<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { setupThreeJS, exportBinaryAsZip, exportModelAsSTL, createSphereMesh, createCubeMesh } from '$lib/threejsFc/threejsMolecules2';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB } from '$lib/molecules/pdbParser';
  import type { AtomCoordinate } from '$lib/molecules/pdbParser';
  import { buildLocalizedPath } from '$lib/functions/language';

  import InfoButton from '$lib/buttons/infoButton.svelte';

  let inputStr = '';
  let searchHistory: string[] = [];
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';

  let resizeCanvas: (() => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;
  let dropZone: HTMLElement;
  let fileInput: HTMLInputElement;

  let acceptFormats = '.pdb,.sdf';

  let quality = 50;
  let showHydrogens = true;

  let atomCoordinates: AtomCoordinate[] = [];
  let createAtoms: ((coordinates: AtomCoordinate[], quality: number, showHydrogens: boolean, generator: any) => void);

  const modelGenerators = [
    { name: 'Spheres', func: createSphereMesh },
    { name: 'Cubes', func: createCubeMesh }
  ];
  let selectedGenerator = modelGenerators[0].func;

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

      const { animate, updateCanvasSize, createAtoms: generatedCreateAtoms } = await setupThreeJS(canvas);

      resizeCanvas = setupCanvasResizing(canvas, updateCanvasSize);
      createAtoms = generatedCreateAtoms;
      animate();

      // Setup event listeners
      dropZone = document.getElementById('dropZone') as HTMLElement;
      fileInput = document.getElementById('fileInput') as HTMLInputElement;

      // We don't need to add event listeners here anymore, as they're handled in the template
    } catch (error) {
      console.error("Error during onMount initialization:", error);
    }
  }
  if (isIOS()) {
      acceptFormats = ''; // Allows all file types on iOS
    }
  });

  // Molecular Search and Handeling of MOlecular Data
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

  async function downloadModel() {
    console.log("Generating something else after model is created...");
    exportBinaryAsZip();
  }

  async function downloadWholeModel() {
    console.log("Generating something else after model is created...");
    exportModelAsSTL();
  }

  function redrawModel(atomCoordinates: AtomCoordinate[]) {
    // Store the atom coordinates in session storage for persistence
    sessionStorage.setItem('atomCoordinates', JSON.stringify(atomCoordinates));
    console.log("redrawModel function initiated");
    console.log(atomCoordinates); // Log the parsed coordinates
    // Safely redraw the spheres with the updated coordinates
    if (typeof createAtoms === "function") {
      createAtoms(atomCoordinates, quality, showHydrogens, selectedGenerator);  // Update the spheres in the scene
    } else {
      console.log("createAtoms function not initialized");
      console.error("Function not initialized");
    }
  }

  // Search History
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

  function clearHistory() {
    searchHistory = [];
  }

  //File Upload feature
  function handleFiles(files: FileList) {
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pdb' || fileExtension === 'sdf') {
        setTableInfo(file.name, "", "");
        setImage('https://openmoji.org/data/black/svg/1F4C4.svg');

        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          atomCoordinates = await parsePDB(content);
          redrawModel(atomCoordinates);
        };
        reader.readAsText(file);
      } else {
        alert($_('invalid_file_type'));
      }
    }
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        handleFiles(target.files);
    }
}

  let isDragging = false;
  let dragCounter = 0;

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter++;
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      isDragging = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;
    dragCounter = 0;
    if (event.dataTransfer?.files) {
      handleFiles(event.dataTransfer.files);
    }
  }

  let isEditing = false; // boolean to track if editing mode is active

  function enableEditing() {
    isEditing = true;
  }

  function disableEditing() {
    isEditing = false;
  }

  let isCollapsed = typeof window !== 'undefined' && localStorage.getItem('menuCollapsed') === 'true' ? true : false;

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    localStorage.setItem('menuCollapsed', isCollapsed.toString());
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }
</script>

<div
  class="full-page-drop-zone"
  class:dragging={isDragging}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  role="region"
>

