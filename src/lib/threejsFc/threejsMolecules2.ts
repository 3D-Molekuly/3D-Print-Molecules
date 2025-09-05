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

    // Add ground plane (optional, commented out)
    // const planeGeometry = new THREE.PlaneGeometry(200, 200);
    // const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -Math.PI / 2;
    // plane.position.y = -1;
    // plane.receiveShadow = true;
    // scene.add(plane);

    const controls = new OrbitControls(camera, renderer.domElement);

    const clearScene = () => {
        const essentialObjects = [ambientLight, directionalLight, backLight, pointLight, hemisphereLight];
        scene!.children = essentialObjects;
    };

    const createAtoms = (params: CreateAtomsParams) => {
        const { coordinates, quality, showHydrogens, multiplicationFactor, selectedGenerator, bondDiameterMultiplicationFactor, bondQuality } = params;
        clearScene();

        group = new THREE.Group();
        scene!.add(group);

        const atomGroups: { [atomType: string]: THREE.Group } = {};
        const filteredCoordinates = showHydrogens ? coordinates : coordinates.filter(({ atomType }) => atomType !== "H");

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

            const centeredCoordinates = filteredCoordinates.map(coord => ({
                ...coord,
                centeredX: coord.x - avgX,
                centeredY: coord.y - avgY,
                centeredZ: coord.z - avgZ
            }));

            camera!.position.set(avgX, avgY, avgZ + 10);
            camera!.lookAt(avgX, avgY, avgZ);

            centeredCoordinates.forEach((atom) => {
                const { atomType, centeredX, centeredY, centeredZ, AtomicRadius, CPKHexColor } = atom;
                const size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;
                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                const mesh = selectedGenerator({
                    x: centeredX,
                    y: centeredY,
                    z: centeredZ,
                    quality,
                    size,
                    color,
                    multiplicationFactor,
                    bondDiameterMultiplicationFactor, // Forward to generator
                    bondQuality, // Forward to generator
                    coordinates: centeredCoordinates as AtomWithBonds[],
                    originalCoordinates: filteredCoordinates as AtomWithBonds[]
                });
                mesh.castShadow = true;

                // Create or retrieve group for the atom type
                if (!atomGroups[atomType]) {
                    const groupForType = new THREE.Group();
                    groupForType.name = `Group_${atomType}`;
                    atomGroups[atomType] = groupForType;
                    group!.add(groupForType);
                }

                atomGroups[atomType].add(mesh);
            });
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
    return sphere;
};

export const createCubeMesh = (params: LocalSelectedGeneratorParams) => {
    const { x, y, z, quality, size, color, multiplicationFactor } = params;
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size * multiplicationFactor, size * multiplicationFactor, size * multiplicationFactor),
        material
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;
    return cube;
};

/*
export const createBallAndStickMesh = (params: UpdatedLocalSelectedGeneratorParams) => {
    const { x, y, z, quality, size, color, multiplicationFactor, coordinates, originalCoordinates } = params;

    if (!coordinates || !originalCoordinates) {
        console.warn("Coordinates are required for ball-and-stick representation");
        return createSphereMesh(params);
    }

    const group = new THREE.Group();

    // Create sphere for the atom
    const sphereSize = size * multiplicationFactor * 0.4;
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(sphereSize, quality, quality),
        material
    );
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    group.add(sphere);

    // Find the current atom using a tolerance for floating-point comparison
    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(atom => {
        return atom.centeredX !== undefined && atom.centeredY !== undefined && atom.centeredZ !== undefined &&
               Math.abs(atom.centeredX - x) < EPSILON &&
               Math.abs(atom.centeredY - y) < EPSILON &&
               Math.abs(atom.centeredZ - z) < EPSILON;
    });

    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach(bond => {
            // Find the bonded atom in the centered coordinates
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);

            if (bondedAtom) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );

                // Calculate midpoint
                const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

                // Calculate direction and length
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const bondLength = direction.length();

                // Create cylinder geometry
                const bondRadius = sphereSize * 0.5;
                // Create cylinder geometry for the bond
                const cylinderGeometry = new THREE.CylinderGeometry(
                    bondRadius, // Radius of the top of the cylinder
                    bondRadius, // Radius of the bottom of the cylinder
                    bondLength, // Height of the cylinder
                    50,          // Number of segmented faces around the circumference
                    1           // Number of segmented faces along the height
                );

                // Center the cylinder geometry
                cylinderGeometry.translate(0, bondLength / 2, 0);

                const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const cylinder = new THREE.Mesh(cylinderGeometry, bondMaterial);

                // Position and rotate the cylinder
                cylinder.position.copy(startPos);
                cylinder.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );

                cylinder.castShadow = true;
                group.add(cylinder);
            }
        });
    }

    return group;
};
*/


