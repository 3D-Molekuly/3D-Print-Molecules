<script lang="ts">
  // Imports
  import { _ } from 'svelte-i18n';
  import { onMount, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { replaceState } from '$app/navigation';
  import {
    setupThreeJS,
    exportModelAs3MF,
    generateModel3MFBlob,
    exportBinaryAsZip,
    exportModelAsSTL,
    createSphereMesh,
    createGluedSphereMesh,
    createBallAndStickMesh,
    createBallAndStickMovingJointsMesh,
    createCubeMesh,
    createStickMesh,
    downloadTestJointSTL,
    takeScreenshotBlob,
    buildPhotoDownloadFileName,
    computeAndRenderGluedSpheresAsync,
    updateGluedSpheresPreviewOptions,
    validateGluedSpheresManifold,
    resetCameraView,
    setAutoRotate,
    setCanvasTheme,
    setBuildPlateVisible,
    getModelBoundsMm,
    syncPreviewScaleMmPerUnit,
    getElementGroupsInfo,
    toggleElementGroupVisibility,
    showAllElementGroups,
    pickAtomAtCanvasNormalizedPosition,
    type ModelBoundsMm,
    type ElementGroupInfo,
    type HoveredAtomInfo
  } from '$lib/threejsFc/threejsMolecules3';
  import { setupCanvasResizing } from '$lib/threejsFc/canvasUtils';
  import { parsePDB, parseSDF, computeMolecularFormula, structureFormatFromFileName, detectStructureFormat, STRUCTURE_FILE_ACCEPT, type StructureFileFormat } from '$lib/molecules/molecularDataParser';
  import { chemDrawTo3D, isCdxBinary, molfileIsFlat, molfileTo3D, type Converted3D } from '$lib/molecules/structureImport';
  import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
  import type { CreateAtomsParams, JointPresetId, ModelStyleId, MoleculeSource, MovingJointsStats, GluedSpheresMode, GluedSpheresExportMode, GluedSpheresStats } from '$lib/types';
  import { JOINT_PRESETS, checkJointParams, jointLevels, paramsForRod, type JointParams } from '$lib/geometry/jointGeometry';
  import { getDefaultPriorityOrder, LARGE_MOLECULE_ATOM_THRESHOLD } from '$lib/geometry/gluedSpheres';
  import { cifToSdf } from '$lib/utils/cifToSdf';
  import { buildLocalizedPath, currentLocale, normalizeLocale } from '$lib/functions/language';
  import { HOME_FAQ } from '$lib/seo';
  import { buildShareUrl, hasShareSearchParams, inferMoleculeSourceFromQuery, parseShareSearchParams, type ShareState } from '$lib/functions/shareUrl';
  import InfoButton from '$lib/buttons/infoButton.svelte';
  import {
    determineInputType,
    fetchPubChemDataWithAutocomplete,
    fetchPDBData,
    fetchCODEntry,
    fetchCCDLigandData,
    fetchCactus3DSdf,
    parsePdbQuerySpec,
    formatPdbQuerySpec,
    type CodLoadedEntry,
    type CcdLoadedLigand,
    type CactusLoadedMolecule,
    fetchPubChemConformer,
    readSdfProperty,
    type PubChemConformer
  } from '$lib/molecules/inputs';
  import { formatConformerQuery, parseConformerQuery } from '$lib/molecules/queryDetection';
  import PrusaSlicerPluginNote from '$lib/components/PrusaSlicerPluginNote.svelte';
  import AdvancedSearchPopup from '$lib/components/AdvancedSearchPopup.svelte';
  import { isOnline, isOffline } from '$lib/functions/network';

  // Types
  let inputStr = '';
  let searchInputEl: HTMLInputElement | null = null;
  let searchHistory: string[] = [];
  let tableInfo = { firstItem: "", secondItem: "", thirdItem: "" };
  let imageUrl = '';
  let fileName: string = "molecule";

  let resizeCanvas: (() => void) | undefined;
  let canvas: HTMLCanvasElement | null = null;

  let acceptFormats = STRUCTURE_FILE_ACCEPT;

  let atomCoordinates: AtomCoordinate[] = [];
  let prevAtomCoordinates: AtomCoordinate[] = [];
  let createAtoms:
    | ((params: CreateAtomsParams, options?: { resetCamera?: boolean }) => MovingJointsStats | null)
    | undefined;

  // Stav 3D náhledového okna
  let isFetchingMolecule = false;
  let autoRotate = false;
  let showBuildPlate = false;
  let canvasDark = false;
  let modelBoundsMm: ModelBoundsMm | null = null;
  let elementGroups: ElementGroupInfo[] = []
  let hoveredAtom: HoveredAtomInfo | null = null;
  let hoverRafId: number | null = null;
  let pendingHoverCoords: { clientX: number; clientY: number } | null = null;
  let themeObserver: MutationObserver | null = null;

  const modelGenerators: { id: ModelStyleId; name: string; func: CreateAtomsParams['selectedGenerator'] }[] = [
    { id: 'spheres', name: 'Spheres', func: createSphereMesh },
    { id: 'spheres-glued', name: 'Spheres SPLIT FOR GLUING (BETA)', func: createGluedSphereMesh },
    { id: 'ball-and-stick', name: 'Ball-and-Stick', func: createBallAndStickMesh },
    { id: 'ball-and-stick-moving-joints', name: 'Ball-and-Stick MOVING JOINTS (BETA)', func: createBallAndStickMovingJointsMesh },
    { id: 'sticks', name: 'Sticks', func: createStickMesh },
    { id: 'minecraft', name: 'Minecraft', func: createCubeMesh }
  ];
  let selectedGenerator = modelGenerators[0].func;

  let quality = 50;
  let showHydrogens = true;
  
  // Proměnné pro každý generátor zvlášť
  let multiplicationFactorSpheres = 1.0;
  let multiplicationFactorBallAndStick = 1.0;
  let multiplicationFactorSticks = 1.0;
  let multiplicationFactorCubes = 1.0;

  let bondDiameterMultiplicationFactor = 0.4;
  let bondQuality = 32;
  let groupBondsSeparately = false;
  let uniformAtomDiameter = false;
  let showMultipleBonds = false;

  // Nastavení pro styl Ball-and-Stick MOVING JOINTS
  let jointPreset: JointPresetId = 'fdm';
  let jointParams: JointParams = { ...JOINT_PRESETS.fdm };
  let jointPreferT = 0.50;
  let jointSkipTerminal = true;
  let jointsInRings = true;

  // Nastavení pro styl Spheres – rozložené pro lepení
  let gluedMode: GluedSpheresMode = 'radical';
  let gluedPriorityOrder: string[] = ['C', 'N', 'O', 'H'];
  let gluedMergeSameElement = true;
  let gluedGap = 0;
  let gluedPegHolesEnabled = false;
  let gluedPegHoleDiameter = 1.9;
  let gluedPegHoleDepth = 3.0;
  let gluedExportMode: GluedSpheresExportMode = 'assembled';
  let gluedPlateSpacing = 3.0;
  let gluedExplodedPercent = 0;
  let gluedShowPartLabels = false;
  let gluedSpheresStats: GluedSpheresStats | null = null;
  let gluedWorkerProgress = { running: false, completed: 0, total: 0 };
  let gluedExportError: string | null = null;
  let isGluedMenuCollapsed = typeof window !== 'undefined' && localStorage.getItem('gluedMenuCollapsed') === 'true';

  // Proměnné měřítka modelu (mm / Å) pro každý generátor zvlášť (výchozí: 10 pro spheres a ostatní, 20 pro moving joints)
  let jointMmPerUnitSpheres = 10;
  let jointMmPerUnitBallAndStick = 10;
  let jointMmPerUnitMovingJoints = 20;
  let jointMmPerUnitSticks = 10;
  let jointMmPerUnitCubes = 10;

  let movingJointsStats: MovingJointsStats | null = null;

  let originalContent: string = "";
  let originalFileExtension: string = "sdf";

  let showMoleculePopup = false;
  // Popup reason: a failed lookup vs. an online database queried while offline
  let moleculePopupOffline = false;
  $: if (!showMoleculePopup) moleculePopupOffline = false;
  let settingsLoaded = false;
  let isReloadMode = false;
  let lastSuccessfulInput = '';
  let lastSuccessfulFileContent = '';
  let isFileUploaded: boolean = false;
  let uploadedFileName: string = "";
  
  let showAdvancedSearch = false; 

  // Sdílení modelu a nastavení přes URL
  let moleculeSource: MoleculeSource | null = null;
  let moleculeQuery: string = '';
  let urlSyncReady = false;
  let openedWithShareParams = false;
  let shareCopied = false;
  let showSharePopover = false;
  let shareWrapperEl: HTMLElement | null = null;
  let shareInputEl: HTMLInputElement | null = null;
  let shareCopiedTimeout: ReturnType<typeof setTimeout> | null = null;
  let urlSyncTimeout: ReturnType<typeof setTimeout> | null = null;
  let sharedSettingsNotice = false;

  $: isGluedSpheresStyle = selectedGenerator === createGluedSphereMesh;
  $: isSpheresBasedStyle = selectedGenerator === createSphereMesh || isGluedSpheresStyle;
  $: isMovingJointsStyle = selectedGenerator === createBallAndStickMovingJointsMesh;
  $: isBallAndStickStyle = selectedGenerator === createBallAndStickMesh || isMovingJointsStyle;

  // Synchronize priority order with elements present in the current molecule
  $: if (atomCoordinates.length > 0) {
    const activeCoords = showHydrogens
      ? atomCoordinates
      : atomCoordinates.filter((c) => c.atomType !== 'H');
    const defaultElements = getDefaultPriorityOrder(activeCoords.map((c) => c.atomType));
    const merged = [
      ...gluedPriorityOrder.filter((el) => defaultElements.includes(el)),
      ...defaultElements.filter((el) => !gluedPriorityOrder.includes(el))
    ];
    if (
      merged.length > 0 &&
      (merged.length !== gluedPriorityOrder.length ||
        merged.some((el, idx) => el !== gluedPriorityOrder[idx]))
    ) {
      gluedPriorityOrder = merged;
    }
  }

  // Real-time update of Exploded View and Part ID labels without re-running CSG
  $: if (browser && isGluedSpheresStyle) {
    updateGluedSpheresPreviewOptions(
      gluedExplodedPercent / 100,
      gluedShowPartLabels,
      gluedExportMode,
      gluedPlateSpacing
    );
  }

  function movePriorityElement(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= gluedPriorityOrder.length) return;
    const next = [...gluedPriorityOrder];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    gluedPriorityOrder = next;
  }

  function toggleGluedMenuCollapse() {
    isGluedMenuCollapsed = !isGluedMenuCollapsed;
    if (browser) {
      localStorage.setItem('gluedMenuCollapsed', isGluedMenuCollapsed.toString());
    }
    setTimeout(() => {
      if (typeof resizeCanvas === 'function') {
        resizeCanvas();
      }
    }, 350);
  }
  $: rawJointWarnings = checkJointParams(jointParams);
  $: jointWarnings = rawJointWarnings.map((w) => {
    if ($currentLocale !== 'en') return w;
    if (w.startsWith('Stěna statoru u rovníku')) {
      return `Stator wall at equator ${(jointParams.R - jointParams.rh - jointParams.c).toFixed(2)} mm < wall ${jointParams.wall} mm`;
    }
    if (w.startsWith('Přesah hlavy jen')) {
      return `Head overhang only ${(jointParams.rh - jointParams.rs - jointParams.c).toFixed(2)} mm – rotor may fall out`;
    }
    if (w.startsWith('Krk statoru')) {
      return 'Stator neck is too thin (increase neck)';
    }
    if (w.startsWith('Hřídel je velmi tenká')) {
      return 'Shaft is very thin, risk of snapping';
    }
    return w;
  });
  $: currentRodRadiusMm = 0.5 * bondDiameterMultiplicationFactor * jointMmPerUnit;
  $: effectiveJointParams = movingJointsStats?.firstJointParamsMm ?? paramsForRod(currentRodRadiusMm, jointParams);
  $: isJointEnlargedByRod = effectiveJointParams.R > jointParams.R + 1e-6;
  $: calculatedJointLength = jointLevels(jointParams).length;
  $: calculatedJointDiameter = 2 * jointParams.R;

  function selectJointPreset(preset: string) {
    const validPreset: JointPresetId = preset === 'sla' ? 'sla' : 'fdm';
    jointPreset = validPreset;
    jointParams = { ...JOINT_PRESETS[validPreset] };
  }

  function resetJointParamsToPreset() {
    jointParams = { ...JOINT_PRESETS[jointPreset] };
  }

  function handleDownloadTestJoint() {
    const prefix = $currentLocale === 'en' ? 'Test_joint' : 'Testovaci_kloub';
    downloadTestJointSTL(
      effectiveJointParams,
      `${prefix}_${jointPreset.toUpperCase()}_c${jointParams.c.toFixed(2)}.stl`
    );
  }

  // Reaktivní proměnná, která se automaticky mění podle zvoleného generátoru
  let multiplicationFactor: number;
  $: {
    if (isSpheresBasedStyle) {
      multiplicationFactor = multiplicationFactorSpheres;
    } else if (isBallAndStickStyle) {
      multiplicationFactor = multiplicationFactorBallAndStick;
    } else if (selectedGenerator === createStickMesh) {
      multiplicationFactor = multiplicationFactorSticks;
    } else if (selectedGenerator === createCubeMesh) {
      multiplicationFactor = multiplicationFactorCubes;
    } else {
      multiplicationFactor = 1.0; // Pojistka
    }
  }

  // Reaktivní proměnná měřítka, která se automaticky mění podle zvoleného generátoru
  let jointMmPerUnit: number;
  $: {
    if (isMovingJointsStyle) {
      jointMmPerUnit = jointMmPerUnitMovingJoints;
    } else if (isSpheresBasedStyle) {
      jointMmPerUnit = jointMmPerUnitSpheres;
    } else if (selectedGenerator === createBallAndStickMesh) {
      jointMmPerUnit = jointMmPerUnitBallAndStick;
    } else if (selectedGenerator === createStickMesh) {
      jointMmPerUnit = jointMmPerUnitSticks;
    } else if (selectedGenerator === createCubeMesh) {
      jointMmPerUnit = jointMmPerUnitCubes;
    } else {
      jointMmPerUnit = 10; // Pojistka
    }
  }

  $: currentStyleId = modelGenerators.find((g) => g.func === selectedGenerator)?.id ?? 'spheres';
  $: currentShareState = {
    source: moleculeSource,
    molecule: moleculeQuery,
    style: currentStyleId,
    quality,
    scale: jointMmPerUnit ?? 10,
    mult: multiplicationFactor ?? 1.0,
    showHydrogens,
    bondDiameterFactor: bondDiameterMultiplicationFactor,
    bondQuality,
    groupBondsSeparately,
    uniformAtomDiameter,
    showMultipleBonds,
    jointPreset,
    jointParams: { ...jointParams },
    jointPreferT,
    jointSkipTerminal,
    jointsInRings,
    gluedMode,
    gluedExportMode,
    gluedPriorityOrder: [...gluedPriorityOrder],
    gluedGap,
    gluedPlateSpacing,
    gluedMergeSameElement,
    gluedPegHolesEnabled,
    gluedPegHoleDiameter,
    gluedPegHoleDepth,
    gluedExplodedPercent,
    gluedShowPartLabels
  } satisfies ShareState;

  function safeReplaceUrl(nextUrl: string) {
    if (!browser) return;
    if (window.location.href === nextUrl) return;
    try {
      replaceState(nextUrl, {});
    } catch {
      window.history.replaceState({}, '', nextUrl);
    }
  }

  $: if (browser && urlSyncReady && (moleculeSource !== null || openedWithShareParams)) {
    const snapshot = currentShareState;
    if (urlSyncTimeout) clearTimeout(urlSyncTimeout);
    urlSyncTimeout = setTimeout(() => {
      const nextUrl = buildShareUrl(window.location.href, snapshot);
      safeReplaceUrl(nextUrl);
    }, 200);
  }

  function applyShareState(state: ShareState) {
    const matchingGen = modelGenerators.find((g) => g.id === state.style);
    if (matchingGen) {
      selectedGenerator = matchingGen.func;
    }

    quality = state.quality;
    showHydrogens = state.showHydrogens;
    bondDiameterMultiplicationFactor = state.bondDiameterFactor;
    bondQuality = state.bondQuality;
    groupBondsSeparately = state.groupBondsSeparately;
    uniformAtomDiameter = state.uniformAtomDiameter;
    showMultipleBonds = state.showMultipleBonds;

    if (state.style === 'spheres' || state.style === 'spheres-glued') {
      jointMmPerUnitSpheres = state.scale;
      multiplicationFactorSpheres = state.mult;
    } else if (state.style === 'ball-and-stick') {
      jointMmPerUnitBallAndStick = state.scale;
      multiplicationFactorBallAndStick = state.mult;
    } else if (state.style === 'ball-and-stick-moving-joints') {
      jointMmPerUnitMovingJoints = state.scale;
      multiplicationFactorBallAndStick = state.mult;
    } else if (state.style === 'sticks') {
      jointMmPerUnitSticks = state.scale;
      multiplicationFactorSticks = state.mult;
    } else if (state.style === 'minecraft') {
      jointMmPerUnitCubes = state.scale;
      multiplicationFactorCubes = state.mult;
    }

    jointPreset = state.jointPreset;
    jointParams = { ...state.jointParams };
    jointPreferT = state.jointPreferT;
    jointSkipTerminal = state.jointSkipTerminal;
    jointsInRings = state.jointsInRings;

    gluedMode = state.gluedMode;
    gluedExportMode = state.gluedExportMode;
    gluedPriorityOrder = [...state.gluedPriorityOrder];
    gluedGap = state.gluedGap;
    gluedPlateSpacing = state.gluedPlateSpacing;
    gluedMergeSameElement = state.gluedMergeSameElement;
    gluedPegHolesEnabled = state.gluedPegHolesEnabled;
    gluedPegHoleDiameter = state.gluedPegHoleDiameter;
    gluedPegHoleDepth = state.gluedPegHoleDepth;
    gluedExplodedPercent = state.gluedExplodedPercent;
    gluedShowPartLabels = state.gluedShowPartLabels;
  }

  $: displayedShareUrl = browser ? buildShareUrl(window.location.href, currentShareState) : '';

  async function copyShareLink() {
    if (!browser) return;
    if (urlSyncTimeout) {
      clearTimeout(urlSyncTimeout);
      urlSyncTimeout = null;
    }
    openedWithShareParams = true;
    const shareUrl = buildShareUrl(window.location.href, currentShareState);
    safeReplaceUrl(shareUrl);

    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        copied = true;
      } finally {
        document.body.removeChild(textArea);
      }
    }

    if (copied) {
      shareCopied = true;
      if (shareCopiedTimeout) clearTimeout(shareCopiedTimeout);
      shareCopiedTimeout = setTimeout(() => {
        shareCopied = false;
      }, 2500);
    }
  }

  async function handleShareButtonClick() {
    if (showSharePopover) {
      showSharePopover = false;
      return;
    }
    showSlicerMenu = false;
    showSharePopover = true;
    await copyShareLink();
    await tick();
    if (shareInputEl) {
      shareInputEl.focus();
      shareInputEl.select();
    }
  }

  let cleanupCanvasResize: (() => void) | undefined;
  let isCanvasFullscreen = false;

  function syncFullscreenState() {
    if (!browser) return;
    const container = document.getElementById('canvasContainer');
    const fsEl =
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
      null;
    isCanvasFullscreen = Boolean(container && fsEl === container);
  }

  async function toggleCanvasFullscreen() {
    const container = document.getElementById('canvasContainer') as
      | (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    if (!container) return;

    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    try {
      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }

  onMount(() => {
    if (browser) {
      let lastSiteDark = document.documentElement.classList.contains('dark');
      canvasDark = lastSiteDark;
      setCanvasTheme(canvasDark);
      showBuildPlate = localStorage.getItem('canvasShowBuildPlate') === 'true';

      themeObserver = new MutationObserver(() => {
        const siteIsDark = document.documentElement.classList.contains('dark');
        if (siteIsDark !== lastSiteDark) {
          lastSiteDark = siteIsDark;
          canvasDark = siteIsDark;
          setCanvasTheme(canvasDark);
        }
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });

      document.addEventListener('fullscreenchange', syncFullscreenState);
      document.addEventListener('webkitfullscreenchange', syncFullscreenState);
      initialize();
    }
    if (isIOS()) {
      acceptFormats = '';
    }
    return () => {
      if (browser) {
        document.removeEventListener('fullscreenchange', syncFullscreenState);
        document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
      }
      if (themeObserver) {
        themeObserver.disconnect();
        themeObserver = null;
      }
      if (hoverRafId !== null && browser) {
        cancelAnimationFrame(hoverRafId);
        hoverRafId = null;
      }
      if (cleanupCanvasResize) cleanupCanvasResize();
      if (urlSyncTimeout) clearTimeout(urlSyncTimeout);
      if (shareCopiedTimeout) clearTimeout(shareCopiedTimeout);
    };
  });

  async function initialize() {
    if (browser) {
      sessionStorage.removeItem('atomCoordinates');
      sessionStorage.removeItem('lastSuccessfulInput');
    }

    searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

    let initialShareState: ShareState | null = null;

    if (browser) {
      // Načtení specifických hodnot pro každý generátor
      multiplicationFactorSpheres = parseFloat(localStorage.getItem('multiplicationFactorSpheres') || '1.0');
      multiplicationFactorBallAndStick = parseFloat(localStorage.getItem('multiplicationFactorBallAndStick') || '1.0');
      multiplicationFactorSticks = parseFloat(localStorage.getItem('multiplicationFactorSticks') || '1.0');
      multiplicationFactorCubes = parseFloat(localStorage.getItem('multiplicationFactorCubes') || '1.0');

      bondDiameterMultiplicationFactor = parseFloat(localStorage.getItem('bondDiameterMultiplicationFactor') || '0.4');
      bondQuality = parseInt(localStorage.getItem('bondQuality') || '32', 10);
      quality = parseInt(localStorage.getItem('quality') || '50', 10);
      groupBondsSeparately = JSON.parse(localStorage.getItem('groupBondsSeparately') || 'false');
      showHydrogens = JSON.parse(localStorage.getItem('showHydrogens') || 'true');
      uniformAtomDiameter = JSON.parse(localStorage.getItem('uniformAtomDiameter') || 'false');
      showMultipleBonds = JSON.parse(localStorage.getItem('showMultipleBonds') || 'false');

      const savedGluedMode = localStorage.getItem('gluedMode');
      if (savedGluedMode === 'radical' || savedGluedMode === 'priority') {
        gluedMode = savedGluedMode;
      }
      const savedGluedMergeSameElement = localStorage.getItem('gluedMergeSameElement');
      if (savedGluedMergeSameElement !== null) {
        gluedMergeSameElement = JSON.parse(savedGluedMergeSameElement);
      }
      const savedGluedGap = parseFloat(localStorage.getItem('gluedGap') || '0');
      if (!isNaN(savedGluedGap)) gluedGap = Math.max(0, Math.min(0.3, savedGluedGap));
      const savedGluedPegHoles = localStorage.getItem('gluedPegHolesEnabled');
      if (savedGluedPegHoles !== null) gluedPegHolesEnabled = JSON.parse(savedGluedPegHoles);
      const savedGluedPegHoleDiameter = parseFloat(localStorage.getItem('gluedPegHoleDiameter') || '1.9');
      if (!isNaN(savedGluedPegHoleDiameter) && savedGluedPegHoleDiameter > 0) {
        gluedPegHoleDiameter = savedGluedPegHoleDiameter;
      }
      const savedGluedPegHoleDepth = parseFloat(localStorage.getItem('gluedPegHoleDepth') || '3.0');
      if (!isNaN(savedGluedPegHoleDepth) && savedGluedPegHoleDepth > 0) {
        gluedPegHoleDepth = savedGluedPegHoleDepth;
      }
      const savedGluedExportMode = localStorage.getItem('gluedExportMode');
      if (savedGluedExportMode === 'assembled' || savedGluedExportMode === 'plate') {
        gluedExportMode = savedGluedExportMode;
      }
      const savedGluedPlateSpacing = parseFloat(localStorage.getItem('gluedPlateSpacing') || '3.0');
      if (!isNaN(savedGluedPlateSpacing) && savedGluedPlateSpacing >= 0) {
        gluedPlateSpacing = savedGluedPlateSpacing;
      }
      const savedGluedShowLabels = localStorage.getItem('gluedShowPartLabels');
      if (savedGluedShowLabels !== null) gluedShowPartLabels = JSON.parse(savedGluedShowLabels);

      const savedPreset = localStorage.getItem('jointPreset');
      if (savedPreset === 'fdm' || savedPreset === 'sla') {
        jointPreset = savedPreset;
      }
      const savedJointParams = localStorage.getItem('jointParams');
      if (savedJointParams) {
        try {
          const parsed = JSON.parse(savedJointParams) as Partial<JointParams>;
          jointParams = { ...JOINT_PRESETS[jointPreset], ...parsed };
        } catch {
          jointParams = { ...JOINT_PRESETS[jointPreset] };
        }
      } else {
        jointParams = { ...JOINT_PRESETS[jointPreset] };
      }
      const savedPreferT = parseFloat(localStorage.getItem('jointPreferT') || '0.5');
      if (!isNaN(savedPreferT)) jointPreferT = savedPreferT;
      const savedSkipTerminal = localStorage.getItem('jointSkipTerminal');
      if (savedSkipTerminal !== null) jointSkipTerminal = JSON.parse(savedSkipTerminal);
      const savedJointsInRings = localStorage.getItem('jointsInRings');
      if (savedJointsInRings !== null) jointsInRings = JSON.parse(savedJointsInRings);
      jointMmPerUnitSpheres = parseFloat(localStorage.getItem('jointMmPerUnitSpheres') || '10');
      if (isNaN(jointMmPerUnitSpheres) || jointMmPerUnitSpheres <= 0) jointMmPerUnitSpheres = 10;

      jointMmPerUnitBallAndStick = parseFloat(localStorage.getItem('jointMmPerUnitBallAndStick') || '10');
      if (isNaN(jointMmPerUnitBallAndStick) || jointMmPerUnitBallAndStick <= 0) jointMmPerUnitBallAndStick = 10;

      const savedMovingJointsMm = localStorage.getItem('jointMmPerUnitMovingJoints');
      if (savedMovingJointsMm) {
        const val = parseFloat(savedMovingJointsMm);
        if (!isNaN(val) && val > 0) jointMmPerUnitMovingJoints = val;
      } else {
        jointMmPerUnitMovingJoints = 20;
      }

      jointMmPerUnitSticks = parseFloat(localStorage.getItem('jointMmPerUnitSticks') || '10');
      if (isNaN(jointMmPerUnitSticks) || jointMmPerUnitSticks <= 0) jointMmPerUnitSticks = 10;

      jointMmPerUnitCubes = parseFloat(localStorage.getItem('jointMmPerUnitCubes') || '10');
      if (isNaN(jointMmPerUnitCubes) || jointMmPerUnitCubes <= 0) jointMmPerUnitCubes = 10;

      const savedSlicer = localStorage.getItem('selectedSlicer');
      if (savedSlicer && slicerOptions.some((s) => s.id === savedSlicer)) {
        selectedSlicerId = savedSlicer;
      }

      // Aplikace parametrů ze sdílené URL adresy (přepíše lokální nastavení)
      const searchParams = new URLSearchParams(window.location.search);
      if (hasShareSearchParams(searchParams)) {
        openedWithShareParams = true;
        initialShareState = parseShareSearchParams(searchParams);
        applyShareState(initialShareState);
        moleculeSource = initialShareState.source;
        moleculeQuery = initialShareState.molecule;
      }

      settingsLoaded = true;
    }

    canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Canvas not found');
      urlSyncReady = true;
      return;
    }

    try {
      const storedCoordinates = sessionStorage.getItem('atomCoordinates');
      const storedInput = sessionStorage.getItem('lastSuccessfulInput');
      const storedTableInfo = sessionStorage.getItem('tableInfo');
      const storedImageUrl = sessionStorage.getItem('imageUrl');
      
      if (!initialShareState && storedCoordinates) {
        atomCoordinates = JSON.parse(storedCoordinates);
        prevAtomCoordinates = atomCoordinates;
        lastSuccessfulInput = storedInput || '';
        inputStr = lastSuccessfulInput;
        isReloadMode = atomCoordinates.length > 0;
        if (storedTableInfo) {
          try {
            tableInfo = JSON.parse(storedTableInfo);
          } catch {}
        }
        if (storedImageUrl) {
          imageUrl = storedImageUrl;
        }
      }

      const { animate, updateCanvasSize, createAtoms: generatedCreateAtoms } = await setupThreeJS(canvas);
      setCanvasTheme(canvasDark);
      setBuildPlateVisible(showBuildPlate);
      setAutoRotate(autoRotate);

      const canvasResizeHandle = setupCanvasResizing(canvas, updateCanvasSize);
      cleanupCanvasResize = canvasResizeHandle;
      resizeCanvas = canvasResizeHandle.resize;
      createAtoms = generatedCreateAtoms;
      animate();

      if (initialShareState) {
        await tick();
        if (
          (initialShareState.source === 'pubchem' ||
            initialShareState.source === 'pdb' ||
            initialShareState.source === 'ccd' ||
            initialShareState.source === 'cactus' ||
            initialShareState.source === 'cod') &&
          initialShareState.molecule
        ) {
          await loadMoleculeFromSource(initialShareState.source, initialShareState.molecule, {
            saveToHistory: false
          });
        } else {
          // Zdroj je vlastní soubor (nebo čisté sdílení nastavení) – rozbalit nastavení a zobrazit informaci
          isCollapsed = false;
          sharedSettingsNotice = true;
          setTimeout(() => {
            if (typeof resizeCanvas === 'function') resizeCanvas();
          }, 50);
        }
      } else if (atomCoordinates.length > 0) {
        await tick();
        redrawModel(atomCoordinates, { resetCamera: true });
      }
    } catch (error) {
      console.error("Error during onMount initialization:", error);
    } finally {
      await tick();
      urlSyncReady = true;
    }
  }

  function setTableInfo(firstItem: string, secondItem: string, thirdItem: string) {
    tableInfo = { firstItem, secondItem, thirdItem };
    if (browser) {
      sessionStorage.setItem('tableInfo', JSON.stringify(tableInfo));
    }
  }

  function setImage(url: string) {
    imageUrl = url;
    if (browser) {
      sessionStorage.setItem('imageUrl', url);
    }
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

  async function loadMoleculeFromSource(
    source: 'pubchem' | 'pdb' | 'ccd' | 'cactus' | 'cod',
    rawQuery: string,
    options: {
      saveToHistory?: boolean;
      preloadedCodSdf?: string;
      preloadedCodEntry?: CodLoadedEntry;
      preloadedCcd?: CcdLoadedLigand;
      preloadedCactus?: CactusLoadedMolecule;
      preloadedConformer?: PubChemConformer;
      conformerLabel?: string;
    } = {}
  ) {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) return;

    // Preloaded data (e.g. a molecule drawn and converted to 3D locally) needs no network
    const hasPreloadedData = Boolean(
      options.preloadedCactus || options.preloadedCcd || options.preloadedCodEntry || options.preloadedCodSdf
    );
    if (isOffline() && !hasPreloadedData) {
      moleculePopupOffline = true;
      showMoleculePopup = true;
      return;
    }
    moleculePopupOffline = false;

    const {
      saveToHistory = true,
      preloadedCodSdf,
      preloadedCodEntry,
      preloadedCcd,
      preloadedCactus,
      preloadedConformer,
      conformerLabel
    } = options;

    isFileUploaded = false;
    sharedSettingsNotice = false;
    isFetchingMolecule = true;
    hoveredAtom = null;
    setTableInfo("", "", "");
    setImage('');

    let nameToSaveForHistory = trimmedQuery;
    let newAtomCoordinates: AtomCoordinate[] = [];
    let resolvedShareQuery = trimmedQuery;
    let displayInput = trimmedQuery;

    try {
      if (source === 'pdb') {
        const spec = parsePdbQuerySpec(trimmedQuery);
        await fetchPDBData(trimmedQuery, setTableInfo, setImage);
        const normalizedSpec = formatPdbQuerySpec(spec.pdbId, spec.chainId, spec.includeWaters);
        nameToSaveForHistory = spec.chainId || spec.includeWaters ? `PDB: ${normalizedSpec}` : spec.pdbId;
        resolvedShareQuery = normalizedSpec;
        displayInput = normalizedSpec;
        const url = `https://files.rcsb.org/view/${encodeURIComponent(spec.pdbId)}.pdb`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch PDB data");
        const content = await response.text();
        originalContent = content;
        originalFileExtension = "pdb";
        newAtomCoordinates = await parsePDB(content, {
          chainId: spec.chainId,
          includeWaters: spec.includeWaters
        });
      } else if (source === 'ccd') {
        const loaded = preloadedCcd ?? (await fetchCCDLigandData(trimmedQuery));
        originalContent = loaded.sdf;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(loaded.sdf);
        const formula = loaded.formula || computeMolecularFormula(newAtomCoordinates);
        setTableInfo(loaded.name, loaded.id, formula);
        setImage(loaded.imageUrl);
        resolvedShareQuery = loaded.id;
        displayInput = `CCD: ${loaded.id}`;
        nameToSaveForHistory = displayInput;
      } else if (source === 'cactus') {
        const loaded = preloadedCactus ?? (await fetchCactus3DSdf(trimmedQuery));
        originalContent = loaded.sdf;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(loaded.sdf);
        const formula = computeMolecularFormula(newAtomCoordinates);
        const generatorLabel = loaded.generator === 'openbabel' ? "OpenBabel 3D (offline)" : "NIH CACTUS 3D";
        const desc = formula ? `${formula} · ${generatorLabel}` : generatorLabel;
        setTableInfo(loaded.iupacName || loaded.query, loaded.generator === 'openbabel' ? "SMILES / OpenBabel" : "SMILES / CACTUS", desc);
        setImage(loaded.imageUrl);
        resolvedShareQuery = loaded.query;
        displayInput = `SMILES: ${loaded.query}`;
        nameToSaveForHistory = displayInput;
      } else if (source === 'cod') {
        const codEntry =
          preloadedCodEntry ??
          (preloadedCodSdf
            ? {
                id: trimmedQuery.replace(/^cod:\s*/i, '').trim(),
                sdf: preloadedCodSdf,
                name: `COD Entry: ${trimmedQuery}`,
                formula: ''
              }
            : await fetchCODEntry(trimmedQuery));
        originalContent = codEntry.sdf;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(codEntry.sdf);
        if (newAtomCoordinates.length === 0) {
          throw new Error("Failed to parse SDF content from COD.");
        }
        const formulaPart = codEntry.formula || computeMolecularFormula(newAtomCoordinates);
        const sgPart = codEntry.spaceGroup ? ` · ${codEntry.spaceGroup}` : '';
        const codDesc = formulaPart ? `${formulaPart}${sgPart}` : "Converted from CIF format";
        setTableInfo(codEntry.name, codEntry.id, codDesc);
        setImage('https://www.crystallography.net/cod/images/cod-logo.png');
        resolvedShareQuery = codEntry.id;
        displayInput = `COD: ${codEntry.id}`;
        nameToSaveForHistory = displayInput;
      } else {
        const conformerId = parseConformerQuery(trimmedQuery);
        if (conformerId) {
          // A specific PubChem 3D conformer (chosen in Advanced search, or from a shared link)
          const conformer =
            preloadedConformer && preloadedConformer.id === conformerId
              ? preloadedConformer
              : await fetchPubChemConformer(conformerId);
          const cid = readSdfProperty(conformer.sdf, 'PUBCHEM_COMPOUND_CID') || conformer.sdf.split(/\r?\n/)[0].trim();
          await fetchPubChemDataWithAutocomplete(cid, setTableInfo, setImage);
          originalContent = conformer.sdf;
          originalFileExtension = "sdf";
          newAtomCoordinates = await parseSDF(conformer.sdf);
          const energy = conformer.energy !== undefined ? ` · E(MMFF94) ${conformer.energy.toFixed(1)} kcal/mol` : '';
          const label = conformerLabel ? conformerLabel : `${$_('adv_conformer_label')} ${conformerId}`;
          setTableInfo(tableInfo.firstItem, cid, `${tableInfo.thirdItem} · ${label}${energy}`);
          resolvedShareQuery = formatConformerQuery(conformerId);
          displayInput = resolvedShareQuery;
          nameToSaveForHistory = resolvedShareQuery;
        } else {
        nameToSaveForHistory = await fetchPubChemDataWithAutocomplete(trimmedQuery, setTableInfo, setImage);
        const cid = tableInfo.secondItem;
        if (!cid) throw new Error("PubChem could not find a molecule for the given input.");

        const primaryUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/record/SDF?record_type=3d&response_type=display`;
        const fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/record/SDF`;
        // Not every compound has a 3D conformer (salts, many inorganics): fall back to the 2D record
        let response = await fetch(primaryUrl).catch(() => null);
        if (!response || !response.ok) response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error("Molecule data not available.");

        let content = await response.text();
        if (molfileIsFlat(content)) {
          try {
            const converted = await molfileTo3D(content);
            content = converted.sdf;
            const generator = converted.generator === 'cactus' ? 'NIH CACTUS 3D' : 'OpenBabel 3D';
            setTableInfo(tableInfo.firstItem, tableInfo.secondItem, `${tableInfo.thirdItem} · 2D → ${generator}`);
          } catch (err) {
            console.warn('PubChem has no 3D record and 3D generation failed; using 2D coordinates:', err);
          }
        }
        originalContent = content;
        originalFileExtension = "sdf";
        newAtomCoordinates = await parseSDF(content);

        const isNumericOrCas = /^\d+$/.test(trimmedQuery) || /^\d{2,7}-\d{2}-\d$/.test(trimmedQuery);
        if (isNumericOrCas) {
          resolvedShareQuery = trimmedQuery;
        } else if (nameToSaveForHistory && nameToSaveForHistory.length <= 50) {
          resolvedShareQuery = nameToSaveForHistory;
        } else {
          resolvedShareQuery = cid || trimmedQuery;
        }
        displayInput = trimmedQuery;
        }
      }

      if (newAtomCoordinates.length === 0) {
        throw new Error("No atom coordinates were found in the fetched file.");
      }

      atomCoordinates = newAtomCoordinates;
      moleculeSource = source;
      moleculeQuery = resolvedShareQuery;

      if (saveToHistory && !areCoordinatesEqual(atomCoordinates, prevAtomCoordinates)) {
        if (nameToSaveForHistory.length > 80) {
          nameToSaveForHistory = trimmedQuery.slice(0, 80);
        }
        saveSearch(nameToSaveForHistory);
      }
      
      prevAtomCoordinates = [...atomCoordinates];
      inputStr = displayInput;
      lastSuccessfulInput = displayInput;
      lastSuccessfulFileContent = originalContent;
      sessionStorage.setItem('lastSuccessfulInput', lastSuccessfulInput);

      await tick();
      redrawModel(atomCoordinates, { resetCamera: true });
      isReloadMode = true;
      if (typeof resizeCanvas === "function") resizeCanvas();
    } catch (error) {
      console.error("Error fetching/parsing molecule data:", error);
      showMoleculePopup = true;
      isReloadMode = false;
    } finally {
      isFetchingMolecule = false;
    }
  }

  async function handleSubmit() {
    if (!inputStr.trim() && !isReloadMode) {
      return;
    }

    if (isReloadMode && inputStr === lastSuccessfulInput) {
      await tick();
      redrawModel(atomCoordinates);
      if (typeof resizeCanvas === "function") resizeCanvas();
      return;
    }

    const trimmedInput = inputStr.trim();
    const codMatch = trimmedInput.match(/^cod:\s*(.+)$/i);
    if (codMatch) {
      await loadMoleculeFromSource('cod', codMatch[1].trim(), { saveToHistory: true });
      return;
    }
    const ccdMatch = trimmedInput.match(/^ccd:\s*(.+)$/i);
    if (ccdMatch) {
      await loadMoleculeFromSource('ccd', ccdMatch[1].trim(), { saveToHistory: true });
      return;
    }
    const cactusMatch = trimmedInput.match(/^(?:smiles|cactus):\s*(.+)$/i);
    if (cactusMatch) {
      await loadMoleculeFromSource('cactus', cactusMatch[1].trim(), { saveToHistory: true });
      return;
    }
    const pdbMatch = trimmedInput.match(/^pdb:\s*(.+)$/i);
    if (pdbMatch) {
      await loadMoleculeFromSource('pdb', pdbMatch[1].trim(), { saveToHistory: true });
      return;
    }

    const source = inferMoleculeSourceFromQuery(trimmedInput);
    await loadMoleculeFromSource(source, trimmedInput, { saveToHistory: true });
  }

  async function handleAdvancedSearch(event: CustomEvent) {
    const {
      source,
      query,
      content,
      preloadedCodEntry,
      preloadedCcd,
      preloadedCactus,
      preloadedConformer,
      conformerLabel
    } = event.detail;

    isReloadMode = false;

    if (source === 'pubchem') {
      inputStr = query;
      await loadMoleculeFromSource('pubchem', query, { saveToHistory: true, preloadedConformer, conformerLabel });
    } else if (source === 'pdb') {
      inputStr = query;
      await loadMoleculeFromSource('pdb', query, { saveToHistory: true });
    } else if (source === 'ccd') {
      await loadMoleculeFromSource('ccd', query, {
        saveToHistory: true,
        preloadedCcd
      });
    } else if (source === 'cactus') {
      await loadMoleculeFromSource('cactus', query, {
        saveToHistory: true,
        preloadedCactus
      });
    } else if (source === 'cod') {
      await loadMoleculeFromSource('cod', query, {
        saveToHistory: true,
        preloadedCodSdf: content,
        preloadedCodEntry
      });
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.isComposing || event.keyCode === 229) return;
      handleSubmit();
    }
  }

  let showSlicerMenu = false;
  let isOpeningSlicer = false;
  let slicerWrapperEl: HTMLElement | null = null;
  let selectedSlicerId = 'prusaslicer';

  const slicerOptions = [
    {
      id: 'prusaslicer',
      protocol: 'prusaslicer',
      labelKey: 'open_in_prusaslicer',
      fallbackLabel: 'Open in PrusaSlicer',
      alt: 'PrusaSlicer',
      darkIcon: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='800'%20height='800'%20viewBox='0%200%20800%20800'%3e%3cpath%20d='m%20680.14429,102.36264%20c%20-131.72203,-131.722038%20-345.22674,-131.722038%20-476.94877,0%20-131.722035,131.72203%20-131.722035,345.22674%200,476.94877%20z'%20fill='%23888'%20/%3e%3cpath%20d='m%20123.79757,699.53056%20c%20131.72203,131.72203%20345.22674,131.72203%20476.94877,0%20131.72204,-131.72204%20131.72204,-345.22674%200,-476.94877'%20fill='%23ed6b21'%20/%3e%3c/svg%3e",
      lightIcon: "data:image/svg+xml,%3csvg%20width='800'%20height='800'%20viewBox='0%200%20800%20800'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:svg='http://www.w3.org/2000/svg'%3e%3cpath%20d='m%20680.14429,102.36264%20c%20-131.72203,-131.722038%20-345.22674,-131.722038%20-476.94877,0%20-131.722035,131.72203%20-131.722035,345.22674%200,476.94877%20z'%20fill='%23363636'%20/%3e%3cpath%20d='m%20123.79757,699.53056%20c%20131.72203,131.72203%20345.22674,131.72203%20476.94877,0%20131.72204,-131.72204%20131.72204,-345.22674%200,-476.94877'%20fill='%23ed6b21'%20/%3e%3c/svg%3e"
    },
    {
      id: 'orcaslicer',
      protocol: 'orcaslicer',
      labelKey: 'open_in_orcaslicer',
      fallbackLabel: 'Open in OrcaSlicer',
      alt: 'OrcaSlicer',
      darkIcon: "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!--%20Created%20with%20Inkscape%20(http://www.inkscape.org/)%20--%3e%3csvg%20version='1.1'%20id='svg2'%20width='814.987'%20height='1023.9927'%20viewBox='0%200%20814.987%201023.9927'%20sodipodi:docname='OrcaSlicer_gradient_narrow.svg'%20inkscape:version='1.3%20(003919a,%202023-07-16)'%20xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape'%20xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:svg='http://www.w3.org/2000/svg'%3e%3cdefs%20id='defs6'%3e%3cclipPath%20clipPathUnits='userSpaceOnUse'%20id='clipPath16'%3e%3cpath%20d='M%200,792%20H%20612%20V%200%20H%200%20Z'%20id='path14'%20/%3e%3c/clipPath%3e%3c/defs%3e%3csodipodi:namedview%20id='namedview4'%20pagecolor='%23ffffff'%20bordercolor='%23000000'%20borderopacity='0.25'%20inkscape:showpageshadow='2'%20inkscape:pageopacity='0.0'%20inkscape:pagecheckerboard='0'%20inkscape:deskcolor='%23d1d1d1'%20showgrid='false'%20inkscape:zoom='0.70710678'%20inkscape:cx='570.63517'%20inkscape:cy='563.56411'%20inkscape:window-width='1392'%20inkscape:window-height='1212'%20inkscape:window-x='0'%20inkscape:window-y='25'%20inkscape:window-maximized='0'%20inkscape:current-layer='layer1'%20/%3e%3cg%20inkscape:groupmode='layer'%20id='layer1'%20inkscape:label='background'%20transform='matrix(0.99895749,0,0,0.99799215,-0.93372195,0.0585938)'%20/%3e%3cg%20id='g8'%20inkscape:groupmode='layer'%20inkscape:label='OrcaS'%20transform='matrix(1.3333333,0,0,-1.3333333,1.3995581e-8,1055.9963)'%3e%3cg%20id='g10'%20transform='translate(1.2589521,16.062441)'%3e%3cg%20id='g12'%20clip-path='url(%23clipPath16)'%3e%3cg%20id='g18'%20transform='translate(59.7287,115.3517)'%3e%3cpath%20d='m%200,0%20c%2053.332,-53.285%20126.698,-86.317%20207.744,-86.646%20164.049,-0.664%20298.355,134.38%20297.699,299.337%20-0.324,81.496%20-33.176,155.271%20-86.17,208.899%20z'%20style='fill:%2374736cff;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path20'%20/%3e%3c/g%3e%3cg%20id='g22'%20transform='translate(479.0017,536.9419)'%3e%3cpath%20d='m%200,0%20-419.273,-421.59%20c%200.298,-0.298%200.606,-0.587%200.906,-0.884%20146.894,74.925%20348.023,206.579%20486.003,316.297%20C%2052.756,-65.97%2029.506,-29.859%200,0'%20style='fill:%23009789;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path24'%20/%3e%3c/g%3e%3cg%20id='g26'%20transform='translate(397.0372,747)'%3e%3cpath%20d='m%200,0%20c%20-163.742,0%20-296.482,-133.473%20-296.482,-298.121%200,-81.979%2032.915,-156.223%2086.172,-210.117%20l%20419.273,421.59%20C%20155.364,-33.096%2081.529,0%200,0'%20style='fill:%23605f5aff;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path28'%20/%3e%3c/g%3e%3cg%20id='g30'%20transform='translate(397.0372,747)'%3e%3cpath%20d='m%200,0%20c%20-56.714,0%20-109.702,-16.022%20-154.751,-43.796%20-24.127,6.312%20-54.061,11.37%20-88.437,11.157%20-59.938,-0.372%20-108.713,-16.603%20-141.822,-31.784%20-8.218,-3.768%20-6.898,-15.967%201.941,-17.829%2021.801,-4.593%2050.498,-14.324%2078.883,-35.28%2017.931,-13.238%2031.574,-27.883%2041.856,-41.597%20-21.794,-41.504%20-34.152,-88.793%20-34.152,-138.992%200,-29.952%204.412,-58.865%2012.586,-86.137%2012.54,27.79%2025.699,46.391%2029.916,52.184%2027.229,37.41%2056.015,56.883%2098.542,85.651%2031.328,21.193%2074.856,46.047%20199.916,97.449%200,0%2039.121,11.017%2091.587,42.212%2020.912,12.433%2036.823,24.17%2041.863,42.526%200.355,1.293%200.677,2.57%200.973,3.83%20C%20129.175,-22.506%2067.208,0%200,0'%20style='fill:%2374736cff;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path32'%20/%3e%3c/g%3e%3cg%20id='g34'%20transform='translate(446.5563,646.8041)'%3e%3cpath%20d='m%200,0%20c%2010.875,-19.229%20-10.891,-52.305%20-48.616,-73.879%20-37.725,-21.573%20-77.124,-23.474%20-88,-4.245%20-10.875,19.229%2010.891,52.305%2048.617,73.879%20C%20-50.274,17.328%20-10.875,19.229%200,0'%20style='fill:%23ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path36'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
      lightIcon: "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!--%20Created%20with%20Inkscape%20(http://www.inkscape.org/)%20--%3e%3csvg%20version='1.1'%20id='svg2'%20width='814.987'%20height='1023.9927'%20viewBox='0%200%20814.987%201023.9927'%20sodipodi:docname='OrcaSlicer_gradient_narrow.svg'%20inkscape:version='1.3%20(003919a,%202023-07-16)'%20xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape'%20xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:svg='http://www.w3.org/2000/svg'%3e%3cdefs%20id='defs6'%3e%3cclipPath%20clipPathUnits='userSpaceOnUse'%20id='clipPath16'%3e%3cpath%20d='M%200,792%20H%20612%20V%200%20H%200%20Z'%20id='path14'%20/%3e%3c/clipPath%3e%3c/defs%3e%3csodipodi:namedview%20id='namedview4'%20pagecolor='%23ffffff'%20bordercolor='%23000000'%20borderopacity='0.25'%20inkscape:showpageshadow='2'%20inkscape:pageopacity='0.0'%20inkscape:pagecheckerboard='0'%20inkscape:deskcolor='%23d1d1d1'%20showgrid='false'%20inkscape:zoom='0.70710678'%20inkscape:cx='570.63517'%20inkscape:cy='563.56411'%20inkscape:window-width='1392'%20inkscape:window-height='1212'%20inkscape:window-x='0'%20inkscape:window-y='25'%20inkscape:window-maximized='0'%20inkscape:current-layer='layer1'%20/%3e%3cg%20inkscape:groupmode='layer'%20id='layer1'%20inkscape:label='background'%20transform='matrix(0.99895749,0,0,0.99799215,-0.93372195,0.0585938)'%20/%3e%3cg%20id='g8'%20inkscape:groupmode='layer'%20inkscape:label='OrcaS'%20transform='matrix(1.3333333,0,0,-1.3333333,1.3995581e-8,1055.9963)'%3e%3cg%20id='g10'%20transform='translate(1.2589521,16.062441)'%3e%3cg%20id='g12'%20clip-path='url(%23clipPath16)'%3e%3cg%20id='g18'%20transform='translate(59.7287,115.3517)'%3e%3cpath%20d='m%200,0%20c%2053.332,-53.285%20126.698,-86.317%20207.744,-86.646%20164.049,-0.664%20298.355,134.38%20297.699,299.337%20-0.324,81.496%20-33.176,155.271%20-86.17,208.899%20z'%20style='fill:%23292826;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path20'%20/%3e%3c/g%3e%3cg%20id='g22'%20transform='translate(479.0017,536.9419)'%3e%3cpath%20d='m%200,0%20-419.273,-421.59%20c%200.298,-0.298%200.606,-0.587%200.906,-0.884%20146.894,74.925%20348.023,206.579%20486.003,316.297%20C%2052.756,-65.97%2029.506,-29.859%200,0'%20style='fill:%23009789;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path24'%20/%3e%3c/g%3e%3cg%20id='g26'%20transform='translate(397.0372,747)'%3e%3cpath%20d='m%200,0%20c%20-163.742,0%20-296.482,-133.473%20-296.482,-298.121%200,-81.979%2032.915,-156.223%2086.172,-210.117%20l%20419.273,421.59%20C%20155.364,-33.096%2081.529,0%200,0'%20style='fill:%23292826;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path28'%20/%3e%3c/g%3e%3cg%20id='g30'%20transform='translate(397.0372,747)'%3e%3cpath%20d='m%200,0%20c%20-56.714,0%20-109.702,-16.022%20-154.751,-43.796%20-24.127,6.312%20-54.061,11.37%20-88.437,11.157%20-59.938,-0.372%20-108.713,-16.603%20-141.822,-31.784%20-8.218,-3.768%20-6.898,-15.967%201.941,-17.829%2021.801,-4.593%2050.498,-14.324%2078.883,-35.28%2017.931,-13.238%2031.574,-27.883%2041.856,-41.597%20-21.794,-41.504%20-34.152,-88.793%20-34.152,-138.992%200,-29.952%204.412,-58.865%2012.586,-86.137%2012.54,27.79%2025.699,46.391%2029.916,52.184%2027.229,37.41%2056.015,56.883%2098.542,85.651%2031.328,21.193%2074.856,46.047%20199.916,97.449%200,0%2039.121,11.017%2091.587,42.212%2020.912,12.433%2036.823,24.17%2041.863,42.526%200.355,1.293%200.677,2.57%200.973,3.83%20C%20129.175,-22.506%2067.208,0%200,0'%20style='fill:%23262523;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path32'%20/%3e%3c/g%3e%3cg%20id='g34'%20transform='translate(446.5563,646.8041)'%3e%3cpath%20d='m%200,0%20c%2010.875,-19.229%20-10.891,-52.305%20-48.616,-73.879%20-37.725,-21.573%20-77.124,-23.474%20-88,-4.245%20-10.875,19.229%2010.891,52.305%2048.617,73.879%20C%20-50.274,17.328%20-10.875,19.229%200,0'%20style='fill:%23ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none'%20id='path36'%20/%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/svg%3e"
    },
    {
      id: 'cura',
      protocol: 'cura',
      labelKey: 'open_in_cura',
      fallbackLabel: 'Open in Ultimaker Cura',
      alt: 'Ultimaker Cura',
      darkIcon: "data:image/svg+xml,%3csvg%20width='200'%20height='200'%20viewBox='0%200%20200%20200'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_1_10)'%3e%3cpath%20d='M145.015%20180L174%20151.886V16H58.0615L17%2055.8286V180H145.015Z'%20fill='%231A6DEE'/%3e%3cpath%20d='M157.288%20-0.28423H51.8979L0.324288%2051.2516V167.768C0.167678%20172.223%200.930561%20176.664%202.56545%20180.812C4.20035%20184.961%206.67226%20188.729%209.82733%20191.882C12.9824%20195.035%2016.7531%20197.505%2020.9047%20199.138C25.0564%20200.772%2029.5001%20201.534%2033.9593%20201.378H150.561L190.923%20161.045V33.3261C191.079%2028.8702%20190.316%2024.4297%20188.681%2020.2811C187.046%2016.1326%20184.575%2012.3646%20181.419%209.21185C178.264%206.05909%20174.494%203.58899%20170.342%201.9553C166.19%200.321599%20161.747%20-0.440725%20157.288%20-0.28423ZM168.499%20152.083L141.591%20178.971H22.7476V60.2144L60.8673%2022.1227H168.499V152.083Z'%20fill='white'/%3e%3cpath%20d='M101.262%20156.291H134.772V133.994H101.262C92.3741%20133.994%2083.8506%20130.47%2077.5661%20124.197C71.2816%20117.925%2067.7511%20109.417%2067.7511%20100.547C67.7511%2091.6762%2071.2816%2083.1688%2077.5661%2076.8963C83.8506%2070.6239%2092.3741%2067.1%20101.262%2067.1H134.772V44.8021H101.262C86.4491%2044.8021%2072.2431%2050.6752%2061.769%2061.1294C51.2949%2071.5835%2045.4106%2085.7624%2045.4106%20100.547C45.4106%20115.331%2051.2949%20129.51%2061.769%20139.964C72.2431%20150.418%2086.4491%20156.291%20101.262%20156.291Z'%20fill='white'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_1_10'%3e%3crect%20width='200'%20height='200'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e",
      lightIcon: "data:image/svg+xml,%3csvg%20width='200'%20height='200'%20viewBox='0%200%20200%20200'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_2_28)'%3e%3cpath%20d='M157.288%20-0.28424H51.8979L0.324288%2051.2516V167.768C0.167678%20172.223%200.930561%20176.664%202.56545%20180.812C4.20035%20184.961%206.67226%20188.729%209.82733%20191.882C12.9824%20195.035%2016.7531%20197.505%2020.9047%20199.138C25.0564%20200.772%2029.5001%20201.534%2033.9593%20201.378H150.561L190.923%20161.045V33.3261C191.079%2028.8702%20190.316%2024.4297%20188.681%2020.2811C187.046%2016.1325%20184.575%2012.3646%20181.419%209.21184C178.264%206.05908%20174.494%203.58898%20170.342%201.95529C166.19%200.321589%20161.747%20-0.440735%20157.288%20-0.28424ZM168.499%20152.083L141.591%20178.971H22.7476V60.2144L60.8673%2022.1227H168.499V152.083Z'%20fill='%231A6DEE'/%3e%3cpath%20d='M141.862%20181L169%20153.743V22H60.4461L22%2060.6143V181H141.862Z'%20fill='%231A6DEE'/%3e%3cpath%20d='M103.75%20169H145V141.6H103.75C92.8098%20141.6%2082.3177%20137.27%2074.5818%20129.562C66.846%20121.854%2062.5%20111.4%2062.5%20100.5C62.5%2089.5996%2066.846%2079.1457%2074.5818%2071.4379C82.3177%2063.7302%2092.8098%2059.4%20103.75%2059.4H145V32H103.75C85.5164%2032%2068.0295%2039.2169%2055.1364%2052.0632C42.2433%2064.9094%2035%2082.3327%2035%20100.5C35%20118.667%2042.2433%20136.091%2055.1364%20148.937C68.0295%20161.783%2085.5164%20169%20103.75%20169Z'%20fill='white'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_2_28'%3e%3crect%20width='200'%20height='200'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e"
    },
    {
      id: 'bambustudio',
      protocol: 'bambustudio',
      labelKey: 'open_in_bambustudio',
      fallbackLabel: 'Open in Bambu Studio',
      alt: 'Bambu Studio',
      darkIcon: "data:image/svg+xml,%3csvg%20width='200'%20height='200'%20viewBox='0%200%20200%20200'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_1_2)'%3e%3cpath%20d='M100%20200C155.228%20200%20200%20155.228%20200%20100C200%2044.7715%20155.228%200%20100%200C44.7715%200%200%2044.7715%200%20100C0%20155.228%2044.7715%20200%20100%20200Z'%20fill='%2300AF41'/%3e%3cpath%20d='M103.453%2084.5444C105.926%2085.5118%20108.3%2086.4379%20110.669%2087.3716C122.42%2091.9985%20134.168%2096.6329%20145.928%20101.239C146.611%20101.505%20146.86%20101.811%20146.858%20102.574C146.832%20121.663%20146.837%20140.754%20146.837%20159.843V160.906C146.429%20160.924%20146.125%20160.951%20145.819%20160.951C132.042%20160.952%20118.262%20160.945%20104.484%20160.969C103.639%20160.969%20103.382%20160.765%20103.382%20159.888C103.406%20135.113%20103.401%20110.336%20103.403%2085.5605C103.403%2085.2606%20103.429%2084.9606%20103.45%2084.5444L103.453%2084.5444Z'%20fill='white'/%3e%3cpath%20d='M53.2095%2039.0306H96.541C96.5598%2039.34%2096.5898%2039.6118%2096.5898%2039.8837C96.5954%2040.9148%2096.5898%2041.9459%2096.5916%2042.9752C96.6066%2061.0273%2096.616%2079.0794%2096.6591%2097.1316C96.661%2098.0127%2096.4004%2098.4196%2095.5718%2098.7439C81.811%20104.128%2068.0652%20109.55%2054.3156%20114.963C53.9781%20115.096%2053.6313%20115.204%2053.2076%20115.352V39.0306H53.2095Z'%20fill='white'/%3e%3cpath%20d='M96.5654%20160.951H54.3925C53.5714%20160.951%2053.1602%20160.553%2053.1589%20159.756C53.1589%20147.76%2053.1664%20135.763%2053.142%20123.766C53.142%20123.007%2053.3389%20122.632%2054.0869%20122.34C67.9921%20116.89%2081.8822%20111.406%2095.778%20105.932C96.003%20105.844%2096.2411%20105.784%2096.5636%20105.684V160.951L96.5654%20160.951Z'%20fill='white'/%3e%3cpath%20d='M103.405%2039.0325H146.783V94.2445C146.339%2094.0907%20145.913%2093.9614%20145.501%2093.7983C131.783%2088.3933%20118.067%2082.9771%20104.34%2077.5965C103.592%2077.3041%20103.388%2076.9403%20103.39%2076.1773C103.412%2064.1525%20103.406%2052.1297%20103.406%2040.1049V39.0325L103.405%2039.0325Z'%20fill='white'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_1_2'%3e%3crect%20width='200'%20height='200'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e",
      lightIcon: "data:image/svg+xml,%3csvg%20width='200'%20height='200'%20viewBox='0%200%20200%20200'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_1_15)'%3e%3cpath%20d='M100%20200C155.228%20200%20200%20155.228%20200%20100C200%2044.7715%20155.228%200%20100%200C44.7715%200%200%2044.7715%200%20100C0%20155.228%2044.7715%20200%20100%20200Z'%20fill='%2300AF41'/%3e%3cpath%20d='M103.453%2084.5444C105.926%2085.5118%20108.3%2086.4379%20110.669%2087.3716C122.42%2091.9985%20134.168%2096.6329%20145.928%20101.239C146.611%20101.505%20146.86%20101.811%20146.858%20102.574C146.832%20121.663%20146.837%20140.754%20146.837%20159.843V160.906C146.429%20160.924%20146.125%20160.951%20145.819%20160.951C132.042%20160.952%20118.262%20160.945%20104.484%20160.969C103.639%20160.969%20103.382%20160.765%20103.382%20159.888C103.406%20135.113%20103.401%20110.336%20103.403%2085.5605C103.403%2085.2606%20103.429%2084.9606%20103.45%2084.5444L103.453%2084.5444Z'%20fill='white'/%3e%3cpath%20d='M53.2095%2039.0306H96.541C96.5598%2039.34%2096.5898%2039.6118%2096.5898%2039.8837C96.5954%2040.9148%2096.5898%2041.9459%2096.5916%2042.9752C96.6066%2061.0273%2096.616%2079.0794%2096.6591%2097.1316C96.661%2098.0127%2096.4004%2098.4196%2095.5718%2098.7439C81.811%20104.128%2068.0652%20109.55%2054.3156%20114.963C53.9781%20115.096%2053.6313%20115.204%2053.2076%20115.352V39.0306H53.2095Z'%20fill='white'/%3e%3cpath%20d='M96.5654%20160.951H54.3925C53.5714%20160.951%2053.1602%20160.553%2053.1589%20159.756C53.1589%20147.76%2053.1664%20135.763%2053.142%20123.766C53.142%20123.007%2053.3389%20122.632%2054.0869%20122.34C67.9921%20116.89%2081.8822%20111.406%2095.778%20105.932C96.003%20105.844%2096.2411%20105.784%2096.5636%20105.684V160.951L96.5654%20160.951Z'%20fill='white'/%3e%3cpath%20d='M103.405%2039.0325H146.783V94.2445C146.339%2094.0907%20145.913%2093.9614%20145.501%2093.7983C131.783%2088.3933%20118.067%2082.9771%20104.34%2077.5965C103.592%2077.304%20103.388%2076.9403%20103.39%2076.1773C103.412%2064.1525%20103.406%2052.1296%20103.406%2040.1049V39.0325L103.405%2039.0325Z'%20fill='white'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_1_15'%3e%3crect%20width='200'%20height='200'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e"
    }
  ];

  $: selectedSlicer = slicerOptions.find((s) => s.id === selectedSlicerId) || slicerOptions[0];

  function selectAndOpenSlicer(slicerId: string) {
    selectedSlicerId = slicerId;
    if (browser) {
      localStorage.setItem('selectedSlicer', slicerId);
    }
    showSlicerMenu = false;
    openInSlicer(slicerId);
  }

  function buildSlicerProtocolUri(slicerId: string, fileUrl: string, fileName: string): string {
    const isMac = typeof navigator !== 'undefined' && /Macintosh|Mac OS X/i.test(navigator.userAgent);
    if (slicerId === 'bambustudio') {
      // Bambu Studio takes the file name from the last URL segment (query included) unless
      // "&name=" is present, so without it the extension resolves to ".com" and the import
      // fails with "unknown file format".
      const bambuFileUrl = `${fileUrl}?source=amazonaws.com&name=${fileName}`;
      if (isMac) {
        return `bambustudioopen://${encodeURIComponent(bambuFileUrl)}`;
      }
      return `bambustudio://open?file=${encodeURIComponent(bambuFileUrl)}`;
    }
    return `${slicerId}://open?file=${encodeURIComponent(fileUrl)}`;
  }

  function triggerCustomProtocolUri(uri: string) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = uri;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 3000);
  }

  function getModelMetadata(desc = "3MF multicolor model with metadata"): Record<string, string | number | boolean | null | undefined> {
    const shareUrl = browser ? buildShareUrl(window.location.href, currentShareState) : null;
    return {
      author: "3D Printing Molecules WEB APP",
      shareUrl,
      moleculeName: tableInfo.firstItem || null,
      moleculeId: tableInfo.secondItem || null,
      moleculeDescription: tableInfo.thirdItem || null,
      moleculeImage: imageUrl && !imageUrl.startsWith('data:') ? imageUrl : null,
      isFileUploaded: isFileUploaded,
      uploadedFileName: isFileUploaded ? uploadedFileName : null,
      quality: quality,
      description: desc,
      hydrogens: String(showHydrogens),
      selectedGenerator: modelGenerators.find(g => g.func === selectedGenerator)?.name,
      multiplicationFactor: multiplicationFactor,
      mmPerUnit: jointMmPerUnit,
      ...(isBallAndStickStyle
        ? {
            bondDiameterMultiplicationFactor: bondDiameterMultiplicationFactor,
            bondQuality: bondQuality,
            groupBondsSeparately: groupBondsSeparately,
            showMultipleBonds: showMultipleBonds
          }
        : {}),
      ...(isMovingJointsStyle
        ? {
            jointPreset: jointPreset,
            jointParams: JSON.stringify(jointParams),
            jointPreferT: jointPreferT,
            jointSkipTerminal: jointSkipTerminal,
            jointsInRings: jointsInRings
          }
        : {}),
      ...(isGluedSpheresStyle
        ? {
            gluedMode: gluedMode,
            gluedPriorityOrder: gluedPriorityOrder.join(','),
            gluedMergeSameElement: gluedMergeSameElement,
            gluedGap: gluedGap,
            gluedPegHolesEnabled: gluedPegHolesEnabled,
            gluedPegHoleDiameter: gluedPegHoleDiameter,
            gluedPegHoleDepth: gluedPegHoleDepth,
            gluedExportMode: gluedExportMode,
            gluedPlateSpacing: gluedPlateSpacing
          }
        : {})
    };
  }

  function verifyGluedSpheresBeforeExport(): boolean {
    if (!isGluedSpheresStyle) return true;
    const validation = validateGluedSpheresManifold(undefined, $currentLocale);
    if (!validation.valid) {
      gluedExportError = `${$_('glued_spheres_export_error_prefix')} ${validation.errors.join(', ')}`;
      return false;
    }
    gluedExportError = null;
    return true;
  }

  async function downloadModel() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    if (!verifyGluedSpheresBeforeExport()) return;
    updateFileName();
    exportModelAs3MF(fileName, getModelMetadata(), $currentLocale);
  }

  async function uploadModelToBlob(id: string, safeFileName: string, blob: Blob): Promise<string | null> {
    try {
      const { upload } = await import('@vercel/blob/client');
      const result = await upload(`slicer/${id}/${safeFileName}`, blob, {
        access: 'public',
        handleUploadUrl: '/api/slicer/upload',
        contentType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
      });
      return result.url;
    } catch (err) {
      console.warn('Blob upload failed, falling back to server storage:', err);
      return null;
    }
  }

  async function openInSlicer(slicerId = selectedSlicerId) {
    showSlicerMenu = false;
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    if (!verifyGluedSpheresBeforeExport()) return;
    if (isOpeningSlicer) return;

    updateFileName();
    isOpeningSlicer = true;
    try {
      const blob = await generateModel3MFBlob(fileName, getModelMetadata(), $currentLocale);
      if (!blob) return;

      const id = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      const safeFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.3mf`;

      // Deployed: store the model in Vercel Blob so any serverless instance (and the slicer) can fetch it.
      // Local dev, or Blob not configured: fall back to the in-process /api/slicer endpoint below.
      if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
        const blobUrl = await uploadModelToBlob(id, safeFileName, blob);
        if (blobUrl) {
          triggerCustomProtocolUri(buildSlicerProtocolUri(slicerId, blobUrl, safeFileName));
          return;
        }
      }

      const apiPath = `/api/slicer/${id}/${encodeURIComponent(safeFileName)}`;

      const res = await fetch(`${apiPath}?slicer=${encodeURIComponent(slicerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blob
      });

      if (!res.ok) {
        throw new Error(`Failed to prepare model for slicer (${res.status})`);
      }

      const data = await res.json().catch(() => ({ openedLocally: false }));
      if (data?.openedLocally) {
        return;
      }

      const fileUrl = `${window.location.origin}${apiPath}`;
      const slicerUri = buildSlicerProtocolUri(slicerId, fileUrl, safeFileName);
      triggerCustomProtocolUri(slicerUri);
    } catch (err) {
      console.error('Error opening model in slicer:', err);
    } finally {
      isOpeningSlicer = false;
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (showSlicerMenu && slicerWrapperEl && !slicerWrapperEl.contains(event.target as Node)) {
      showSlicerMenu = false;
    }
    if (showSharePopover && shareWrapperEl && !shareWrapperEl.contains(event.target as Node)) {
      showSharePopover = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (showSlicerMenu) showSlicerMenu = false;
      if (showSharePopover) showSharePopover = false;
    }
  }

  async function downloadModelZip() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    if (!verifyGluedSpheresBeforeExport()) return;
    updateFileName();
    const metadata = getModelMetadata("ZIP of STL models with metadata");

    exportBinaryAsZip(fileName, metadata, $currentLocale);
  }

  async function downloadWholeModel() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    if (!verifyGluedSpheresBeforeExport()) return;
    updateFileName();
    exportModelAsSTL(fileName);
  }

  function refreshPreviewHud() {
    modelBoundsMm = getModelBoundsMm();
    elementGroups = getElementGroupsInfo();
    hoveredAtom = null;
  }

  function handleResetCameraView() {
    resetCameraView();
  }

  function handleToggleAutoRotate() {
    autoRotate = !autoRotate;
    setAutoRotate(autoRotate);
  }

  function handleToggleBuildPlate() {
    showBuildPlate = !showBuildPlate;
    setBuildPlateVisible(showBuildPlate);
    if (browser) {
      localStorage.setItem('canvasShowBuildPlate', String(showBuildPlate));
    }
  }

  function handleToggleElementGroup(key: string) {
    elementGroups = toggleElementGroupVisibility(key);
    hoveredAtom = null;
  }

  function handleShowAllElementGroups() {
    elementGroups = showAllElementGroups();
  }

  function handleCanvasPointerMove(event: PointerEvent) {
    if (atomCoordinates.length === 0 || !canvas || event.buttons !== 0) {
      if (hoveredAtom) hoveredAtom = null;
      return;
    }
    pendingHoverCoords = { clientX: event.clientX, clientY: event.clientY };
    if (hoverRafId !== null) return;
    hoverRafId = requestAnimationFrame(() => {
      hoverRafId = null;
      if (!pendingHoverCoords || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const ndcX = ((pendingHoverCoords.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((pendingHoverCoords.clientY - rect.top) / rect.height) * 2 + 1;
      hoveredAtom = pickAtomAtCanvasNormalizedPosition(ndcX, ndcY);
    });
  }

  function handleCanvasPointerLeave() {
    pendingHoverCoords = null;
    hoveredAtom = null;
  }

  $: hasHiddenElementGroups = elementGroups.some((g) => !g.visible);

  $: if (
    browser &&
    createAtoms &&
    atomCoordinates.length > 0 &&
    !isGluedSpheresStyle &&
    !isMovingJointsStyle &&
    jointMmPerUnit > 0
  ) {
    modelBoundsMm = syncPreviewScaleMmPerUnit(jointMmPerUnit);
  }

  function redrawModel(coords: AtomCoordinate[], options: { resetCamera?: boolean } = {}) {
    if (coords.length === 0) return;
    sessionStorage.setItem('atomCoordinates', JSON.stringify(coords));
    gluedExportError = null;
    if (typeof createAtoms === "function") {
      const params: CreateAtomsParams = {
        coordinates: coords,
        quality: quality,
        showHydrogens: showHydrogens,
        multiplicationFactor: multiplicationFactor, // Zde se použije reaktivní proměnná
        selectedGenerator: selectedGenerator,
        mmPerUnit: jointMmPerUnit,
        ...(isBallAndStickStyle
          ? { bondDiameterMultiplicationFactor, bondQuality, groupBondsSeparately, uniformAtomDiameter, showMultipleBonds }
          : {}),
        ...(isGluedSpheresStyle
          ? {
              uniformAtomDiameter,
              gluedSpheres: {
                mode: gluedMode,
                priorityOrder: [...gluedPriorityOrder],
                mergeSameElement: gluedMergeSameElement,
                gap: gluedGap,
                pegHolesEnabled: gluedPegHolesEnabled,
                pegHoleDiameter: gluedPegHoleDiameter,
                pegHoleDepth: gluedPegHoleDepth,
                exportMode: gluedExportMode,
                plateSpacing: gluedPlateSpacing,
                explodedFactor: gluedExplodedPercent / 100,
                showPartLabels: gluedShowPartLabels,
                mmPerUnit: jointMmPerUnit,
                locale: $currentLocale
              }
            }
          : {}),
        ...(isMovingJointsStyle
          ? {
              movingJoints: {
                preset: jointPreset,
                params: { ...jointParams },
                preferT: jointPreferT,
                skipTerminal: jointSkipTerminal,
                jointsInRings: jointsInRings,
                mmPerUnit: jointMmPerUnit
              }
            }
          : {})
      };
      if (isGluedSpheresStyle) {
        movingJointsStats = null;
        const activeCount = showHydrogens
          ? coords.length
          : coords.filter((c) => c.atomType !== 'H').length;
        gluedWorkerProgress = { running: true, completed: 0, total: activeCount };
        computeAndRenderGluedSpheresAsync(
          params,
          {
            onProgress: (completed, total) => {
              gluedWorkerProgress = { running: true, completed, total };
            },
            onComplete: (stats) => {
              gluedWorkerProgress = { running: false, completed: stats.totalAtoms, total: stats.totalAtoms };
              gluedSpheresStats = stats;
              refreshPreviewHud();
            },
            onError: (errMsg) => {
              gluedWorkerProgress = { running: false, completed: 0, total: 0 };
              gluedExportError = errMsg;
            }
          },
          options
        );
      } else {
        gluedWorkerProgress = { running: false, completed: 0, total: 0 };
        gluedSpheresStats = null;
        movingJointsStats = createAtoms(params, options);
        refreshPreviewHud();
      }
    } else {
      console.error("createAtoms function not initialized");
    }
  }

  function updateFileName() {
    let name = "molecule";
    if (isFileUploaded) {
      name = `Molecule_${uploadedFileName}`;
    } else if (moleculeSource === 'cod' && moleculeQuery) {
      name = `Molecule_COD_${moleculeQuery}`;
    } else if (moleculeSource === 'ccd' && moleculeQuery) {
      name = `Molecule_CCD_${moleculeQuery}`;
    } else if (moleculeSource === 'pdb' && moleculeQuery) {
      name = `Molecule_PDB_${moleculeQuery.replace(/[^A-Za-z0-9_-]/g, '_')}`;
    } else if (moleculeSource === 'cactus' && (tableInfo.firstItem || moleculeQuery)) {
      const safeLabel = (tableInfo.firstItem || moleculeQuery)
        .replace(/[^A-Za-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 32);
      name = `Molecule_${safeLabel || 'CACTUS'}`;
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
    if (inputStr !== lastSuccessfulInput) {
      isReloadMode = false;
    }
    handleSubmit();
  }

  function clearHistory() {
    searchHistory = [];
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }
  
  /**
   * Turns uploaded or pasted structure data into atom coordinates. ChemDraw documents and 2D
   * molfiles (implicit hydrogens, z = 0) are converted to full 3D structures first.
   */
  async function structureContentToAtoms(
    raw: string | ArrayBuffer,
    displayName: string,
    formatHint: StructureFileFormat | null
  ): Promise<AtomCoordinate[]> {
    const bytes = typeof raw === 'string' ? null : new Uint8Array(raw);
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(bytes!);
    const fileFormat = formatHint ?? (bytes && isCdxBinary(bytes) ? 'cdx' : detectStructureFormat(text));
    if (!fileFormat) {
      throw new Error(`Unsupported file format: ${displayName}`);
    }
    setTableInfo(displayName, `Uploaded .${fileFormat} file`, "");

    const applyConverted = async (converted: Converted3D, sourceLabel: string) => {
      originalContent = converted.sdf;
      originalFileExtension = 'sdf';
      const atoms = await parseSDF(converted.sdf);
      const formula = computeMolecularFormula(atoms);
      const generator = converted.generator === 'cactus' ? 'NIH CACTUS 3D' : 'OpenBabel 3D (offline)';
      setTableInfo(displayName, `${sourceLabel} → ${generator}`, formula);
      if (converted.imageUrl) setImage(converted.imageUrl);
      return atoms;
    };

    if (fileFormat === 'cdx' || fileFormat === 'cdxml') {
      const data = fileFormat === 'cdx' ? (bytes ?? new TextEncoder().encode(text)) : text;
      return applyConverted(await chemDrawTo3D(data, fileFormat), `ChemDraw (.${fileFormat})`);
    }
    if (fileFormat === 'pdb') {
      originalContent = text;
      originalFileExtension = 'pdb';
      return parsePDB(text);
    }
    if (fileFormat === 'cif') {
      const sdfContent = await cifToSdf(text);
      originalContent = sdfContent;
      originalFileExtension = 'sdf';
      return parseSDF(sdfContent);
    }

    if (molfileIsFlat(text)) {
      try {
        return await applyConverted(await molfileTo3D(text), '2D molfile');
      } catch (err) {
        // Keep the flat drawing rather than failing: it is still a valid (planar) structure
        console.warn('2D -> 3D conversion failed, using the flat structure:', err);
      }
    }
    originalContent = text;
    originalFileExtension = 'sdf';
    return parseSDF(text);
  }

  async function loadStructureData(raw: string | ArrayBuffer, displayName: string, formatHint: StructureFileFormat | null, baseName: string) {
    isReloadMode = false;
    isFetchingMolecule = true;
    hoveredAtom = null;
    uploadedFileName = baseName || displayName;
    isFileUploaded = true;
    moleculeSource = 'file';
    moleculeQuery = '';
    sharedSettingsNotice = false;
    setImage('https://openmoji.org/data/black/svg/1F4C4.svg');
    inputStr = `File: ${displayName}`;

    try {
      const newAtomCoordinates = await structureContentToAtoms(raw, displayName, formatHint);
      if (newAtomCoordinates.length === 0) {
        throw new Error(`No atoms found in the uploaded file: ${displayName}`);
      }

      atomCoordinates = newAtomCoordinates;
      prevAtomCoordinates = [...atomCoordinates];
      lastSuccessfulFileContent = originalContent;
      lastSuccessfulInput = inputStr;
      sessionStorage.setItem('lastSuccessfulInput', lastSuccessfulInput);

      await tick();
      redrawModel(atomCoordinates, { resetCamera: true });
      isReloadMode = true;
    } catch (error) {
      console.error("Error parsing uploaded file:", error);
      showMoleculePopup = true;
      isReloadMode = false;
    } finally {
      isFetchingMolecule = false;
    }
  }

  function handleFiles(files: FileList) {
    if (files && files.length > 0) {
      const file = files[0];
      // Format from the extension (ignoring a wrapper ".txt", e.g. "molecule.sdf.txt" from iOS),
      // otherwise detected from the content once the file is read.
      const { baseName, format: formatFromName } = structureFormatFromFileName(file.name);
      isFetchingMolecule = true;
      // Read raw bytes: binary ChemDraw (.cdx) files must not go through a text decoder
      file.arrayBuffer().then(
        (buffer) => loadStructureData(buffer, file.name, formatFromName, baseName),
        () => {
          isFetchingMolecule = false;
          showMoleculePopup = true;
        }
      );
    }
  }

  /**
   * Pasting a structure: MDL molfile / SDF text, CDXML (ChemDraw "Copy As > CDXML Text" or
   * "MOL Text") or a copied file. Returns true when the paste was handled.
   */
  function handleStructurePaste(event: ClipboardEvent): boolean {
    const data = event.clipboardData;
    if (!data) return false;
    if (data.files && data.files.length > 0) {
      const { format } = structureFormatFromFileName(data.files[0].name);
      if (format) {
        event.preventDefault();
        handleFiles(data.files);
        return true;
      }
    }
    const text = data.getData('text/plain') || data.getData('text');
    if (!text || !text.includes('\n') && !/^\s*<CDXML/i.test(text)) return false;
    const format = detectStructureFormat(text);
    if (!format) return false;
    event.preventDefault();
    const label = format === 'cdxml' ? 'ChemDraw (pasted)' : 'Pasted structure';
    loadStructureData(text, label, format, 'pasted_structure');
    return true;
  }

  function handleWindowPaste(event: ClipboardEvent) {
    const target = event.target as HTMLElement | null;
    const isEditable = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    // Inside the main search box multi-line structures are handled too; other fields keep their paste
    if (isEditable && target !== searchInputEl) return;
    if (document.querySelector('dialog[open]')) return;
    handleStructurePaste(event);
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
    
    // Resetování specifických hodnot
    multiplicationFactorSpheres = 1.0;
    multiplicationFactorBallAndStick = 1.0;
    multiplicationFactorSticks = 1.0;
    multiplicationFactorCubes = 1.0;

    bondDiameterMultiplicationFactor = 0.4;
    bondQuality = 32;
    groupBondsSeparately = false;
    uniformAtomDiameter = false;
    showMultipleBonds = false;

    jointPreset = 'fdm';
    jointParams = { ...JOINT_PRESETS.fdm };
    jointPreferT = 0.50;
    jointSkipTerminal = true;
    jointsInRings = true;
    jointMmPerUnitSpheres = 10;
    jointMmPerUnitBallAndStick = 10;
    jointMmPerUnitMovingJoints = 20;
    jointMmPerUnitSticks = 10;
    jointMmPerUnitCubes = 10;

    gluedMode = 'radical';
    gluedPriorityOrder = atomCoordinates.length > 0
      ? getDefaultPriorityOrder(atomCoordinates.map((c) => c.atomType))
      : ['C', 'N', 'O', 'H'];
    gluedMergeSameElement = true;
    gluedGap = 0;
    gluedPegHolesEnabled = false;
    gluedPegHoleDiameter = 1.9;
    gluedPegHoleDepth = 3.0;
    gluedExportMode = 'assembled';
    gluedPlateSpacing = 3.0;
    gluedExplodedPercent = 0;
    gluedShowPartLabels = false;
    gluedExportError = null;

    if (browser) {
      localStorage.removeItem('quality');
      
      // Smazání specifických hodnot z localStorage
      localStorage.removeItem('multiplicationFactorSpheres');
      localStorage.removeItem('multiplicationFactorBallAndStick');
      localStorage.removeItem('multiplicationFactorSticks');
      localStorage.removeItem('multiplicationFactorCubes');
      localStorage.removeItem('jointMmPerUnitSpheres');
      localStorage.removeItem('jointMmPerUnitBallAndStick');
      localStorage.removeItem('jointMmPerUnitMovingJoints');
      localStorage.removeItem('jointMmPerUnitSticks');
      localStorage.removeItem('jointMmPerUnitCubes');

      localStorage.removeItem('bondDiameterMultiplicationFactor');
      localStorage.removeItem('bondQuality');
      localStorage.removeItem('groupBondsSeparately');
      localStorage.removeItem('showHydrogens');
      localStorage.removeItem('uniformAtomDiameter');
      localStorage.removeItem('showMultipleBonds');
      localStorage.removeItem('jointPreset');
      localStorage.removeItem('jointParams');
      localStorage.removeItem('jointPreferT');
      localStorage.removeItem('jointSkipTerminal');
      localStorage.removeItem('jointsInRings');
      localStorage.removeItem('jointMmPerUnit');
      localStorage.removeItem('gluedMode');
      localStorage.removeItem('gluedMergeSameElement');
      localStorage.removeItem('gluedGap');
      localStorage.removeItem('gluedPegHolesEnabled');
      localStorage.removeItem('gluedPegHoleDiameter');
      localStorage.removeItem('gluedPegHoleDepth');
      localStorage.removeItem('gluedExportMode');
      localStorage.removeItem('gluedPlateSpacing');
      localStorage.removeItem('gluedShowPartLabels');
    }

    if (atomCoordinates.length > 0) {
      redrawModel(atomCoordinates);
    }
  }

  $: if (browser && settingsLoaded) {
    localStorage.setItem('quality', String(quality));
    
    // Uložení specifických hodnot
    localStorage.setItem('multiplicationFactorSpheres', String(multiplicationFactorSpheres));
    localStorage.setItem('multiplicationFactorBallAndStick', String(multiplicationFactorBallAndStick));
    localStorage.setItem('multiplicationFactorSticks', String(multiplicationFactorSticks));
    localStorage.setItem('multiplicationFactorCubes', String(multiplicationFactorCubes));
    localStorage.setItem('jointMmPerUnitSpheres', String(jointMmPerUnitSpheres));
    localStorage.setItem('jointMmPerUnitBallAndStick', String(jointMmPerUnitBallAndStick));
    localStorage.setItem('jointMmPerUnitMovingJoints', String(jointMmPerUnitMovingJoints));
    localStorage.setItem('jointMmPerUnitSticks', String(jointMmPerUnitSticks));
    localStorage.setItem('jointMmPerUnitCubes', String(jointMmPerUnitCubes));

    localStorage.setItem('bondDiameterMultiplicationFactor', String(bondDiameterMultiplicationFactor));
    localStorage.setItem('bondQuality', String(bondQuality));
    localStorage.setItem('groupBondsSeparately', JSON.stringify(groupBondsSeparately));
    localStorage.setItem('showHydrogens', JSON.stringify(showHydrogens));
    localStorage.setItem('uniformAtomDiameter', JSON.stringify(uniformAtomDiameter));
    localStorage.setItem('showMultipleBonds', JSON.stringify(showMultipleBonds));
    localStorage.setItem('jointPreset', jointPreset);
    localStorage.setItem('jointParams', JSON.stringify(jointParams));
    localStorage.setItem('jointPreferT', String(jointPreferT));
    localStorage.setItem('jointSkipTerminal', JSON.stringify(jointSkipTerminal));
    localStorage.setItem('jointsInRings', JSON.stringify(jointsInRings));
    localStorage.setItem('gluedMode', gluedMode);
    localStorage.setItem('gluedMergeSameElement', JSON.stringify(gluedMergeSameElement));
    localStorage.setItem('gluedGap', String(gluedGap));
    localStorage.setItem('gluedPegHolesEnabled', JSON.stringify(gluedPegHolesEnabled));
    localStorage.setItem('gluedPegHoleDiameter', String(gluedPegHoleDiameter));
    localStorage.setItem('gluedPegHoleDepth', String(gluedPegHoleDepth));
    localStorage.setItem('gluedExportMode', gluedExportMode);
    localStorage.setItem('gluedPlateSpacing', String(gluedPlateSpacing));
    localStorage.setItem('gluedShowPartLabels', JSON.stringify(gluedShowPartLabels));
  }

  let isEditing = false;
  function enableEditing() { isEditing = true; }
  function disableEditing() { isEditing = false; }

  // Server renders the settings collapsed too (the client default), so hydration does not shift the layout (CLS).
  let isCollapsed = typeof window === 'undefined' || localStorage.getItem('menuCollapsed') !== 'false';
  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    localStorage.setItem('menuCollapsed', isCollapsed.toString());
    setTimeout(() => {
      if (typeof resizeCanvas === "function") {
        resizeCanvas();
      }
    }, 350);
  }

  let isJointMenuCollapsed = typeof window !== 'undefined' && localStorage.getItem('jointMenuCollapsed') === 'true';
  function toggleJointMenuCollapse() {
    isJointMenuCollapsed = !isJointMenuCollapsed;
    if (browser) {
      localStorage.setItem('jointMenuCollapsed', isJointMenuCollapsed.toString());
    }
    setTimeout(() => {
      if (typeof resizeCanvas === "function") {
        resizeCanvas();
      }
    }, 350);
  }

  function isIOS() {
    return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  let photoSaved = false;
  let photoSavedTimer: ReturnType<typeof setTimeout> | null = null;

  function saveCanvasAsImage() {
    if (atomCoordinates.length === 0) {
      showMoleculePopup = true;
      return;
    }
    if (isFetchingMolecule || gluedWorkerProgress.running) {
      return;
    }
    updateFileName();
    const blob = takeScreenshotBlob();
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = buildPhotoDownloadFileName(fileName);
      link.href = objectUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      photoSaved = true;
      if (photoSavedTimer) clearTimeout(photoSavedTimer);
      photoSavedTimer = setTimeout(() => {
        photoSaved = false;
      }, 1500);
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
    if (inputStr !== lastSuccessfulInput) {
      isReloadMode = false;
    }
  }

  $: activeFaqItems = HOME_FAQ[normalizeLocale($currentLocale)];
  const faqDetailsAttrs: Record<string, string> = { name: 'home-faq' };
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} on:paste={handleWindowPaste} />

<div
  class="full-page-drop-zone"
  class:dragging={isDragging}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
>
  <div class="container mt-4 main-panel main-content">
    <h1 class="visually-hidden">{$_('seo_home_h1')}</h1>
    <div class="row main-layout-row">
      <div class="col-md-8 left-panel">
        <search class="d-flex mb-3 align-items-center main-search-bar">
          <div class="input-group">
            <input
              type="text"
              bind:value={inputStr}
              bind:this={searchInputEl}
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
                  class="btn-close me-1"
                  aria-label="Clear"
                  on:click={() => {
                    inputStr = '';
                    isReloadMode = false;
                  }}
                ></button>
              {/if}
              <button
                type="button"
                class="btn btn-icon"
                on:click={() => showAdvancedSearch = true}
                aria-label={$_('adv_search_title')}
              >
                <span class="material-symbols-outlined" aria-hidden="true">settings</span>
              </button>
            </div>

            <!-- Menu musí být v DOM vždy: Bootstrap si při prvním kliknutí uloží referenci na něj a později přidané menu by bez reloadu nenašel -->
            <ul
              class="dropdown-menu"
              class:d-none={searchHistory.length === 0}
              id="searchDropdown"
              aria-labelledby="dropdownMenuButton"
            >
              {#if searchHistory.length > 0}
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
              {/if}
            </ul>
          </div>

          <div class="search-action-item">
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
            class="btn btn-primary button-with-icon d-flex align-items-center main-search-line search-action-item"
            class:btn-warning={isReloadMode}
            type="button"
          >
            <span class="material-symbols-outlined">
              {isReloadMode ? 'refresh' : 'downloading'}
            </span>
            {isReloadMode ? $_('reload_data_button') : $_('fetch_data_button')}
          </button>
        </search>

        {#if !$isOnline}
          <div class="alert alert-warning d-flex align-items-center gap-2 py-2 px-3 mb-3 small" role="status">
            <span class="material-symbols-outlined flex-shrink-0" style="font-size: 20px; margin-right: 0;" aria-hidden="true">cloud_off</span>
            <span class="flex-grow-1">
              {$_('offline_search_notice')}
              <a href={`${buildLocalizedPath('/tutorials', $currentLocale)}#offline-pwa`} class="alert-link fw-normal text-nowrap">{$_('offline_more_info')}</a>
            </span>
          </div>
        {/if}

        {#if sharedSettingsNotice}
          <div class="alert alert-info alert-dismissible d-flex align-items-center gap-2 py-2 px-3 mb-3 small" role="status">
            <span class="material-symbols-outlined flex-shrink-0" style="font-size: 20px; margin-right: 0;">tune</span>
            <span class="flex-grow-1">{$_('shared_settings_applied_notice')}</span>
            <button
              type="button"
              class="btn-close position-static p-1 ms-2"
              aria-label={$_('close_popup') || 'Close'}
              on:click={() => (sharedSettingsNotice = false)}
            ></button>
          </div>
        {/if}

        <table class="table table-borderless molecule-info-table">
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
                  {#if (moleculeSource === 'pubchem' || (determineInputType(inputStr) === "CID" && !moleculeSource)) && !isFileUploaded}
                    <a
                      href="https://pubchem.ncbi.nlm.nih.gov/compound/{tableInfo.secondItem}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pubchem-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else if (moleculeSource === 'pdb' || (determineInputType(inputStr) === "PDB" && !moleculeSource)) && !isFileUploaded}
                    <a
                      href="https://www.rcsb.org/structure/{tableInfo.secondItem}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pdb-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else if moleculeSource === 'ccd' && !isFileUploaded}
                    <a
                      href="https://www.rcsb.org/ligand/{tableInfo.secondItem}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pdb-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else if moleculeSource === 'cod' && !isFileUploaded}
                    <a
                      href="https://www.crystallography.net/cod/{tableInfo.secondItem}.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="pubchem-link"
                    >
                      {tableInfo.secondItem}
                    </a>
                  {:else}
                    {tableInfo.secondItem}
                  {/if}
                {/if}
              </td>
              <td>{tableInfo.thirdItem}</td>
              <td rowspan="2" class="molecule-image-cell">
                {#if imageUrl}
                  <img
                    src={imageUrl}
                    alt={tableInfo.firstItem ? `2D structure of ${tableInfo.firstItem}` : 'Structure preview'}
                    class="img-fluid"
                    on:error={() => { imageUrl = ''; }}
                  />
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
              <div class="d-flex align-items-center gap-2 flex-grow-1">
                <select
                  class="form-select flex-grow-1"
                  id="model-generator"
                  bind:value={selectedGenerator}>
                  {#each modelGenerators as generator}
                    <option value={generator.func}>{generator.name}</option>
                  {/each}
                </select>
                {#if isMovingJointsStyle || isGluedSpheresStyle}
                  <span class="beta-badge" title="Beta feature">BETA</span>
                {/if}
              </div>
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
                    <label for="qualityRange" class="me-2 text-nowrap section-label mb-0">
                      <span>{$_('quality_slider')}</span>
                      {#if isEditing}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          bind:value={quality}
                          on:blur={disableEditing}
                          class="ms-1"
                          style="width: 3em; text-align: center;">
                      {:else}
                        <button
                          type="button"
                          on:click={enableEditing}
                          class="editable-button ms-1">
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
                      class="btn btn-link btn-lg ms-1 p-1"
                      title={$_('reset_settings_to_default')}
                      aria-label={$_('reset_settings_to_default')}
                    >
                      <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 28px;">restart_alt</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr>
                <td colspan="2">
                  <div class="row g-4 mt-1 align-items-start">
                    <!-- Left column: Numeric parameters -->
                    <div class="col-md-6">
                      <div class="d-flex flex-column gap-3">
                        <div>
                          <label for="jointMmPerUnit" class="form-label d-flex justify-content-between align-items-baseline mb-1">
                            <span>{$_('joint_scale_label')}</span>
                            <small class="text-muted fw-normal">
                              {isMovingJointsStyle ? ($_('joint_scale_help_moving_joints') || 'Default: 20 mm = 1 Å') : $_('joint_scale_help')}
                            </small>
                          </label>
                          <div class="input-group">
                            {#if isMovingJointsStyle}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitMovingJoints}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {:else if isSpheresBasedStyle}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitSpheres}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {:else if selectedGenerator === createBallAndStickMesh}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitBallAndStick}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {:else if selectedGenerator === createStickMesh}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitSticks}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {:else if selectedGenerator === createCubeMesh}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitCubes}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {:else}
                              <input
                                type="number"
                                id="jointMmPerUnit"
                                class="form-control"
                                bind:value={jointMmPerUnitSpheres}
                                min="1"
                                max="50"
                                step="0.5"
                              />
                            {/if}
                            <span class="input-group-text">mm/Å</span>
                          </div>
                        </div>

                        {#if isSpheresBasedStyle}
                          <div>
                            <label for="multiplicationFactorSpheres" class="form-label mb-1">{$_('multiplication_factor')}</label>
                            <input type="number" id="multiplicationFactorSpheres" bind:value={multiplicationFactorSpheres} step="0.1" min="0.1" class="form-control">
                          </div>
                        {/if}
                        
                        {#if isBallAndStickStyle}
                          <div>
                            <label for="multiplicationFactorBallAndStick" class="form-label mb-1">{$_('multiplication_factor')}</label>
                            <input type="number" id="multiplicationFactorBallAndStick" bind:value={multiplicationFactorBallAndStick} step="0.1" min="0.1" class="form-control">
                          </div>
                        {/if}

                        {#if selectedGenerator === createStickMesh}
                          <div>
                            <label for="multiplicationFactorSticks" class="form-label mb-1">{$_('multiplication_factor')}</label>
                            <input type="number" id="multiplicationFactorSticks" bind:value={multiplicationFactorSticks} step="0.1" min="0.1" class="form-control">
                          </div>
                        {/if}
                        
                        {#if selectedGenerator === createCubeMesh}
                          <div>
                            <label for="multiplicationFactorCubes" class="form-label mb-1">{$_('multiplication_factor')}</label>
                            <input type="number" id="multiplicationFactorCubes" bind:value={multiplicationFactorCubes} step="0.1" min="0.1" class="form-control">
                          </div>
                        {/if}

                        {#if isBallAndStickStyle}
                          <div>
                            <label for="bondDiameterFactor" class="form-label mb-1">{$_('bond_diameter_factor')}</label>
                            <input type="number" id="bondDiameterFactor" bind:value={bondDiameterMultiplicationFactor} step="0.1" min="0.1" class="form-control">
                          </div>
                          <div>
                            <label for="bondQuality" class="form-label mb-1">{$_('bond_quality')}</label>
                            <input type="number" id="bondQuality" bind:value={bondQuality} step="1" min="10" class="form-control">
                          </div>
                        {/if}
                      </div>
                    </div>

                    <!-- Right column: Checkboxes -->
                    <div class="col-md-6">
                      <div class="settings-checkbox-group p-3 rounded border d-flex flex-column gap-3">
                        <div class="form-check mb-0">
                          <input class="form-check-input" type="checkbox" id="hydrogensCheckbox" bind:checked={showHydrogens}>
                          <label class="form-check-label" for="hydrogensCheckbox">{$_('hydrogens_checbox')}</label>
                        </div>

                        {#if isBallAndStickStyle}
                          <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="groupBondsSeparatelyCheckBox" bind:checked={groupBondsSeparately}>
                            <label class="form-check-label" for="groupBondsSeparatelyCheckBox">{$_('bonds_checbox')}</label>
                          </div>
                        {/if}
                        {#if isBallAndStickStyle || isGluedSpheresStyle}
                          <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="uniformAtomDiameterCheckbox" bind:checked={uniformAtomDiameter}>
                            <label class="form-check-label" for="uniformAtomDiameterCheckbox">{$_('uniform_atom_diameter_checkbox')}</label>
                          </div>
                        {/if}
                        {#if isBallAndStickStyle}
                          <div class="form-check mb-0">
                            <input class="form-check-input" type="checkbox" id="showMultipleBondsCheckbox" bind:checked={showMultipleBonds}>
                            <label class="form-check-label" for="showMultipleBondsCheckbox">{$_('show_multiple_bonds_checkbox') || 'Show Multiple Bonds'}</label>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>

                  {#if isMovingJointsStyle}
                    <div class="moving-joints-panel mt-4 p-3 rounded border">
                      <!-- BETA Banner -->
                      <div class="moving-joints-beta-banner alert d-flex align-items-start gap-3 p-3 mb-3 shadow-sm rounded" role="alert">
                        <span class="material-symbols-outlined beta-banner-icon flex-shrink-0" style="font-size: 28px; line-height: 1;">science</span>
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <strong class="beta-banner-title">{$_('moving_joints_beta_banner_title')}</strong>
                            <span class="beta-badge">BETA</span>
                          </div>
                          <p class="mb-0 small beta-banner-desc">
                            {$_('moving_joints_beta_banner_text')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="moving-joints-header-btn w-100 d-flex align-items-center justify-content-between p-0 border-0 bg-transparent text-start"
                        on:click={toggleJointMenuCollapse}
                        aria-expanded={!isJointMenuCollapsed}
                        aria-controls="collapseMovingJoints"
                      >
                        <span class="fw-bold d-flex align-items-center gap-2">
                          <span class="material-symbols-outlined">settings_motion_mode</span>
                          {$_('moving_joints_settings_title')}
                          <span class="beta-badge">BETA</span>
                        </span>
                        <span class="material-symbols-outlined google-font-darkmode" style="font-size: 28px; line-height: 1;">
                          {isJointMenuCollapsed ? 'arrow_drop_down' : 'arrow_drop_up'}
                        </span>
                      </button>

                      <div class={isJointMenuCollapsed ? 'collapse' : 'mt-3 pt-3 border-top'} id="collapseMovingJoints">
                        <!-- 3a: Základní nastavení -->
                        <div class="row g-3">
                          <div class="col-md-12">
                            <label for="jointPresetSelect" class="form-label mb-1">{$_('joint_preset_label')}</label>
                            <select
                              id="jointPresetSelect"
                              class="form-select"
                              value={jointPreset}
                              on:change={(e) => selectJointPreset(e.currentTarget.value)}
                            >
                              <option value="fdm">{$_('joint_preset_fdm')}</option>
                              <option value="sla">{$_('joint_preset_sla')}</option>
                            </select>
                          </div>

                          <div class="col-md-6">
                            <label for="jointClearanceRange" class="form-label mb-1 d-flex justify-content-between">
                              <span>{$_('joint_clearance_label')} <span class="param-symbol">(c)</span></span>
                              <span class="fw-semibold">{jointParams.c.toFixed(2)} mm</span>
                            </label>
                            <div class="d-flex align-items-center gap-2">
                              <input
                                type="range"
                                id="jointClearanceRange"
                                class="form-range flex-grow-1"
                                min="0.10"
                                max="0.50"
                                step="0.05"
                                bind:value={jointParams.c}
                              />
                              <input
                                type="number"
                                id="jointClearanceNumber"
                                class="form-control"
                                style="width: 5.5rem;"
                                min="0.10"
                                max="0.50"
                                step="0.05"
                                bind:value={jointParams.c}
                                aria-label={$_('joint_clearance_aria')}
                              />
                            </div>
                          </div>

                          <div class="col-md-6">
                            <label for="jointPreferTRange" class="form-label mb-1 d-flex justify-content-between">
                              <span>{$_('joint_position_label')} <span class="param-symbol">(preferT)</span></span>
                              <span class="fw-semibold">{jointPreferT.toFixed(2)}</span>
                            </label>
                            <div class="d-flex align-items-center gap-2">
                              <input
                                type="range"
                                id="jointPreferTRange"
                                class="form-range flex-grow-1"
                                min="0.20"
                                max="0.80"
                                step="0.05"
                                bind:value={jointPreferT}
                              />
                              <input
                                type="number"
                                id="jointPreferTNumber"
                                class="form-control"
                                style="width: 5.5rem;"
                                min="0.20"
                                max="0.80"
                                step="0.05"
                                bind:value={jointPreferT}
                                aria-label={$_('joint_position_aria')}
                              />
                            </div>
                            <small class="text-muted d-block mt-1">
                              {$_('joint_position_help')}
                            </small>
                          </div>

                          <div class="col-md-6">
                            <div class="form-check">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                id="skipTerminalCheckbox"
                                bind:checked={jointSkipTerminal}
                              />
                              <label class="form-check-label" for="skipTerminalCheckbox">
                                {$_('joint_skip_terminal_label')}
                              </label>
                            </div>
                          </div>

                          <div class="col-md-6">
                            <div class="form-check">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                id="jointsInRingsCheckbox"
                                bind:checked={jointsInRings}
                              />
                              <label class="form-check-label" for="jointsInRingsCheckbox">
                                {$_('joint_in_rings_label')}
                              </label>
                              <small class="text-muted d-block">
                                {$_('joint_in_rings_help')}
                              </small>
                            </div>
                          </div>
                        </div>

                        <!-- Poznámka o zvětšení kloubu podle tyčinky -->
                        {#if isJointEnlargedByRod}
                          <div class="alert alert-info py-2 px-3 mt-3 mb-0 small">
                            {$_('joint_enlarged_by_rod_note')} {effectiveJointParams.R.toFixed(2)} mm
                          </div>
                        {/if}

                        <!-- Živý výpis varování z checkJointParams(p) -->
                        {#if jointWarnings.length > 0}
                          <div class="alert alert-warning py-2 px-3 mt-3 mb-0 small" role="alert">
                            <strong>{$_('joint_warnings_title')}</strong>
                            <ul class="mb-0 ps-3 mt-1">
                              {#each jointWarnings as warning}
                                <li>{warning}</li>
                              {/each}
                            </ul>
                          </div>
                        {/if}

                        <!-- Statistika po vygenerování modelu -->
                        {#if movingJointsStats}
                          <div class="joint-stats-box mt-3 p-2 rounded border small">
                            <div>
                              {$_('joint_stats_inserted_prefix')} <strong>{movingJointsStats.insertedCount}</strong> {$_('joint_stats_inserted_middle')} <strong>{movingJointsStats.eligibleSingleBondsCount}</strong> {$_('joint_stats_inserted_suffix')}
                              {#if movingJointsStats.skippedCount > 0}
                                <strong>{movingJointsStats.skippedCount}</strong> {$_('joint_stats_skipped_suffix')}
                              {/if}
                            </div>
                            {#if movingJointsStats.skippedCount > 0}
                              <details class="mt-1">
                                <summary class="cursor-pointer fw-semibold">
                                  {$_('joint_stats_show_skipped')} ({movingJointsStats.skippedBonds.length})
                                </summary>
                                <div class="mt-1 text-muted">
                                  {movingJointsStats.skippedBonds.join(', ')}
                                </div>
                              </details>
                            {/if}
                          </div>
                        {/if}

                        <!-- 3b: Rozbalovací sekce Pokročilé parametry kloubu (ve výchozím stavu sbaleno) -->
                        <details class="mt-3 joint-details">
                          <summary class="fw-semibold cursor-pointer">
                            {$_('joint_advanced_title')}
                          </summary>
                          <div class="mt-3">
                            <div class="row g-3">
                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamR" class="form-label small fw-semibold mb-1" title={$_('joint_param_R_title')}>
                                  {$_('joint_param_R_label')} <span class="param-symbol">(R, mm)</span>
                                </label>
                                <input type="number" id="jointParamR" class="form-control form-control-sm" min="1.5" max="10" step="0.1" bind:value={jointParams.R} title={$_('joint_param_R_title')} />
                                <small class="text-muted d-block">{$_('joint_param_R_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamRs" class="form-label small fw-semibold mb-1" title={$_('joint_param_rs_title')}>
                                  {$_('joint_param_rs_label')} <span class="param-symbol">(rs, mm)</span>
                                </label>
                                <input type="number" id="jointParamRs" class="form-control form-control-sm" min="0.6" max="6" step="0.1" bind:value={jointParams.rs} title={$_('joint_param_rs_title')} />
                                <small class="text-muted d-block">{$_('joint_param_rs_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamRh" class="form-label small fw-semibold mb-1" title={$_('joint_param_rh_title')}>
                                  {$_('joint_param_rh_label')} <span class="param-symbol">(rh, mm)</span>
                                </label>
                                <input type="number" id="jointParamRh" class="form-control form-control-sm" min="1.0" max="8" step="0.1" bind:value={jointParams.rh} title={$_('joint_param_rh_title')} />
                                <small class="text-muted d-block">{$_('joint_param_rh_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamNeck" class="form-label small fw-semibold mb-1" title={$_('joint_param_neck_title')}>
                                  {$_('joint_param_neck_label')} <span class="param-symbol">(neck, mm)</span>
                                </label>
                                <input type="number" id="jointParamNeck" class="form-control form-control-sm" min="0.6" max="5" step="0.1" bind:value={jointParams.neck} title={$_('joint_param_neck_title')} />
                                <small class="text-muted d-block">{$_('joint_param_neck_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamWall" class="form-label small fw-semibold mb-1" title={$_('joint_param_wall_title')}>
                                  {$_('joint_param_wall_label')} <span class="param-symbol">(wall, mm)</span>
                                </label>
                                <input type="number" id="jointParamWall" class="form-control form-control-sm" min="0.5" max="4" step="0.1" bind:value={jointParams.wall} title={$_('joint_param_wall_title')} />
                                <small class="text-muted d-block">{$_('joint_param_wall_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamTopLen" class="form-label small fw-semibold mb-1" title={$_('joint_param_topLen_title')}>
                                  {$_('joint_param_topLen_label')} <span class="param-symbol">(topLen, mm)</span>
                                </label>
                                <input type="number" id="jointParamTopLen" class="form-control form-control-sm" min="0.2" max="5" step="0.1" bind:value={jointParams.topLen} title={$_('joint_param_topLen_title')} />
                                <small class="text-muted d-block">{$_('joint_param_topLen_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamRadialSegments" class="form-label small fw-semibold mb-1" title={$_('joint_param_radialSegments_title')}>
                                  {$_('joint_param_radialSegments_label')} <span class="param-symbol">(radialSegments)</span>
                                </label>
                                <input type="number" id="jointParamRadialSegments" class="form-control form-control-sm" min="24" max="128" step="4" bind:value={jointParams.radialSegments} title={$_('joint_param_radialSegments_title')} />
                                <small class="text-muted d-block">{$_('joint_param_radialSegments_help')}</small>
                              </div>

                              <div class="col-md-3 col-sm-6">
                                <label for="jointParamArcSegments" class="form-label small fw-semibold mb-1" title={$_('joint_param_arcSegments_title')}>
                                  {$_('joint_param_arcSegments_label')} <span class="param-symbol">(arcSegments)</span>
                                </label>
                                <input type="number" id="jointParamArcSegments" class="form-control form-control-sm" min="2" max="16" step="1" bind:value={jointParams.arcSegments} title={$_('joint_param_arcSegments_title')} />
                                <small class="text-muted d-block">{$_('joint_param_arcSegments_help')}</small>
                              </div>
                            </div>

                            <!-- Živě počítaná délka a průměr kloubu -->
                            <div class="mt-3 p-2 rounded bg-light-subtle border small d-flex flex-wrap gap-3 align-items-center justify-content-between">
                              <div>
                                <strong>{$_('joint_total_length_label')}</strong> {calculatedJointLength.toFixed(2)} mm
                                &nbsp;|&nbsp;
                                <strong>{$_('joint_diameter_label')}</strong> {calculatedJointDiameter.toFixed(2)} mm
                                <span class="text-muted ms-1">
                                  ({$_('joint_min_free_bond_prefix')} {calculatedJointLength.toFixed(1)} mm)
                                </span>
                              </div>
                              <div class="d-flex gap-2">
                                <button type="button" class="btn btn-sm btn-outline-secondary" on:click={resetJointParamsToPreset}>
                                  {$_('joint_reset_preset_button')}
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-primary" on:click={handleDownloadTestJoint}>
                                  {$_('joint_download_test_stl_button')}
                                </button>
                              </div>
                            </div>

                            <!-- Inline SVG schéma řezu kloubem -->
                            <div class="mt-3 text-center">
                              <svg
                                viewBox="0 0 420 230"
                                class="joint-diagram-svg img-fluid rounded border p-2"
                                role="img"
                                aria-label={$_('joint_svg_aria_label')}
                              >
                                <defs>
                                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                    <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" />
                                  </marker>
                                </defs>
                                <!-- Osa rotace +Y (vodorovně zleva doprava: strana A dole vlevo -> strana B nahoře vpravo) -->
                                <line x1="25" y1="125" x2="395" y2="125" stroke="#888" stroke-dasharray="5,4" stroke-width="1.2" />
                                <text x="30" y="142" font-size="10" fill="currentColor">{$_('joint_svg_side_a')}</text>
                                <text x="315" y="142" font-size="10" fill="currentColor">{$_('joint_svg_side_b')}</text>

                                <!-- Stator (modrošedý profil nad osou) -->
                                <polygon
                                  points="60,125 60,35 280,35 225,90 185,90 140,45 95,90 95,125"
                                  fill="#4a90e2"
                                  fill-opacity="0.28"
                                  stroke="#2b6cb0"
                                  stroke-width="1.8"
                                />
                                <text x="72" y="52" font-size="11" font-weight="bold" fill="#2b6cb0">STATOR</text>

                                <!-- Rotor (oranžový profil nad osou s mezerou c) -->
                                <polygon
                                  points="105,125 140,57 177,98 232,98 292,35 335,35 335,125"
                                  fill="#ed8936"
                                  fill-opacity="0.32"
                                  stroke="#c05621"
                                  stroke-width="1.8"
                                />
                                <text x="275" y="55" font-size="11" font-weight="bold" fill="#c05621">ROTOR</text>

                                <!-- Kóta R (vnější poloměr) -->
                                <line x1="48" y1="125" x2="48" y2="35" stroke="currentColor" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <text x="28" y="83" font-size="11" font-weight="bold" fill="currentColor">R</text>

                                <!-- Kóta rh (poloměr hlavy) -->
                                <line x1="140" y1="125" x2="140" y2="57" stroke="#c05621" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <text x="144" y="95" font-size="11" font-weight="bold" fill="#c05621">rh</text>

                                <!-- Kóta rs (poloměr hřídele) -->
                                <line x1="205" y1="125" x2="205" y2="98" stroke="#c05621" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <text x="209" y="115" font-size="11" font-weight="bold" fill="#c05621">rs</text>

                                <!-- Kóta wall (dno statoru) -->
                                <line x1="60" y1="160" x2="95" y2="160" stroke="currentColor" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <line x1="60" y1="125" x2="60" y2="165" stroke="#999" stroke-width="0.8" />
                                <line x1="95" y1="125" x2="95" y2="165" stroke="#999" stroke-width="0.8" />
                                <text x="66" y="175" font-size="11" font-weight="bold" fill="currentColor">wall</text>

                                <!-- Kóta c (vůle mezi kužely) -->
                                <line x1="95" y1="115" x2="105" y2="115" stroke="#d97706" stroke-width="1.5" />
                                <text x="97" y="108" font-size="11" font-weight="bold" fill="#d97706">c</text>

                                <!-- Kóta neck (délka krku hřídele) -->
                                <line x1="181" y1="160" x2="229" y2="160" stroke="currentColor" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <line x1="181" y1="98" x2="181" y2="165" stroke="#999" stroke-width="0.8" />
                                <line x1="229" y1="98" x2="229" y2="165" stroke="#999" stroke-width="0.8" />
                                <text x="192" y="175" font-size="11" font-weight="bold" fill="currentColor">neck</text>

                                <!-- Kóta topLen (přesah rotoru) -->
                                <line x1="292" y1="20" x2="335" y2="20" stroke="currentColor" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
                                <line x1="292" y1="35" x2="292" y2="15" stroke="#999" stroke-width="0.8" />
                                <line x1="335" y1="35" x2="335" y2="15" stroke="#999" stroke-width="0.8" />
                                <text x="296" y="14" font-size="11" font-weight="bold" fill="currentColor">topLen</text>

                                <!-- Popisek 45° kuželů -->
                                <text x="210" y="205" text-anchor="middle" font-size="10" fill="currentColor">
                                  {$_('joint_svg_caption')}
                                </text>
                              </svg>
                            </div>
                          </div>
                        </details>

                        <!-- 3c: Rozbalovací upozornění Jak tisknout klouby (ve výchozím stavu rozbaleno) -->
                        <details open class="mt-3 joint-details joint-print-guide p-2 rounded border">
                          <summary class="fw-semibold cursor-pointer">
                            {$_('joint_print_guide_title')}
                          </summary>
                          <ul class="mt-2 mb-0 ps-3 small">
                            <li class="mb-1">
                              <strong>{$_('joint_print_guide_supports_bold')}</strong> {$_('joint_print_guide_supports_text')}
                            </li>
                            <li class="mb-1">
                              <strong>{$_('joint_print_guide_shells_bold')}</strong> {$_('joint_print_guide_shells_text')}
                            </li>
                            <li class="mb-1">
                              <strong>FDM:</strong> {$_('joint_print_guide_fdm_text')}
                            </li>
                            <li>
                              <strong>SLA:</strong> {$_('joint_print_guide_sla_text')}
                            </li>
                          </ul>
                        </details>
                      </div>
                    </div>
                  {/if}

                  {#if isGluedSpheresStyle}
                    <div class="moving-joints-panel mt-4 p-3 rounded border">
                      <!-- BETA Banner -->
                      <div class="moving-joints-beta-banner alert d-flex align-items-start gap-3 p-3 mb-3 shadow-sm rounded" role="alert">
                        <span class="material-symbols-outlined beta-banner-icon flex-shrink-0" style="font-size: 28px; line-height: 1;">science</span>
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <strong class="beta-banner-title">{$_('glued_spheres_beta_banner_title')}</strong>
                            <span class="beta-badge">BETA</span>
                          </div>
                          <p class="mb-0 small beta-banner-desc">
                            {$_('glued_spheres_beta_banner_text')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="moving-joints-header-btn w-100 d-flex align-items-center justify-content-between p-0 border-0 bg-transparent text-start"
                        on:click={toggleGluedMenuCollapse}
                        aria-expanded={!isGluedMenuCollapsed}
                        aria-controls="collapseGluedSpheres"
                      >
                        <span class="fw-bold d-flex align-items-center gap-2">
                          <span class="material-symbols-outlined">extension</span>
                          {$_('glued_spheres_settings_title')}
                          <span class="beta-badge">BETA</span>
                        </span>
                        <span class="material-symbols-outlined google-font-darkmode" style="font-size: 28px; line-height: 1;">
                          {isGluedMenuCollapsed ? 'arrow_drop_down' : 'arrow_drop_up'}
                        </span>
                      </button>

                      <div class={isGluedMenuCollapsed ? 'collapse' : 'mt-3 pt-3 border-top'} id="collapseGluedSpheres">
                        <div class="row g-3">
                          <!-- Režim řezání (A: Radikální roviny / B: Odečítání podle priority) -->
                          <div class="col-md-6">
                            <label for="gluedModeSelect" class="form-label mb-1">{$_('glued_spheres_mode_label')}</label>
                            <select
                              id="gluedModeSelect"
                              class="form-select"
                              bind:value={gluedMode}
                              on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                            >
                              <option value="radical">{$_('glued_spheres_mode_radical')}</option>
                              <option value="priority">{$_('glued_spheres_mode_priority')}</option>
                            </select>
                          </div>

                          <!-- Režim exportu (Složeno / Rozloženo na podložku) -->
                          <div class="col-md-6">
                            <label for="gluedExportModeSelect" class="form-label mb-1">{$_('glued_spheres_export_mode_label')}</label>
                            <select
                              id="gluedExportModeSelect"
                              class="form-select"
                              bind:value={gluedExportMode}
                            >
                              <option value="assembled">{$_('glued_spheres_export_assembled')}</option>
                              <option value="plate">{$_('glued_spheres_export_plate')}</option>
                            </select>
                          </div>

                          <!-- Pořadí priorit prvků (jen Režim B) -->
                          {#if gluedMode === 'priority'}
                            <div class="col-md-12">
                              <span class="form-label d-block mb-1">{$_('glued_spheres_priority_label')}</span>
                              <small class="text-muted d-block mb-2">{$_('glued_spheres_priority_help')}</small>
                              <div class="d-flex flex-wrap gap-2 align-items-center">
                                {#each gluedPriorityOrder as el, idx (el)}
                                  <div class="d-inline-flex align-items-center gap-1 px-2 py-1 rounded border bg-body">
                                    <span class="badge bg-secondary">{idx + 1}.</span>
                                    <strong class="mx-1">{el}</strong>
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-outline-secondary py-0 px-1"
                                      disabled={idx === 0}
                                      title={$_('glued_spheres_move_up')}
                                      aria-label={$_('glued_spheres_move_up')}
                                      on:click={() => {
                                        movePriorityElement(idx, -1);
                                        if (atomCoordinates.length > 0) redrawModel(atomCoordinates);
                                      }}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-outline-secondary py-0 px-1"
                                      disabled={idx === gluedPriorityOrder.length - 1}
                                      title={$_('glued_spheres_move_down')}
                                      aria-label={$_('glued_spheres_move_down')}
                                      on:click={() => {
                                        movePriorityElement(idx, 1);
                                        if (atomCoordinates.length > 0) redrawModel(atomCoordinates);
                                      }}
                                    >
                                      ↓
                                    </button>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}

                          <!-- Tolerance / mezera (gap, 0 - 0.3 mm) -->
                          <div class="col-md-6">
                            <label for="gluedGapRange" class="form-label mb-1 d-flex justify-content-between">
                              <span>{$_('glued_spheres_gap_label')}</span>
                              <span class="fw-semibold">{gluedGap.toFixed(2)} mm</span>
                            </label>
                            <div class="d-flex align-items-center gap-2">
                              <input
                                type="range"
                                id="gluedGapRange"
                                class="form-range flex-grow-1"
                                min="0"
                                max="0.30"
                                step="0.01"
                                bind:value={gluedGap}
                                on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                              />
                              <input
                                type="number"
                                id="gluedGapNumber"
                                class="form-control"
                                style="width: 5.5rem;"
                                min="0"
                                max="0.30"
                                step="0.01"
                                bind:value={gluedGap}
                                on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                              />
                            </div>
                            <small class="text-muted d-block mt-1">{$_('glued_spheres_gap_help')}</small>
                          </div>

                          <!-- Rozestup dílů na podložce (mm) -->
                          <div class="col-md-6">
                            <label for="gluedPlateSpacingInput" class="form-label mb-1">{$_('glued_spheres_plate_spacing_label')}</label>
                            <div class="input-group">
                              <input
                                type="number"
                                id="gluedPlateSpacingInput"
                                class="form-control"
                                min="0.5"
                                max="25"
                                step="0.5"
                                bind:value={gluedPlateSpacing}
                              />
                              <span class="input-group-text">mm</span>
                            </div>
                          </div>

                          <!-- Spojit sousedící atomy stejného prvku do jednoho dílu -->
                          <div class="col-md-12">
                            <div class="form-check">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                id="gluedMergeSameElementCheckbox"
                                bind:checked={gluedMergeSameElement}
                                on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                              />
                              <label class="form-check-label" for="gluedMergeSameElementCheckbox">
                                {$_('glued_spheres_merge_same_element_label')}
                              </label>
                            </div>
                          </div>

                          <!-- Díry pro kolík (jen Režim A) -->
                          {#if gluedMode === 'radical'}
                            <div class="col-md-12">
                              <div class="form-check">
                                <input
                                  class="form-check-input"
                                  type="checkbox"
                                  id="gluedPegHolesCheckbox"
                                  bind:checked={gluedPegHolesEnabled}
                                  on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                                />
                                <label class="form-check-label" for="gluedPegHolesCheckbox">
                                  {$_('glued_spheres_peg_holes_label')}
                                </label>
                              </div>
                            </div>

                            {#if gluedPegHolesEnabled}
                              <div class="col-md-6">
                                <label for="gluedPegDiameterInput" class="form-label mb-1">{$_('glued_spheres_peg_diameter_label')}</label>
                                <div class="input-group input-group-sm">
                                  <input
                                    type="number"
                                    id="gluedPegDiameterInput"
                                    class="form-control"
                                    min="1.0"
                                    max="5.0"
                                    step="0.05"
                                    bind:value={gluedPegHoleDiameter}
                                    on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                                  />
                                  <span class="input-group-text">mm</span>
                                </div>
                              </div>

                              <div class="col-md-6">
                                <label for="gluedPegDepthInput" class="form-label mb-1">{$_('glued_spheres_peg_depth_label')}</label>
                                <div class="input-group input-group-sm">
                                  <input
                                    type="number"
                                    id="gluedPegDepthInput"
                                    class="form-control"
                                    min="1.0"
                                    max="15.0"
                                    step="0.5"
                                    bind:value={gluedPegHoleDepth}
                                    on:change={() => { if (atomCoordinates.length > 0) redrawModel(atomCoordinates); }}
                                  />
                                  <span class="input-group-text">mm</span>
                                </div>
                              </div>
                            {/if}
                          {/if}

                          <!-- Náhled: Exploded view posuvník (0–100 %) a popisky ID dílů -->
                          <div class="col-md-6">
                            <label for="gluedExplodedRange" class="form-label mb-1 d-flex justify-content-between">
                              <span>{$_('glued_spheres_exploded_label')}</span>
                              <span class="fw-semibold">{gluedExplodedPercent}%</span>
                            </label>
                            <input
                              type="range"
                              id="gluedExplodedRange"
                              class="form-range w-100"
                              min="0"
                              max="100"
                              step="1"
                              bind:value={gluedExplodedPercent}
                            />
                            <small class="text-muted d-block mt-1">{$_('glued_spheres_exploded_help')}</small>
                          </div>

                          <div class="col-md-6 d-flex align-items-center">
                            <div class="form-check mt-2">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                id="gluedShowLabelsCheckbox"
                                bind:checked={gluedShowPartLabels}
                              />
                              <label class="form-check-label" for="gluedShowLabelsCheckbox">
                                {$_('glued_spheres_show_labels_label')}
                              </label>
                            </div>
                          </div>
                        </div>

                        <!-- Průběh výpočtu ve Web Workeru -->
                        {#if gluedWorkerProgress.running}
                          <div class="alert alert-info py-2 px-3 mt-3 mb-0 small" role="status">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <span>{$_('glued_spheres_progress_prefix')}</span>
                              <strong>{gluedWorkerProgress.completed} / {gluedWorkerProgress.total} {$_('glued_spheres_progress_atoms')}</strong>
                            </div>
                            <div class="progress" style="height: 6px;">
                              <div
                                class="progress-bar progress-bar-striped progress-bar-animated"
                                role="progressbar"
                                style="width: {gluedWorkerProgress.total > 0 ? Math.round((gluedWorkerProgress.completed / gluedWorkerProgress.total) * 100) : 0}%;"
                              ></div>
                            </div>
                          </div>
                        {/if}

                        <!-- Upozornění na velkou molekulu (>2000 atomů) -->
                        {#if atomCoordinates.length > LARGE_MOLECULE_ATOM_THRESHOLD || gluedSpheresStats?.largeMoleculeWarning}
                          <div class="alert alert-warning py-2 px-3 mt-3 mb-0 small" role="alert">
                            {$_('glued_spheres_large_molecule_warning')}
                          </div>
                        {/if}

                        <!-- Chyba při kontrole manifold před exportem -->
                        {#if gluedExportError}
                          <div class="alert alert-danger py-2 px-3 mt-3 mb-0 small" role="alert">
                            {gluedExportError}
                          </div>
                        {/if}

                        <!-- Statistika vygenerovaných dílů -->
                        {#if gluedSpheresStats}
                          <div class="joint-stats-box mt-3 p-2 rounded border small">
                            <div>
                              {$_('glued_spheres_stats_parts_prefix')} <strong>{gluedSpheresStats.generatedPartsCount}</strong> / <strong>{gluedSpheresStats.totalAtoms}</strong> {$_('glued_spheres_stats_parts_suffix')}
                            </div>
                          </div>

                          <!-- Panel varování: pohlcené atomy, díly < 2 mm, přeskočené díry, duplicitní atomy, non-manifold -->
                          {#if gluedSpheresStats.swallowedAtoms.length > 0 || gluedSpheresStats.smallParts.length > 0 || gluedSpheresStats.skippedPegHoles.length > 0 || gluedSpheresStats.duplicateAtoms.length > 0 || gluedSpheresStats.nonManifoldParts.length > 0}
                            <div class="alert alert-warning py-2 px-3 mt-3 mb-0 small" role="alert">
                              <strong>{$_('glued_spheres_warnings_title')}</strong>
                              <ul class="mb-0 ps-3 mt-1">
                                {#if gluedSpheresStats.swallowedAtoms.length > 0}
                                  <li>
                                    <strong>{$_('glued_spheres_warning_swallowed')} ({gluedSpheresStats.swallowedAtoms.length}):</strong>
                                    {gluedSpheresStats.swallowedAtoms.join(', ')}
                                  </li>
                                {/if}
                                {#if gluedSpheresStats.smallParts.length > 0}
                                  <li>
                                    <strong>{$_('glued_spheres_warning_small')} ({gluedSpheresStats.smallParts.length}):</strong>
                                    {gluedSpheresStats.smallParts.join(', ')}
                                  </li>
                                {/if}
                                {#if gluedSpheresStats.skippedPegHoles.length > 0}
                                  <li>
                                    <strong>{$_('glued_spheres_warning_skipped_holes')} ({gluedSpheresStats.skippedPegHoles.length}):</strong>
                                    <details class="mt-1">
                                      <summary class="cursor-pointer fw-semibold">
                                        {gluedSpheresStats.skippedPegHoles.length}
                                      </summary>
                                      <div class="mt-1 text-muted">
                                        {gluedSpheresStats.skippedPegHoles.join('; ')}
                                      </div>
                                    </details>
                                  </li>
                                {/if}
                                {#if gluedSpheresStats.duplicateAtoms.length > 0}
                                  <li>
                                    <strong>{$_('glued_spheres_warning_duplicates')} ({gluedSpheresStats.duplicateAtoms.length}):</strong>
                                    {gluedSpheresStats.duplicateAtoms.join(', ')}
                                  </li>
                                {/if}
                                {#if gluedSpheresStats.nonManifoldParts.length > 0}
                                  <li class="text-danger">
                                    <strong>{$_('glued_spheres_warning_non_manifold')} ({gluedSpheresStats.nonManifoldParts.length}):</strong>
                                    {gluedSpheresStats.nonManifoldParts.join(', ')}
                                  </li>
                                {/if}
                              </ul>
                            </div>
                          {/if}
                        {/if}
                      </div>
                    </div>
                  {/if}
                </td>
              </tr>

              <tr>
                <td colspan="2" class="pt-4">
                  <div class="d-flex gap-2">
                    <button on:click={downloadWholeModel} class="btn btn-info btn-lg w-100 d-flex align-items-center justify-content-center gap-2">
                      <span class="material-symbols-outlined">deployed_code_update</span>
                      {$_('download_whole_model_button')}
                    </button>
                    <button on:click={downloadSourceFile} class="btn btn-secondary btn-lg w-100 d-flex align-items-center justify-content-center gap-2">
                      <span class="material-symbols-outlined">download</span>
                      {$_('download_template_button')}
                    </button>
                  </div>
                  {#if isGluedSpheresStyle}
                    <button on:click={downloadModel} class="btn btn-outline-secondary w-100 mt-2 d-flex align-items-center justify-content-center gap-2">
                      <span class="material-symbols-outlined" style="display: inline-flex; align-items: center; justify-content: center; line-height: 1;">deployed_code_update</span>
                      <span>{$_('download_model_button_3mf')}</span>
                    </button>
                  {:else}
                    <button on:click={downloadModelZip} class="btn btn-outline-secondary w-100 mt-2 d-flex align-items-center justify-content-center gap-2">
                      <span class="material-symbols-outlined" style="display: inline-flex; align-items: center; justify-content: center; line-height: 1;">folder_zip</span>
                      <span>{$_('download_model_button_zip')}</span>
                    </button>
                  {/if}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <br>

        <div class="d-flex gap-2 align-items-stretch model-action-row">
          {#if isGluedSpheresStyle}
            <button on:click={downloadModelZip} class="btn btn-success btn-lg flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-2">
              <span class="material-symbols-outlined">folder_zip</span>
              {$_('download_model_button_zip')}
            </button>
          {:else}
            <button on:click={downloadModel} class="btn btn-success btn-lg flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-2">
              <span class="material-symbols-outlined">deployed_code_update</span>
              {$_('download_model_button_3mf')}
            </button>
          {/if}

          <div class="slicer-dropdown-wrapper flex-shrink-0" bind:this={slicerWrapperEl}>
            <div class="slicer-split-group shadow-sm">
              <button
                type="button"
                class="btn btn-lg slicer-main-btn d-flex align-items-center gap-2"
                title={$_(selectedSlicer.labelKey) || selectedSlicer.fallbackLabel}
                disabled={isOpeningSlicer}
                on:click={() => openInSlicer(selectedSlicer.id)}
              >
                <img class="slicer-icon dark" src={selectedSlicer.darkIcon} alt={selectedSlicer.alt} width="16" height="16" />
                <img class="slicer-icon light" src={selectedSlicer.lightIcon} alt={selectedSlicer.alt} width="16" height="16" />
                <span class="slicer-trigger-label">{$_('slice_button') || 'Slice'}</span>
              </button>
              <button
                type="button"
                class="btn btn-lg slicer-arrow-btn d-flex align-items-center justify-content-center"
                aria-expanded={showSlicerMenu}
                aria-label={$_('open_in_slicer') || 'Select slicer'}
                title={$_('open_in_slicer') || 'Select slicer'}
                disabled={isOpeningSlicer}
                on:click={() => (showSlicerMenu = !showSlicerMenu)}
              >
                <svg
                  class="slicer-chevron"
                  class:open={showSlicerMenu}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            {#if showSlicerMenu}
              <div class="slicer-floating-popover">
                <div class="slicer-popover-arrow"></div>
                <div class="slicer-dropdown-menu">
                  {#each slicerOptions as slicer (slicer.id)}
                    <button
                      type="button"
                      class="btn slicer-option-button"
                      class:selected={slicer.id === selectedSlicerId}
                      on:click={() => selectAndOpenSlicer(slicer.id)}
                    >
                      <img class="slicer-icon dark" src={slicer.darkIcon} alt={slicer.alt} width="16" height="16" />
                      <img class="slicer-icon light" src={slicer.lightIcon} alt={slicer.alt} width="16" height="16" />
                      <span>{$_(slicer.labelKey) || slicer.fallbackLabel}</span>
                    </button>
                  {/each}
                  <PrusaSlicerPluginNote variant="compact" />
                </div>
              </div>
            {/if}
          </div>

          <div class="share-popover-wrapper flex-shrink-0" bind:this={shareWrapperEl}>
            {#if showSharePopover}
              <div class="share-floating-popover" role="dialog" aria-label={$_('share_url_label') || 'Shareable link'}>
                <div class="share-popover-card">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="share-popover-title fw-semibold small">
                      {$_('share_url_label') || 'Shareable link'}
                    </span>
                    <button
                      type="button"
                      class="btn-close share-popover-close"
                      aria-label={$_('close_popup') || 'Close'}
                      on:click={() => (showSharePopover = false)}
                    ></button>
                  </div>
                  <div class="input-group input-group-sm">
                    <input
                      type="text"
                      readonly
                      class="form-control share-url-input"
                      value={displayedShareUrl}
                      bind:this={shareInputEl}
                      on:click={(e) => e.currentTarget.select()}
                      aria-label={$_('share_url_label') || 'Shareable link'}
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary d-flex align-items-center gap-1 share-popover-copy-btn"
                      class:copied={shareCopied}
                      on:click={copyShareLink}
                      title={$_('share_button_title') || 'Copy'}
                    >
                      <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 0;">
                        {shareCopied ? 'check' : 'content_copy'}
                      </span>
                      <span>{shareCopied ? ($_('share_copied') || 'Copied!') : ($_('share_copy_button') || 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <div class="share-popover-arrow"></div>
              </div>
            {/if}

            <button
              type="button"
              class="btn btn-lg share-action-btn shadow-sm d-flex align-items-center justify-content-center h-100"
              class:copied={shareCopied}
              aria-expanded={showSharePopover}
              on:click={handleShareButtonClick}
              title={shareCopied ? ($_('share_copied') || 'Copied!') : ($_('share_button_title') || 'Share')}
              aria-label={shareCopied ? ($_('share_copied') || 'Copied!') : ($_('share_button_title') || 'Share')}
            >
              <span class="material-symbols-outlined share-btn-icon">
                {shareCopied ? 'check' : 'share'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-4 preview-column">
        <div class="canvas-container" class:canvas-dark={canvasDark} id="canvasContainer">
          {#if atomCoordinates.length > 0 && hoveredAtom}
            <div class="canvas-hover-tag">
              <span
                class="legend-color-dot"
                style="background-color: {hoveredAtom.colorHex};"
                aria-hidden="true"
              ></span>
              {#if hoveredAtom.partName}
                <span class="canvas-hover-symbol">{hoveredAtom.partName}</span>
                <span class="canvas-hover-meta">({hoveredAtom.atomType})</span>
              {:else}
                <span class="canvas-hover-symbol">{hoveredAtom.atomType}</span>
                {#if hoveredAtom.atomId !== undefined}
                  <span class="canvas-hover-meta">#{hoveredAtom.atomId + 1}</span>
                {/if}
                {#if hoveredAtom.dimensionMm !== undefined}
                  <span class="canvas-hover-meta">
                    · {hoveredAtom.isCube ? '□' : 'Ø'} {hoveredAtom.dimensionMm.toFixed(1)} mm
                  </span>
                {/if}
              {/if}
            </div>
          {/if}

          <div class="canvas-controls">
            {#if atomCoordinates.length > 0}
              <button
                type="button"
                class="btn canvas-tool-btn"
                on:click={handleResetCameraView}
                title={$_('canvas_reset_view')}
                aria-label={$_('canvas_reset_view')}
              >
                <span class="material-symbols-outlined canvas-control" aria-hidden="true">center_focus_strong</span>
              </button>
              <button
                type="button"
                class="btn canvas-tool-btn"
                class:active={autoRotate}
                aria-pressed={autoRotate}
                on:click={handleToggleAutoRotate}
                title={$_('canvas_auto_rotate')}
                aria-label={$_('canvas_auto_rotate')}
              >
                <span class="material-symbols-outlined canvas-control" aria-hidden="true">360</span>
              </button>
              <button
                type="button"
                class="btn canvas-tool-btn"
                class:active={showBuildPlate}
                aria-pressed={showBuildPlate}
                on:click={handleToggleBuildPlate}
                title={$_('canvas_build_plate')}
                aria-label={$_('canvas_build_plate')}
              >
                <span class="material-symbols-outlined canvas-control" aria-hidden="true">grid_on</span>
              </button>
            {/if}
            <button
              type="button"
              class="btn canvas-tool-btn"
              class:copied={photoSaved}
              on:click={saveCanvasAsImage}
              title={$_('canvas_save_image')}
              aria-label={$_('canvas_save_image')}
            >
              <span class="material-symbols-outlined canvas-control" aria-hidden="true">
                {photoSaved ? 'check' : 'photo_camera'}
              </span>
            </button>
            <button
              type="button"
              class="btn canvas-tool-btn"
              class:active={isCanvasFullscreen}
              aria-pressed={isCanvasFullscreen}
              on:click={toggleCanvasFullscreen}
              title={$_('canvas_fullscreen')}
              aria-label={$_('canvas_fullscreen')}
            >
              <span class="material-symbols-outlined canvas-control" aria-hidden="true">
                {isCanvasFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>

          <canvas
            id="threeCanvas"
            class="border rounded"
            on:dblclick={handleResetCameraView}
            on:pointermove={handleCanvasPointerMove}
            on:pointerleave={handleCanvasPointerLeave}
          ></canvas>

          {#if atomCoordinates.length === 0 && !isFetchingMolecule && !gluedWorkerProgress.running}
            <div class="canvas-empty-state">
              <div class="canvas-empty-title">{$_('canvas_empty_title')}</div>
              <p class="canvas-empty-hint">{$_('canvas_empty_hint')}</p>
              <div class="canvas-sample-list">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary canvas-sample-btn"
                  on:click={() => loadMoleculeFromSource('pubchem', '2519', { saveToHistory: true })}
                >
                  {$_('canvas_sample_caffeine')}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary canvas-sample-btn"
                  on:click={() => loadMoleculeFromSource('pubchem', '2244', { saveToHistory: true })}
                >
                  {$_('canvas_sample_aspirin')}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary canvas-sample-btn"
                  on:click={() => loadMoleculeFromSource('pubchem', '962', { saveToHistory: true })}
                >
                  {$_('canvas_sample_water')}
                </button>
              </div>
            </div>
          {/if}

          {#if isFetchingMolecule || gluedWorkerProgress.running}
            <div class="canvas-loading-overlay">
              <div class="canvas-loading-card">
                <div class="canvas-loading-label">
                  {#if gluedWorkerProgress.running}
                    {$_('glued_spheres_progress_prefix')} ({gluedWorkerProgress.completed}/{gluedWorkerProgress.total})
                  {:else}
                    {$_('canvas_loading_molecule')}
                  {/if}
                </div>
                {#if gluedWorkerProgress.running && gluedWorkerProgress.total > 0}
                  <progress
                    class="canvas-progress"
                    value={gluedWorkerProgress.completed}
                    max={gluedWorkerProgress.total}
                  ></progress>
                {:else}
                  <progress class="canvas-progress"></progress>
                {/if}
              </div>
            </div>
          {/if}

          {#if atomCoordinates.length > 0 && (elementGroups.length > 0 || modelBoundsMm)}
            <div class="canvas-hud-bottom">
              {#if elementGroups.length > 0}
                <div class="canvas-element-legend">
                  {#each elementGroups as item (item.key)}
                    <button
                      type="button"
                      class="canvas-legend-chip"
                      class:muted={!item.visible}
                      aria-pressed={item.visible}
                      title={$_('canvas_legend_toggle_hint')}
                      aria-label="{item.atomType === 'Bonds' ? $_('canvas_bonds_group') : item.atomType} ({item.count})"
                      on:click={() => handleToggleElementGroup(item.key)}
                    >
                      <span
                        class="legend-color-dot"
                        style="background-color: {item.colorHex};"
                        aria-hidden="true"
                      ></span>
                      <span class="legend-symbol">
                        {item.atomType === 'Bonds' ? $_('canvas_bonds_group') : item.atomType}
                      </span>
                      <span class="legend-count">{item.count}</span>
                    </button>
                  {/each}
                  {#if hasHiddenElementGroups}
                    <button
                      type="button"
                      class="canvas-legend-chip canvas-legend-reset"
                      on:click={handleShowAllElementGroups}
                    >
                      {$_('canvas_legend_show_all')}
                    </button>
                  {/if}
                </div>
              {/if}

              {#if modelBoundsMm}
                <div
                  class="canvas-dimensions-badge"
                  class:exceeds={modelBoundsMm.exceedsStandardPlate}
                  title={modelBoundsMm.exceedsStandardPlate ? $_('canvas_dimensions_exceeds') : $_('canvas_dimensions_label')}
                >
                  {#if modelBoundsMm.exceedsStandardPlate}
                    <span class="material-symbols-outlined canvas-badge-icon" aria-hidden="true">warning</span>
                  {/if}
                  <span>
                    {Math.round(modelBoundsMm.widthMm)} × {Math.round(modelBoundsMm.depthMm)} × {Math.round(modelBoundsMm.heightMm)} mm
                  </span>
                </div>
              {/if}
            </div>
          {/if}
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
        {#if moleculePopupOffline}
          <span class="material-symbols-outlined" style="color: #e53935; font-size: 48px;">cloud_off</span>
          <div style="margin-top: 10px; font-weight: bold;">
            {$_('offline_search_notice')}
          </div>
        {:else}
          <span class="material-symbols-outlined" style="color: #e53935; font-size: 48px;">warning</span>
          <div style="margin-top: 10px; font-weight: bold;">
            {$_('no_molecule_found') || 'No molecule found for the provided input.'}
          </div>
        {/if}
        <button class="btn btn-warning mt-3" on:click={() => showMoleculePopup = false}>
          {$_('close_popup') || 'Close'}
        </button>
      </div>
    </div>
  {/if}
</div>

<div class="container seo-overview-section mt-3 text-center">
  <details class="seo-overview-disclosure">
    <summary
      class="btn btn-outline-secondary seo-disclosure-trigger shadow-sm"
      title={$_('seo_toggle_label')}
      aria-label={$_('seo_toggle_label')}
    >
      <span class="material-symbols-outlined seo-disclosure-icon" aria-hidden="true">info</span>
      <span class="visually-hidden">{$_('seo_toggle_label')}</span>
    </summary>

    <div class="seo-overview-body pt-4 mt-3 border-top text-start">
      <div class="seo-overview-header mb-4">
        <h2 class="h4 fw-semibold mb-2">{$_('seo_overview_title')}</h2>
        <p class="text-muted mb-3">{$_('seo_overview_lead')}</p>
        <div class="d-flex flex-wrap gap-3 small">
          <a href={buildLocalizedPath('/tutorials', $currentLocale)} class="seo-inline-link">
            {$_('seo_link_tutorials')} →
          </a>
          <a href={buildLocalizedPath('/about', $currentLocale)} class="seo-inline-link">
            {$_('seo_link_about')} →
          </a>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="seo-feature-card h-100 p-3 rounded border">
            <h3 class="h6 fw-semibold mb-2">{$_('seo_feature_databases_title')}</h3>
            <p class="small text-muted mb-0">{$_('seo_feature_databases_desc')}</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="seo-feature-card h-100 p-3 rounded border">
            <h3 class="h6 fw-semibold mb-2">{$_('seo_feature_styles_title')}</h3>
            <p class="small text-muted mb-0">{$_('seo_feature_styles_desc')}</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="seo-feature-card h-100 p-3 rounded border">
            <h3 class="h6 fw-semibold mb-2">{$_('seo_feature_export_title')}</h3>
            <p class="small text-muted mb-0">{$_('seo_feature_export_desc')}</p>
          </div>
        </div>
      </div>

      <div class="seo-faq-block">
        <h2 class="h5 fw-semibold mb-3">{$_('seo_faq_title')}</h2>
        <div class="d-flex flex-column gap-2">
          {#each activeFaqItems as item (item.question)}
            <details {...faqDetailsAttrs} class="seo-faq-item rounded border">
              <summary class="seo-faq-summary fw-semibold px-3 py-2">{item.question}</summary>
              <p class="small text-muted px-3 pb-3 pt-1 mb-0">{item.answer}</p>
            </details>
          {/each}
        </div>
      </div>
    </div>
  </details>
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
  <a href={buildLocalizedPath('/tutorials', $currentLocale)}>{@html $_('infobox_moreinfo')}</a>
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
.molecule-image-cell {
  width: 200px;
}
@media (max-width: 575.98px) {
  /* Telefon: vyhledávání na celou šířku, tlačítka Upload/Fetch pod ním vedle sebe */
  .main-search-bar {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }
  .main-search-bar > .input-group {
    flex: 1 1 100%;
  }
  .main-search-bar > .search-action-item {
    flex: 1 1 40%;
    min-width: 0;
  }
  .main-search-bar > div.search-action-item {
    display: flex;
  }
  .main-search-bar > div.search-action-item > .main-search-line {
    flex: 1 1 auto;
  }
  .main-search-bar .search-action-item.main-search-line,
  .main-search-bar .search-action-item > .main-search-line {
    justify-content: center;
    text-align: center;
    line-height: 1.15;
    height: 52px;
  }
  .main-search-bar .main-search-line.form-control {
    height: 52px;
    margin-right: 0 !important;
  }
  /* Tabulka s informacemi: menší obrázek, dlouhé názvy se zalomí */
  .molecule-info-table {
    font-size: 0.875rem;
  }
  .molecule-info-table th,
  .molecule-info-table td {
    padding: 0.35rem 0.25rem;
  }
  .molecule-info-table th {
    white-space: nowrap;
  }
  .molecule-info-table td {
    overflow-wrap: anywhere;
  }
  .molecule-info-table td:first-child {
    width: auto !important;
  }
  .molecule-info-table td:nth-child(2) {
    white-space: nowrap;
    overflow-wrap: normal;
  }
  .molecule-image-cell {
    width: 110px;
  }
  .molecule-image-cell .image-placeholder {
    width: 100px;
    height: 100px;
    font-size: 12px;
  }
  /* Akční tlačítka: Download přes celou šířku, Slice + Share pod ním */
  .model-action-row {
    flex-wrap: wrap;
  }
  .model-action-row > .btn-success {
    flex: 1 1 100% !important;
  }
  .model-action-row > .slicer-dropdown-wrapper {
    flex: 1 1 auto !important;
  }
  .model-action-row .slicer-split-group,
  .model-action-row .slicer-main-btn {
    flex: 1 1 auto;
    justify-content: center;
  }
  .model-action-row .share-action-btn {
    height: auto !important;
    width: 52px;
  }
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
  inline-size: 100%;
  min-inline-size: 0;
  aspect-ratio: 1 / 1;
  max-block-size: calc(100dvh - 2rem);
  border-radius: 0.375rem;
  color-scheme: light;
  background-color: #ffffff;
  overflow: hidden;
  --canvas-surface: rgba(248, 249, 250, 0.92);
  --canvas-surface-hover: #e9ecef;
  --canvas-border: #dee2e6;
  --canvas-text: #212529;
  --canvas-text-muted: #6c757d;
  --canvas-accent-bg: rgba(13, 110, 253, 0.1);
  --canvas-accent-border: rgba(13, 110, 253, 0.45);
  --canvas-accent-text: #0d6efd;
  --canvas-focus-ring: #0d6efd;
}
.canvas-container.canvas-dark {
  color-scheme: dark;
  background-color: #212529;
  --canvas-surface: rgba(43, 48, 53, 0.92);
  --canvas-surface-hover: #343a40;
  --canvas-border: #495057;
  --canvas-text: #f8f9fa;
  --canvas-text-muted: #adb5bd;
  --canvas-accent-bg: rgba(13, 110, 253, 0.22);
  --canvas-accent-border: #6ea8fe;
  --canvas-accent-text: #6ea8fe;
  --canvas-focus-ring: #6ea8fe;
}
:global(html.dark) .canvas-container #threeCanvas,
.canvas-container.canvas-dark #threeCanvas {
  border-color: #495057 !important;
}
@media (min-width: 768px) {
  .main-layout-row {
    display: flex;
    flex-direction: row;
  }
  .left-panel {
    align-self: flex-start;
    min-inline-size: 0;
  }
  .preview-column {
    align-self: stretch;
    min-inline-size: 0;
  }
  .canvas-container {
    position: sticky;
    inset-block-start: 1rem;
    max-block-size: calc(100dvh - 2rem);
  }
}
@media (max-width: 767.98px) {
  .main-layout-row {
    display: flex;
    flex-direction: column;
  }
  .left-panel,
  .preview-column {
    min-inline-size: 0;
  }
  .preview-column {
    margin-block-start: 2rem;
  }
}
.canvas-container:fullscreen,
.canvas-container:-webkit-full-screen {
  position: relative;
  inset-block-start: 0;
  inline-size: 100dvw;
  block-size: 100dvh;
  max-block-size: none;
  aspect-ratio: auto;
  border-radius: 0;
  padding: 0;
  background-color: #ffffff;
}
.canvas-container.canvas-dark:fullscreen,
.canvas-container.canvas-dark:-webkit-full-screen {
  background-color: #212529;
}
.canvas-container:fullscreen #threeCanvas,
.canvas-container:-webkit-full-screen #threeCanvas {
  border: none !important;
  border-radius: 0 !important;
}
.canvas-container:fullscreen .canvas-controls,
.canvas-container:-webkit-full-screen .canvas-controls {
  inset-block-start: 16px;
  inset-inline-end: 16px;
}
.canvas-container:fullscreen .canvas-hover-tag,
.canvas-container:-webkit-full-screen .canvas-hover-tag {
  inset-block-start: 16px;
  inset-inline-start: 16px;
}
.canvas-container:fullscreen .canvas-hud-bottom,
.canvas-container:-webkit-full-screen .canvas-hud-bottom {
  inset-block-end: 16px;
  inset-inline: 16px;
}
.canvas-controls {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}
.canvas-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-inline-size: 28px;
  min-block-size: 28px;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--canvas-text-muted);
  box-shadow: none;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.canvas-tool-btn:hover {
  background-color: var(--canvas-surface-hover);
  border-color: transparent;
  color: var(--canvas-text);
}
.canvas-tool-btn:active {
  background-color: var(--canvas-surface-hover);
  box-shadow: none;
}
.canvas-tool-btn.active {
  background-color: var(--canvas-accent-bg);
  border-color: var(--canvas-accent-border);
  color: var(--canvas-accent-text);
}
.canvas-tool-btn.copied {
  border-color: #198754;
  background-color: #ecfdf3;
  color: #146c43;
}
.canvas-container.canvas-dark .canvas-tool-btn.copied {
  border-color: #2ea043;
  background-color: rgba(46, 160, 67, 0.18);
  color: #7ee787;
}
.canvas-tool-btn:focus-visible,
.canvas-legend-chip:focus-visible,
.canvas-sample-btn:focus-visible {
  box-shadow: none;
  outline: 2px solid var(--canvas-focus-ring);
  outline-offset: 2px;
}
.canvas-controls .material-symbols-outlined {
  font-size: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.material-symbols-outlined.canvas-control {
  margin: 0;
  padding: 0;
  display: inline-block;
}
.canvas-hover-tag {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-start: 8px;
  z-index: 10;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-inline-size: calc(100% - 224px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 8px;
  min-block-size: 26px;
  border-radius: 0.25rem;
  background-color: var(--canvas-surface);
  border: 1px solid var(--canvas-border);
  color: var(--canvas-text);
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.2;
}
.canvas-hover-symbol {
  font-weight: 400;
}
.canvas-hover-meta {
  color: var(--canvas-text-muted);
  font-weight: 300;
}
.canvas-hud-bottom {
  position: absolute;
  inset-block-end: 8px;
  inset-inline: 8px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  pointer-events: none;
}
.canvas-element-legend {
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-inline-size: 100%;
}
.canvas-legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  min-block-size: 24px;
  border-radius: 0.25rem;
  border: 1px solid var(--canvas-border);
  background-color: var(--canvas-surface);
  color: var(--canvas-text);
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}
.canvas-legend-chip:hover {
  background-color: var(--canvas-surface-hover);
  border-color: #adb5bd;
}
.canvas-container.canvas-dark .canvas-legend-chip:hover {
  border-color: #6c757d;
}
.canvas-legend-chip.muted {
  opacity: 0.45;
  text-decoration: line-through;
}
.canvas-legend-reset {
  border-color: var(--canvas-accent-border);
  color: var(--canvas-accent-text);
  text-decoration: none;
}
.legend-color-dot {
  inline-size: 9px;
  block-size: 9px;
  border-radius: 50%;
  border: 1px solid rgba(33, 37, 41, 0.25);
  flex-shrink: 0;
}
.canvas-container.canvas-dark .legend-color-dot {
  border-color: rgba(248, 249, 250, 0.35);
}
.legend-symbol {
  font-weight: 400;
}
.legend-count {
  color: var(--canvas-text-muted);
  font-weight: 300;
  font-size: 0.74rem;
}
.canvas-dimensions-badge {
  pointer-events: auto;
  margin-inline-start: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  min-block-size: 24px;
  border-radius: 0.25rem;
  background-color: var(--canvas-surface);
  border: 1px solid var(--canvas-border);
  color: var(--canvas-text-muted);
  font-size: 0.78rem;
  font-weight: 300;
  line-height: 1.2;
  white-space: nowrap;
}
.canvas-dimensions-badge.exceeds {
  background-color: #fff9db;
  border-color: #ffe066;
  color: #664d03;
  font-weight: 400;
}
.canvas-container.canvas-dark .canvas-dimensions-badge.exceeds {
  background-color: rgba(255, 193, 7, 0.14);
  border-color: rgba(255, 193, 7, 0.35);
  color: #ffda6a;
}
.canvas-badge-icon {
  font-size: 15px;
  margin: 0;
  line-height: 1;
  color: #e67700;
}
.canvas-container.canvas-dark .canvas-badge-icon {
  color: #ffc107;
}
.canvas-empty-state {
  position: absolute;
  inset: 44px 16px 16px 16px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  pointer-events: none;
}
.canvas-empty-title {
  font-size: 1rem;
  font-weight: 400;
  color: var(--canvas-text);
  margin-block-end: 0.3rem;
}
.canvas-empty-hint {
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--canvas-text-muted);
  max-inline-size: 30ch;
  line-height: 1.4;
  margin-block-end: 0.85rem;
}
.canvas-sample-list {
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
.canvas-sample-btn {
  font-weight: 300;
  font-size: 0.82rem;
  border-color: var(--canvas-border);
  color: var(--canvas-text);
  background-color: transparent;
}
.canvas-sample-btn:hover {
  background-color: var(--canvas-surface-hover);
  border-color: #adb5bd;
  color: var(--canvas-text);
}
.canvas-container.canvas-dark .canvas-sample-btn {
  border-color: #495057;
  color: #f8f9fa;
}
.canvas-container.canvas-dark .canvas-sample-btn:hover {
  background-color: #343a40;
  border-color: #6c757d;
  color: #ffffff;
}
.canvas-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(33, 37, 41, 0.08);
  pointer-events: none;
}
.canvas-container.canvas-dark .canvas-loading-overlay {
  background-color: rgba(0, 0, 0, 0.28);
}
.canvas-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0.65rem 1rem;
  border-radius: 0.375rem;
  background-color: var(--canvas-surface);
  border: 1px solid var(--canvas-border);
  color: var(--canvas-text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-inline-size: 90%;
}
.canvas-loading-label {
  font-size: 0.85rem;
  font-weight: 300;
  text-align: center;
}
.canvas-progress {
  inline-size: min(180px, 60vw);
  block-size: 6px;
  accent-color: var(--canvas-accent-text);
}
.canvas-container.canvas-dark .canvas-progress {
  accent-color: var(--canvas-accent-text);
}
@media (pointer: coarse) {
  .canvas-tool-btn {
    min-inline-size: 34px;
    min-block-size: 34px;
  }
  .canvas-legend-chip {
    min-block-size: 30px;
    padding: 3px 9px;
  }
  .canvas-sample-btn {
    min-block-size: 34px;
    padding: 0.3rem 0.65rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .canvas-tool-btn,
  .canvas-legend-chip,
  .canvas-sample-btn,
  .popup-overlay,
  .popup-content,
  .slicer-chevron {
    transition: none;
    animation: none;
  }
}
#threeCanvas {
  position: absolute;
  inset: 0;
  display: block;
  inline-size: 100%;
  block-size: 100%;
  touch-action: none;
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
/* Bootstrap (.input-group > .dropdown-toggle:nth-last-child(n+3)) jinak při vykreslené historii (dropdown-menu) odstraní pravé zaoblení */
.input-group > .main-search-line.form-control {
  border-radius: var(--bs-border-radius-lg) !important;
}

/* Styly pro Printables-style dělené tlačítko "Slice" a rozbalovací nabídku slicerů */
.slicer-dropdown-wrapper {
  position: relative;
  display: flex;
}

.slicer-split-group {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid #d0d5dd;
  border-radius: 0.5rem;
  background-color: #ffffff;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.slicer-split-group:hover,
.slicer-split-group:focus-within {
  border-color: #adb5bd;
}

.slicer-main-btn,
.slicer-arrow-btn {
  background-color: transparent;
  color: #212529;
  border: none;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.slicer-main-btn {
  padding: 0.5rem 0.75rem 0.5rem 0.9rem;
}

.slicer-arrow-btn {
  padding: 0.5rem 0.55rem;
  border-left: 1px solid #e4e7ec;
}

.slicer-main-btn:hover,
.slicer-main-btn:focus-visible,
.slicer-arrow-btn:hover,
.slicer-arrow-btn:focus-visible {
  background-color: #f2f4f7;
  color: #212529;
}

.slicer-chevron {
  transition: transform 0.2s ease;
}

.slicer-chevron.open {
  transform: rotate(180deg);
}

.slicer-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.slicer-icon.dark {
  display: none;
}

.slicer-icon.light {
  display: inline-block;
}

:global(html.dark) .slicer-icon.light {
  display: none;
}

:global(html.dark) .slicer-icon.dark {
  display: inline-block;
}

.slicer-floating-popover {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 1060;
  width: max-content;
}

.slicer-popover-arrow {
  position: absolute;
  top: -7px;
  right: 11px;
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border-left: 1px solid #c5c5c5;
  border-top: 1px solid #c5c5c5;
  transform: rotate(45deg);
  z-index: 1;
}

.slicer-dropdown-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #c5c5c5;
  border-radius: 4px;
  padding: 0.35rem 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  min-width: 220px;
}

.slicer-option-button {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #212529;
  font-size: 0.95rem;
  font-weight: 400;
  text-align: left;
  white-space: nowrap;
  transition: background-color 0.12s ease;
}

.slicer-option-button.selected {
  font-weight: 600;
  background-color: #f8f9fa;
}

.slicer-option-button:hover,
.slicer-option-button:focus-visible {
  background-color: #f2f4f7;
  color: #111;
}

:global(html.dark) .slicer-split-group {
  background-color: #2b3035;
  border-color: #495057;
}

:global(html.dark) .slicer-split-group:hover,
:global(html.dark) .slicer-split-group:focus-within {
  border-color: #6c757d;
}

:global(html.dark) .slicer-main-btn,
:global(html.dark) .slicer-arrow-btn {
  color: #f8f9fa;
}

:global(html.dark) .slicer-arrow-btn {
  border-left-color: #495057;
}

:global(html.dark) .slicer-main-btn:hover,
:global(html.dark) .slicer-main-btn:focus-visible,
:global(html.dark) .slicer-arrow-btn:hover,
:global(html.dark) .slicer-arrow-btn:focus-visible {
  background-color: #343a40;
  color: #ffffff;
}

:global(html.dark) .slicer-dropdown-menu {
  background-color: #2b3035;
  border-color: #495057;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

:global(html.dark) .slicer-popover-arrow {
  background-color: #2b3035;
  border-left-color: #495057;
  border-top-color: #495057;
}

:global(html.dark) .slicer-option-button {
  color: #f8f9fa;
}

:global(html.dark) .slicer-option-button.selected {
  background-color: #343a40;
}

:global(html.dark) .slicer-option-button:hover,
:global(html.dark) .slicer-option-button:focus-visible {
  background-color: #3b4248;
  color: #ffffff;
}

.share-popover-wrapper {
  position: relative;
  display: flex;
}

.share-floating-popover {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  z-index: 1065;
  width: min(430px, calc(100vw - 2rem));
}

.share-popover-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #c5c5c5;
  border-radius: 0.5rem;
  padding: 0.75rem 0.85rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
  z-index: 2;
}

.share-popover-arrow {
  position: absolute;
  bottom: -6px;
  right: 18px;
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border-right: 1px solid #c5c5c5;
  border-bottom: 1px solid #c5c5c5;
  transform: rotate(45deg);
  z-index: 3;
}

.share-popover-title {
  color: #212529;
}

.share-popover-close {
  font-size: 0.7rem;
}

.share-url-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  background-color: #f8f9fa;
  color: #212529;
}

.share-popover-copy-btn.copied {
  border-color: #198754;
  background-color: #ecfdf3;
  color: #146c43;
}

.share-action-btn {
  border: 1px solid #d0d5dd;
  border-radius: 0.5rem;
  background-color: #ffffff;
  color: #212529;
  aspect-ratio: 1 / 1;
  min-width: 48px;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.share-action-btn:hover,
.share-action-btn:focus-visible {
  background-color: #f2f4f7;
  border-color: #adb5bd;
  color: #212529;
}

.share-action-btn.copied {
  border-color: #198754;
  background-color: #ecfdf3;
  color: #146c43;
}

.share-btn-icon {
  margin-right: 0;
  font-size: 20px;
}

:global(html.dark) .share-popover-card {
  background-color: #2b3035;
  border-color: #495057;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

:global(html.dark) .share-popover-arrow {
  background-color: #2b3035;
  border-right-color: #495057;
  border-bottom-color: #495057;
}

:global(html.dark) .share-popover-title {
  color: #f8f9fa;
}

:global(html.dark) .share-popover-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}

:global(html.dark) .share-url-input {
  background-color: #1b1f22;
  border-color: #495057;
  color: #f8f9fa;
}

:global(html.dark) .share-popover-copy-btn {
  border-color: #495057;
  color: #f8f9fa;
}

:global(html.dark) .share-popover-copy-btn:hover {
  background-color: #343a40;
  color: #ffffff;
}

:global(html.dark) .share-popover-copy-btn.copied {
  border-color: #2ea043;
  background-color: rgba(46, 160, 67, 0.18);
  color: #7ee787;
}

:global(html.dark) .share-action-btn {
  background-color: #2b3035;
  border-color: #495057;
  color: #f8f9fa;
}

:global(html.dark) .share-action-btn:hover,
:global(html.dark) .share-action-btn:focus-visible {
  background-color: #343a40;
  border-color: #6c757d;
  color: #ffffff;
}

:global(html.dark) .share-action-btn.copied {
  border-color: #2ea043;
  background-color: rgba(46, 160, 67, 0.18);
  color: #7ee787;
}

.settings-checkbox-group {
  background-color: #f8f9fa;
}

:global(html.dark) .settings-checkbox-group {
  background-color: #212529;
  border-color: #495057 !important;
}

#collapseOne .form-check-input:not(:checked) {
  border-color: #98a2b3;
}

:global(html.dark) #collapseOne .form-check-input:not(:checked) {
  border-color: #6c757d;
}

.param-symbol {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  color: #495057;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

:global(html.dark) .param-symbol {
  color: #adb5bd;
  background-color: rgba(255, 255, 255, 0.08);
}

.beta-badge {
  background-color: #ffc107;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  padding: 0.2em 0.55em;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
  vertical-align: middle;
}

.moving-joints-beta-banner {
  background-color: #fff9db;
  border: 1px solid #ffe066;
  color: #664d03;
}

.moving-joints-beta-banner .beta-banner-icon {
  color: #e67700;
  margin-top: 1px;
}

.moving-joints-beta-banner .beta-banner-title {
  color: #5c3b00;
  font-size: 0.95rem;
}

.moving-joints-beta-banner .beta-banner-desc {
  color: #7a5806;
}

:global(html.dark) .moving-joints-beta-banner {
  background-color: rgba(255, 193, 7, 0.12);
  border-color: rgba(255, 193, 7, 0.35) !important;
  color: #ffda6a;
}

:global(html.dark) .moving-joints-beta-banner .beta-banner-icon {
  color: #ffc107;
}

:global(html.dark) .moving-joints-beta-banner .beta-banner-title {
  color: #ffe69c;
}

:global(html.dark) .moving-joints-beta-banner .beta-banner-desc {
  color: #dcdcdc;
}

.moving-joints-panel {
  background-color: #f8f9fa;
}

:global(html.dark) .moving-joints-panel {
  background-color: #212529;
  border-color: #495057 !important;
}

.moving-joints-header-btn {
  color: inherit;
  cursor: pointer;
}

.moving-joints-header-btn:hover {
  opacity: 0.85;
}

.joint-stats-box,
.joint-print-guide {
  background-color: #ffffff;
}

:global(html.dark) .joint-stats-box,
:global(html.dark) .joint-print-guide {
  background-color: #2b3035;
  border-color: #495057 !important;
}

.joint-diagram-svg {
  max-width: 520px;
  width: 100%;
  background-color: #ffffff;
}

:global(html.dark) .joint-diagram-svg {
  background-color: #1b1f22;
  border-color: #495057 !important;
}

.cursor-pointer {
  cursor: pointer;
}

.seo-overview-disclosure {
  display: block;
  text-align: center;
}

.seo-overview-body {
  text-align: start;
}

.seo-disclosure-trigger {
  list-style: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: fit-content;
  min-inline-size: 2.75rem;
  min-block-size: 2.25rem;
  padding: 0.375rem 0.75rem;
  margin-inline: auto;
  border-radius: 0.5rem;
  user-select: none;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.seo-disclosure-trigger::-webkit-details-marker {
  display: none;
}

.seo-disclosure-trigger::after {
  content: "";
  display: inline-block;
  margin-left: 0.2rem;
  vertical-align: 0.12em;
  border-top: 0.35em solid currentColor;
  border-right: 0.3em solid transparent;
  border-bottom: 0;
  border-left: 0.3em solid transparent;
  transition: transform 0.2s ease;
}

.seo-overview-disclosure[open] > .seo-disclosure-trigger::after {
  transform: rotate(180deg);
}

.seo-overview-disclosure[open] > .seo-disclosure-trigger {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}

.seo-disclosure-trigger:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

@media (pointer: coarse) {
  .seo-disclosure-trigger {
    min-inline-size: 3rem;
    min-block-size: 2.75rem;
  }
}

.seo-disclosure-icon {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1;
}

.seo-feature-card,
.seo-faq-item {
  background-color: #f8f9fa;
  border-color: #e2e8f0 !important;
}

.seo-faq-summary {
  cursor: pointer;
}

.seo-inline-link {
  font-weight: 500;
  text-decoration: none;
}

.seo-inline-link:hover {
  text-decoration: underline;
}

:global(html.dark) .seo-disclosure-trigger {
  background-color: #2b3035;
  border-color: #495057;
  color: #adb5bd;
}

:global(html.dark) .seo-disclosure-trigger:hover {
  background-color: #343a40;
  border-color: #6c757d;
  color: #ffffff;
}

:global(html.dark) .seo-overview-disclosure[open] > .seo-disclosure-trigger {
  background-color: #343a40;
  border-color: #6c757d;
  color: #ffffff;
}

:global(html.dark) .seo-overview-body {
  border-color: #495057 !important;
}

:global(html.dark) .seo-feature-card,
:global(html.dark) .seo-faq-item {
  background-color: #2b3035;
  border-color: #495057 !important;
}

:global(html.dark) .seo-overview-section .text-muted {
  color: #adb5bd !important;
}
</style>