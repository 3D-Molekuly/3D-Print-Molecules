import * as THREE from 'three';
import JSZip from 'jszip';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type {
    CreateAtomsParams,
    SelectedGeneratorParams,
    AtomWithBonds,
    GeneratorResult,
    MovingJointsConfig,
    MovingJointsStats,
    PlannedMovingBondEntry
} from '$lib/types';
import {
    JOINT_PRESETS,
    buildMovingBond,
    createJointGeometries,
    jointIsClear,
    jointProfiles,
    paramsForRod,
    type CollisionAtom,
    type CollisionBond,
    type JointParams
} from '$lib/geometry/jointGeometry';

const exporter = new STLExporter();

let group: THREE.Group | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let currentExportScale = 1;
let lastMovingJointsStats: MovingJointsStats | null = null;

export function getLastMovingJointsStats(): MovingJointsStats | null {
    return lastMovingJointsStats;
}

export function getCurrentGroup(): THREE.Group | null {
    return group;
}

function getAtomBaseSize(
    atom: AtomCoordinate,
    isBallAndStick: boolean,
    uniformAtomDiameter?: boolean
): number {
    let size = atom.AtomicRadius ? parseFloat(atom.AtomicRadius) : 0.5;
    if (isNaN(size)) size = 0.5;
    if (isBallAndStick && uniformAtomDiameter) {
        size = 0.6;
    }
    return size;
}

/**
 * Checks whether undirected edge (uId, vId) lies in a ring (cycle) in the displayed graph
 * by running BFS from uId to vId with the direct edge (uId, vId) removed.
 */
export function isBondInRing(
    uId: number,
    vId: number,
    adjacency: Map<number, Set<number>>
): boolean {
    const visited = new Set<number>([uId]);
    const queue: number[] = [uId];
    while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adjacency.get(curr);
        if (!neighbors) continue;
        for (const next of neighbors) {
            if ((curr === uId && next === vId) || (curr === vId && next === uId)) {
                continue;
            }
            if (next === vId) {
                return true;
            }
            if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        }
    }
    return false;
}

interface DisplayedBond {
    key: string;
    uId: number;
    vId: number;
    bondType: number;
}

/**
 * Plans print-in-place moving joints for all eligible single bonds in the displayed molecule.
 */
