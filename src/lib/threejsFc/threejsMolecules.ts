import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AtomCoordinate } from '$lib/molecules/pdbParser'; // Make sure to import AtomCoordinate type

export function setupThreeJS(canvas: HTMLCanvasElement, atomCoordinates: AtomCoordinate[]) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);
    renderer.shadowMap.enabled = true;

    // Function to clear the scene
    const clearScene = () => {
        while (scene.children.length > 0) {
            const object = scene.children[0];
            scene.remove(object);
        }
    };

    // Function to create atom spheres from coordinates
    const createAtomSpheres = (coordinates: AtomCoordinate[]) => {
        // First, clear the existing objects
        clearScene();

        if (coordinates.length > 0) {
            // Calculate the average position for centering
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

        // Now, create new atom spheres
        coordinates.forEach(({ atomType, x, y, z, AtomicRadius, CPKHexColor }) => {
            const radius = AtomicRadius ? parseFloat(AtomicRadius) : 0.5; // Default radius if not specified
            const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000; // Default color if not specified

            const material = new THREE.MeshBasicMaterial({ color });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);

            sphere.position.set(x - avgX, y - avgY, z);
            sphere.castShadow = true;
            scene.add(sphere);
        });

        // Position the camera
        camera.position.set(avgX, avgY, 10); // Adjust the camera position based on the average
        camera.lookAt(avgX, avgY, 0); // Ensure the camera looks at the center
        };
    }

    const controls = new OrbitControls(camera, renderer.domElement);

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

    return { animate, updateCanvasSize, createAtomSpheres, clearScene }; // Return clearScene for future use
}