<div class="container mt-4 main-panel main-content">
  <div class="row">
    <!-- Left side with form -->
    <div class="col-md-8 left-panel">
      <!-- Search field and buttons -->
      <div class="d-flex mb-3 align-items-center">
          <div class="input-group">
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
          <!-- "X" button to clear search -->
          {#if inputStr}
            <button
              type="button"
              class="btn-close"
              aria-label="Clear"
              on:click={() => (inputStr = '')}
              style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%);"
            ></button>
          {/if}

        {#if searchHistory.length > 0}
        <ul class="dropdown-menu" id="searchDropdown" aria-labelledby="dropdownMenuButton">
          <!-- Search history items -->
          {#each searchHistory as item, index}
            <li>
              <a class="dropdown-item" href="/" on:click={() => handleHistoryClick(item)}>
                {item}
              </a>
            </li>
          {/each}

          <!-- Red "Delete history" button -->
          <li>
            <button
              type="button"
              class="dropdown-item"
              style="font-weight: bold; cursor: pointer; color: red; font-size: 10px;"
              on:click={clearHistory}
            >
            ⨉ {$_('delete_history')}
            </button>
          </li>
        </ul>
        {/if}
      </div>

        <div>
          <label for="fileInput" class="btn btn-primary me-2 button-with-icon d-flex align-items-center main-search-line">
            <span class="material-symbols-outlined">upload_file</span>
            {$_('upload_file_button')}
          </label>
          <input
            on:change={handleFileUpload}
            type="file"
            id="fileInput"
            class="d-none"
            accept={acceptFormats}
          >
        </div>

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

      <div>
      <table class="table table-borderless">
        <thead>
          <tr>
            <th>
              {$_('model_settings')}

              <button
                type="button"
                on:click={toggleCollapse}
                aria-expanded={!isCollapsed}
                aria-controls="collapseOne"
                class="btn btn-link"
              >
                <span class="material-symbols-outlined google-font-darkmode" style="font-size: 36px;">
                  {isCollapsed ? 'arrow_drop_down' : 'arrow_drop_up'}
                </span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody class={isCollapsed ? 'collapse' : ''} id="collapseOne">
          <tr>
            <td>
              <label for="qualityRange">
                {$_('quality_slider')}
                {#if isEditing}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    bind:value={quality}
                    on:blur={disableEditing}
                    class=""
                    style="width: 3em; text-align: center;">
                {:else}
                  <button
                    type="button"
                    on:click={enableEditing}
                    class="editable-button">
                    {quality}
                  </button>
                {/if}
              </label>
              <div class="quality-container">
                <input type="range" id="qualityRange" min="0" max="100" bind:value={quality} class="form-range">
              </div>
            </td>
            <td>
              <label for="model-generator">{$_('select_model_type')}</label>
              <select class="form-select"  id="model-generator" bind:value={selectedGenerator}>
                {#each modelGenerators as generator}
                  <option value={generator.func}>{generator.name}</option>
                {/each}
              </select>
            </td>
          </tr>
          <tr>
            <td>
              <label class="form-check-label" for="hydrogensCheckbox">{$_('hydrogens_checbox')}</label>
              <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
            </td>
            <td>
              <button on:click={downloadWholeModel} class="btn btn-info btn-lg w-100">
                <span class="material-symbols-outlined">deployed_code_update</span>
                {$_('download_whole_model_button')}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <br>

      <!-- Button to generate model -->
      <button on:click={downloadModel} class="btn btn-success btn-lg w-100">
        <span class="material-symbols-outlined">deployed_code_update</span>
        {$_('download_model_button')}
      </button>
    </div>

    <!-- Right side with canvas -->
    <div class="col-md-4">
      <canvas id="threeCanvas" class="border rounded"></canvas>
    </div>
  </div>
</div>

{#if isDragging}
    <div class="drag-overlay" role="status" aria-live="polite">
      <div class="drag-message">
        {$_('drag_and_drop_message')}
      </div>
    </div>
{/if}
</div>
<InfoButton title={$_('infobox_tittle')}>
  <div>
    {@html $_('infobox_helptext')}
  </div>
  <br>
  <div>
    {@html $_('infobox_appusage')}
  </div>
  <div>
    {@html $_('infobox_slicer_multipartobject')} <img src="/assets/multipartobject.svg" alt="warningWindowMulticolorObject">
  </div>
  <a href={buildLocalizedPath('/tutorials')}>{@html $_('infobox_moreinfo')}</a>
</InfoButton>
<style>
.main-content {
  margin-bottom: 2rem;
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

.full-page-drop-zone {
    width: 100%;
    position: relative;
  }

  .drag-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .drag-message {
    font-size: 2rem;
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 20px;
    border-radius: 10px;
  }

  .editable-button {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .editable-button:hover,
  .editable-button:focus {
    outline: 1px dashed #ccc;
  }
</style>
