import * as THREE from "three";
import JSZip from "jszip";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { CreateAtomsParams, SelectedGeneratorParams, AtomWithBonds } from '$lib/types';

const exporter = new STLExporter();

let group: THREE.Group | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;

interface LocalSelectedGeneratorParams {
    x: number;
    y: number;
    z: number;
    quality: number;
    size: number;
    color: number;
    multiplicationFactor: number;
    coordinates?: AtomWithBonds[];
    originalCoordinates?: AtomWithBonds[];
    groupBondsSeparately?: boolean;
    uniformAtomDiameter?: boolean;
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

    const createAtoms = (params: CreateAtomsParams) => {
        const { coordinates, quality, showHydrogens, multiplicationFactor, selectedGenerator, bondDiameterMultiplicationFactor, bondQuality, groupBondsSeparately, uniformAtomDiameter, showMultipleBonds } = params;
        clearScene();

        group = new THREE.Group();
        scene!.add(group);

        const atomGroups: { [atomType: string]: THREE.Group } = {};

        // ---- Conditionally create a single group for all bonds ----
        let bondsGroup: THREE.Group | null = null;
        if (groupBondsSeparately) {
            bondsGroup = new THREE.Group();
            bondsGroup.name = 'Group_Bonds'; // Set the name for the exporter
            group.add(bondsGroup);
        }

        const filteredCoordinates = showHydrogens ? coordinates : coordinates.filter(({ atomType }) => atomType !== "H");

        if (filteredCoordinates.length > 0) {
            // Calculate the geometric center of the molecule
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

            const centeredCoordinates = filteredCoordinates.map(coord => ({
                ...coord,
                centeredX: coord.x - avgX,
                centeredY: coord.y - avgY,
                centeredZ: coord.z - avgZ
            }));

            camera!.position.set(0, 0, 10);
            camera!.lookAt(0, 0, 0);

            centeredCoordinates.forEach((atom) => {
                const { atomType, centeredX, centeredY, centeredZ, AtomicRadius, CPKHexColor } = atom;

                let size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;

                // ---- Handle uniform atom diameter for Ball-and-Stick model ----
                if (selectedGenerator === createBallAndStickMesh && uniformAtomDiameter) {
                    size = 0.6;
                }

                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                const { atomMesh, bondMeshes } = selectedGenerator({
                    x: centeredX,
                    y: centeredY,
                    z: centeredZ,
                    quality,
                    size,
                    color,
                    multiplicationFactor,
                    bondDiameterMultiplicationFactor,
                    bondQuality,
                    coordinates: centeredCoordinates as AtomWithBonds[],
                    originalCoordinates: filteredCoordinates as AtomWithBonds[],
                    groupBondsSeparately,
                    uniformAtomDiameter,
                    showMultipleBonds // Pass new setting to generator
                });

                if (!atomGroups[atomType]) {
                    const groupForType = new THREE.Group();
                    groupForType.name = `Group_${atomType}`;
                    atomGroups[atomType] = groupForType;
                    group!.add(groupForType);
                }

                atomGroups[atomType].add(atomMesh);

                // ---- Decide where to put the bonds ----
                if (groupBondsSeparately && bondsGroup) {
                    bondsGroup.add(...bondMeshes.children);
                } else {
                    atomGroups[atomType].add(...bondMeshes.children);
                }
            });

            // ---- Coloring logic ----
            if (!groupBondsSeparately) {
                Object.values(atomGroups).forEach(atomGroup => {
                    const representativeAtom = atomGroup.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh | undefined;

                    if (representativeAtom && representativeAtom.material instanceof THREE.MeshStandardMaterial) {
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
        }

        console.log('Group created and filled:', group);
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

export const createSphereMesh = (params: LocalSelectedGeneratorParams) => {
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

export const createCubeMesh = (params: LocalSelectedGeneratorParams) => {
    const { x, y, z, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size * multiplicationFactor, size * multiplicationFactor, size * multiplicationFactor),
        material
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;

    return {
        atomMesh: cube,
        bondMeshes: new THREE.Group()
    };
};

export const createStickMesh = (params: UpdatedLocalSelectedGeneratorParams): { atomMesh: THREE.Mesh, bondMeshes: THREE.Group } => {
    // ... (This function is unchanged)
    const { x, y, z, quality, color, multiplicationFactor, coordinates } = params;
    if (!coordinates) {
        console.warn("Coordinates are required for stick representation; creating a fallback sphere.");
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
    const currentAtom = coordinates.find(atom =>
        atom.centeredX !== undefined &&
        atom.centeredY !== undefined &&
        atom.centeredZ !== undefined &&
        Math.abs(atom.centeredX - x) < EPSILON &&
        Math.abs(atom.centeredY - y) < EPSILON &&
        Math.abs(atom.centeredZ - z) < EPSILON
    );
    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach(bond => {
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);
            if (bondedAtom) {
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
                    stickRadius, stickRadius, halfBondLength, quality, 1
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

export const createBallAndStickMesh = (params: UpdatedLocalSelectedGeneratorParams): { atomMesh: THREE.Mesh, bondMeshes: THREE.Group } => {
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
        showMultipleBonds // New parameter
    } = params;

    // Fallback if coordinates are not provided
    if (!coordinates) {
        console.warn("Coordinates are required for ball-and-stick representation");
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
    const currentAtom = coordinates.find(atom =>
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

            const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, bondLength, bondQuality, 1);
            // Translate geometry so one end is at the origin, making it easy to position and rotate.
            geometry.translate(0, bondLength / 2, 0);

            const cylinder = new THREE.Mesh(geometry, bondMaterial);
            // Position the base of the cylinder at the atom's center.
            cylinder.position.copy(start);
            // Rotate the cylinder to point towards the bond's midpoint.
            cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
            cylinder.castShadow = true;
            return cylinder;
        };

        currentAtom.bonds.forEach(bond => {
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);
            if (bondedAtom) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(bondedAtom.centeredX, bondedAtom.centeredY, bondedAtom.centeredZ);
                
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
                    const shift = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(offsetDistance);

                    if (bondOrder === 2) {
                        // Double bond: two parallel half-cylinders
                        bondsGroup.add(createHalfCylinder(startPos.clone().add(shift), midPoint.clone().add(shift)));
                        bondsGroup.add(createHalfCylinder(startPos.clone().sub(shift), midPoint.clone().sub(shift)));
                    } else if (bondOrder === 3) {
                        // Triple bond: one central and two parallel half-cylinders
                        bondsGroup.add(createHalfCylinder(startPos, midPoint));
                        bondsGroup.add(createHalfCylinder(startPos.clone().add(shift), midPoint.clone().add(shift)));
                        bondsGroup.add(createHalfCylinder(startPos.clone().sub(shift), midPoint.clone().sub(shift)));
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


// ... (The rest of the file: exportBinary, exportBinaryAsZip, etc. is unchanged)
export function exportBinary() {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    let delay = 0;

    group.children.forEach((child, index) => {
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
}

export function exportBinaryAsZip(
    fileName: string,
    metadata: Record<string, string | number>
) {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    const zip = new JSZip();

    group.children.forEach((child, index) => {
        if (child instanceof THREE.Group) {
            const result = exporter.parse(child, { binary: true }) as DataView;
            const groupName = child.name || `Group_${index}`;
            console.log(`Exporting group: ${groupName}`);
            zip.file(`${groupName}.stl`, new Blob([result.buffer as ArrayBuffer], { type: "application/octet-stream" }));
        }
    });

    const metadataContent = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    zip.file("metadata.txt", metadataContent);

    zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        console.log("ZIP was created with metadaty:", fileName);
    }).catch((error) => {
        console.error("Error creating ZIP:", error);
    });
}

export function exportModelAsSTL(fileName: string) {
    if (!group) {
        console.warn("No mesh available for export.");
        return;
    }
    const result = exporter.parse(group, { binary: true }) as DataView;
    downloadSTL(result.buffer, `${fileName}.stl`);
}

function downloadSTL(data: ArrayBufferLike, filename: string) {
    const arrayBuffer = data as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function takeScreenshot(): string | null {
    if (!renderer || !scene || !camera) {
        console.warn("Three.js not initialized");
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

interface UpdatedLocalSelectedGeneratorParams extends LocalSelectedGeneratorParams {
    originalCoordinates?: AtomWithBonds[];
    bondDiameterMultiplicationFactor?: number;
    bondQuality?: number;
    showMultipleBonds?: boolean; // New optional parameter
    uniformAtomDiameter?: boolean;
}