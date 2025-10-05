<script lang="ts">
  // Imports
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { setupThreeJS, exportBinaryAsZip, exportModelAsSTL, createSphereMesh, createBallAndStickMesh, createCubeMesh, createStickMesh, takeScreenshot } from '$lib/threejsFc/threejsMolecules3';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB, parseSDF } from '$lib/molecules/molecularDataParser';
  import type { AtomCoordinate, CreateAtomsParams } from '$lib/molecules/molecularDataParser';
  import { cifToSdf } from '$lib/utils/cifToSdf';
  import { buildLocalizedPath } from '$lib/functions/language';
  import InfoButton from '$lib/buttons/infoButton.svelte';
  import { determineInputType, fetchPubChemDataWithAutocomplete, fetchPDBData } from '$lib/molecules/inputs';
  import AdvancedSearchPopup from '$lib/components/AdvancedSearchPopup.svelte'; // <- NOVÝ IMPORT

  // Types
  let inputStr = '';
  let searchHistory: string[] = [];
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let fileName: string = "molecule";

  let resizeCanvas: (() => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;

  let acceptFormats = '.sdf, .pdb, .cif';

  let atomCoordinates: AtomCoordinate[] = [];
  let prevAtomCoordinates: AtomCoordinate[] = [];
  let createAtoms: ((params: CreateAtomsParams) => void);

  const modelGenerators = [
    { name: 'Spheres', func: createSphereMesh },
    { name: 'Ball-and-Stick', func: createBallAndStickMesh },
    { name: 'Sticks', func: createStickMesh },
    { name: 'Minecraft', func: createCubeMesh }
  ];
  let selectedGenerator = modelGenerators[0].func;

  let quality = 50;
  let showHydrogens = true;
  let multiplicationFactor = 1.0;
  let bondDiameterMultiplicationFactor = 0.4;
  let bondQuality = 32;
  let groupBondsSeparately = false;
  let uniformAtomDiameter = false;
  let showMultipleBonds = false;

  let originalContent: string = "";
  let originalFileExtension: string = "sdf";

  let showMoleculePopup = false;
  let settingsLoaded = false;
  let isReloadMode = false;
  let lastSuccessfulInput = '';
  let lastSuccessfulFileContent = '';
  let isFileUploaded: boolean = false;
  let uploadedFileName: string = "";
  
  // Nová proměnná pro zobrazení popupu
  let showAdvancedSearch = false; 

  onMount(() => {
    if (browser) {
      initialize();
    }
    if (isIOS()) {
      acceptFormats = '';
    }
  });

  async function initialize() {

    if (browser) {
      sessionStorage.removeItem('atomCoordinates');
      sessionStorage.removeItem('lastSuccessfulInput');
    }

    searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

    if (browser) {
      multiplicationFactor = parseFloat(localStorage.getItem('multiplicationFactor') || '1.0');
      bondDiameterMultiplicationFactor = parseFloat(localStorage.getItem('bondDiameterMultiplicationFactor') || '0.4');
      bondQuality = parseInt(localStorage.getItem('bondQuality') || '32', 10);
      quality = parseInt(localStorage.getItem('quality') || '50', 10);
      groupBondsSeparately = JSON.parse(localStorage.getItem('groupBondsSeparately') || 'false');
      showHydrogens = JSON.parse(localStorage.getItem('showHydrogens') || 'true');
      uniformAtomDiameter = JSON.parse(localStorage.getItem('uniformAtomDiameter') || 'false');
      showMultipleBonds = JSON.parse(localStorage.getItem('showMultipleBonds') || 'false');
      settingsLoaded = true;
    }

    canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    try {
      const storedCoordinates = sessionStorage.getItem('atomCoordinates');
      const storedInput = sessionStorage.getItem('lastSuccessfulInput');
      
      if (storedCoordinates) {
        atomCoordinates = JSON.parse(storedCoordinates);
        prevAtomCoordinates = atomCoordinates;
        lastSuccessfulInput = storedInput || '';
        inputStr = lastSuccessfulInput;
        isReloadMode = atomCoordinates.length > 0; // Set reload mode if there's a model
      }

      const { animate, updateCanvasSize, createAtoms: generatedCreateAtoms } = await setupThreeJS(canvas);

      const cleanup = setupCanvasResizing(canvas, updateCanvasSize);
      resizeCanvas = updateCanvasSize;
      createAtoms = generatedCreateAtoms;
      animate();

      if (atomCoordinates.length > 0) {
        redrawModel(atomCoordinates); // Redraw existing model on init
      }
      
      return () => {
        cleanup();
      };
    } catch (error) {
      console.error("Error during onMount initialization:", error);
    }
  }

  function setTableInfo(firstItem: string, secondItem: string, thirdItem: string) {
    tableInfo = { firstItem, secondItem, thirdItem };
  }

  function setImage(url: string) {
    imageUrl = url;
  }

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
    // If input is empty, do nothing. The gear button handles opening the advanced search.
    if (!inputStr.trim() && !isReloadMode) {
      return;
    }

    // If reload mode is active, just redraw the current model with new settings
    if (isReloadMode && inputStr === lastSuccessfulInput) {
      redrawModel(atomCoordinates);
      if (typeof resizeCanvas === "function") resizeCanvas();
      return;
    }

    // --- Start a new search ---
    isFileUploaded = false;
    setTableInfo("", "", "");
    setImage('');

    const trimmedInput = inputStr.trim();
    let nameToSaveForHistory = trimmedInput;
    let newAtomCoordinates: AtomCoordinate[] = [];

    try {
      const isPDB = /^[1-9][a-zA-Z0-9]{3}$/i.test(trimmedInput);

      if (isPDB) {
        await fetchPDBData(trimmedInput, setTableInfo, setImage);
        nameToSaveForHistory = trimmedInput.toUpperCase();
        const url = `https://files.rcsb.org/view/${trimmedInput}.pdb`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch PDB data");
        const content = await response.text();
        originalContent = content;
        originalFileExtension = "pdb";
        newAtomCoordinates = await parsePDB(content);
      } else {
        nameToSaveForHistory = await fetchPubChemDataWithAutocomplete(trimmedInput, setTableInfo, setImage);
        const cid = tableInfo.secondItem;
        if (!cid) throw new Error("PubChem could not find a molecule for the given input.");
        
        const primaryUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/record/SDF?record_type=3d&response_type=display`;
        const fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/record/SDF`;
        let response = await fetch(primaryUrl).catch(() => fetch(fallbackUrl));
        if (!response.ok) throw new Error("Molecule data not available.");
        
        const content = await response.text();
        originalContent = content;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(content);
      }

      if (newAtomCoordinates.length === 0) {
        throw new Error("No atom coordinates were found in the fetched file.");
      }

      atomCoordinates = newAtomCoordinates;

      if (!areCoordinatesEqual(atomCoordinates, prevAtomCoordinates)) {
        if (nameToSaveForHistory.length > 50) {
          nameToSaveForHistory = trimmedInput;
        }
        saveSearch(nameToSaveForHistory);
      }
      
      prevAtomCoordinates = [...atomCoordinates];
      lastSuccessfulInput = inputStr;
      lastSuccessfulFileContent = originalContent;
      sessionStorage.setItem('lastSuccessfulInput', lastSuccessfulInput);

      redrawModel(atomCoordinates);
      isReloadMode = true; // Set to true after a successful fetch
      if (typeof resizeCanvas === "function") resizeCanvas();
    } catch (error) {
      console.error("Error fetching/parsing molecule data:", error);
      showMoleculePopup = true;
      isReloadMode = false; // Failed, so disable reload mode
    }
  }

  // Nová funkce pro zpracování pokročilého vyhledávání
  async function handleAdvancedSearch(event: CustomEvent) {
    const { source, query, content } = event.detail;

    setTableInfo("", "", "");
    setImage('');
    isFileUploaded = false; 

    if (source === 'pubchem') {
      inputStr = query;
      isReloadMode = false; // Treat as a new search
      handleSubmit();
    } else if (source === 'cod') {
      try {
        originalContent = content;
        originalFileExtension = "sdf"; // It's already converted to SDF
        isFileUploaded = true; // Treat it like a file for naming purposes
        uploadedFileName = `COD_${query}`;

        atomCoordinates = await parseSDF(content);
        if (atomCoordinates.length === 0) {
          throw new Error("Failed to parse SDF content from COD.");
        }

        setTableInfo(`COD Entry: ${query}`, query, "Converted from CIF format");
        setImage('https://www.crystallography.net/cod/images/cod-logo.png');

        prevAtomCoordinates = [...atomCoordinates];
        lastSuccessfulFileContent = content;
        lastSuccessfulInput = `COD: ${query}`;
        inputStr = lastSuccessfulInput; // Update input field to reflect the search
        sessionStorage.setItem('lastSuccessfulInput', lastSuccessfulInput);

        redrawModel(atomCoordinates);
        isReloadMode = true; // Enable reload after success
      } catch (error) {
        console.error("Error processing data from COD:", error);
        showMoleculePopup = true;
        isReloadMode = false;
      }
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function downloadModel() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    updateFileName();
    const metadata: Record<string, any> = {
      author: "3D Printing Molecules WEB APP",
      moleculeName: tableInfo.firstItem || null,
      moleculeId: tableInfo.secondItem || null,
      moleculeDescription: tableInfo.thirdItem || null,
      moleculeImage: imageUrl || null,
      isFileUploaded: isFileUploaded,
      uploadedFileName: isFileUploaded ? uploadedFileName : null,
      quality: quality,
      description: "ZIP of STL models with metadata",
      hydrogens: String(showHydrogens),
      selectedGenerator: modelGenerators.find(g => g.func === selectedGenerator)?.name,
      multiplicationFactor: multiplicationFactor,
      ...(selectedGenerator === createBallAndStickMesh
        ? {
            bondDiameterMultiplicationFactor: bondDiameterMultiplicationFactor,
            bondQuality: bondQuality,
            groupBondsSeparately: groupBondsSeparately,
            showMultipleBonds: showMultipleBonds
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

  function redrawModel(coords: AtomCoordinate[]) {
    if (coords.length === 0) return;
    sessionStorage.setItem('atomCoordinates', JSON.stringify(coords));
    if (typeof createAtoms === "function") {
      const params: CreateAtomsParams = {
        coordinates: coords,
        quality: quality,
        showHydrogens: showHydrogens,
        multiplicationFactor: multiplicationFactor,
        selectedGenerator: selectedGenerator,
        ...(selectedGenerator === createBallAndStickMesh
          ? { bondDiameterMultiplicationFactor, bondQuality, groupBondsSeparately, uniformAtomDiameter, showMultipleBonds }
          : {})
      };
      createAtoms(params);
    } else {
      console.error("createAtoms function not initialized");
    }
  }

  function updateFileName() {
    let name = "molecule";
    if (isFileUploaded) {
      name = `Molecule_${uploadedFileName}`;
    } else if (tableInfo.secondItem) {
      name = `Molecule_${tableInfo.secondItem}`;
    }
    fileName = name;
  }

  function saveSearch(nameToSave: string) {
    const trimmedName = nameToSave.trim();
    if (browser && trimmedName !== '' && !searchHistory.includes(trimmedName) && !showMoleculePopup) {
      searchHistory = [trimmedName, ...searchHistory.slice(0, 4)];
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }

  function handleHistoryClick(item: string) {
    inputStr = item;
    // Check if it's a new search or the same as the last successful one
    if (inputStr !== lastSuccessfulInput) {
      isReloadMode = false;
    }
    handleSubmit();
  }

  function clearHistory() {
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }
  
  function handleFiles(files: FileList) {
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!['pdb', 'sdf', 'cif'].includes(fileExtension || '')) {
        showMoleculePopup = true;
        return;
      }
      
      isReloadMode = false; // New file means it's a new action, not a reload
      uploadedFileName = file.name.split('.').slice(0, -1).join('.');
      isFileUploaded = true;
      setTableInfo(file.name, `Uploaded .${fileExtension} file`, "");
      setImage('https://openmoji.org/data/black/svg/1F4C4.svg');
      inputStr = `File: ${file.name}`; // Update input field
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        try {
          let newAtomCoordinates: AtomCoordinate[] = [];

          if (fileExtension === 'pdb') {
            originalContent = content;
            originalFileExtension = 'pdb';
            newAtomCoordinates = await parsePDB(content);
          } else if (fileExtension === 'sdf') {
            originalContent = content;
            originalFileExtension = 'sdf';
            newAtomCoordinates = await parseSDF(content);
          } else if (fileExtension === 'cif') {
            // Convert CIF content to SDF format
            const sdfContent = await cifToSdf(content);
            originalContent = sdfContent; // Save the converted content
            originalFileExtension = 'sdf';
            newAtomCoordinates = await parseSDF(sdfContent);
          }

          if (newAtomCoordinates.length === 0) {
            throw new Error(`No atoms found in the uploaded file: ${file.name}`);
          }

          atomCoordinates = newAtomCoordinates;
          prevAtomCoordinates = [...atomCoordinates];
          lastSuccessfulFileContent = originalContent;
          lastSuccessfulInput = inputStr; // Store the "File: ..." string
          sessionStorage.setItem('lastSuccessfulInput', lastSuccessfulInput);

          redrawModel(atomCoordinates);
          isReloadMode = true; // Enable reload after successful upload
        } catch (error) {
          console.error("Error parsing uploaded file:", error);
          showMoleculePopup = true;
          isReloadMode = false;
        }
      };
      reader.readAsText(file);
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

  function resetSettingsToDefault() {
    quality = 50;
    showHydrogens = true;
    multiplicationFactor = 1.0;
    bondDiameterMultiplicationFactor = 0.4;
    bondQuality = 32;
    groupBondsSeparately = false;
    uniformAtomDiameter = false;
    showMultipleBonds = false;

    if (browser) {
      localStorage.removeItem('quality');
      localStorage.removeItem('multiplicationFactor');
      localStorage.removeItem('bondDiameterMultiplicationFactor');
      localStorage.removeItem('bondQuality');
      localStorage.removeItem('groupBondsSeparately');
      localStorage.removeItem('showHydrogens');
      localStorage.removeItem('uniformAtomDiameter');
      localStorage.removeItem('showMultipleBonds');
    }

    if (atomCoordinates.length > 0) {
      redrawModel(atomCoordinates);
    }
  }

  $: if (browser && settingsLoaded) {
    localStorage.setItem('quality', String(quality));
    localStorage.setItem('multiplicationFactor', String(multiplicationFactor));
    localStorage.setItem('bondDiameterMultiplicationFactor', String(bondDiameterMultiplicationFactor));
    localStorage.setItem('bondQuality', String(bondQuality));
    localStorage.setItem('groupBondsSeparately', JSON.stringify(groupBondsSeparately));
    localStorage.setItem('showHydrogens', JSON.stringify(showHydrogens));
    localStorage.setItem('uniformAtomDiameter', JSON.stringify(uniformAtomDiameter));
    localStorage.setItem('showMultipleBonds', JSON.stringify(showMultipleBonds));
  }

  let isEditing = false;
  function enableEditing() { isEditing = true; }
  function disableEditing() { isEditing = false; }

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

  function isIOS() {
    return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

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

  function focusOnMount(element: HTMLElement) {
    if (element) {
      setTimeout(() => element.focus(), 0);
    }
  }

  function handlePopupKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === "Escape") {
      showMoleculePopup = false;
    }
  }

  function handleInputChange() {
    // If user types something different than what's loaded, exit reload mode
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
            <div class="input-group-append-custom">
              {#if inputStr}
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Clear"
                  on:click={() => {
                    inputStr = '';
                    isReloadMode = false;
                  }}
                ></button>
              {:else}
                <button
                  class="btn btn-icon"
                  on:click={() => showAdvancedSearch = true}
                  title="Advanced Search"
                  aria-label="Advanced Search"
                >
                  <span class="material-symbols-outlined">settings</span>
                </button>
              {/if}
            </div>

            {#if searchHistory.length > 0}
              <ul class="dropdown-menu" id="searchDropdown" aria-labelledby="dropdownMenuButton">
                {#each searchHistory as item, index}
                  <li>
                    <a class="dropdown-item" href="#" on:click|preventDefault={() => handleHistoryClick(item)}>
                      {item}
                    </a>
                  </li>
                {/each}
                <li><hr class="dropdown-divider"></li>
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
              <td>
                {#if tableInfo.secondItem}
                  {#if determineInputType(inputStr) === "CID" && !isFileUploaded}
                    <a
                      href="https://pubchem.ncbi.nlm.nih.gov/compound/{tableInfo.secondItem}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pubchem-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else if determineInputType(inputStr) === "PDB" && !isFileUploaded}
                    <a
                      href="https://www.rcsb.org/structure/{tableInfo.secondItem}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pdb-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else}
                    {tableInfo.secondItem}
                  {/if}
                {/if}
              </td>
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

        <!-- SELECT MODEL TYPE - always keep label on left -->
        <div class="row mb-3 align-items-center">
          <div class="col-12">
            <div class="d-flex align-items-center gap-3 flex-nowrap">
              <label for="model-generator" class="section-label text-nowrap">
                {$_('select_model_type')}
              </label>
              <select
                class="form-select flex-grow-1"
                id="model-generator"
                bind:value={selectedGenerator}>
                {#each modelGenerators as generator}
                  <option value={generator.func}>{generator.name}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>

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
                <td colspan="2">
                  <!-- QUALITY SLIDER + BIGGER RESET BUTTON -->
                  <div class="d-flex align-items-center gap-3">
                    <label for="qualityRange" class="me-2 text-nowrap section-label">
                      {$_('quality_slider')}
                      {#if isEditing}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          bind:value={quality}
                          on:blur={disableEditing}
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

                    <input
                      type="range"
                      id="qualityRange"
                      min="0"
                      max="100"
                      bind:value={quality}
                      class="form-range flex-grow-1"
                    />

                    <button
                      type="button"
                      on:click={resetSettingsToDefault}
                      class="btn btn-link btn-lg ms-2 p-2"
                      title={$_('reset_settings_to_default')}
                      aria-label={$_('reset_settings_to_default')}
                    >
                      <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 32px;">restart_alt</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr>
                <td colspan="2">
                  <div class="row mt-3">
                    <div class="col-md-6">
                      <div class="d-flex flex-column gap-3">
                        {#if selectedGenerator === createSphereMesh || selectedGenerator === createCubeMesh || selectedGenerator === createStickMesh || selectedGenerator === createBallAndStickMesh}
                          <div>
                            <label for="multiplicationFactor" class="form-label">{$_('multiplication_factor')}</label>
                            <input type="number" id="multiplicationFactor" bind:value={multiplicationFactor} step="0.1" min="0.1" class="form-control">
                          </div>
                        {/if}

                        {#if selectedGenerator === createBallAndStickMesh}
                          <div>
                            <label for="bondDiameterFactor" class="form-label">{$_('bond_diameter_factor')}</label>
                            <input type="number" id="bondDiameterFactor" bind:value={bondDiameterMultiplicationFactor} step="0.1" min="0.1" class="form-control">
                          </div>
                          <div>
                            <label for="bondQuality" class="form-label">{$_('bond_quality')}</label>
                            <input type="number" id="bondQuality" bind:value={bondQuality} step="1" min="10" class="form-control">
                          </div>
                        {/if}
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column gap-3">
                        <div class="form-check pt-4">
                          <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
                          <label class="form-check-label" for="hydrogensCheckbox">{$_('hydrogens_checbox')}</label>
                        </div>

                        {#if selectedGenerator === createBallAndStickMesh}
                          <div class="form-check pt-4">
                            <input class="form-check-input" type="checkbox" id="groupBondsSeparatelyCheckBox" bind:checked={groupBondsSeparately}>
                            <label class="form-check-label" for="groupBondsSeparatelyCheckBox">{$_('bonds_checbox')}</label>
                          </div>
                          <div class="form-check pt-4">
                            <input class="form-check-input" type="checkbox" id="uniformAtomDiameterCheckbox" bind:checked={uniformAtomDiameter}>
                            <label class="form-check-label" for="uniformAtomDiameterCheckbox">{$_('uniform_atom_diameter_checkbox')}</label>
                          </div>
                          <div class="form-check pt-4">
                            <input class="form-check-input" type="checkbox" id="showMultipleBondsCheckbox" bind:checked={showMultipleBonds}>
                            <label class="form-check-label" for="showMultipleBondsCheckbox">{$_('show_multiple_bonds_checkbox') || 'Show Multiple Bonds'}</label>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td colspan="2" class="pt-4">
                  <div class="d-flex gap-2">
                    <button on:click={downloadWholeModel} class="btn btn-info btn-lg w-100">
                      <span class="material-symbols-outlined">deployed_code_update</span>
                      {$_('download_whole_model_button')}
                    </button>
                    <button on:click={downloadSourceFile} class="btn btn-secondary btn-lg w-100">
                      <span class="material-symbols-outlined">download</span>
                      {$_('download_template_button')}
                    </button>
                  </div>
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
            <button class="btn" on:click={saveCanvasAsImage} title="Save as image">
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
            }} title="Fullscreen">
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
      role="alertdialog"
      aria-modal="true"
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

<AdvancedSearchPopup bind:show={showAdvancedSearch} on:search={handleAdvancedSearch} on:close={() => showAdvancedSearch = false}/>

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
/* ... (všechny vaše stávající styly z původního souboru) ... */
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
.pubchem-link, .pdb-link {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}
.pubchem-link:hover, .pdb-link:hover {
  color: #004499;
  text-decoration: none;
  border-bottom: 1px solid #004499;
}

/* Keeps select-model label aligned */
label[for="model-generator"] {
  min-width: 160px;
}

/* Slightly bigger hitbox for reset button */
.btn-link.btn-lg {
  line-height: 1;
}

/* Ensure vertical alignment matches headers */
.section-label {
  display: flex;
  align-items: center;
  height: 2.5rem; /* same visual height as table headers */
  font-weight: 600;
}

/* Slight layout polish */
label[for="model-generator"] {
  min-width: 160px;
}

.btn-link.btn-lg {
  line-height: 1;
}

/* NOVÉ STYLY pro tlačítko s kolečkem v inputu */
.input-group {
  position: relative;
}
.input-group-append-custom {
  position: absolute;
  right: 1.5rem; /* Upravte podle potřeby, aby sedělo vedle 'me-2' na inputu */
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  height: 100%;
}
.btn.btn-icon {
  background: transparent;
  border: none;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  color: #6c757d; /* Neutrální barva */
}
.btn.btn-icon:hover {
  color: #212529; /* Tmavší barva při najetí */
}
.main-search-line.form-control {
  padding-right: 3.5rem; /* Uvolní místo pro tlačítko */
}
</style>