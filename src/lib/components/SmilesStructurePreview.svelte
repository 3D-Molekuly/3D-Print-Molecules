<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import {
    createStructureViewer,
    loadKekule,
    showInViewer,
    smilesToMolecule2D,
    type KekuleNS
  } from '$lib/molecules/kekuleDraw';

  /** Text from the SMILES input; the structure is re-drawn (debounced) as it changes. */
  export let smiles = '';

  const dispatch = createEventDispatcher<{ edit: { smiles: string } }>();

  let hostEl: HTMLDivElement | null = null;
  let Kekule: KekuleNS = null;
  let viewer: KekuleNS = null;
  let themeObserver: MutationObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;
  let destroyed = false;

  let state: 'idle' | 'loading' | 'ok' | 'not-smiles' | 'error' = 'idle';
  let shownSmiles = '';
  let currentMol: KekuleNS = null;

  $: trimmed = smiles.trim();
  $: schedule(trimmed);

  onMount(() => {
    themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });

  onDestroy(() => {
    destroyed = true;
    if (timer) clearTimeout(timer);
    themeObserver?.disconnect();
    try {
      viewer?.finalize?.();
    } catch {
      // ignore teardown errors from Kekule
    }
    viewer = null;
  });

  function schedule(text: string) {
    if (timer) clearTimeout(timer);
    if (!text) {
      requestId++;
      state = 'idle';
      shownSmiles = '';
      currentMol = null;
      return;
    }
    timer = setTimeout(() => render(text), 350);
  }

  async function render(text: string) {
    const id = ++requestId;
    if (state !== 'ok') state = 'loading';
    try {
      Kekule ??= await loadKekule();
      const mol = await smilesToMolecule2D(Kekule, text);
      if (destroyed || id !== requestId) return;
      if (!mol) {
        state = 'not-smiles';
        currentMol = null;
        return;
      }
      currentMol = mol;
      shownSmiles = text;
      state = 'ok';
      // the host is rendered once state === 'ok'; wait a frame for it to be laid out
      await new Promise((r) => requestAnimationFrame(r));
      if (destroyed || id !== requestId || !hostEl) return;
      if (!viewer) {
        viewer = createStructureViewer(Kekule, hostEl);
        viewer.getElement().classList.add('smiles-structure-viewer');
        applyTheme();
      }
      showInViewer(viewer, mol);
    } catch (e) {
      if (destroyed || id !== requestId) return;
      console.warn('SMILES preview failed:', e);
      state = 'error';
    }
  }

  function applyTheme() {
    if (!viewer) return;
    const ink = document.documentElement.classList.contains('dark') ? '#f1f3f5' : '#212529';
    const colors = viewer.getRenderConfigs().getColorConfigs();
    colors.setAtomColor(ink);
    colors.setLabelColor(ink);
    colors.setBondColor(ink);
    colors.setGlyphStrokeColor(ink);
    colors.setGlyphFillColor(ink);
    viewer.repaint();
  }
</script>

{#if trimmed}
  <div class="smiles-preview" aria-live="polite">
    <div class="preview-box" class:hidden={state !== 'ok'}>
      <div class="preview-host" bind:this={hostEl} role="img" aria-label={$_('adv_smiles_preview_alt', { values: { smiles: shownSmiles } })}></div>
      {#if state === 'ok'}
        <button type="button" class="btn btn-sm edit-btn" on:click={() => dispatch('edit', { smiles: shownSmiles })}>
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          {$_('adv_smiles_edit_in_draw')}
        </button>
      {/if}
    </div>
    {#if state === 'loading'}
      <p class="preview-note">
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        {$_('adv_smiles_preview_loading')}
      </p>
    {:else if state === 'not-smiles'}
      <p class="preview-note">{$_('adv_smiles_preview_not_smiles')}</p>
    {:else if state === 'error'}
      <p class="preview-note">{$_('adv_smiles_preview_error')}</p>
    {/if}
  </div>
{/if}

<style>
  .smiles-preview {
    margin-top: 0.75rem;
  }

  .preview-box {
    position: relative;
    height: 180px;
    border: 1px solid var(--adv-border);
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--adv-surface);
  }

  /* keep the viewer mounted (and sized) while a new structure is being computed */
  .preview-box.hidden {
    position: absolute;
    visibility: hidden;
    width: calc(100% - 2rem);
  }

  .preview-host {
    position: absolute;
    inset: 0;
  }

  .preview-host :global(.smiles-structure-viewer),
  .preview-host :global(.K-Chem-Viewer2D),
  .preview-host :global(.K-Chem-Viewer) {
    border: 0 !important;
    background-color: transparent !important;
  }

  .edit-btn {
    position: absolute;
    right: 6px;
    bottom: 6px;
    z-index: 2; /* above Kekule's canvas */
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: var(--adv-text);
    background-color: var(--adv-surface);
    border: 1px solid var(--adv-border);
  }

  .edit-btn:hover {
    border-color: var(--adv-accent);
    background-color: var(--adv-hover);
  }

  .edit-btn .material-symbols-outlined {
    font-size: 1rem;
  }

  .preview-note {
    display: flex;
    align-items: center;
    margin: 0.4rem 0 0;
    font-size: 0.82rem;
    color: var(--adv-muted);
  }
</style>