export function planMoleculeMovingJoints(
    centeredCoordinates: AtomWithBonds[],
    multiplicationFactor: number,
    bondRadius: number,
    bondQuality: number,
    uniformAtomDiameter: boolean,
    config: MovingJointsConfig
): {
    movingBondsMap: Map<string, PlannedMovingBondEntry>;
    stats: MovingJointsStats;
} {
    const atomById = new Map<number, AtomWithBonds>();
    const atomPosMap = new Map<number, THREE.Vector3>();
    const atomRadiusMap = new Map<number, number>();
    const collisionAtoms: CollisionAtom[] = [];

    for (const atom of centeredCoordinates) {
        atomById.set(atom.id, atom);
        const pos = new THREE.Vector3(
            atom.centeredX ?? atom.x,
            atom.centeredY ?? atom.y,
            atom.centeredZ ?? atom.z
        );
        const radius = getAtomBaseSize(atom, true, uniformAtomDiameter) * multiplicationFactor * 0.4;
        atomPosMap.set(atom.id, pos);
        atomRadiusMap.set(atom.id, radius);
        collisionAtoms.push({ index: atom.id, pos, radius });
    }

    const displayedBondsMap = new Map<string, DisplayedBond>();
    const adjacency = new Map<number, Set<number>>();
    for (const atom of centeredCoordinates) {
        adjacency.set(atom.id, new Set<number>());
    }

    for (const atom of centeredCoordinates) {
        if (!Array.isArray(atom.bonds)) continue;
        for (const b of atom.bonds) {
            if (!atomById.has(b.atomId) || b.atomId === atom.id) continue;
            const uId = Math.min(atom.id, b.atomId);
            const vId = Math.max(atom.id, b.atomId);
            const key = `${uId}-${vId}`;
            if (!displayedBondsMap.has(key)) {
                displayedBondsMap.set(key, { key, uId, vId, bondType: b.bondType });
                adjacency.get(uId)!.add(vId);
                adjacency.get(vId)!.add(uId);
            }
        }
    }

    const collisionBonds: CollisionBond[] = [];
    for (const bond of displayedBondsMap.values()) {
        collisionBonds.push({ a: bond.uId, b: bond.vId, radius: bondRadius });
    }

    // Count heavy (non-H) neighbors in the displayed graph for each atom
    const heavyDegree = new Map<number, number>();
    for (const [id, neighbors] of adjacency.entries()) {
        let count = 0;
        for (const nbrId of neighbors) {
            const nbr = atomById.get(nbrId);
            if (nbr && nbr.atomType !== 'H') {
                count++;
            }
        }
        heavyDegree.set(id, count);
    }

    const movingBondsMap = new Map<string, PlannedMovingBondEntry>();
    let insertedCount = 0;
    let eligibleSingleBondsCount = 0;
    let skippedCount = 0;
    const skippedBonds: string[] = [];
    let firstJointParamsMm: JointParams | null = null;

    for (const bond of displayedBondsMap.values()) {
        // Must be single bond (order 1) and not aromatic (in SDF/MOL, type 4 = aromatic)
        if (bond.bondType !== 1) continue;

        const degU = adjacency.get(bond.uId)?.size ?? 0;
        const degV = adjacency.get(bond.vId)?.size ?? 0;

        // Both atoms must have degree >= 2 in the displayed graph if skipTerminal is enabled
        if (config.skipTerminal && (degU < 2 || degV < 2)) continue;

        // Skip bonds in rings if jointsInRings is false
        if (!config.jointsInRings && isBondInRing(bond.uId, bond.vId, adjacency)) continue;

        eligibleSingleBondsCount++;

        // Choose side A: higher number of heavy (non-H) neighbors in displayed graph; on tie, lower index
        const heavyU = heavyDegree.get(bond.uId) ?? 0;
        const heavyV = heavyDegree.get(bond.vId) ?? 0;
        const atomAId = heavyV > heavyU ? bond.vId : bond.uId;
        const atomBId = heavyV > heavyU ? bond.uId : bond.vId;

        const posA = atomPosMap.get(atomAId)!;
        const posB = atomPosMap.get(atomBId)!;
        const rA = atomRadiusMap.get(atomAId)!;
        const rB = atomRadiusMap.get(atomBId)!;

        const mb = buildMovingBond(posA, posB, {
            rodRadius: bondRadius,
            rA,
            rB,
            mmPerUnit: config.mmPerUnit,
            params: config.params,
            rodRadialSegments: bondQuality,
            preferT: config.preferT
        });

        if (mb !== null && jointIsClear(mb, atomAId, atomBId, collisionAtoms, collisionBonds)) {
            movingBondsMap.set(bond.key, { atomAId, atomBId, mb });
            insertedCount++;
            if (!firstJointParamsMm) {
                firstJointParamsMm = mb.params;
            }
        } else {
            if (mb !== null) {
                for (const g of [...mb.sideA, ...mb.sideB]) {
                    g.dispose();
                }
            }
            skippedCount++;
            const atomU = atomById.get(bond.uId)!;
            const atomV = atomById.get(bond.vId)!;
            skippedBonds.push(`${atomU.atomType}${atomU.id}–${atomV.atomType}${atomV.id}`);
        }
    }

    if (!firstJointParamsMm) {
        firstJointParamsMm = paramsForRod(bondRadius * config.mmPerUnit, config.params);
    }

    return {
        movingBondsMap,
        stats: {
            insertedCount,
            eligibleSingleBondsCount,
            skippedCount,
            skippedBonds,
            firstJointParamsMm
        }
    };
}

/**
 * Pure function that builds the Three.js Group hierarchy for a molecule
 * (usable both in the browser WebGL scene and in headless tests).
 */
