<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import * as THREE from "three";
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  let quality = 50;
  let showHydrogens = true;

  onMount(() => {
      const canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;

      if (!canvas) {
          console.error('Canvas, form element, or header element not found');
          return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas });

      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0xffffff);

      camera.position.z = 5;

      // Create spheres for the water molecule
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
          oxygenSphere.rotation.y += 0.01;
          hydrogenSphere1.rotation.y += 0.01;
          hydrogenSphere2.rotation.y += 0.01;
          controls.update();
          renderer.render(scene, camera);
      }

      function updateCanvasSize() {
          const canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
          const formElement = document.querySelector('.left-panel') as HTMLElement;
          const containerElement = document.querySelector('.main-panel') as HTMLElement;

          if (!canvas || !formElement) {
              console.error('Canvas or form element not found');
              return;
          }

          const isMobile = window.innerWidth < 768;

          if (isMobile) {
              // Mobilní režim - canvas má stejnou šířku jako prvek nad ním
              canvas.style.width = `${formElement.clientWidth-25}px`;
              canvas.style.height = 'auto';
          } else {
              // Horizontální režim - canvas má stejnou výšku jako formulář vlevo
              canvas.style.height = `${formElement.clientHeight}px`;

              // Získání pozice canvasu a kontejneru
              const canvasLeftOffset = canvas.getBoundingClientRect().left;
              const containerRightOffset = containerElement.getBoundingClientRect().right;

              // Výpočet nové šířky canvasu, aby byl zarovnaný s koncem kontejneru
              const newCanvasWidth = containerRightOffset - canvasLeftOffset;
              canvas.style.width = `${newCanvasWidth}px`;

          }

          // Aktualizace aspektu kamery
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
      }

      window.addEventListener('resize', updateCanvasSize);
      updateCanvasSize(); // Nastavit počáteční velikost canvasu

      animate();
  });
</script>

<div class="container mt-4 main-panel">
  <div class="row">
    <!-- Levá strana s formulářem -->
    <div class="col-md-8 left-panel">
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
      <canvas id="threeCanvas" class="border rounded"></canvas>
    </div>
  </div>
</div>

<style>
.container {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .row {
      display: flex;
      flex-direction: row;
  }

  .col-md-4 {
      display: flex;
      align-items: center;
  }
}

@media (max-width: 767px) {
  .row {
      display: flex;
      flex-direction: column;
  }

  .col-md-4 {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 40px;
  }
}
</style>
