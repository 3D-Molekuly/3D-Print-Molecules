<div class="container mt-4">
  <div class="row">
    <!-- Levá strana s formulářem -->
    <div class="col-md-8">
      <!-- Vyhledávací pole a tlačítka -->
    <div class="d-flex mb-3 align-items-center">
		<input type="text" class="form-control form-control-lg me-2" placeholder="Search..." aria-label="Search">
		<label for="fileInput" class="btn btn-primary me-2">Upload File</label>
		<input type="file" id="fileInput" class="d-none">
		<button class="btn btn-primary">Fetch Data</button>
	</div>

      <!-- Tabulka s daty -->
      <table class="table table-borderless">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Description</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sample Name</td>
            <td>12345</td>
            <td>Sample description</td>
            <td rowspan="2">
              <img src="https://via.placeholder.com/150" alt="Sample Image" class="img-fluid">
            </td>
          </tr>
          <tr>
            <td colspan="3">
              <div>
                <label for="qualityRange">Quality: {quality}</label>
                <input type="range" id="qualityRange" min="0" max="100" bind:value={quality} class="form-range">
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
                <label class="form-check-label" for="hydrogensCheckbox">
                  Hydrogens
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Tlačítko pro generování modelu -->
      <button class="btn btn-success btn-lg w-100">Generate Model</button>
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

<script>
	let quality = 50;
    let showHydrogens = false;

	import { onMount } from 'svelte';
    import * as THREE from "three";

    onMount(() => {
        const canvas = document.getElementById('threeCanvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas });

        renderer.setSize(canvas.width, canvas.height);
        camera.position.z = 5;

        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x0077ff });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        function animate() {
            requestAnimationFrame(animate);
            sphere.rotation.y += 0.01;
            renderer.render(scene, camera);
        }

        animate();
    });
</script>
