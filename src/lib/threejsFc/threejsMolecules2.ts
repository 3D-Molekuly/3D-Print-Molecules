import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import type { AtomCoordinate } from '$lib/molecules/pdbParser';

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

    const createAtoms = (
        coordinates: AtomCoordinate[],
        quality: number,
        showHydrogens: boolean,
        selectedGenerator: (x: number, y: number, z: number, quality: number, size: number, color: number) => THREE.Mesh
    ) => {
        clearScene();

        group = new THREE.Group(); // Initialize the group to hold all meshes
        scene.add(group);

        const filteredCoordinates = showHydrogens ? coordinates : coordinates.filter(({ atomType }) => atomType !== "H");

        if (coordinates.length > 0) {
            const center = coordinates.reduce(
                (acc, { x, y, z }) => {
                    acc.x += x;
                    acc.y += y;
                    acc.z += z;
                    return acc;
                },
                { x: 0, y: 0, z: 0 }
            );

            const avgX = center.x / coordinates.length;
            const avgY = center.y / coordinates.length;
            const avgZ = center.z / coordinates.length;

            camera.position.set(avgX, avgY, avgZ + 10);
            camera.lookAt(avgX, avgY, avgZ);

            filteredCoordinates.forEach(({ x, y, z, AtomicRadius, CPKHexColor }) => {
                const size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;
                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                const mesh = selectedGenerator(x - avgX, y - avgY, z - avgZ, quality, size, color);
                mesh.castShadow = true;
                //scene.add(mesh);
                group!.add(mesh);

                console.log("3D object added with quality:", quality);
            });
        }
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

export const createSphereMesh = (
    x: number,
    y: number,
    z: number,
    quality: number,
    size: number,
    color: number
) => {
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, quality, quality),
        material
    );
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    return sphere;
};

export const createCubeMesh = (
    x: number,
    y: number,
    z: number,
    quality: number,
    size: number,
    color: number
) => {
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        material
    );
    cube.position.set(x, y, z);
    cube.castShadow = true;
    return cube;
};

// Export scene or specific mesh as binary STL
export function exportBinary() {
    if (!group) {
        console.warn("No mesh available for export.");
        return;
    }

    // Export as binary
    const result = exporter.parse(group, { binary: true }) as DataView;

    // Use the underlying ArrayBuffer of the DataView
    downloadSTL(result.buffer, "molecule.stl");
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