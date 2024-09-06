<div class="container mt-4">
  <div class="row">
    <!-- Levá strana s formulářem -->
    <div class="col-md-8">
      <!-- Vyhledávací pole a tlačítka -->
    <div class="d-flex mb-3 align-items-center">
		<input type="text" class="form-control form-control-lg me-2" placeholder={$_('search_field')} aria-label="Search">
		<label for="fileInput" class="btn btn-primary me-2">{$_('upload_file_button')}</label>
		<input type="file" id="fileInput" class="d-none">
		<button class="btn btn-primary">{$_('fetch_data_button')}</button>
	</div>

      <!-- Tabulka s daty -->
      <table class="table table-borderless">
        <thead>
          <tr>
            <th>{$_('name_table_header')}</th>
            <th>{$_('id_table_header')}</th>
            <th>{$_('description_table_header')}</th>
            <th>{$_('image_table_description')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sample Name</td>
            <td>12345</td>
            <td>Sample description</td>
            <td rowspan="2">
				<img src="https://via.placeholder.com/150" alt="Sample" class="img-fluid">
            </td>
          </tr>
          <tr>
            <td colspan="3">
              <div>
                <label for="qualityRange">{$_('quality_slider')} {quality}</label>
                <input type="range" id="qualityRange" min="0" max="100" bind:value={quality} class="form-range">
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
                <label class="form-check-label" for="hydrogensCheckbox">
                  {$_('hydrogens_checbox')}
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Tlačítko pro generování modelu -->
      <button class="btn btn-success btn-lg w-100">{$_('generate_model_button')}</button>
    </div>

    <!-- Pravá strana s canvasem -->
    <div class="col-md-4">
      <canvas id="threeCanvas" class="border" width="400" height="400"></canvas>
    </div>
  </div>
</div>

<style>

.form-control {
    padding: 0.375rem 0.75rem; /* Bootstrap's default padding for inputs */
    min-height: 61.23px; /* Set a minimum height */
}

</style>

<script lang="ts">
    import { _, locale } from 'svelte-i18n'
      function switchLocale(newLocale: string) {
        locale.set(newLocale);
      }

    let quality = 50;
    let showHydrogens = false;

    import { onMount } from 'svelte';
    import * as THREE from "three";
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';  // Import OrbitControls

    onMount(() => {
        const canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Set up scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas });

        renderer.setSize(canvas.width, canvas.height);
        renderer.setClearColor(0xffffff); // Set background color to white

        camera.position.z = 5;

        // Create the spheres for the water molecule
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue color for oxygen
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

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);

        function animate() {
            requestAnimationFrame(animate);
            oxygenSphere.rotation.y += 0.01;
            hydrogenSphere1.rotation.y += 0.01;
            hydrogenSphere2.rotation.y += 0.01;
            controls.update(); // Update controls
            renderer.render(scene, camera);
        }

        animate();
    });
</script>