export function buildMoleculeGroup(params: CreateAtomsParams): {
    group: THREE.Group;
    stats: MovingJointsStats | null;
} {
    const {
        coordinates,
        quality,
        showHydrogens,
        multiplicationFactor,
        selectedGenerator,
        mmPerUnit,
        bondDiameterMultiplicationFactor,
        bondQuality,
        groupBondsSeparately,
        uniformAtomDiameter,
        showMultipleBonds,
        movingJoints
    } = params;

    const builtGroup = new THREE.Group();
    const atomGroups: { [atomType: string]: THREE.Group } = {};

    let bondsGroup: THREE.Group | null = null;
    if (groupBondsSeparately) {
        bondsGroup = new THREE.Group();
        bondsGroup.name = 'Group_Bonds';
        builtGroup.add(bondsGroup);
    }

    const indexedCoordinates: AtomWithBonds[] = coordinates.map((coord, idx) => ({
        ...coord,
        id: coord.id ?? idx + 1
    }));

    const filteredCoordinates = showHydrogens
        ? indexedCoordinates
        : indexedCoordinates.filter(({ atomType }) => atomType !== 'H');

    const isMovingJoints = selectedGenerator === createBallAndStickMovingJointsMesh;
    const isBallAndStick =
        selectedGenerator === createBallAndStickMesh || isMovingJoints;

    const resolvedMmPerUnit = mmPerUnit ?? movingJoints?.mmPerUnit ?? (isMovingJoints ? 20 : 10);

    const effectiveMovingJoints: MovingJointsConfig = movingJoints
        ? { ...movingJoints, mmPerUnit: resolvedMmPerUnit }
        : {
              preset: 'fdm',
              params: { ...JOINT_PRESETS.fdm },
              preferT: 0.5,
              skipTerminal: true,
              jointsInRings: true,
              mmPerUnit: resolvedMmPerUnit
          };

    currentExportScale = mmPerUnit !== undefined ? mmPerUnit : isMovingJoints ? effectiveMovingJoints.mmPerUnit : 1;
    let stats: MovingJointsStats | null = null;

    if (filteredCoordinates.length > 0) {
        const center = filteredCoordinates.reduce(
            (acc, { x, y, z }) => {
                acc.x += x;
                acc.y += y;
                acc.z += z;
                return acc;
            },
            { x: 0, y: 0, z: 0 }
        );

        const avgX = center.x / filteredCoordinates.length;
        const avgY = center.y / filteredCoordinates.length;
        const avgZ = center.z / filteredCoordinates.length;

        const centeredCoordinates: AtomWithBonds[] = filteredCoordinates.map((coord) => ({
            ...coord,
            centeredX: coord.x - avgX,
            centeredY: coord.y - avgY,
            centeredZ: coord.z - avgZ
        }));

        let movingBondsMap: Map<string, PlannedMovingBondEntry> | undefined;
        if (isMovingJoints) {
            const bondRadius = 0.5 * (bondDiameterMultiplicationFactor ?? 0.5);
            const planned = planMoleculeMovingJoints(
                centeredCoordinates,
                multiplicationFactor,
                bondRadius,
                bondQuality ?? 32,
                Boolean(uniformAtomDiameter),
                effectiveMovingJoints
            );
            movingBondsMap = planned.movingBondsMap;
            stats = planned.stats;
        }

        centeredCoordinates.forEach((atom) => {
            const { atomType, centeredX, centeredY, centeredZ, CPKHexColor } = atom;

            const size = getAtomBaseSize(atom, isBallAndStick, uniformAtomDiameter);
            const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

            const { atomMesh, bondMeshes } = selectedGenerator({
                x: centeredX!,
                y: centeredY!,
                z: centeredZ!,
                quality,
                size,
                color,
                multiplicationFactor,
                bondDiameterMultiplicationFactor,
                bondQuality,
                coordinates: centeredCoordinates,
                originalCoordinates: filteredCoordinates,
                groupBondsSeparately,
                uniformAtomDiameter,
                showMultipleBonds,
                movingBondsMap
            });

            if (!atomGroups[atomType]) {
                const groupForType = new THREE.Group();
                groupForType.name = `Group_${atomType}`;
                atomGroups[atomType] = groupForType;
                builtGroup.add(groupForType);
            }

            atomGroups[atomType].add(atomMesh);

            if (groupBondsSeparately && bondsGroup) {
                bondsGroup.add(...bondMeshes.children);
            } else {
                atomGroups[atomType].add(...bondMeshes.children);
            }
        });

        // Coloring logic: apply element's shared material to all meshes in its group
        if (!groupBondsSeparately) {
            Object.values(atomGroups).forEach((atomGroup) => {
                const representativeAtom = atomGroup.children.find(
                    (child) => child instanceof THREE.Mesh
                ) as THREE.Mesh | undefined;

                if (
                    representativeAtom &&
                    representativeAtom.material instanceof THREE.MeshStandardMaterial
                ) {
                    const atomColor = representativeAtom.material.color;
                    const sharedMaterial = new THREE.MeshStandardMaterial({ color: atomColor });

                    atomGroup.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.material = sharedMaterial;
                        }
                    });
                }
            });
        }
    } else if (isMovingJoints) {
        stats = {
            insertedCount: 0,
            eligibleSingleBondsCount: 0,
            skippedCount: 0,
            skippedBonds: [],
            firstJointParamsMm: null
        };
    }

    builtGroup.updateMatrixWorld(true);
    group = builtGroup;
    lastMovingJointsStats = stats;

    return { group: builtGroup, stats };
}

export function setupThreeJS(canvas: HTMLCanvasElement) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    // Add alpha: true for transparency support
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, preserveDrawingBuffer: true });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff); // scene background for display remains white
    renderer.shadowMap.enabled = true;

    // Lights setup
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.8);
    backLight.position.set(-5, -5, 5).normalize();
    backLight.castShadow = true;
    backLight.shadow.bias = -0.001;
    backLight.shadow.mapSize.width = 1024;
    backLight.shadow.mapSize.height = 1024;
    scene.add(backLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemisphereLight.position.set(0, 10, 0);
    scene.add(hemisphereLight);

    const controls = new OrbitControls(camera, renderer.domElement);

    const clearScene = () => {
        const essentialObjects = [ambientLight, directionalLight, backLight, pointLight, hemisphereLight];
        scene!.children = essentialObjects;
    };

    const createAtoms = (params: CreateAtomsParams): MovingJointsStats | null => {
        clearScene();

        const { group: builtGroup, stats } = buildMoleculeGroup(params);
        scene!.add(builtGroup);

        if (builtGroup.children.length > 0) {
            camera!.position.set(0, 0, 10);
            camera!.lookAt(0, 0, 0);
        }

        console.log('Group created and filled:', builtGroup);
        return stats;
    };

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function updateCanvasSize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (renderer && camera) {
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }

    return { animate, updateCanvasSize, createAtoms, clearScene };
}

