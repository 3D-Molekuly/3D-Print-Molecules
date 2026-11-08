<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { fetchCactus3DSdf } from '$lib/molecules/inputs';
  import {
    createEditor,
    ELEMENT_TOOL_ID,
    exportStructureImage,
    generate3DLocally,
    getDrawnMolecule,
    loadKekule,
    prefetchOpenBabelAssets,
    toSmiles,
    type KekuleNS
  } from '$lib/molecules/kekuleDraw';

  type ToolId =
    | 'select'
    | 'erase'
    | 'bond1'
    | 'bond2'
    | 'bond3'
    | `el-${string}`
    | 'ring-benzene'
    | 'ring-cyclohexane'
    | 'ring-cyclopentane';

  const ELEMENTS = ['C', 'H', 'O', 'N', 'P', 'S', 'F', 'Cl', 'Br'] as const;

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

      editorReady = true;
    } catch (e: any) {
      console.error('Failed to initialise Kekule editor:', e);
      loadError = e?.message || $_('error_occurred');
    }
  });

  onDestroy(() => {
    destroyed = true;
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
    } else if (tool.startsWith('el-')) {
      const controller = setController(ELEMENT_TOOL_ID);
      if (controller) controller.elementSymbol = tool.slice(3);
    } else if (tool === 'ring-benzene') {
      setController('MolRingIaController', { ringAtomCount: 6, isAromatic: true });
    } else if (tool === 'ring-cyclohexane') {
      setController('MolRingIaController', { ringAtomCount: 6, isAromatic: false });
    } else if (tool === 'ring-cyclopentane') {
      setController('MolRingIaController', { ringAtomCount: 5, isAromatic: false });
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
    </div>

    <div class="btn-group btn-group-sm" role="group" aria-label={$_('adv_draw_group_rings')}>
      <button type="button" class="btn btn-outline-secondary" class:active={activeTool === 'ring-benzene'} aria-pressed={activeTool === 'ring-benzene'} disabled={!editorReady} on:click={() => selectTool('ring-benzene')}>
        {$_('adv_draw_ring_benzene')}
      </button>
      <button type="button" class="btn btn-outline-secondary" class:active={activeTool === 'ring-cyclohexane'} aria-pressed={activeTool === 'ring-cyclohexane'} disabled={!editorReady} on:click={() => selectTool('ring-cyclohexane')}>
        {$_('adv_draw_ring_cyclohexane')}
      </button>
      <button type="button" class="btn btn-outline-secondary" class:active={activeTool === 'ring-cyclopentane'} aria-pressed={activeTool === 'ring-cyclopentane'} disabled={!editorReady} on:click={() => selectTool('ring-cyclopentane')}>
        {$_('adv_draw_ring_cyclopentane')}
      </button>
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

  .elements-row {
    gap: 0.3rem;
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

  :global(html.dark) .element-o:not(.active) { color: #ff6b6b; }
  :global(html.dark) .element-n:not(.active) { color: #7aa2ff; }
  :global(html.dark) .element-p:not(.active) { color: #ffa94d; }
  :global(html.dark) .element-s:not(.active) { color: #ffd43b; }
  :global(html.dark) .element-f:not(.active),
  :global(html.dark) .element-cl:not(.active) { color: #69db7c; }
  :global(html.dark) .element-br:not(.active) { color: #e8846b; }

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
