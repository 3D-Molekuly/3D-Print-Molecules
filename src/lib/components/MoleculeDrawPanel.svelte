<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { fetchCactus3DSdf } from '$lib/molecules/inputs';
  import {
    addMoleculeToEditor,
    createEditor,
    describeMolecule,
    ELEMENT_TOOL_ID,
    isKnownElement,
    RING_TEMPLATES,
    TEMPLATE_TOOL_ID,
    exportStructureImage,
    generate3DLocally,
    getDrawnMolecule,
    loadKekule,
    prefetchOpenBabelAssets,
    smilesToMolecule2D,
    toSmiles,
    type KekuleNS
  } from '$lib/molecules/kekuleDraw';

  type ToolId =
    | 'select'
    | 'erase'
    | 'bond1'
    | 'bond2'
    | 'bond3'
    | 'bond-wedge'
    | 'bond-hash'
    | 'charge-plus'
    | 'charge-minus'
    | `el-${string}`
    | 'ring-benzene'
    | `ring-${number}`
    | `tpl-${string}`;

  const ELEMENTS = ['C', 'H', 'O', 'N', 'P', 'S', 'F', 'Cl', 'Br', 'I', 'B', 'Si', 'Se'] as const;
  const EXTRA_ELEMENTS = ['Li', 'Na', 'K', 'Mg', 'Ca', 'Al', 'Ge', 'As', 'Sn', 'Sb', 'Te', 'Fe', 'Cu', 'Zn', 'Pt', 'Hg'] as const;

  /** Carbocycles drawn with Kekule's ring tool (can be fused onto existing atoms/bonds). */
  const MAIN_RINGS = [
    { tool: 'ring-benzene', size: 6, aromatic: true, label: 'adv_draw_ring_benzene' },
    { tool: 'ring-6', size: 6, aromatic: false, label: 'adv_draw_ring_cyclohexane' },
    { tool: 'ring-5', size: 5, aromatic: false, label: 'adv_draw_ring_cyclopentane' }
  ] as const;
  const EXTRA_RINGS = [
    { tool: 'ring-3', size: 3, label: 'adv_draw_ring_cyclopropane' },
    { tool: 'ring-4', size: 4, label: 'adv_draw_ring_cyclobutane' },
    { tool: 'ring-7', size: 7, label: 'adv_draw_ring_cycloheptane' },
    { tool: 'ring-8', size: 8, label: 'adv_draw_ring_cyclooctane' }
  ] as const;
  const HETEROCYCLES = [
    { name: 'pyridine', aromatic: true },
    { name: 'pyrimidine', aromatic: true },
    { name: 'pyrrole', aromatic: true },
    { name: 'furan', aromatic: true },
    { name: 'thiophene', aromatic: true },
    { name: 'imidazole', aromatic: true },
    { name: 'piperidine', aromatic: false },
    { name: 'morpholine', aromatic: false }
  ] as const;

  const templateTool = (name: string): ToolId => `tpl-${name}`;

  /** SVG points of a regular n-gon with a vertex on top, fitted into a 24×24 box. */
  function polygonPoints(n: number): string {
    const r = 9.6;
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return `${(12 + r * Math.cos(a)).toFixed(2)},${(12.4 + r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  }

  /** Splits "C6H12N" into [["C","6"],["H","12"],["N",""]] for rendering with subscripts. */
  function formulaParts(formula: string): [string, string][] {
    return [...formula.matchAll(/([A-Z][a-z]?)(\d*)/g)].map((m) => [m[1], m[2]]);
  }

  function chargeLabel(charge: number): string {
    if (!charge) return '';
    const abs = Math.abs(charge);
    return `${abs > 1 ? abs : ''}${charge > 0 ? '+' : '−'}`;
  }

  /** Optional SMILES to load onto the canvas once the editor is ready (e.g. from the SMILES tab). */
  export let initialSmiles = '';

  const dispatch = createEventDispatcher<{
    generated: {
      smiles: string;
      sdf: string;
      generator: 'cactus' | 'openbabel';
      iupacName?: string;
      imageUrl: string;
    };
  }>();

  let hostEl: HTMLDivElement | null = null;
  let Kekule: KekuleNS = null;
  let editor: KekuleNS = null;
  let themeObserver: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let destroyed = false;

  let editorReady = false;
  let loadError = '';
  let activeTool: ToolId = 'bond1';
  let isGenerating = false;
  let statusMsg = '';
  let errorMsg = '';

  let openMenu: 'rings' | 'elements' | null = null;
  let customElement = '';
  let customElementError = '';

  let previewSmiles = '';
  let previewFormula = '';
  let previewCharge = 0;
  let previewTimer: ReturnType<typeof setTimeout> | null = null;
  let copied = false;

  $: extraRingActive = activeTool.startsWith('tpl-') || EXTRA_RINGS.some((r) => r.tool === activeTool);
  $: activeExtraRingLabel = activeTool.startsWith('tpl-')
    ? $_(`adv_draw_ring_${activeTool.slice(4)}`)
    : (EXTRA_RINGS.find((r) => r.tool === activeTool)?.label ?? '');
  $: activeElement = activeTool.startsWith('el-') ? activeTool.slice(3) : '';
  $: extraElementActive = !!activeElement && !(ELEMENTS as readonly string[]).includes(activeElement);

  onMount(async () => {
    prefetchOpenBabelAssets();
    try {
      Kekule = await loadKekule();
      if (destroyed || !hostEl) return;

      editor = createEditor(Kekule, hostEl);
      const el: HTMLElement = editor.getElement();
      el.classList.add('draw-editor');
      el.style.width = '100%';
      el.style.height = '100%';
      applyTheme();
      selectTool('bond1');

      themeObserver = new MutationObserver(applyTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      resizeObserver = new ResizeObserver(() => editor?.resized?.());
      resizeObserver.observe(hostEl);
      editor.addEventListener('editObjsUpdated', schedulePreview);
      editor.addEventListener('operChange', schedulePreview);

      editorReady = true;
      if (initialSmiles.trim()) await loadSmilesOntoCanvas(initialSmiles);
    } catch (e: any) {
      console.error('Failed to initialise Kekule editor:', e);
      loadError = e?.message || $_('error_occurred');
    }
  });

  onDestroy(() => {
    destroyed = true;
    if (previewTimer) clearTimeout(previewTimer);
    themeObserver?.disconnect();
    resizeObserver?.disconnect();
    try {
      editor?.finalize?.();
    } catch {
      // ignore teardown errors from Kekule
    }
    editor = null;
  });

  function isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  function applyTheme() {
    if (!editor) return;
    const ink = isDarkMode() ? '#f1f3f5' : '#212529';
    const colors = editor.getRenderConfigs().getColorConfigs();
    colors.setAtomColor(ink);
    colors.setLabelColor(ink);
    colors.setBondColor(ink);
    colors.setGlyphStrokeColor(ink);
    colors.setGlyphFillColor(ink);
    editor.repaint();
  }

  function selectTool(tool: ToolId) {
    if (!editor) return;
    activeTool = tool;
    errorMsg = '';

    const setController = (id: string, props?: Record<string, unknown>) => {
      const controller = editor.getIaController(id);
      if (controller && props) controller.setPropValues(props);
      editor.setActiveIaControllerId(id);
      return controller;
    };

    if (tool === 'select') {
      setController('BasicMolManipulationIaController');
    } else if (tool === 'erase') {
      setController('BasicMolEraserIaController');
    } else if (tool === 'bond1' || tool === 'bond2' || tool === 'bond3') {
      const order = { bond1: Kekule.BondOrder.SINGLE, bond2: Kekule.BondOrder.DOUBLE, bond3: Kekule.BondOrder.TRIPLE }[tool];
      setController('MolBondIaController', {
        bondType: Kekule.BondType.COVALENT,
        bondOrder: order,
        bondStereo: Kekule.BondStereo.NONE
      });
    } else if (tool === 'bond-wedge' || tool === 'bond-hash') {
      setController('MolBondIaController', {
        bondType: Kekule.BondType.COVALENT,
        bondOrder: Kekule.BondOrder.SINGLE,
        bondStereo: tool === 'bond-wedge' ? Kekule.BondStereo.UP : Kekule.BondStereo.DOWN
      });
    } else if (tool === 'charge-plus' || tool === 'charge-minus') {
      setController('MolNodeChargeIaController', {
        charge: null,
        chargeInc: tool === 'charge-plus' ? 1 : -1,
        electronicBias: 0,
        electronicBiasInc: 0,
        radical: Kekule.RadicalOrder.NONE
      });
    } else if (tool.startsWith('el-')) {
      const controller = setController(ELEMENT_TOOL_ID);
      if (controller) controller.elementSymbol = tool.slice(3);
    } else if (tool === 'ring-benzene') {
      setController('MolRingIaController', { ringAtomCount: 6, isAromatic: true });
    } else if (tool.startsWith('ring-')) {
      setController('MolRingIaController', { ringAtomCount: Number(tool.slice(5)), isAromatic: false });
    } else if (tool.startsWith('tpl-')) {
      const controller = setController(TEMPLATE_TOOL_ID);
      if (controller) controller.template = RING_TEMPLATES[tool.slice(4)] ?? null;
    }
  }

  async function loadSmilesOntoCanvas(smiles: string) {
    statusMsg = $_('adv_draw_loading_smiles');
    try {
      const mol = await smilesToMolecule2D(Kekule, smiles);
      if (destroyed || !editor) return;
      if (!mol) {
        errorMsg = $_('adv_smiles_preview_not_smiles');
        return;
      }
      addMoleculeToEditor(Kekule, editor, mol);
      schedulePreview();
    } catch (e: any) {
      console.error('Loading SMILES into the editor failed:', e);
      errorMsg = $_('adv_smiles_preview_error');
    } finally {
      statusMsg = '';
    }
  }

  function pickFromMenu(tool: ToolId) {
    selectTool(tool);
    openMenu = null;
  }

  function toggleMenu(menu: 'rings' | 'elements') {
    openMenu = openMenu === menu ? null : menu;
    customElementError = '';
  }

  function applyCustomElement() {
    const raw = customElement.trim();
    const symbol = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    if (!Kekule || !isKnownElement(Kekule, symbol)) {
      customElementError = $_('adv_draw_element_invalid');
      return;
    }
    customElementError = '';
    customElement = '';
    pickFromMenu(`el-${symbol}`);
  }

  /** Svelte action: keeps a dropdown inside the panel (opens left- or right-aligned, or shifted). */
  function fitMenu(node: HTMLElement) {
    const panel = node.closest('.draw-panel')?.getBoundingClientRect();
    const anchor = node.parentElement?.getBoundingClientRect();
    if (!panel || !anchor) return;
    node.style.maxWidth = `${panel.width}px`;
    let rect = node.getBoundingClientRect();
    if (rect.right <= panel.right) return;
    node.style.left = 'auto';
    node.style.right = '0';
    rect = node.getBoundingClientRect();
    if (rect.left >= panel.left) return;
    node.style.right = 'auto';
    node.style.left = `${panel.left - anchor.left}px`;
  }

  function handleWindowClick(e: MouseEvent) {
    if (openMenu && !(e.target as HTMLElement)?.closest?.('.draw-dropdown')) openMenu = null;
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && openMenu) {
      e.stopPropagation();
      openMenu = null;
    }
  }

  function schedulePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 200);
  }

  function updatePreview() {
    previewTimer = null;
    if (!editor || !Kekule) return;
    const mol = getDrawnMolecule(Kekule, editor);
    if (!mol) {
      previewSmiles = '';
      previewFormula = '';
      previewCharge = 0;
      return;
    }
    previewSmiles = toSmiles(Kekule, mol);
    const info = describeMolecule(mol);
    previewFormula = info?.formula ?? '';
    previewCharge = info?.charge ?? 0;
  }

  async function copySmiles() {
    if (!previewSmiles) return;
    try {
      await navigator.clipboard.writeText(previewSmiles);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  function undo() {
    if (editor?.canUndo()) editor.undo();
  }

  function redo() {
    if (editor?.canRedo()) editor.redo();
  }

  function clearCanvas() {
    if (!editor) return;
    editor.newDoc();
    editor.setZoom(2);
    errorMsg = '';
    statusMsg = '';
    schedulePreview();
  }

  async function handleGenerate() {
    if (!editor || isGenerating) return;
    errorMsg = '';

    const mol = getDrawnMolecule(Kekule, editor);
    if (!mol) {
      errorMsg = $_('adv_draw_empty_error');
      return;
    }

    isGenerating = true;
    statusMsg = $_('adv_draw_generating');
    const smiles = toSmiles(Kekule, mol);

    try {
      // Step 1: online — NIH CACTUS via the existing server endpoint
      if (navigator.onLine && smiles) {
        try {
          const loaded = await withTimeout(fetchCactus3DSdf(smiles), 15000);
          dispatch('generated', {
            smiles,
            sdf: loaded.sdf,
            generator: 'cactus',
            iupacName: loaded.iupacName,
            imageUrl: loaded.imageUrl
          });
          return;
        } catch (e) {
          console.warn('CACTUS 3D generation failed, falling back to local OpenBabel:', e);
        }
      }

      // Step 2: offline fallback — OpenBabel (WASM) in a web worker
      statusMsg = $_('adv_draw_generating_offline');
      const sdf = await generate3DLocally(Kekule, mol);
      dispatch('generated', {
        smiles,
        sdf,
        generator: 'openbabel',
        imageUrl: exportStructureImage(editor)
      });
    } catch (e: any) {
      console.error('Local 3D generation failed:', e);
      errorMsg = `${$_('adv_draw_generate_error')}${e?.message ? ` (${e.message})` : ''}`;
    } finally {
      isGenerating = false;
      statusMsg = '';
    }
  }

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out.')), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<div class="draw-panel">
  <p class="field-hint">{$_('adv_draw_hint')}</p>

  <div class="draw-toolbar" role="toolbar" aria-label={$_('adv_draw_toolbar_label')}>
    <div class="btn-group btn-group-sm" role="group" aria-label={$_('adv_draw_group_tools')}>
      <button type="button" class="btn btn-outline-secondary" class:active={activeTool === 'select'} aria-pressed={activeTool === 'select'} title={$_('adv_draw_tool_select')} disabled={!editorReady} on:click={() => selectTool('select')}>
        <span class="material-symbols-outlined" aria-hidden="true">arrow_selector_tool</span>
        <span class="visually-hidden">{$_('adv_draw_tool_select')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary" class:active={activeTool === 'erase'} aria-pressed={activeTool === 'erase'} title={$_('adv_draw_tool_erase')} disabled={!editorReady} on:click={() => selectTool('erase')}>
        <span class="material-symbols-outlined" aria-hidden="true">ink_eraser</span>
        <span class="visually-hidden">{$_('adv_draw_tool_erase')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary" title={$_('adv_draw_undo')} disabled={!editorReady} on:click={undo}>
        <span class="material-symbols-outlined" aria-hidden="true">undo</span>
        <span class="visually-hidden">{$_('adv_draw_undo')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary" title={$_('adv_draw_redo')} disabled={!editorReady} on:click={redo}>
        <span class="material-symbols-outlined" aria-hidden="true">redo</span>
        <span class="visually-hidden">{$_('adv_draw_redo')}</span>
      </button>
      <button type="button" class="btn btn-outline-danger" title={$_('adv_draw_clear_btn')} disabled={!editorReady} on:click={clearCanvas}>
        <span class="material-symbols-outlined" aria-hidden="true">delete_sweep</span>
        <span class="visually-hidden">{$_('adv_draw_clear_btn')}</span>
      </button>
    </div>

    <div class="btn-group btn-group-sm" role="group" aria-label={$_('adv_draw_group_bonds')}>
      <button type="button" class="btn btn-outline-secondary bond-btn" class:active={activeTool === 'bond1'} aria-pressed={activeTool === 'bond1'} title={$_('adv_draw_bond_single')} disabled={!editorReady} on:click={() => selectTool('bond1')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="20" x2="20" y2="4" /></svg>
        <span class="visually-hidden">{$_('adv_draw_bond_single')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary bond-btn" class:active={activeTool === 'bond2'} aria-pressed={activeTool === 'bond2'} title={$_('adv_draw_bond_double')} disabled={!editorReady} on:click={() => selectTool('bond2')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="2.5" y1="18.5" x2="18.5" y2="2.5" /><line x1="5.5" y1="21.5" x2="21.5" y2="5.5" /></svg>
        <span class="visually-hidden">{$_('adv_draw_bond_double')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary bond-btn" class:active={activeTool === 'bond3'} aria-pressed={activeTool === 'bond3'} title={$_('adv_draw_bond_triple')} disabled={!editorReady} on:click={() => selectTool('bond3')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="1" y1="17" x2="17" y2="1" /><line x1="4" y1="20" x2="20" y2="4" /><line x1="7" y1="23" x2="23" y2="7" /></svg>
        <span class="visually-hidden">{$_('adv_draw_bond_triple')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary bond-btn" class:active={activeTool === 'bond-wedge'} aria-pressed={activeTool === 'bond-wedge'} title={$_('adv_draw_bond_wedge')} disabled={!editorReady} on:click={() => selectTool('bond-wedge')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon class="filled" points="3,21 19.5,2.5 23,6" /></svg>
        <span class="visually-hidden">{$_('adv_draw_bond_wedge')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary bond-btn" class:active={activeTool === 'bond-hash'} aria-pressed={activeTool === 'bond-hash'} title={$_('adv_draw_bond_hash')} disabled={!editorReady} on:click={() => selectTool('bond-hash')}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="4.5" y1="19.5" x2="5.5" y2="20.5" /><line x1="7.6" y1="15.6" x2="9.9" y2="17.9" /><line x1="10.7" y1="11.7" x2="14.3" y2="15.3" /><line x1="13.8" y1="7.8" x2="18.7" y2="12.7" /><line x1="16.9" y1="3.9" x2="23.1" y2="10.1" />
        </svg>
        <span class="visually-hidden">{$_('adv_draw_bond_hash')}</span>
      </button>
    </div>

    <div class="btn-group btn-group-sm" role="group" aria-label={$_('adv_draw_group_charge')}>
      <button type="button" class="btn btn-outline-secondary charge-btn" class:active={activeTool === 'charge-plus'} aria-pressed={activeTool === 'charge-plus'} title={$_('adv_draw_charge_plus')} disabled={!editorReady} on:click={() => selectTool('charge-plus')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="7.5" y1="12" x2="16.5" y2="12" /><line x1="12" y1="7.5" x2="12" y2="16.5" /></svg>
        <span class="visually-hidden">{$_('adv_draw_charge_plus')}</span>
      </button>
      <button type="button" class="btn btn-outline-secondary charge-btn" class:active={activeTool === 'charge-minus'} aria-pressed={activeTool === 'charge-minus'} title={$_('adv_draw_charge_minus')} disabled={!editorReady} on:click={() => selectTool('charge-minus')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><line x1="7.5" y1="12" x2="16.5" y2="12" /></svg>
        <span class="visually-hidden">{$_('adv_draw_charge_minus')}</span>
      </button>
    </div>

    <div class="btn-group btn-group-sm" role="group" aria-label={$_('adv_draw_group_rings')}>
      {#each MAIN_RINGS as ring}
        <button type="button" class="btn btn-outline-secondary ring-btn" class:active={activeTool === ring.tool} aria-pressed={activeTool === ring.tool} title={$_(ring.label)} disabled={!editorReady} on:click={() => selectTool(ring.tool)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points={polygonPoints(ring.size)} />{#if ring.aromatic}<circle cx="12" cy="12.4" r="4.4" />{/if}</svg>
          <span class="ring-label">{$_(ring.label)}</span>
        </button>
      {/each}
    </div>

    <div class="draw-dropdown">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary ring-btn dropdown-toggle-btn"
        class:active={extraRingActive}
        aria-haspopup="menu"
        aria-expanded={openMenu === 'rings'}
        disabled={!editorReady}
        on:click={() => toggleMenu('rings')}
      >
        {extraRingActive ? activeExtraRingLabel : $_('adv_draw_more_rings')}
        <span class="material-symbols-outlined caret" aria-hidden="true">expand_more</span>
      </button>
      {#if openMenu === 'rings'}
        <div class="draw-menu rings-menu" role="menu" use:fitMenu>
          <div class="menu-heading">{$_('adv_draw_rings_carbocycles')}</div>
          <div class="menu-grid">
            {#each EXTRA_RINGS as ring}
              <button type="button" role="menuitemradio" aria-checked={activeTool === ring.tool} class="menu-item" class:active={activeTool === ring.tool} on:click={() => pickFromMenu(ring.tool)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points={polygonPoints(ring.size)} /></svg>
                {$_(ring.label)}
              </button>
            {/each}
          </div>
          <div class="menu-heading">{$_('adv_draw_rings_heterocycles')}</div>
          <p class="menu-note">{$_('adv_draw_heterocycles_note')}</p>
          <div class="menu-grid">
            {#each HETEROCYCLES as het}
              {@const tool = templateTool(het.name)}
              {@const tpl = RING_TEMPLATES[het.name]}
              <button type="button" role="menuitemradio" aria-checked={activeTool === tool} class="menu-item" class:active={activeTool === tool} on:click={() => pickFromMenu(tool)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points={polygonPoints(tpl.atoms.length)} />{#if het.aromatic}<circle cx="12" cy="12.4" r="4" />{/if}</svg>
                {$_(`adv_draw_ring_${het.name}`)}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="draw-toolbar elements-row" role="group" aria-label={$_('adv_draw_group_elements')}>
    {#each ELEMENTS as el}
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary element-btn element-{el.toLowerCase()}"
        class:active={activeTool === `el-${el}`}
        aria-pressed={activeTool === `el-${el}`}
        title={$_('adv_draw_element_title', { values: { element: el } })}
        disabled={!editorReady}
        on:click={() => selectTool(`el-${el}`)}
      >
        {el}
      </button>
    {/each}

    <div class="draw-dropdown">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary element-btn dropdown-toggle-btn"
        class:active={extraElementActive}
        aria-haspopup="menu"
        aria-expanded={openMenu === 'elements'}
        title={$_('adv_draw_more_elements')}
        disabled={!editorReady}
        on:click={() => toggleMenu('elements')}
      >
        {extraElementActive ? activeElement : $_('adv_draw_more_elements')}
        <span class="material-symbols-outlined caret" aria-hidden="true">expand_more</span>
      </button>
      {#if openMenu === 'elements'}
        <div class="draw-menu elements-menu" role="menu" use:fitMenu>
          <div class="menu-element-grid">
            {#each EXTRA_ELEMENTS as el}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={activeElement === el}
                class="menu-item element-item"
                class:active={activeElement === el}
                title={$_('adv_draw_element_title', { values: { element: el } })}
                on:click={() => pickFromMenu(`el-${el}`)}
              >
                {el}
              </button>
            {/each}
          </div>
          <form class="custom-element" on:submit|preventDefault={applyCustomElement}>
            <label class="visually-hidden" for="draw-custom-element">{$_('adv_draw_element_input_label')}</label>
            <input
              id="draw-custom-element"
              class="form-control form-control-sm"
              type="text"
              maxlength="2"
              autocomplete="off"
              spellcheck="false"
              placeholder={$_('adv_draw_element_input_label')}
              bind:value={customElement}
              aria-invalid={!!customElementError}
            />
            <button type="submit" class="btn btn-sm btn-primary" disabled={!customElement.trim()}>{$_('adv_draw_element_input_btn')}</button>
          </form>
          {#if customElementError}
            <div class="menu-error" role="alert">{customElementError}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="draw-canvas-wrap" aria-busy={!editorReady && !loadError}>
    <div class="draw-canvas" bind:this={hostEl}></div>
    {#if !editorReady && !loadError}
      <div class="draw-canvas-overlay">
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        {$_('adv_draw_loading_editor')}
      </div>
    {/if}
    {#if loadError}
      <div class="draw-canvas-overlay text-danger">{loadError}</div>
    {/if}
  </div>

  <div class="draw-preview" aria-live="polite">
    {#if previewFormula || previewSmiles}
      {#if previewFormula}
        <span class="preview-item">
          <span class="preview-label">{$_('adv_draw_preview_formula')}</span>
          <span class="preview-formula">{#each formulaParts(previewFormula) as [sym, n]}{sym}{#if n}<sub>{n}</sub>{/if}{/each}{#if previewCharge}<sup>{chargeLabel(previewCharge)}</sup>{/if}</span>
        </span>
      {/if}
      {#if previewSmiles}
        <span class="preview-item preview-smiles-wrap">
          <span class="preview-label">SMILES</span>
          <code class="preview-smiles" title={previewSmiles}>{previewSmiles}</code>
          <button type="button" class="btn btn-sm copy-btn" title={$_('adv_draw_copy_smiles')} on:click={copySmiles}>
            <span class="material-symbols-outlined" aria-hidden="true">{copied ? 'check' : 'content_copy'}</span>
            <span class="visually-hidden">{$_('adv_draw_copy_smiles')}</span>
          </button>
        </span>
      {/if}
    {:else}
      <span class="preview-empty">{$_('adv_draw_preview_empty')}</span>
    {/if}
  </div>

  <button type="button" class="btn btn-primary w-100 mt-3 generate-btn" disabled={!editorReady || isGenerating} on:click={handleGenerate}>
    {#if isGenerating}
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      {statusMsg || $_('adv_draw_generating')}
    {:else}
      <span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span>
      {$_('adv_draw_generate_btn')}
    {/if}
  </button>

  <p class="visually-hidden" role="status" aria-live="polite">{statusMsg}</p>

  {#if errorMsg}
    <div class="alert alert-danger mt-3 mb-0" role="alert">{errorMsg}</div>
  {/if}
</div>

<style>
  .draw-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .field-hint {
    font-size: 0.84rem;
    color: var(--adv-muted);
    margin: 0 0 0.65rem 0;
    line-height: 1.35;
  }

  .draw-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .draw-toolbar .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    min-width: 34px;
    color: var(--adv-text);
    border-color: var(--adv-border);
    background-color: var(--adv-surface);
  }

  .draw-toolbar .btn:hover:not(:disabled) {
    background-color: var(--adv-hover);
    border-color: var(--adv-accent);
  }

  .draw-toolbar .btn.active {
    background-color: var(--adv-accent);
    border-color: var(--adv-accent);
    color: #ffffff;
  }

  .draw-toolbar .btn-outline-danger {
    color: #dc3545;
  }

  .draw-toolbar .material-symbols-outlined {
    font-size: 1.15rem;
    line-height: 1;
  }

  .bond-btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .bond-btn svg .filled {
    fill: currentColor;
    stroke-width: 1;
    stroke-linejoin: round;
  }

  .charge-btn svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  .ring-btn {
    gap: 0.35rem;
  }

  .ring-btn svg,
  .menu-item svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linejoin: round;
  }

  .elements-row {
    gap: 0.3rem;
  }

  @media (max-width: 480px) {
    .ring-label {
      position: absolute !important;
      clip-path: inset(50%) !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      white-space: nowrap !important;
    }
  }

  .draw-dropdown {
    position: relative;
    display: inline-flex;
  }

  .dropdown-toggle-btn {
    gap: 0.2rem;
    padding-right: 0.35rem;
  }

  .dropdown-toggle-btn .caret {
    font-size: 1.05rem;
  }

  .draw-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 30;
    min-width: 220px;
    padding: 0.5rem;
    border: 1px solid var(--adv-border);
    border-radius: 8px;
    background-color: var(--adv-surface);
    color: var(--adv-text);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  .rings-menu {
    width: min(340px, calc(100vw - 48px));
  }

  .menu-heading {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--adv-muted);
    margin: 0.25rem 0.25rem 0.3rem;
  }

  .menu-note {
    font-size: 0.75rem;
    color: var(--adv-muted);
    margin: -0.15rem 0.25rem 0.35rem;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.2rem;
    margin-bottom: 0.3rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: none;
    color: inherit;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
  }

  .menu-item:hover {
    background-color: var(--adv-hover);
    border-color: var(--adv-border);
  }

  .menu-item.active {
    background-color: var(--adv-accent);
    border-color: var(--adv-accent);
    color: #ffffff;
  }

  .menu-element-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.2rem;
  }

  .element-item {
    justify-content: center;
    font-weight: 700;
  }

  .custom-element {
    display: flex;
    gap: 0.35rem;
    margin-top: 0.5rem;
  }

  .custom-element input {
    flex: 1;
    min-width: 0;
    background-color: var(--adv-surface);
    color: var(--adv-text);
    border-color: var(--adv-border);
  }

  .menu-error {
    font-size: 0.78rem;
    color: #dc3545;
    margin-top: 0.3rem;
  }

  .draw-preview {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 1rem;
    min-height: 30px;
    margin-top: 0.45rem;
    font-size: 0.85rem;
    color: var(--adv-text);
  }

  .preview-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .preview-smiles-wrap {
    flex: 1 1 200px;
  }

  .preview-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--adv-muted);
  }

  .preview-formula {
    font-weight: 600;
  }

  .preview-smiles {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--adv-text);
    background: none;
  }

  .copy-btn {
    display: inline-flex;
    padding: 0.1rem 0.3rem;
    color: var(--adv-muted);
    border: 0;
  }

  .copy-btn:hover {
    color: var(--adv-accent);
  }

  .copy-btn .material-symbols-outlined {
    font-size: 1rem;
  }

  .preview-empty {
    color: var(--adv-muted);
  }

  .element-btn {
    font-weight: 700;
    min-width: 36px;
  }

  /* CPK-like accent for heteroatoms (light theme); active state overrides to white */
  .element-o:not(.active) { color: #d63333; }
  .element-n:not(.active) { color: #2f5bd3; }
  .element-p:not(.active) { color: #e07a00; }
  .element-s:not(.active) { color: #b59a00; }
  .element-f:not(.active),
  .element-cl:not(.active) { color: #1f9d3a; }
  .element-br:not(.active) { color: #a52a2a; }
  .element-i:not(.active) { color: #7b2fa8; }
  .element-b:not(.active) { color: #d97a6c; }
  .element-si:not(.active) { color: #b08a5a; }
  .element-se:not(.active) { color: #cc7a00; }

  :global(html.dark) .element-o:not(.active) { color: #ff6b6b; }
  :global(html.dark) .element-n:not(.active) { color: #7aa2ff; }
  :global(html.dark) .element-p:not(.active) { color: #ffa94d; }
  :global(html.dark) .element-s:not(.active) { color: #ffd43b; }
  :global(html.dark) .element-f:not(.active),
  :global(html.dark) .element-cl:not(.active) { color: #69db7c; }
  :global(html.dark) .element-br:not(.active) { color: #e8846b; }
  :global(html.dark) .element-i:not(.active) { color: #c77dff; }
  :global(html.dark) .element-b:not(.active) { color: #ffb5a7; }
  :global(html.dark) .element-si:not(.active) { color: #e0c097; }
  :global(html.dark) .element-se:not(.active) { color: #ffa94d; }

  .draw-canvas-wrap {
    position: relative;
    height: clamp(240px, 42vh, 360px);
    border: 1px solid var(--adv-border);
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--adv-surface);
    margin-top: 0.25rem;
  }

  .draw-canvas {
    position: absolute;
    inset: 0;
  }

  .draw-canvas-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    font-size: 0.9rem;
    color: var(--adv-muted);
  }

  /* Kekule renders its own widget chrome; blend it into the dialog */
  .draw-canvas :global(.draw-editor),
  .draw-canvas :global(.K-Chem-Editor-Client) {
    border: 0 !important;
    background-color: var(--adv-surface) !important;
  }

  .generate-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 44px;
    font-weight: 600;
  }

  .generate-btn .material-symbols-outlined {
    font-size: 1.25rem;
  }

  .visually-hidden {
    position: absolute !important;
    clip-path: inset(50%) !important;
    overflow: hidden !important;
    width: 1px !important;
    height: 1px !important;
    margin: -1px !important;
    padding: 0 !important;
    border: 0 !important;
    white-space: nowrap !important;
  }
</style>