export const createBallAndStickMesh = (params: UpdatedLocalSelectedGeneratorParams) => {
    // Log all relevant parameters for debugging
    console.log("createBallAndStickMesh parameters:", {
        x: params.x,
        y: params.y,
        z: params.z,
        quality: params.quality,
        size: params.size,
        color: params.color,
        multiplicationFactor: params.multiplicationFactor,
        bondDiameterMultiplicationFactor: params.bondDiameterMultiplicationFactor,
        bondQuality: params.bondQuality,
        coordinates: params.coordinates,
        originalCoordinates: params.originalCoordinates
    });

    const {
        x,
        y,
        z,
        quality,
        size,
        color,
        multiplicationFactor,
        coordinates,
        originalCoordinates,
        bondDiameterMultiplicationFactor, // New parameter for bond diameter
        bondQuality // New parameter for cylinder mesh quality
    } = params;

    if (!coordinates || !originalCoordinates) {
        console.warn("Coordinates are required for ball-and-stick representation");
        return createSphereMesh(params);
    }

    const group = new THREE.Group();

    // Create sphere for the atom
    const sphereSize = size * multiplicationFactor * 0.4;
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(sphereSize, quality, quality),
        material
    );
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    group.add(sphere);

    // Find the current atom using a tolerance for floating-point comparison
    const EPSILON = 0.0001;
    const currentAtom = coordinates.find(atom => {
        return atom.centeredX !== undefined &&
               atom.centeredY !== undefined &&
               atom.centeredZ !== undefined &&
               Math.abs(atom.centeredX - x) < EPSILON &&
               Math.abs(atom.centeredY - y) < EPSILON &&
               Math.abs(atom.centeredZ - z) < EPSILON;
    });

    if (currentAtom && Array.isArray(currentAtom.bonds) && currentAtom.bonds.length > 0) {
        currentAtom.bonds.forEach(bond => {
            // Find the bonded atom in the centered coordinates
            const bondedAtom = coordinates.find(atom => atom.id === bond.atomId);

            if (bondedAtom) {
                const startPos = new THREE.Vector3(x, y, z);
                const endPos = new THREE.Vector3(
                    bondedAtom.centeredX,
                    bondedAtom.centeredY,
                    bondedAtom.centeredZ
                );

                // Calculate midpoint
                const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

                // Calculate direction and half-length for each cylinder
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const bondLength = direction.length();
                const halfBondLength = bondLength / 2;

                // Create cylinder geometry with consistent diameter
                const bondRadius = sphereSize * (bondDiameterMultiplicationFactor ?? 0.5);

                // First cylinder (from start to midpoint)
                const cylinderGeometry1 = new THREE.CylinderGeometry(
                    bondRadius, // Radius of the top
                    bondRadius, // Radius of the bottom
                    halfBondLength, // Height of the cylinder
                    bondQuality, // Number of segmented faces around circumference
                    1 // Number of segmented faces along height
                );

                // Second cylinder (from midpoint to end)
                const cylinderGeometry2 = new THREE.CylinderGeometry(
                    bondRadius,
                    bondRadius,
                    halfBondLength,
                    bondQuality,
                    1
                );

                // Center the cylinder geometries
                cylinderGeometry1.translate(0, halfBondLength / 2, 0);
                cylinderGeometry2.translate(0, halfBondLength / 2, 0);

                const bondMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });

                // Create and position first cylinder (start to midpoint)
                const cylinder1 = new THREE.Mesh(cylinderGeometry1, bondMaterial);
                cylinder1.position.copy(startPos);
                cylinder1.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );
                cylinder1.castShadow = true;
                group.add(cylinder1);

                // Create and position second cylinder (midpoint to end)
                const cylinder2 = new THREE.Mesh(cylinderGeometry2, bondMaterial);
                cylinder2.position.copy(midPoint);
                cylinder2.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );
                cylinder2.castShadow = true;
                group.add(cylinder2);
            }
        });
    }

    return group;
};



// Export scene or specific mesh as binary STL
export function exportBinary() {
    if (!group || group.children.length === 0) {
        console.warn("No mesh available for export.");
        return;
    }

    let delay = 0;

    group.children.forEach((child, index) => {
        if (child instanceof THREE.Group) {
            const result = exporter.parse(child, { binary: true }) as DataView;

            // Použijeme název skupiny nebo generujeme unikátní název
            const groupName = child.name || `Group_${index}`;
            console.log(`Exporting group: ${groupName}`);

            // Nastavení časového odstupu pro každé stažení
            setTimeout(() => {
                downloadSTL(result.buffer, `${groupName}.stl`);
            }, delay);

            delay += 1000; // Zpoždění 100 ms mezi staženími
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

    // Přidání STL souborů do ZIP
    group.children.forEach((child, index) => {
        if (child instanceof THREE.Group) {
            const result = exporter.parse(child, { binary: true }) as DataView;

            const groupName = child.name || `Group_${index}`;
            console.log(`Exporting group: ${groupName}`);

            // Přidání STL do ZIP
            zip.file(`${groupName}.stl`, new Blob([result.buffer as ArrayBuffer], { type: "application/octet-stream" }));
        }
    });

    // Přidání metadat jako textového souboru
    const metadataContent = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

    zip.file("metadata.txt", metadataContent);

    // Generování ZIP a stažení
    zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href); // Uvolnění paměti
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

    // Export celého modelu
    const result = exporter.parse(group, { binary: true }) as DataView;

    // Stáhneme jako jeden STL soubor
    downloadSTL(result.buffer, `${fileName}.stl`);
}

// Helper function to trigger download
function downloadSTL(data: ArrayBufferLike, filename: string) {
    const arrayBuffer = data as ArrayBuffer; // Explicit cast to ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // Cleanup the URL object
    URL.revokeObjectURL(link.href);
}

// Add this new function
export function takeScreenshot(): string | null {
    if (!renderer || !scene || !camera) {
        console.warn("Three.js not initialized");
        return null;
    }
    // Store original clear settings
    const originalClearColor = renderer.getClearColor(new THREE.Color()).getHex();
    const originalAlpha = renderer.getClearAlpha();
    // Set transparent background for the screenshot
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    // Restore original clear settings
    renderer.setClearColor(originalClearColor, originalAlpha);
    return dataUrl;
}

interface UpdatedLocalSelectedGeneratorParams extends LocalSelectedGeneratorParams {
    originalCoordinates?: AtomWithBonds[];
    bondDiameterMultiplicationFactor?: number; // New parameter for bond diameter
    bondQuality?: number; // New parameter for cylinder mesh quality
}