export const createSphereMesh = (params: SelectedGeneratorParams): GeneratorResult => {
    const { x, y, z, quality, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size * multiplicationFactor, quality, quality),
        material
    );
    sphere.position.set(x, y, z);
    sphere.castShadow = true;

    return {
        atomMesh: sphere,
        bondMeshes: new THREE.Group()
    };
};

export const createCubeMesh = (params: SelectedGeneratorParams): GeneratorResult => {
    const { x, y, z, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(
            size * multiplicationFactor,
            size * multiplicationFactor,
            size * multiplicationFactor
        ),
        material
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;

    return {
        atomMesh: cube,
        bondMeshes: new THREE.Group()
    };
};

export const createStickMesh = (params: SelectedGeneratorParams): GeneratorResult => {
    const { x, y, z, quality, color, multiplicationFactor, coordinates } = params;
    if (!coordinates) {
        console.warn('Coordinates are required for stick representation; creating a fallback sphere.');
        const fallbackMaterial = new THREE.MeshStandardMaterial({ color });
        const stickRadius = 0.2 * multiplicationFactor;
        const fallbackAtom = new THREE.Mesh(
            new THREE.SphereGeometry(stickRadius, quality, quality),
            fallbackMaterial
        );
        fallbackAtom.position.set(x, y, z);
        fallbackAtom.castShadow = true;
        return {
            atomMesh: fallbackAtom,
            bondMeshes: new THREE.Group()
        };
    }
    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'Bonds';
    const stickRadius = 0.2 * multiplicationFactor;
    const material = new THREE.MeshStandardMaterial({ color });
    const atomMesh = new THREE.Mesh(
        new THREE.SphereGeometry(stickRadius, quality, quality),
        material
    );
    atomMesh.position.set(x, y, z);
    atomMesh.castShadow = true;
    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(
        (atom) =>
            atom.centeredX !== undefined &&
            atom.centeredY !== undefined &&
            atom.centeredZ !== undefined &&
            Math.abs(atom.centeredX - x) < EPSILON &&
            Math.abs(atom.centeredY - y) < EPSILON &&
            Math.abs(atom.centeredZ - z) < EPSILON
    );
    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach((bond) => {
            const bondedAtom = coordinates.find((atom) => atom.id === bond.atomId);
            if (
                bondedAtom &&
                bondedAtom.centeredX !== undefined &&
                bondedAtom.centeredY !== undefined &&
                bondedAtom.centeredZ !== undefined
            ) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const bondLength = direction.length();
                const halfBondLength = bondLength / 2;
                if (halfBondLength === 0) return;
                const cylinderGeometry = new THREE.CylinderGeometry(
                    stickRadius,
                    stickRadius,
                    halfBondLength,
                    quality,
                    1
                );
                cylinderGeometry.translate(0, halfBondLength / 2, 0);
                const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const cylinder = new THREE.Mesh(cylinderGeometry, bondMaterial);
                cylinder.position.copy(startPos);
                cylinder.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );
                cylinder.castShadow = true;
                bondsGroup.add(cylinder);
            }
        });
    }
    return { atomMesh, bondMeshes: bondsGroup };
};

