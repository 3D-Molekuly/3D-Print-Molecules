import * as THREE from "three";
import JSZip from "jszip";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { CreateAtomsParams, SelectedGeneratorParams } from '$lib/types';

const exporter = new STLExporter();

let group: THREE.Group | null = null;

export function setupThreeJS(canvas: HTMLCanvasElement) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);
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
        scene.children = essentialObjects;
    };

    const createAtoms = (params: CreateAtomsParams) => {
        const { coordinates, quality, showHydrogens, multiplicationFactor, selectedGenerator } = params;
        clearScene();

        group = new THREE.Group();
        scene.add(group);

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

            camera.position.set(avgX, avgY, avgZ + 10);
            camera.lookAt(avgX, avgY, avgZ);

            filteredCoordinates.forEach(({ atomType, x, y, z, AtomicRadius, CPKHexColor }) => {
                const size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;
                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                const mesh = selectedGenerator({ x: x - avgX, y: y - avgY, z: z - avgZ, quality, size, color, multiplicationFactor });
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
        renderer.render(scene, camera);
    }

    function updateCanvasSize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    return { animate, updateCanvasSize, createAtoms, clearScene };
}

export const createSphereMesh = (params: SelectedGeneratorParams) => {
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

export const createCubeMesh = (params: SelectedGeneratorParams) => {
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
