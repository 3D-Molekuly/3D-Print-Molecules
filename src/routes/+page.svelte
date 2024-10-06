<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { setupThreeJS } from '$lib/threejsFc/threejsSetup';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB } from '$lib/molecules/pdbParser';
  import type { AtomCoordinate } from '$lib/molecules/pdbParser';

  let quality = 50;
  let showHydrogens = true;
  let inputStr = '';
  let resizeCanvas: (() => void) | undefined;
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let atomCoordinates: AtomCoordinate[] = [];

  onMount(() => {
    const canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
    if (!canvas) return console.error('Canvas not found');

    const { animate, updateCanvasSize } = setupThreeJS(canvas);
    resizeCanvas = setupCanvasResizing(canvas, updateCanvasSize);
    animate();
  });

  import { determineInputType, fetchPubChemData, fetchPDBData } from '$lib/molecules/inputs';

  function setTableInfo(firstItem: string, secondItem: string, thirdItem: string) {
    tableInfo = { firstItem, secondItem, thirdItem };
  }

  function setImage(url: string) {
    imageUrl = url;
  }

  async function handleSubmit() {
    const inputType = determineInputType(inputStr);

    if (inputType === "CID") {
      await fetchPubChemData(inputStr, setTableInfo, setImage);
    } else if (inputType === "PDB") {
      await fetchPDBData(inputStr, setTableInfo, setImage);
    } else {
      console.error("Unsupported input type.");
    }

    if (typeof resizeCanvas === "function") resizeCanvas();
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      setTableInfo(file.name, "", "");
      setImage('https://openmoji.org/data/black/svg/1F4C4.svg');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        atomCoordinates = await parsePDB(content); // Await the async parser function
        console.log("Parsed atom coordinates from file:", atomCoordinates);
      };
      reader.readAsText(file);
      }
    }

  async function generateModel() {
  if (inputStr) {
    const inputType = determineInputType(inputStr);

    if (inputType === "CID") {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${tableInfo.thirdItem}/record/SDF`;
      const response = await fetch(url);
      const content = await response.text();
      atomCoordinates = await parsePDB(content);  // Await the async parser function
    } else if (inputType === "PDB") {
      const url = `https://files.rcsb.org/view/${inputStr}.pdb`;
      const response = await fetch(url);
      const content = await response.text();
      atomCoordinates = await parsePDB(content);  // Await the async parser function
    }

    console.log("Atom coordinates:", atomCoordinates); // Log the parsed coordinates
  }
}
</script>

<div class="container mt-4 main-panel main-content">
  <div class="row">
    <!-- Left side with form -->
    <div class="col-md-8 left-panel">
      <!-- Search field and buttons -->
      <div class="d-flex mb-3 align-items-center">
        <input type="text" bind:value={inputStr} on:keydown={handleKeyPress} class="form-control form-control-lg me-2 custom-input-height" placeholder={$_('search_field')} aria-label="Search">

        <label for="fileInput" class="btn btn-primary me-2 button-with-icon d-flex align-items-center">
          <span class="material-symbols-outlined">upload_file</span>
          {$_('upload_file_button')}
        </label>
        <input on:change={handleFileUpload} type="file" id="fileInput" class="d-none">

        <button on:click={handleSubmit} class="btn btn-primary button-with-icon d-flex align-items-center">
          <span class="material-symbols-outlined">downloading</span>
          {$_('fetch_data_button')}
        </button>
      </div>

      <!-- Table with data -->
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
            <td style="width: 40%;">{tableInfo.firstItem}</td>
            <td>{tableInfo.secondItem}</td>
            <td>{tableInfo.thirdItem}</td>
            <td rowspan="2" style="width: 200px;">
              {#if imageUrl}
                <img src={imageUrl} alt="representation of the molecule" class="img-fluid">
              {:else}
                <div class="image-placeholder">
                  <span>{$_('no_image_available')}</span>
                </div>
              {/if}
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

      <!-- Button to generate model -->
      <button on:click={generateModel} class="btn btn-success btn-lg w-100">
        <span class="material-symbols-outlined">deployed_code_update</span>
        {$_('generate_model_button')}
      </button>
    </div>

    <!-- Right side with canvas -->
    <div class="col-md-4">
      <canvas id="threeCanvas" class="border rounded"></canvas>
    </div>
  </div>
</div>

<style>
.main-content {
  margin-bottom: 5rem;
}

.custom-input-height {
  height: 65px; /* Adjust this value to match the button height */
}

.container {
  display: flex;
  flex-direction: column;
}

img {
    object-fit: cover;  /* Ensures the image maintains its aspect ratio */
  }

.image-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 200px;
    background-color: #f0f0f0;  /* Light gray background */
    color: #777;                /* Gray text color */
    font-size: 14px;
    text-align: center;
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