export const createBallAndStickMesh = (params: SelectedGeneratorParams): GeneratorResult => {
    const {
        x,
        y,
        z,
        quality,
        size,
        color,
        multiplicationFactor,
        coordinates,
        bondDiameterMultiplicationFactor,
        bondQuality,
        showMultipleBonds,
        movingBondsMap
    } = params;

    // Fallback if coordinates are not provided
    if (!coordinates) {
        console.warn('Coordinates are required for ball-and-stick representation');
        return {
            atomMesh: createSphereMesh(params).atomMesh,
            bondMeshes: new THREE.Group()
        };
    }

    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'Bonds';

    const sphereSize = size * multiplicationFactor * 0.4;
    const material = new THREE.MeshStandardMaterial({ color });
    const atomMesh = new THREE.Mesh(
        new THREE.SphereGeometry(sphereSize, quality, quality),
        material
    );
    atomMesh.position.set(x, y, z);
    atomMesh.castShadow = true;

    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(
        (atom) =>
            atom.centeredX !== undefined &&
            atom.centeredY !== undefined &&
            atom.centeredZ !== undefined &&
            Math.abs(atom.centeredX - x) < EPSILON &&
            Math.abs(atom.centeredY - y) < EPSILON &&
            Math.abs(atom.centeredZ - z) < EPSILON
    );

    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        const bondRadius = 0.5 * (bondDiameterMultiplicationFactor ?? 0.5);
        const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

        /**
         * Helper to create one half of a bond cylinder, from an atom's center to the bond's midpoint.
         * This preserves the ability to color each half of the bond separately.
         */
        const createHalfCylinder = (start: THREE.Vector3, end: THREE.Vector3): THREE.Mesh => {
            const direction = new THREE.Vector3().subVectors(end, start);
            const bondLength = direction.length();
            if (bondLength < EPSILON) return new THREE.Mesh();

            const geometry = new THREE.CylinderGeometry(
                bondRadius,
                bondRadius,
                bondLength,
                bondQuality ?? 32,
                1
            );
            // Translate geometry so one end is at the origin, making it easy to position and rotate.
            geometry.translate(0, bondLength / 2, 0);

            const cylinder = new THREE.Mesh(geometry, bondMaterial);
            // Position the base of the cylinder at the atom's center.
            cylinder.position.copy(start);
            // Rotate the cylinder to point towards the bond's midpoint.
            cylinder.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction.normalize()
            );
            cylinder.castShadow = true;
            return cylinder;
        };

        const processedNeighbors = new Set<number>();

        currentAtom.bonds.forEach((bond) => {
            if (processedNeighbors.has(bond.atomId)) return;
            const bondedAtom = coordinates.find((atom) => atom.id === bond.atomId);
            if (
                bondedAtom &&
                bondedAtom.centeredX !== undefined &&
                bondedAtom.centeredY !== undefined &&
                bondedAtom.centeredZ !== undefined
            ) {
                processedNeighbors.add(bond.atomId);

                const uId = Math.min(currentAtom.id, bondedAtom.id);
                const vId = Math.max(currentAtom.id, bondedAtom.id);
                const bondKey = `${uId}-${vId}`;
                const movingEntry = movingBondsMap?.get(bondKey);

                if (movingEntry) {
                    const sideGeoms =
                        currentAtom.id === movingEntry.atomAId
                            ? movingEntry.mb.sideA
                            : movingEntry.mb.sideB;
                    for (const geom of sideGeoms) {
                        const mesh = new THREE.Mesh(geom, bondMaterial);
                        mesh.castShadow = true;
                        bondsGroup.add(mesh);
                    }
                    return;
                }

                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );

                // This atom will only draw its half of the bond, from its center to the midpoint.
                const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
                const bondOrder = bond.bondType;

                // If multiple bonds are disabled, or if it's a single bond, draw one half-cylinder.
                if (!showMultipleBonds || bondOrder === 1) {
                    bondsGroup.add(createHalfCylinder(startPos, midPoint));
                } else {
                    // Handle multiple bonds (double or triple) by creating shifted half-cylinders.
                    const dir = new THREE.Vector3().subVectors(endPos, startPos);
                    let up = new THREE.Vector3(0, 1, 0);
                    if (Math.abs(dir.clone().normalize().dot(up)) > 0.99) {
                        up = new THREE.Vector3(1, 0, 0);
                    }
                    const offsetDistance = bondRadius * 2.0;
                    const shift = new THREE.Vector3()
                        .crossVectors(dir, up)
                        .normalize()
                        .multiplyScalar(offsetDistance);

                    if (bondOrder === 2) {
                        // Double bond: two parallel half-cylinders
                        bondsGroup.add(
                            createHalfCylinder(startPos.clone().add(shift), midPoint.clone().add(shift))
                        );
                        bondsGroup.add(
                            createHalfCylinder(startPos.clone().sub(shift), midPoint.clone().sub(shift))
                        );
                    } else if (bondOrder === 3) {
                        // Triple bond: one central and two parallel half-cylinders
                        bondsGroup.add(createHalfCylinder(startPos, midPoint));
                        bondsGroup.add(
                            createHalfCylinder(startPos.clone().add(shift), midPoint.clone().add(shift))
                        );
                        bondsGroup.add(
                            createHalfCylinder(startPos.clone().sub(shift), midPoint.clone().sub(shift))
                        );
                    } else {
                        // Fallback for any other bond order value (e.g., aromatic) - draw as single bond.
                        bondsGroup.add(createHalfCylinder(startPos, midPoint));
                    }
                }
            }
        });
    }

    return { atomMesh, bondMeshes: bondsGroup };
};

/**
 * Generator for style "Ball-and-Stick MOVING JOINTS".
 * Shares atom and bond generation with createBallAndStickMesh without code duplication.
 */
export const createBallAndStickMovingJointsMesh = (
    params: SelectedGeneratorParams
): GeneratorResult => {
    return createBallAndStickMesh(params);
};

function withExportScale<T>(fn: () => T): T {
    if (!group) return fn();
    const prevScale = group.scale.clone();
    group.scale.setScalar(currentExportScale);
    group.updateMatrixWorld(true);
    try {
        return fn();
    } finally {
        group.scale.copy(prevScale);
        group.updateMatrixWorld(true);
    }
}

