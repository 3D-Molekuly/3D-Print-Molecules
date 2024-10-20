<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { setupThreeJS } from '$lib/threejsFc/threejsMolecules';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB } from '$lib/molecules/pdbParser';
  import type { AtomCoordinate } from '$lib/molecules/pdbParser';

  let quality = 50;
  let showHydrogens = true;
  let inputStr = '';
  let searchHistory: string[] = [];
  let resizeCanvas: (() => void) | undefined;
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let atomCoordinates: AtomCoordinate[] = []
  let createAtomSpheres: ((coordinates: AtomCoordinate[], quality: number) => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;

  onMount(async () => {
    if (browser) {
      searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      try {
        const storedCoordinates = sessionStorage.getItem('atomCoordinates');
        atomCoordinates = storedCoordinates ? JSON.parse(storedCoordinates) : [];

        const { animate, updateCanvasSize, createAtomSpheres: spheresCreator } = setupThreeJS(canvas, atomCoordinates);

        if (typeof spheresCreator === "function") {
          createAtomSpheres = spheresCreator;
        } else {
          throw new Error("Failed to initialize createAtomSpheres function");
        }

        resizeCanvas = setupCanvasResizing(canvas, updateCanvasSize);
        animate();
      } catch (error) {
        console.error("Error during onMount initialization:", error);
      }
    }
  });

  import { determineInputType, fetchPubChemData, fetchPDBData } from '$lib/molecules/inputs';

  function setTableInfo(firstItem: string, secondItem: string, thirdItem: string) {
    tableInfo = { firstItem, secondItem, thirdItem };
  }

  function setImage(url: string) {
    imageUrl = url;
  }

  async function handleSubmit() {
    saveSearch();
    const inputType = determineInputType(inputStr);

    // Fetch data and set table info and image
    if (inputType === "CID") {
      await fetchPubChemData(inputStr, setTableInfo, setImage);
    } else if (inputType === "PDB") {
      await fetchPDBData(inputStr, setTableInfo, setImage);
    } else {
      console.error("Unsupported input type.");
      return;  // Exit if unsupported input type
    }

    // Fetch and parse the molecule data
    if (inputType === "CID") {
        const primaryUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${tableInfo.secondItem}/record/SDF?record_type=3d&response_type=display`;
        const fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${tableInfo.secondItem}/record/SDF`;

        let response;
        try {
            response = await fetch(primaryUrl);
            if (!response.ok) throw new Error("Primary URL failed");
        } catch (error) {
            console.error("Failed to fetch from primary URL, trying fallback:", error);
            response = await fetch(fallbackUrl);
            if (!response.ok) {
                throw new Error("Fallback URL also failed");
            }
        }
        const content = await response.text();
        atomCoordinates = await parsePDB(content);  // Await the async parser function

    } else if (inputType === "PDB") {
        const url = `https://files.rcsb.org/view/${inputStr}.pdb`;
        const response = await fetch(url);
        const content = await response.text();
        atomCoordinates = await parsePDB(content);  // Await the async parser function
    }

    // Optionally, redraw the model with the new atom coordinates
    redrawModel(atomCoordinates);

    // Update canvas size if applicable
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
        redrawModel(atomCoordinates);
      };
      reader.readAsText(file);
      }
    }

    async function generateModel() {
      console.log("Generating something else after model is created...");
    }

    function redrawModel(atomCoordinates: AtomCoordinate[]) {
    // Store the atom coordinates in session storage for persistence
    sessionStorage.setItem('atomCoordinates', JSON.stringify(atomCoordinates));
    console.log(atomCoordinates); // Log the parsed coordinates
    // Safely redraw the spheres with the updated coordinates
    if (typeof createAtomSpheres === "function") {
      createAtomSpheres(atomCoordinates, quality);  // Update the spheres in the scene
    } else {
      console.error("createAtomSpheres function not initialized");
    }
  }

  // Save inputStr to search history (max 5 items)
  function isClient() {
    return typeof window !== 'undefined';
  }

  function saveSearch() {
    if (browser && inputStr.trim() !== '' && !searchHistory.includes(inputStr)) {
      searchHistory = [inputStr, ...searchHistory.slice(0, 4)];
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }

  // Handle search item click from history
  function handleHistoryClick(item: string) {
    inputStr = item;
    saveSearch();  // Update history
    handleSubmit();  // Trigger the search action
  }
</script>

<div class="container mt-4 main-panel main-content">
  <div class="row">
    <!-- Left side with form -->
    <div class="col-md-8 left-panel">
      <!-- Search field and buttons -->
      <div class="d-flex mb-3 align-items-center">
        <input
          type="text"
          bind:value={inputStr}
          on:keydown={handleKeyPress}
          class="form-control form-control-lg me-2 main-search-line dropdown-toggle"
          id="dropdownMenuButton"
          data-bs-toggle="dropdown"
          placeholder={$_('search_field')}
          aria-label="Search"
        />
        {#if searchHistory.length > 0}
        <ul class="dropdown-menu" id="searchDropdown" aria-labelledby="dropdownMenuButton">
          <!-- Dropdown items will be injected here -->
          {#each searchHistory as item, index}
            <li>
              <a class="dropdown-item" href="/" on:click={() => handleHistoryClick(item)}>
                {item}
              </a>
            </li>
          {/each}
        </ul>
        {/if}
        <label for="fileInput" class="btn btn-primary me-2 button-with-icon d-flex align-items-center main-search-line">
          <span class="material-symbols-outlined">upload_file</span>
          {$_('upload_file_button')}
        </label>
        <input on:change={handleFileUpload} type="file" id="fileInput" class="d-none">

        <button on:click={handleSubmit} class="btn btn-primary button-with-icon d-flex align-items-center main-search-line">
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
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>{$_('model_settings')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <label for="qualityRange">{$_('quality_slider')} {quality}</label>
            </td>
            <td>
              <div class="quality-container">
                <input type="range" id="qualityRange" min="0" max="100" bind:value={quality} class="form-range">
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <label class="form-check-label" for="hydrogensCheckbox">{$_('hydrogens_checbox')}</label>
            </td>
            <td class="form-check">
              <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
            </td>
          </tr>
        </tbody>
      </table>
      <br>

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

.main-search-line {
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

.quality-container {
  display: flex;
  align-items: center;
}

.form-range {
  width: 150px; /* Adjust this value to control the slider width */
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
