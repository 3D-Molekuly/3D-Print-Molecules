<script lang="ts">
  // Imports
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { setupThreeJS, exportBinaryAsZip, exportModelAsSTL, createSphereMesh, createBallAndStickMesh, createCubeMesh, takeScreenshot } from '$lib/threejsFc/threejsMolecules2';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB, parseSDF } from '$lib/molecules/molecularDataParser';
  import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
  import { buildLocalizedPath } from '$lib/functions/language';
  import InfoButton from '$lib/buttons/infoButton.svelte';

  // Types
  let inputStr = '';
  let searchHistory: string[] = [];
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let fileName: string = "molecule";

  let resizeCanvas: (() => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;

  let acceptFormats = '.sdf';

  let atomCoordinates: AtomCoordinate[] = [];
  let prevAtomCoordinates: AtomCoordinate[] = [];
  let createAtoms: ((params: CreateAtomsParams) => void);

  const modelGenerators = [
    { name: 'Spheres', func: createSphereMesh },
    { name: 'Ball-and-Stick', func: createBallAndStickMesh },
    { name: 'Minecraft', func: createCubeMesh }
  ];
  let selectedGenerator = modelGenerators[0].func;

  let quality = 50;
  let showHydrogens = true;
  let multiplicationFactor = 1.0;
  let bondDiameterMultiplicationFactor = 0.4;
  let bondQuality = 32;
  let groupBondsSeparately = false;
  let originalContent: string = "";
  let originalFileExtension: string = "sdf";

  let showMoleculePopup = false;

  // New variables for reload functionality
  let isReloadMode = false;
  let lastSuccessfulInput = '';
  let lastSuccessfulFileContent = '';

  // Lifecycle
  onMount(() => {
    if (browser) {
      initialize();
    }
    if (isIOS()) {
      acceptFormats = '';
    }
  });

  async function initialize() {
    searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    try {
      const storedCoordinates = sessionStorage.getItem('atomCoordinates');
      atomCoordinates = storedCoordinates ? JSON.parse(storedCoordinates) : [];
      prevAtomCoordinates = atomCoordinates;

      const { animate, updateCanvasSize, createAtoms: generatedCreateAtoms } = await setupThreeJS(canvas);

      const cleanup = setupCanvasResizing(canvas, updateCanvasSize);
      createAtoms = generatedCreateAtoms;
      animate();

      return () => {
        cleanup();
      };
    } catch (error) {
      console.error("Error during onMount initialization:", error);
    }
  }

  // Functions
  import { determineInputType, fetchPubChemData, fetchPDBData } from '$lib/molecules/inputs';

  // Setters for table info and image
  function setTableInfo(firstItem: string, secondItem: string, thirdItem: string) {
    tableInfo = { firstItem, secondItem, thirdItem };
  }

  function setImage(url: string) {
    imageUrl = url;
  }

  // Check if two sets of coordinates are equal
  function areCoordinatesEqual(coords1: AtomCoordinate[], coords2: AtomCoordinate[]): boolean {
    if (coords1.length !== coords2.length) return false;
    return coords1.every((coord, i) =>
      coord.x === coords2[i].x &&
      coord.y === coords2[i].y &&
      coord.z === coords2[i].z &&
      coord.atomType === coords2[i].atomType
    );
  }

  // Handle form submission or reload
  async function handleSubmit() {
    // If input is empty, show popup and return
    if (!inputStr.trim()) {
      showMoleculePopup = true;
      return;
    }

    // First, check if this is a reload action.
    // This happens if the reload mode is already active, or if the input
    // hasn't changed from the last successful search.
    if (isReloadMode || (inputStr === lastSuccessfulInput && atomCoordinates.length > 0)) {
      isReloadMode = true; // Ensure the state is correct for the UI
      redrawModel(atomCoordinates);
      if (typeof resizeCanvas === "function") resizeCanvas();
      return; // We're done, no need to fetch new data.
    }

    // If we've reached this point, it's a NEW search.
    // Reset states for the new search.
    isReloadMode = false;
    isFileUploaded = false;
    showMoleculePopup = false;

    const inputType = determineInputType(inputStr);

    // Check for valid input types first
    if (inputType !== "CID" && inputType !== "PDB") {
      console.error("Unsupported input type.");
      showMoleculePopup = true;
      return;
    }

    // Clear previous molecule info before fetching new data.
    // This prevents using stale data (e.g., the old CID) if the new search fails.
    setTableInfo("", "", "");
    setImage('');

    if (inputType === "CID") {
      await fetchPubChemData(inputStr, setTableInfo, setImage);
    } else if (inputType === "PDB") {
      await fetchPDBData(inputStr, setTableInfo, setImage);
    }

    // Store current coordinates before attempting to fetch new ones
    let newAtomCoordinates: AtomCoordinate[] = [];

    try {
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
            showMoleculePopup = true;
            throw new Error("Fallback URL also failed");
          }
        }
        const content = await response.text();
        originalContent = content;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(content);
      } else if (inputType === "PDB") {
        const url = `https://files.rcsb.org/view/${inputStr}.pdb`;
        const response = await fetch(url);
        if (!response.ok) {
          showMoleculePopup = true;
          throw new Error("Failed to fetch PDB data");
        }
        const content = await response.text();
        originalContent = content;
        originalFileExtension = "pdb";
        newAtomCoordinates = await parsePDB(content);
      }

      // Check if no coordinates were found
      if (newAtomCoordinates.length === 0) {
        showMoleculePopup = true;
        return;
      }

      // Only update atomCoordinates if we successfully got new data
      atomCoordinates = newAtomCoordinates;

      // Check if coordinates are the same as previous ones
      if (areCoordinatesEqual(atomCoordinates, prevAtomCoordinates)) {
        // Same data found - switch to reload mode
        isReloadMode = true;
      } else {
        // New data found - proceed normally
        saveSearch();
        prevAtomCoordinates = [...atomCoordinates];
        lastSuccessfulInput = inputStr;
        lastSuccessfulFileContent = originalContent;
      }

      redrawModel(atomCoordinates);

      if (typeof resizeCanvas === "function") resizeCanvas();
    } catch (error) {
      console.error("Error fetching/parsing molecule data:", error);
      showMoleculePopup = true;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  // Download functions
  async function downloadModel() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    updateFileName();

    const metadata: Record<string, any> = {
      author: "3D Printing Molecules WEB APP",
      quality: quality,
      description: "ZIP of STL models with metadata",
      hydrogens: String(showHydrogens),
      selectedGenerator: modelGenerators.find(g => g.func === selectedGenerator)?.name,
      multiplicationFactor: multiplicationFactor,
      ...(selectedGenerator === createBallAndStickMesh
        ? {
            bondDiameterMultiplicationFactor: bondDiameterMultiplicationFactor,
            bondQuality: bondQuality,
            groupBondsSeparately: groupBondsSeparately
          }
        : {})
    };

    exportBinaryAsZip(fileName, metadata);
  }

  async function downloadWholeModel() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    updateFileName();
    exportModelAsSTL(fileName);
  }

  // Redraw model with new coordinates
  function redrawModel(atomCoordinates: AtomCoordinate[]) {
    sessionStorage.setItem('atomCoordinates', JSON.stringify(atomCoordinates));
    console.log("redrawModel function initiated");
    console.log(atomCoordinates);
    if (typeof createAtoms === "function") {
      const params: CreateAtomsParams = {
        coordinates: atomCoordinates,
        quality: quality,
        showHydrogens: showHydrogens,
        multiplicationFactor: multiplicationFactor,
        selectedGenerator: selectedGenerator,
        ...(selectedGenerator === createBallAndStickMesh
          ? { bondDiameterMultiplicationFactor, bondQuality, groupBondsSeparately }
          : {})
      };
      createAtoms(params);
    } else {
      console.log("createAtoms function not initialized");
      console.error("Function not initialized");
    }
  }

  // Update file name based on input or upload
  function updateFileName() {
    let name = "molecule";
    if (isFileUploaded) {
      name = `Molecule_${uploadedFileName}`;
    } else if (tableInfo.secondItem) {
      name = `Molecule_${tableInfo.secondItem}`;
    }
    fileName = name;
    console.log("Updated file name:", fileName);
  }

  // Save search to history
  function saveSearch() {
    if (browser && inputStr.trim() !== '' && !searchHistory.includes(inputStr) && !showMoleculePopup) {
      searchHistory = [inputStr, ...searchHistory.slice(0, 4)];
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }

  function handleHistoryClick(item: string) {
    inputStr = item;
    // Reset reload mode when selecting from history
    if (inputStr !== lastSuccessfulInput) {
      isReloadMode = false;
    }
    handleSubmit();
  }

  function clearHistory() {
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }

  // File upload handling
  let uploadedFileName: string = "";
  let isFileUploaded: boolean = false;

  function handleFiles(files: FileList) {
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pdb' || fileExtension === 'sdf') {
        uploadedFileName = file.name.split('.').slice(0, -1).join('.');
        isFileUploaded = true;
        // Reset reload mode when new file is uploaded
        isReloadMode = false;
        setTableInfo(file.name, "", "");
        setImage('https://openmoji.org/data/black/svg/1F4C4.svg');

        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          originalContent = content;
          originalFileExtension = fileExtension;
          try {
            atomCoordinates = fileExtension === 'pdb' ? await parsePDB(content) : await parseSDF(content);
            if (atomCoordinates.length === 0) {
              showMoleculePopup = true;
              return;
            }

            // Check if coordinates are the same as previous ones
            if (areCoordinatesEqual(atomCoordinates, prevAtomCoordinates)) {
              // Same data found - switch to reload mode
              isReloadMode = true;
            } else {
              // New data found - proceed normally
              prevAtomCoordinates = [...atomCoordinates];
              lastSuccessfulFileContent = content;
            }

            redrawModel(atomCoordinates);
          } catch (error) {
            console.error("Error parsing uploaded file:", error);
            showMoleculePopup = true;
          }
        };
        reader.readAsText(file);
      } else {
        showMoleculePopup = true;
      }
    }
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFiles(target.files);
    }
  }

  // Drag and drop state
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

  // Reset settings to their default values
  function resetSettingsToDefault() {
    quality = 50;
    //selectedGenerator = modelGenerators[0].func;
    showHydrogens = true;
    multiplicationFactor = 1.0;
    bondDiameterMultiplicationFactor = 0.4;
    bondQuality = 32;
    groupBondsSeparately = false;

    // If a model is currently displayed, redraw it with the default settings
    if (atomCoordinates.length > 0) {
      redrawModel(atomCoordinates);
    }
  }

  // Input box editing state
  let isEditing = false; //editing state for quality input box

  function enableEditing() {
    isEditing = true;
  }

  function disableEditing() {
    isEditing = false;
  }

  // Collapsible menu state
  let isCollapsed = typeof window !== 'undefined' && localStorage.getItem('menuCollapsed') !== 'false';

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    localStorage.setItem('menuCollapsed', isCollapsed.toString());
    setTimeout(() => {
      if (typeof resizeCanvas === "function") {
        resizeCanvas();
      }
    }, 350);
  }

  // iOS detection for file input accept attribute
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Save canvas as image
  function saveCanvasAsImage() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    updateFileName();
    const imageData = takeScreenshot();
    if (imageData) {
      const link = document.createElement('a');
      link.download = `Photo_${fileName}`;
      link.href = imageData;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      console.error("Failed to capture screenshot");
    }
  }

  function downloadSourceFile() {
    if (!originalContent || atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    const blob = new Blob([originalContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `Source_${fileName}.${originalFileExtension}`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Helper to focus an element on mount for accessibility
  function focusOnMount(element: HTMLElement) {
    if (element) {
      // Defer focus until next tick to ensure element is rendered and visible
      setTimeout(() => element.focus(), 0);
    }
  }

  // Popup keyboard accessibility
  function handlePopupKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      showMoleculePopup = false;
    }
  }

  // Reset reload mode when input changes
  function handleInputChange() {
    if (inputStr !== lastSuccessfulInput) {
      isReloadMode = false;
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
      <div class="col-md-8 left-panel">
        <div class="d-flex mb-3 align-items-center">
          <div class="input-group">
            <input
              type="text"
              bind:value={inputStr}
              on:keydown={handleKeyPress}
              on:input={handleInputChange}
              class="form-control form-control-lg me-2 main-search-line dropdown-toggle"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              placeholder={$_('search_field')}
              aria-label="Search"
            />
            {#if inputStr}
              <button
                type="button"
                class="btn-close"
                aria-label="Clear"
                on:click={() => {
                  inputStr = '';
                  isReloadMode = false;
                }}
                style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%);"
              ></button>
            {/if}

            {#if searchHistory.length > 0}
              <ul class="dropdown-menu" id="searchDropdown" aria-labelledby="dropdownMenuButton">
                {#each searchHistory as item, index}
                  <li>
                    <a class="dropdown-item" href="/" on:click={() => handleHistoryClick(item)}>
                      {item}
                    </a>
                  </li>
                {/each}
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

          <button
            on:click={handleSubmit}
            on:keydown={handleKeyPress}
            class="btn btn-primary button-with-icon d-flex align-items-center main-search-line"
            class:btn-warning={isReloadMode}
            role="button"
            tabindex="0"
          >
            <span class="material-symbols-outlined">
              {isReloadMode ? 'refresh' : 'downloading'}
            </span>
            {isReloadMode ? $_('reload_data_button') : $_('fetch_data_button')}
          </button>
        </div>

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
                  <div class="d-flex align-items-center mb-1">
                    <label for="model-generator" class="form-label mb-0">{$_('select_model_type')}</label>
                    <button
                      type="button"
                      on:click={resetSettingsToDefault}
                      class="btn btn-sm btn-link p-1 ms-2"
                      title="Reset settings to default"
                      aria-label="Reset settings to default"
                      style="align: right;"
                    >
                      <span class="material-symbols-outlined" style="vertical-align: middle;">restart_alt</span>
                    </button>
                  </div>
                  <select class="form-select" id="model-generator" bind:value={selectedGenerator}>
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
              {#if selectedGenerator === createBallAndStickMesh}
                <tr>
                  <td>
                    <label for="multiplicationFactor">{$_('multiplication_factor')}</label>
                    <input type="number" id="multiplicationFactor" bind:value={multiplicationFactor} step="0.1" min="0.1" class="form-control w-auto">

                    <label for="bondDiameterFactor">{$_('bond_diameter_factor')}</label>
                    <input type="number" id="bondDiameterFactor" bind:value={bondDiameterMultiplicationFactor} step="0.1" min="0.1" class="form-control w-auto">

                    <label for="bondQuality">{$_('bond_quality')}</label>
                    <input type="number" id="bondQuality" bind:value={bondQuality} step="1" min="10" class="form-control w-auto">

                    <label class="form-check-label" for="groupBondsSeparatelyCheckBox">{$_('bonds_checbox')}</label>
                    <input class="form-check-input" type="checkbox" id="groupBondsSeparatelyCheckBox" bind:checked={groupBondsSeparately}>
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
                  <button on:click={downloadSourceFile} class="btn btn-secondary btn-lg w-100 mt-2">
                    <span class="material-symbols-outlined">download</span>
                    {$_('download_template_button')}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <br>

        <button on:click={downloadModel} class="btn btn-success btn-lg w-100">
          <span class="material-symbols-outlined">deployed_code_update</span>
          {$_('download_model_button')}
        </button>
      </div>

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

  {#if showMoleculePopup}
    <div
      class="popup-overlay"
      tabindex="-1"
      use:focusOnMount
      on:keydown={handlePopupKeydown}
      on:click={() => showMoleculePopup = false}
    >
      <div class="popup-content" on:click|stopPropagation>
        <span class="material-symbols-outlined" style="color: #e53935; font-size: 48px;">warning</span>
        <div style="margin-top: 10px; font-weight: bold;">
          {$_('no_molecule_found') || 'No molecule found for the provided input.'}
        </div>
        <button class="btn btn-warning mt-3" on:click={() => showMoleculePopup = false}>
          {$_('close_popup') || 'Close'}
        </button>
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
  height: 65px;
}

.container {
  display: flex;
  flex-direction: column;
}

img {
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 200px;
  background-color: #f0f0f0;
  color: #777;
  font-size: 14px;
  text-align: center;
}

.quality-container {
  display: flex;
  align-items: center;
}

.form-range {
  width: 150px;
}

@media (min-width: 768px) {
  .row {
    display: flex;
    flex-direction: row;
  }

  .col-md-4 {
    display: flex;
    align-items: flex-start;
    height: fit-content;
  }

  .canvas-container {
    height: 100%;
    max-height: none;
  }

  #threeCanvas {
    max-height: none;
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
  max-height: 100vh;
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
  margin: 0;
  padding: 0;
  display: inline-block;
}

#threeCanvas {
  max-height: 100vh;
  object-fit: contain;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-in-out;
}

.popup-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
  max-width: 400px;
  animation: slideIn 0.3s ease-in-out;
}

.popup-content .material-symbols-outlined {
  font-size: 48px;
  color: #d32f2f;
  margin-bottom: 16px;
}

.popup-content div {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #333;
}

.popup-content .btn-warning {
  padding: 8px 24px;
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>