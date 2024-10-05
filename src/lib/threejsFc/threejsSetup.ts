import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupThreeJS(canvas: HTMLCanvasElement) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff);

    camera.position.z = 5;

    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const oxygenSphere = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), material);
    scene.add(oxygenSphere);

    const hydrogenMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const hydrogenGeometry = new THREE.SphereGeometry(0.75, 32, 32);
    const hydrogenSphere1 = new THREE.Mesh(hydrogenGeometry, hydrogenMaterial);
    const hydrogenSphere2 = new THREE.Mesh(hydrogenGeometry, hydrogenMaterial);
    hydrogenSphere1.position.set(1.5, 1, 0);
    hydrogenSphere2.position.set(-1.5, 1, 0);

    scene.add(hydrogenSphere1);
    scene.add(hydrogenSphere2);

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
