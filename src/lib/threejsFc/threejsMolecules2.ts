import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AtomCoordinate } from '$lib/molecules/pdbParser'; // Import AtomCoordinate type

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

    const clearScene = () => {
        const essentialObjects = [ambientLight, directionalLight, backLight, pointLight, hemisphereLight];
        scene.children = essentialObjects;
    };

    const createAtoms = (
        coordinates: AtomCoordinate[],
        quality: number,
        selectedGenerator: (x: number, y: number, z: number, quality: number, size: number, color: number) => THREE.Mesh
    ) => {
        clearScene();

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

            coordinates.forEach(({ x, y, z, AtomicRadius, CPKHexColor }) => {
                const size = AtomicRadius ? parseFloat(AtomicRadius) : 0.5;
                const color = CPKHexColor ? parseInt(CPKHexColor.replace('#', '0x')) : 0x000000;

                const mesh = selectedGenerator(x - avgX, y - avgY, z - avgZ, quality, size, color);
                mesh.castShadow = true;
                scene.add(mesh);

                console.log("3D object added with quality:", quality);
            });
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