export function exportGroupToSTLBuffer(target: THREE.Object3D, scaleOverride?: number): ArrayBuffer {
    if (scaleOverride !== undefined) {
        const prevScale = target.scale.clone();
        target.scale.setScalar(scaleOverride);
        target.updateMatrixWorld(true);
        try {
            const result = exporter.parse(target, { binary: true }) as DataView;
            return result.buffer as ArrayBuffer;
        } finally {
            target.scale.copy(prevScale);
            target.updateMatrixWorld(true);
        }
    }
    return withExportScale(() => {
        if (!group) {
            target.updateMatrixWorld(true);
        }
        const result = exporter.parse(target, { binary: true }) as DataView;
        return result.buffer as ArrayBuffer;
    });
}

/**
 * Creates a binary STL buffer containing the calibration test joint (stator + rotor with 3 mm rods at both ends, ~16 mm total, as two separate shells in mm).
 */
export function createTestJointSTLBuffer(params: JointParams): ArrayBuffer {
    const prof = jointProfiles(params);
    const rodR = Math.min(params.R, Math.max(params.rs, params.R * 0.5));
    const rodLen = 3.0;

    // Extend stator profile downward by 3 mm rod (y = -3 .. 0) and rotor profile upward by 3 mm rod (y = length .. length + 3)
    const statorPoints = [
        new THREE.Vector2(0, -rodLen),
        new THREE.Vector2(rodR, -rodLen),
        new THREE.Vector2(rodR, 0),
        ...prof.stator.slice(1)
    ];
    const rotorPoints = [
        ...prof.rotor.slice(0, -1),
        new THREE.Vector2(rodR, prof.length),
        new THREE.Vector2(rodR, prof.length + rodLen),
        new THREE.Vector2(0, prof.length + rodLen)
    ];

    const stator = new THREE.LatheGeometry(statorPoints, params.radialSegments);
    const rotor = new THREE.LatheGeometry(rotorPoints, params.radialSegments);

    const testGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x808080 });
    testGroup.add(new THREE.Mesh(stator, mat));
    testGroup.add(new THREE.Mesh(rotor, mat));
    testGroup.updateMatrixWorld(true);
    const result = exporter.parse(testGroup, { binary: true }) as DataView;
    stator.dispose();
    rotor.dispose();
    mat.dispose();
    return result.buffer as ArrayBuffer;
}

export function downloadTestJointSTL(params: JointParams, filename = 'Test_Joint.stl'): void {
    const buffer = createTestJointSTLBuffer(params);
    downloadSTL(buffer, filename);
}

export function exportBinary() {
    if (!group || group.children.length === 0) {
        console.warn('No mesh available for export.');
        return;
    }

    let delay = 0;

    withExportScale(() => {
        group!.children.forEach((child, index) => {
            if (child instanceof THREE.Group) {
                const result = exporter.parse(child, { binary: true }) as DataView;
                const groupName = child.name || `Group_${index}`;
                console.log(`Exporting group: ${groupName}`);
                setTimeout(() => {
                    downloadSTL(result.buffer, `${groupName}.stl`);
                }, delay);

                delay += 1000;
            }
        });
    });
}

export function exportBinaryAsZip(
    fileName: string,
    metadata: Record<string, string | number | boolean | null | undefined>
) {
    if (!group || group.children.length === 0) {
        console.warn('No mesh available for export.');
        return;
    }

    const zip = new JSZip();

    withExportScale(() => {
        group!.children.forEach((child, index) => {
            if (child instanceof THREE.Group) {
                const result = exporter.parse(child, { binary: true }) as DataView;
                const groupName = child.name || `Group_${index}`;
                console.log(`Exporting group: ${groupName}`);
                zip.file(
                    `${groupName}.stl`,
                    new Blob([result.buffer as ArrayBuffer], { type: 'application/octet-stream' })
                );
            }
        });
    });

    const metadataContent = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    zip.file('metadata.txt', metadataContent);

    zip.generateAsync({ type: 'blob' })
        .then((content) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${fileName}.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
            console.log('ZIP was created with metadaty:', fileName);
        })
        .catch((error) => {
            console.error('Error creating ZIP:', error);
        });
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case "'":
                return '&apos;';
            case '"':
                return '&quot;';
            default:
                return c;
        }
    });
}

function roundCoord(val: number): string {
    return Number(val.toFixed(5)).toString();
}

interface GroupGeometryData {
    name: string;
    colorHex: string;
    vertices: number[];
    indices: number[];
}

function encodeExtruderPaintColor(zeroBasedSlot: number): string {
    if (zeroBasedSlot <= 0) return '';
    const state = zeroBasedSlot + 1;
    const bits: number[] = [0, 0];
    if (state < 3) {
        bits.push(state & 1, (state >> 1) & 1);
    } else {
        bits.push(1, 1);
        let m = state - 3;
        while (m >= 15) {
            bits.push(1, 1, 1, 1);
            m -= 15;
        }
        bits.push(m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1);
    }
    const HEX = '0123456789ABCDEF';
    let out = '';
    for (let c = 0; c < bits.length; c += 4) {
        const b0 = bits[c] ?? 0;
        const b1 = bits[c + 1] ?? 0;
        const b2 = bits[c + 2] ?? 0;
        const b3 = bits[c + 3] ?? 0;
        out = HEX[b0 | (b1 << 1) | (b2 << 2) | (b3 << 3)] + out;
    }
    return out;
}

