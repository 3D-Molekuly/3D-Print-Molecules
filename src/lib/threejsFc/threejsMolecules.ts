import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AtomCoordinate } from '$lib/molecules/pdbParser'; // Make sure to import AtomCoordinate type

export function setupThreeJS(canvas: HTMLCanvasElement, atomCoordinates: AtomCoordinate[]) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);

    camera.position.z = 5;

    // Function to create atom spheres from coordinates
    const createAtomSpheres = (coordinates: AtomCoordinate[]) => {
        coordinates.forEach(({ atomType, x, y, z, AtomicRadius, CPKHexColor }) => {
            const radius = AtomicRadius ? parseFloat(AtomicRadius) : 0.5; // Default radius if not specified
            const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000; // Default color if not specified
            const material = new THREE.MeshBasicMaterial({ color });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
            sphere.position.set(x, y, z);
            scene.add(sphere);
        });
    };

    // Create atom spheres using the provided atom coordinates
    createAtomSpheres(atomCoordinates);

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

    return { animate, updateCanvasSize };
}
