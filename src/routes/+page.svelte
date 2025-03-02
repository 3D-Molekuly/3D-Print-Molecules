<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { setupThreeJS, exportBinaryAsZip, exportModelAsSTL, createSphereMesh, createCubeMesh, createBallAndStickMesh, takeScreenshot } from '$lib/threejsFc/threejsMolecules2';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB, parseSDF } from '$lib/molecules/molecularDataParser';
  import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
  import { buildLocalizedPath } from '$lib/functions/language';
  import type { CreateAtomsParams, SelectedGeneratorParams } from '$lib/types';

  import InfoButton from '$lib/buttons/infoButton.svelte';

  let inputStr = '';
  let searchHistory: string[] = [];
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let fileName: string = "molecule";

  let resizeCanvas: (() => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;
  let dropZone: HTMLElement;
  let fileInput: HTMLInputElement;

  let acceptFormats = '.sdf';

  let quality = 50;
  let showHydrogens = true;

  let atomCoordinates: AtomCoordinate[] = [];
  let createAtoms: ((params: CreateAtomsParams) => void);

  const modelGenerators = [
    { name: 'Spheres', func: createSphereMesh },
    { name: 'Ball-and-Stick', func: createBallAndStickMesh },
    { name: 'Minecraft', func: createCubeMesh }
  ];
  let selectedGenerator = modelGenerators[0].func;

  let multiplicationFactor = 1.0;

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

      const cleanup = setupCanvasResizing(canvas, updateCanvasSize);
      createAtoms = generatedCreateAtoms;
      animate();

      // Return cleanup function
      return () => {
        cleanup();
      };

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
    isFileUploaded = false;
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
        atomCoordinates = await parseSDF(content);  // Await the async parser function

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
    updateFileName();
    exportBinaryAsZip(fileName, {
      author: "3D Printing Molecules WEB APP",
      quality: quality,
      description: "ZIP of STL models with metadata",
      hydrogens: String(showHydrogens)
    });
  }

  async function downloadWholeModel() {
    console.log("Generating something else after model is created...");
    updateFileName();
    exportModelAsSTL(fileName);
  }

  function redrawModel(atomCoordinates: AtomCoordinate[]) {
    // Store the atom coordinates in session storage for persistence
    sessionStorage.setItem('atomCoordinates', JSON.stringify(atomCoordinates));
    console.log("redrawModel function initiated");
    console.log(atomCoordinates); // Log the parsed coordinates
    // Safely redraw the spheres with the updated coordinates
    if (typeof createAtoms === "function") {
      const params: CreateAtomsParams = {
        coordinates: atomCoordinates,
        quality: quality,
        showHydrogens: showHydrogens,
        multiplicationFactor: multiplicationFactor,
        selectedGenerator: selectedGenerator
      };
      createAtoms(params);  // Update the spheres in the scene
    } else {
      console.log("createAtoms function not initialized");
      console.error("Function not initialized");
    }
  }

  function updateFileName() {
    let name = "molecule";  // Default name

    // Check if file was uploaded and set the name accordingly
    if (isFileUploaded) {
      name = `Molecule_${uploadedFileName}`;  // Use the uploaded file name without extension
    }
    // Check if `tableInfo.secondItem` has a value and set it as the file name.
    else if (tableInfo.secondItem) {
      name = `Molecule_${tableInfo.secondItem}`;
    }

    fileName = name;
    console.log("Updated file name:", fileName);
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

  let uploadedFileName: string = "";
  let isFileUploaded: boolean = false;

  //File Upload feature

  function handleFiles(files: FileList) {
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pdb' || fileExtension === 'sdf') {
        // Set the uploaded file name and indicator
        uploadedFileName = file.name.split('.').slice(0, -1).join('.');  // Remove extension
        isFileUploaded = true;

        // Update the table info and image
        setTableInfo(file.name, "", "");
        setImage('https://openmoji.org/data/black/svg/1F4C4.svg');

        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          atomCoordinates = await parseSDF(content);
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

  let isCollapsed = typeof window !== 'undefined' && localStorage.getItem('menuCollapsed') !== 'false';

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    localStorage.setItem('menuCollapsed', isCollapsed.toString());
    // Wait for the collapse animation to finish before resizing
    setTimeout(() => {
        if (typeof resizeCanvas === "function") {
            resizeCanvas();
        }
    }, 350); // Bootstrap's default collapse animation duration is 300ms
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  function saveCanvasAsImage() {
    updateFileName();
    const imageData = takeScreenshot();
    if (imageData) {
      const link = document.createElement('a');
      link.download = `Photo_${fileName}.png`;
      link.href = imageData;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      console.error("Failed to capture screenshot");
    }
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
          {#if selectedGenerator === createSphereMesh}
          <tr>
            <td>
              <label for="multiplicationFactor">{$_('multiplication_factor')}</label>
              <input type="number" id="multiplicationFactor" bind:value={multiplicationFactor} step="0.1" min="0.1" class="form-control w-auto">
            </td>
          </tr>
          {/if}
          {#if selectedGenerator === createCubeMesh}
          <tr>
            <td>
              <label for="multiplicationFactor">{$_('multiplication_factor')}</label>
              <input type="number" id="multiplicationFactor" bind:value={multiplicationFactor} step="0.1" min="0.1" class="form-control w-auto">
            </td>
          </tr>
          {/if}
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
      <div class="canvas-container" id="canvasContainer">
        <div class="canvas-controls">
          <button class="btn" on:click={saveCanvasAsImage}>
            <span class="material-symbols-outlined canvas-control">photo_camera</span>
          </button>

          <button class="btn" on:click={() => {
            const container = document.getElementById('canvasContainer');
            if (container) {
              if (!document.fullscreenElement) {
                container.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }
          }}>
            <span class="material-symbols-outlined canvas-control">fullscreen</span>
          </button>
        </div>
        <canvas id="threeCanvas" class="border rounded"></canvas>
      </div>
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
    align-items: flex-start; /* Changed from center to flex-start */
    height: fit-content;
  }

  .canvas-container {
    height: 100%;
    max-height: none; /* Remove the max-height constraint */
  }

  #threeCanvas {
    max-height: none; /* Remove the max-height constraint */
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

.canvas-container {
  position: relative;
  width: 100%;
  max-height: 100vh; /* Prevent excessive height */
}

.canvas-container:fullscreen {
  background: rgb(255, 255, 255);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas-container:fullscreen canvas {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
}

.canvas-container:fullscreen .canvas-controls {
  position: fixed;
  top: 20px;
  right: 20px;
}

.canvas-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 5px;
}

.canvas-controls button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    height: 31px;
    width: 31px;
    line-height: 1;
}

.canvas-controls .material-symbols-outlined {
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.canvas-controls button:hover {
  background-color: rgb(195, 195, 195);
}

.material-symbols-outlined.canvas-control {
  margin: 0; /* Odstraňte jakékoli vnější mezery */
  padding: 0; /* Odstraňte vnitřní mezery */
  display: inline-block; /* Zajistěte, že ikona má přesnou velikost */
}

#threeCanvas {
  max-height: 100vh; /* Prevent canvas from exceeding viewport height */
  object-fit: contain;
}

</style>