export async function generateModel3MFBlob(
    fileName: string,
    metadata?: Record<string, string | number | boolean | null | undefined>
): Promise<Blob | null> {
    if (!group || group.children.length === 0) {
        console.warn('No mesh available for export.');
        return null;
    }

    const groupDataList: GroupGeometryData[] = [];

    let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;

    withExportScale(() => {
        group!.children.forEach((child, index) => {
            if (!(child instanceof THREE.Group || child instanceof THREE.Mesh)) {
                return;
            }

            const groupName = child.name || `Group_${index}`;
            let groupColor = '#808080';

            child.traverse((obj) => {
                if (obj instanceof THREE.Mesh && obj.material) {
                    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
                    if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
                        groupColor = `#${mat.color.getHexString().toUpperCase()}`;
                    }
                }
            });

            const vertices: number[] = [];
            const indices: number[] = [];
            const v = new THREE.Vector3();

            child.traverse((obj) => {
                if (obj instanceof THREE.Mesh && obj.geometry) {
                    let cleanGeom: THREE.BufferGeometry = obj.geometry.clone();
                    cleanGeom.deleteAttribute('uv');
                    cleanGeom.deleteAttribute('normal');
                    cleanGeom.applyMatrix4(obj.matrixWorld);
                    cleanGeom = mergeVertices(cleanGeom, 1e-4);

                    const positionAttribute = cleanGeom.getAttribute('position') as
                        | THREE.BufferAttribute
                        | undefined;
                    if (!positionAttribute) {
                        cleanGeom.dispose();
                        return;
                    }

                    const indexAttribute = cleanGeom.index;
                    const baseVertexOffset = vertices.length / 3;

                    for (let i = 0; i < positionAttribute.count; i++) {
                        v.fromBufferAttribute(positionAttribute, i);
                        vertices.push(v.x, v.y, v.z);

                        if (v.x < minX) minX = v.x;
                        if (v.y < minY) minY = v.y;
                        if (v.z < minZ) minZ = v.z;
                        if (v.x > maxX) maxX = v.x;
                        if (v.y > maxY) maxY = v.y;
                        if (v.z > maxZ) maxZ = v.z;
                    }

                    if (indexAttribute !== null) {
                        for (let i = 0; i < indexAttribute.count; i++) {
                            indices.push(indexAttribute.getX(i) + baseVertexOffset);
                        }
                    } else {
                        for (let i = 0; i < positionAttribute.count; i++) {
                            indices.push(i + baseVertexOffset);
                        }
                    }

                    cleanGeom.dispose();
                }
            });

            if (indices.length > 0 && vertices.length > 0) {
                groupDataList.push({
                    name: groupName,
                    colorHex: groupColor,
                    vertices,
                    indices
                });
            }
        });
    });

    if (groupDataList.length === 0) {
        console.warn('No geometry found to export in 3MF.');
        return null;
    }

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="config" ContentType="text/xml" />
  <Default Extension="txt" ContentType="text/plain" />
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    let colorGroupXml = '    <m:colorgroup id="1">\n';
    let baseMaterialsXml = '    <basematerials id="2">\n';
    groupDataList.forEach((data) => {
        colorGroupXml += `      <m:color color="${data.colorHex}FF" />\n`;
        baseMaterialsXml += `      <base name="${escapeXml(data.name)}" displaycolor="${data.colorHex}FF" />\n`;
    });
    colorGroupXml += '    </m:colorgroup>\n';
    baseMaterialsXml += '    </basematerials>\n';

    const objectId = 3;
    const vertexLines: string[] = [];
    const triangleLines: string[] = [];
    const volumeConfigs: string[] = [];

    let globalVertexOffset = 0;
    let globalTriangleOffset = 0;

    groupDataList.forEach((data, i) => {
        const numVertices = data.vertices.length / 3;
        const numTriangles = data.indices.length / 3;
        const firstTriangleId = globalTriangleOffset;
        const lastTriangleId = globalTriangleOffset + numTriangles - 1;
        const paintHex = encodeExtruderPaintColor(i);
        const paintAttr = paintHex
            ? ` paint_color="${paintHex}" slic3rpe:mmu_segmentation="${paintHex}"`
            : '';

        for (let vIdx = 0; vIdx < data.vertices.length; vIdx += 3) {
            vertexLines.push(
                `          <vertex x="${roundCoord(data.vertices[vIdx])}" y="${roundCoord(data.vertices[vIdx + 1])}" z="${roundCoord(data.vertices[vIdx + 2])}" />`
            );
        }

        for (let tIdx = 0; tIdx < data.indices.length; tIdx += 3) {
            const v1 = data.indices[tIdx] + globalVertexOffset;
            const v2 = data.indices[tIdx + 1] + globalVertexOffset;
            const v3 = data.indices[tIdx + 2] + globalVertexOffset;
            triangleLines.push(
                `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${i}"${paintAttr} />`
            );
        }

        volumeConfigs.push(`    <volume firstid="${firstTriangleId}" lastid="${lastTriangleId}">
      <metadata type="volume" key="name" value="${escapeXml(data.name)}"/>
      <metadata type="volume" key="volume_type" value="ModelPart"/>
      <metadata type="volume" key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata type="volume" key="source_object_id" value="${objectId}"/>
      <metadata type="volume" key="source_volume_id" value="${i}"/>
      <metadata type="volume" key="extruder" value="${i + 1}"/>
      <mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </volume>`);

        globalVertexOffset += numVertices;
        globalTriangleOffset += numTriangles;
    });

    const centerX = isFinite(minX) && isFinite(maxX) ? (minX + maxX) / 2 : 0;
    const centerY = isFinite(minY) && isFinite(maxY) ? (minY + maxY) / 2 : 0;
    const offsetX = roundCoord(100 - centerX);
    const offsetY = roundCoord(100 - centerY);
    const offsetZ = roundCoord(isFinite(minZ) ? -minZ : 0);

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">
  <metadata name="Application">BambuStudio-01.10.00.89</metadata>
  <metadata name="BambuStudio:3mfVersion">1</metadata>
  <metadata name="slic3rpe:Version3mf">1</metadata>
  <metadata name="slic3rpe:MmPaintingVersion">1</metadata>
  <metadata name="Title">${escapeXml(fileName)}</metadata>
  <resources>
