import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AtomCoordinate } from '$lib/molecules/pdbParser'; // Make sure to import AtomCoordinate type

export function setupThreeJS(canvas: HTMLCanvasElement, atomCoordinates: AtomCoordinate[]) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);
    renderer.shadowMap.enabled = true;  // Ensure shadow maps are enabled

    // Add ambient light to ensure global illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 3); // Increase ambient light intensity for better coverage
    scene.add(ambientLight);

    // Add main directional light from the front
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.001; // Adjust shadow bias to reduce shadow artifacts
    directionalLight.shadow.mapSize.width = 1024; // Increase shadow resolution
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add back light to illuminate from behind
    const backLight = new THREE.DirectionalLight(0xffffff, 1.8); // Adjust back light intensity
    backLight.position.set(-5, -5, 5).normalize();
    backLight.castShadow = true;
    backLight.shadow.bias = -0.001;
    backLight.shadow.mapSize.width = 1024;
    backLight.shadow.mapSize.height = 1024;
    scene.add(backLight);

    // Add a point light for focused illumination
    const pointLight = new THREE.PointLight(0xffffff, 2); // Brighten point light intensity
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // Add a hemispheric light for soft lighting from the sky
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5); // Light from above with a soft gradient
    hemisphereLight.position.set(0, 10, 0);
    scene.add(hemisphereLight);

    // Reduce shadow intensity or disable shadows on some lights if needed
    directionalLight.castShadow = true;
    backLight.castShadow = true;
    pointLight.castShadow = false; // PointLight shadows might cause unwanted harsh shadows, disable if necessary

    // Add a ground plane to receive shadows
    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });  // Shadow material
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;  // Rotate plane to horizontal
    plane.position.y = -1;  // Position it below the spheres
    //plane.receiveShadow = true;  // Allow the plane to receive shadows
    //scene.add(plane);

    // Function to clear the scene while keeping the essential objects (lights, plane)
    const clearScene = () => {
        const essentialObjects = [ambientLight, directionalLight, backLight, pointLight, hemisphereLight, plane];  // Keep lights and plane

        // Remove all other objects from the scene
        scene.children = essentialObjects;
    };

    // Function to create atom spheres from coordinates
    const createAtomSpheres = (coordinates: AtomCoordinate[], quality: number) => {
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
                const radius = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;  // Default radius if not specified
                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;  // Default color if not specified

                // Use MeshStandardMaterial to react to lights and shadows
                const material = new THREE.MeshStandardMaterial({ color });
                const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, quality, quality), material);

                sphere.position.set(x - avgX, y - avgY, z);
                sphere.castShadow = true;  // Enable shadows for the spheres
                scene.add(sphere);
            });

            // Position the camera
            camera.position.set(avgX, avgY, 10);  // Adjust the camera position based on the average
            camera.lookAt(avgX, avgY, 0);  // Ensure the camera looks at the center
        }
    };

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

    return { animate, updateCanvasSize, createAtomSpheres, clearScene };  // Return clearScene for future use
}