${colorGroupXml}${baseMaterialsXml}    <object id="${objectId}" name="${escapeXml(fileName)}" type="model" pid="1" pindex="0">
      <mesh>
        <vertices>
${vertexLines.join('\n')}
        </vertices>
        <triangles>
${triangleLines.join('\n')}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${offsetX} ${offsetY} ${offsetZ}" printable="1" />
  </build>
</model>`;

    const slic3rPeModelConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="${objectId}" instances_count="1">
    <metadata type="object" key="name" value="${escapeXml(fileName)}"/>
${volumeConfigs.join('\n')}
  </object>
</config>`;

    const colorList = groupDataList.map((d) => d.colorHex).join(';');
    const nozzleDiameters = groupDataList.map(() => '0.4').join(',');
    const filamentDiameters = groupDataList.map(() => '1.75').join(',');

    const slic3rPeConfig = `; generated by 3D-Print-Molecules-WEB
; extruder_colour = ${colorList}
; filament_colour = ${colorList}
; nozzle_diameter = ${nozzleDiameters}
; filament_diameter = ${filamentDiameters}
; single_extruder_multi_material = 1
`;

    const projectSettingsJson = JSON.stringify(
        {
            filament_colour: groupDataList.map((d) => d.colorHex),
            filament_type: groupDataList.map(() => 'PLA'),
            filament_settings_id: groupDataList.map(() => 'Bambu PLA Basic @BBL X1C'),
            printer_settings_id: 'Bambu Lab X1 Carbon 0.4 nozzle',
            print_settings_id: '0.20mm Standard @BBL X1C',
            version: '01.10.00.89'
        },
        null,
        2
    );

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.folder('_rels')!.file('.rels', relsXml);
    zip.folder('3D')!.file('3dmodel.model', modelXml);

    const metadataFolder = zip.folder('Metadata')!;
    metadataFolder.file('Slic3r_PE_model.config', slic3rPeModelConfig);
    metadataFolder.file('Slic3r_PE.config', slic3rPeConfig);
    metadataFolder.file('project_settings.config', projectSettingsJson);

    if (metadata) {
        const metadataContent = Object.entries(metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        zip.file('metadata.txt', metadataContent);
    }

    try {
        return await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    } catch (error) {
        console.error('Error creating 3MF:', error);
        return null;
    }
}

export async function exportModelAs3MF(
    fileName: string,
    metadata?: Record<string, string | number | boolean | null | undefined>
): Promise<void> {
    const content = await generateModel3MFBlob(fileName, metadata);
    if (!content) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${fileName}.3mf`;
    link.click();
    URL.revokeObjectURL(link.href);
    console.log('3MF was successfully created:', fileName);
}

export function exportModelAsSTL(fileName: string) {
    if (!group) {
        console.warn('No mesh available for export.');
        return;
    }
    const buffer = exportGroupToSTLBuffer(group);
    downloadSTL(buffer, `${fileName}.stl`);
}

function downloadSTL(data: ArrayBufferLike, filename: string) {
    const arrayBuffer = data as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function takeScreenshot(): string | null {
    if (!renderer || !scene || !camera) {
        console.warn('Three.js not initialized');
        return null;
    }
    const originalClearColor = renderer.getClearColor(new THREE.Color()).getHex();
    const originalAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    renderer.setClearColor(originalClearColor, originalAlpha);
    return dataUrl;
}