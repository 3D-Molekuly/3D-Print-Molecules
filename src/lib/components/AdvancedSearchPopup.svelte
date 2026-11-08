<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { _ } from 'svelte-i18n';
  import {
    fetchCODEntry,
    searchCODEntries,
    searchPDBEntries,
    searchCCDLigands,
    fetchCCDLigandData,
    fetchCactus3DSdf,
    formatPdbQuerySpec,
    parsePdbQuerySpec,
    type CodSearchHit,
    type PdbSearchHit,
    type CcdSearchHit,
    searchPubChemByFormula,
    resolvePubChemCid,
    fetchPubChemConformerIds,
    fetchPubChemConformer,
    type PubChemCompoundHit,
    type PubChemConformer
  } from '$lib/molecules/inputs';
  import { detectFormulaQuery, formatConformerQuery } from '$lib/molecules/queryDetection';
  import MoleculeDrawPanel from '$lib/components/MoleculeDrawPanel.svelte';
  import { isOnline, isOffline } from '$lib/functions/network';

  export let show: boolean;

  type TabId = 'pubchem' | 'pdb_ccd' | 'cactus' | 'cod' | 'draw';
  const TAB_ORDER: readonly TabId[] = ['pubchem', 'pdb_ccd', 'cactus', 'cod', 'draw'];

  const dispatch = createEventDispatcher();

  let dialogEl: HTMLDialogElement | null = null;
  let tabButtons: Record<TabId, HTMLButtonElement | null> = {
    pubchem: null,
    pdb_ccd: null,
    cactus: null,
    cod: null,
    draw: null
  };

  let activeTab: TabId = 'pubchem';
  let pdbSubMode: 'ccd' | 'pdb' = 'ccd';

  // Queries
  let pubchemQuery = '';
  let ccdQuery = '';
  let pdbQuery = '';
  let pdbChain = '';
  let pdbIncludeWaters = false;
  let cactusQuery = '';
  let codQuery = '';

  // Shared UI states
  let isLoading = false;
  let isSearchingList = false;
  let loadingItemId = '';
  let errorMsg = '';
  let hasSearchedCurrentList = false;

  // Result lists
  let pubchemSuggestions: string[] = [];
  let activePubchemIndex = -1;
  /** Compounds matching a typed formula (isomers), e.g. C2H6O -> ethanol, dimethyl ether. */
  let pubchemFormulaHits: PubChemCompoundHit[] = [];
  /** "Choose a 3D conformer" mode of the PubChem tab. */
  let chooseConformer = false;
  let conformerCompound: { cid: string; title: string } | null = null;
  let conformerIds: string[] = [];
  let conformers: Record<string, PubChemConformer | null> = {};
  let conformerListLoading = false;
  let ccdResults: CcdSearchHit[] = [];
  let pdbResults: PdbSearchHit[] = [];
  let codResults: CodSearchHit[] = [];

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  $: isDirectCodId = /^\d{4,10}$/.test(codQuery.trim());

  // Sync `show` prop with native <dialog>.showModal() / .close()
  $: if (browser && dialogEl) {
    if (show && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!show && dialogEl.open) {
      dialogEl.close();
    }
  }

  onMount(() => {
    if (!dialogEl) return;

    // Fallback for browsers without declarative <dialog closedby="any"> support (e.g. Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const isOutside = (e: PointerEvent, dlg: HTMLDialogElement) => {
        const r = dlg.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        if (!dialogEl) return;
        pressedOutside = e.target === dialogEl && isOutside(e, dialogEl);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (dialogEl && pressedOutside && e.target === dialogEl && isOutside(e, dialogEl)) {
          dialogEl.close();
        }
        pressedOutside = false;
      };
      dialogEl.addEventListener('pointerdown', onPointerDown);
      dialogEl.addEventListener('pointerup', onPointerUp);
      return () => {
        dialogEl?.removeEventListener('pointerdown', onPointerDown);
        dialogEl?.removeEventListener('pointerup', onPointerUp);
      };
    }
  });

  function isImeComposing(event: KeyboardEvent): boolean {
    return event.isComposing || event.keyCode === 229;
  }

  /** Online databases need network; the offline banner explains why nothing happens. */
  function blockIfOffline(): boolean {
    if (!isOffline()) return false;
    errorMsg = '';
    return true;
  }

  function clearFeedback() {
    errorMsg = '';
    hasSearchedCurrentList = false;
  }

  function switchTab(nextTab: TabId, moveFocus = false) {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeTab = nextTab;
    errorMsg = '';
    isSearchingList = false;
    hasSearchedCurrentList = false;
    if (moveFocus) {
      tick().then(() => tabButtons[nextTab]?.focus());
    }
  }

  function handleTabListKeydown(event: KeyboardEvent) {
    if (isImeComposing(event)) return;
    const idx = TAB_ORDER.indexOf(activeTab);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      switchTab(TAB_ORDER[(idx + 1) % TAB_ORDER.length], true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      switchTab(TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length], true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      switchTab(TAB_ORDER[0], true);
    } else if (event.key === 'End') {
      event.preventDefault();
      switchTab(TAB_ORDER[TAB_ORDER.length - 1], true);
    }
  }

  // --- 1. PubChem ---
  function handlePubchemInput() {
    clearFeedback();
    activePubchemIndex = -1;
    pubchemFormulaHits = [];
    resetConformers();
    if (debounceTimer) clearTimeout(debounceTimer);
    // Name suggestions make no sense for formulas ("H2O" would suggest "H2O2")
    if (pubchemQuery.trim().length < 3 || detectFormulaQuery(pubchemQuery)?.confident) {
      pubchemSuggestions = [];
      return;
    }
    if (isOffline()) return;
    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(pubchemQuery.trim())}/synonyms/JSON`
        );
        if (!response.ok) {
          pubchemSuggestions = [];
          return;
        }
        const data = await response.json();
        pubchemSuggestions = (data?.InformationList?.Information?.[0]?.Synonym ?? []).slice(0, 6);
      } catch {
        pubchemSuggestions = [];
      }
    }, 300);
  }

  function handlePubchemKeydown(event: KeyboardEvent) {
    if (isImeComposing(event) || pubchemSuggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activePubchemIndex = (activePubchemIndex + 1) % pubchemSuggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activePubchemIndex = (activePubchemIndex - 1 + pubchemSuggestions.length) % pubchemSuggestions.length;
    } else if (event.key === 'Enter' && activePubchemIndex >= 0) {
      event.preventDefault();
      selectPubchemSuggestion(pubchemSuggestions[activePubchemIndex]);
    }
  }

  function selectPubchemSuggestion(suggestion: string) {
    if (isSearchingList) return;
    pubchemQuery = suggestion;
    pubchemSuggestions = [];
    activePubchemIndex = -1;
    handlePubChemSearch();
  }

  async function handlePubChemSearch() {
    const q = pubchemQuery.trim();
    if (!q || isLoading || isSearchingList) return;
    if (blockIfOffline()) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    pubchemSuggestions = [];
    errorMsg = '';
    resetConformers();

    // Formulas ("C2H6O", "h2so4") can match several compounds: let the user pick the isomer
    const formulaQuery = detectFormulaQuery(q);
    if (formulaQuery) {
      isSearchingList = true;
      try {
        pubchemFormulaHits = await searchPubChemByFormula(formulaQuery.formula, 8);
        hasSearchedCurrentList = true;
      } catch {
        pubchemFormulaHits = [];
      } finally {
        isSearchingList = false;
      }
      if (pubchemFormulaHits.length > 0 || formulaQuery.confident) return;
      // "NaCl"-like input without a formula match: fall through to the name search
    }
    pubchemFormulaHits = [];

    if (chooseConformer) {
      isSearchingList = true;
      try {
        const { cid } = await resolvePubChemCid(q);
        if (!cid) {
          errorMsg = $_('adv_no_results');
          return;
        }
        await showConformersFor(cid, q);
      } finally {
        isSearchingList = false;
      }
      return;
    }

    dispatch('search', {
      source: 'pubchem',
      query: q
    });
    requestClose();
  }

  function selectPubchemCompound(hit: PubChemCompoundHit) {
    if (blockIfOffline()) return;
    if (chooseConformer) {
      showConformersFor(hit.cid, hit.title);
      return;
    }
    dispatch('search', { source: 'pubchem', query: hit.cid });
    requestClose();
  }

  function resetConformers() {
    conformerCompound = null;
    conformerIds = [];
    conformers = {};
    conformerListLoading = false;
  }

  /** Lists PubChem's 3D conformers for a compound and loads their energies in the background. */
  async function showConformersFor(cid: string, title: string) {
    resetConformers();
    conformerCompound = { cid, title };
    conformerListLoading = true;
    try {
      conformerIds = await fetchPubChemConformerIds(cid);
    } finally {
      conformerListLoading = false;
    }
    // PubChem throttles at ~5 requests/s: load with limited concurrency
    const queue = [...conformerIds];
    const loadNext = async (): Promise<void> => {
      const id = queue.shift();
      if (!id || conformerCompound?.cid !== cid) return;
      let conformer: PubChemConformer | null = null;
      try {
        conformer = await fetchPubChemConformer(id); // retries on PubChem throttling itself
      } catch {
        conformer = null;
      }
      if (conformerCompound?.cid === cid) conformers = { ...conformers, [id]: conformer };
      return loadNext();
    };
    await Promise.all([loadNext(), loadNext()]);
  }

  function selectConformer(id: string, index: number) {
    if (blockIfOffline()) return;
    const label = `${$_('adv_conformer_label')} ${index + 1}/${conformerIds.length}`;
    dispatch('search', {
      source: 'pubchem',
      query: formatConformerQuery(id),
      preloadedConformer: conformers[id] ?? undefined,
      conformerLabel: label
    });
    requestClose();
  }

  function loadCompoundWithoutConformer() {
    if (!conformerCompound) return;
    dispatch('search', { source: 'pubchem', query: conformerCompound.cid });
    requestClose();
  }

  $: conformerEnergyMin = Math.min(
    ...Object.values(conformers)
      .map((c) => c?.energy)
      .filter((e): e is number => e !== undefined)
  );

  // --- 2A. RCSB CCD Ligands ---
  function handleCcdInput() {
    clearFeedback();
    if (debounceTimer) clearTimeout(debounceTimer);
    const q = ccdQuery.trim();
    if (q.length < 2) {
      ccdResults = [];
      return;
    }
    if (isOffline()) return;
    debounceTimer = setTimeout(async () => {
      isSearchingList = true;
      try {
        ccdResults = await searchCCDLigands(q, 8);
        hasSearchedCurrentList = true;
      } catch {
        ccdResults = [];
      } finally {
        isSearchingList = false;
      }
    }, 350);
  }

  async function selectCcdLigand(compId: string) {
    if (isLoading) return;
    if (blockIfOffline()) return;
    isLoading = true;
    loadingItemId = compId;
    errorMsg = '';
    try {
      const loaded = await fetchCCDLigandData(compId);
      dispatch('search', {
        source: 'ccd',
        query: loaded.id,
        preloadedCcd: loaded
      });
      requestClose();
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isLoading = false;
      loadingItemId = '';
    }
  }

  async function handleCcdSubmit() {
    const q = ccdQuery.trim();
    if (!q || isLoading) return;
    if (blockIfOffline()) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    // Direct 1–5 char CCD code (e.g. HEM, ATP, CLA, B12)
    if (/^[A-Za-z0-9]{1,5}$/.test(q)) {
      try {
        isLoading = true;
        loadingItemId = q.toUpperCase();
        errorMsg = '';
        const loaded = await fetchCCDLigandData(q);
        dispatch('search', {
          source: 'ccd',
          query: loaded.id,
          preloadedCcd: loaded
        });
        requestClose();
        return;
      } catch {
        isLoading = false;
        loadingItemId = '';
        // Fall through to text search if not an exact CCD code (e.g. "heme", "zinc")
      }
    }

    isSearchingList = true;
    errorMsg = '';
    try {
      ccdResults = await searchCCDLigands(q, 10);
      hasSearchedCurrentList = true;
      if (ccdResults.length === 1) {
        await selectCcdLigand(ccdResults[0].id);
      }
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isSearchingList = false;
    }
  }

  // --- 2B. RCSB PDB Entries ---
  function handlePdbInput() {
    clearFeedback();
    if (debounceTimer) clearTimeout(debounceTimer);
    const q = pdbQuery.trim();
    if (q.length < 2) {
      pdbResults = [];
      return;
    }
    if (isOffline()) return;
    debounceTimer = setTimeout(async () => {
      isSearchingList = true;
      try {
        pdbResults = await searchPDBEntries(q, 8);
        hasSearchedCurrentList = true;
      } catch {
        pdbResults = [];
      } finally {
        isSearchingList = false;
      }
    }, 350);
  }

  function selectPdbEntry(pdbId: string, overrideChain?: string) {
    if (blockIfOffline()) return;
    const spec = parsePdbQuerySpec(pdbId);
    const effectiveChain = overrideChain !== undefined ? overrideChain : (pdbChain.trim() || spec.chainId);
    const formatted = formatPdbQuerySpec(spec.pdbId, effectiveChain, pdbIncludeWaters);
    dispatch('search', {
      source: 'pdb',
      query: formatted
    });
    requestClose();
  }

  async function handlePdbSubmit() {
    const q = pdbQuery.trim();
    if (!q || isLoading) return;
    if (blockIfOffline()) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    const parsed = parsePdbQuerySpec(q);
    if (/^[1-9][A-Z0-9]{3}$/.test(parsed.pdbId)) {
      const formatted = formatPdbQuerySpec(
        parsed.pdbId,
        pdbChain.trim() || parsed.chainId,
        pdbIncludeWaters || parsed.includeWaters
      );
      dispatch('search', {
        source: 'pdb',
        query: formatted
      });
      requestClose();
      return;
    }

    isSearchingList = true;
    errorMsg = '';
    try {
      pdbResults = await searchPDBEntries(q, 10);
      hasSearchedCurrentList = true;
      if (pdbResults.length === 1) {
        selectPdbEntry(pdbResults[0].id);
      }
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isSearchingList = false;
    }
  }

  // --- 3. SMILES -> 3D (CACTUS) ---
  async function handleCactusSubmit() {
    const q = cactusQuery.trim();
    if (!q || isLoading) return;
    if (blockIfOffline()) return;
    isLoading = true;
    errorMsg = '';
    try {
      const loaded = await fetchCactus3DSdf(q);
      dispatch('search', {
        source: 'cactus',
        query: loaded.query,
        preloadedCactus: loaded
      });
      requestClose();
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isLoading = false;
    }
  }

  function applyCactusExample(val: string) {
    cactusQuery = val;
    handleCactusSubmit();
  }

  // --- 4. Crystallography Open DB (COD) ---
  function handleCodInput() {
    clearFeedback();
    if (debounceTimer) clearTimeout(debounceTimer);
    const q = codQuery.trim();
    if (q.length < 2 || /^\d{4,10}$/.test(q)) {
      codResults = [];
      return;
    }
    if (isOffline()) return;
    debounceTimer = setTimeout(async () => {
      isSearchingList = true;
      try {
        codResults = await searchCODEntries(q);
        hasSearchedCurrentList = true;
      } catch {
        codResults = [];
      } finally {
        isSearchingList = false;
      }
    }, 450);
  }

  async function loadCodById(codId: string) {
    if (isLoading) return;
    if (blockIfOffline()) return;
    isLoading = true;
    loadingItemId = codId;
    errorMsg = '';
    try {
      const entry = await fetchCODEntry(codId);
      dispatch('search', {
        source: 'cod',
        query: entry.id,
        content: entry.sdf,
        preloadedCodEntry: entry
      });
      requestClose();
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isLoading = false;
      loadingItemId = '';
    }
  }

  async function handleCodSubmit() {
    const q = codQuery.trim();
    if (!q || isLoading) return;
    if (blockIfOffline()) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    if (/^\d{4,10}$/.test(q)) {
      await loadCodById(q);
      return;
    }

    isSearchingList = true;
    errorMsg = '';
    try {
      codResults = await searchCODEntries(q);
      hasSearchedCurrentList = true;
      if (codResults.length === 1) {
        await loadCodById(codResults[0].id);
      }
    } catch (e: any) {
      errorMsg = e?.message || $_('error_occurred');
    } finally {
      isSearchingList = false;
    }
  }

  function applyCodExample(val: string) {
    codQuery = val;
    codResults = [];
    handleCodSubmit();
  }

  // --- 5. Draw (Kekule.js) -> 3D ---
  function handleDrawGenerated(
    event: CustomEvent<{
      smiles: string;
      sdf: string;
      generator: 'cactus' | 'openbabel';
      iupacName?: string;
      imageUrl: string;
    }>
  ) {
    const { smiles, sdf, generator, iupacName, imageUrl } = event.detail;
    const label = smiles || $_('adv_draw_molecule_name');
    dispatch('search', {
      source: 'cactus',
      query: label,
      content: sdf,
      preloadedCactus: {
        query: label,
        sdf,
        iupacName: iupacName || $_('adv_draw_molecule_name'),
        imageUrl,
        generator
      }
    });
    requestClose();
  }

  function resetDialogState() {
    if (debounceTimer) clearTimeout(debounceTimer);
    pubchemQuery = '';
    ccdQuery = '';
    pdbQuery = '';
    pdbChain = '';
    cactusQuery = '';
    codQuery = '';
    errorMsg = '';
    isLoading = false;
    isSearchingList = false;
    loadingItemId = '';
    hasSearchedCurrentList = false;
    pubchemSuggestions = [];
    activePubchemIndex = -1;
    pubchemFormulaHits = [];
    resetConformers();
    ccdResults = [];
    pdbResults = [];
    codResults = [];
  }

  function requestClose() {
    if (dialogEl?.open) {
      dialogEl.close();
    } else {
      handleNativeDialogClose();
    }
  }

  function handleNativeDialogClose() {
    if (dialogEl) {
      dialogEl.returnValue = '';
    }
    resetDialogState();
    show = false;
    dispatch('close');
  }

  const dialogClosedByAttr: Record<string, string> = { closedby: 'any' };
</script>

<dialog
  bind:this={dialogEl}
  {...dialogClosedByAttr}
  aria-labelledby="advanced-search-title"
  class="adv-dialog"
  class:wide={activeTab === 'draw'}
  on:close={handleNativeDialogClose}
>
  <div class="adv-dialog-header">
    <h2 id="advanced-search-title" class="adv-dialog-title">{$_('adv_search_title')}</h2>
    <button
      type="button"
      class="btn-close close-button"
      aria-label={$_('adv_search_close')}
      on:click={requestClose}
    ></button>
  </div>

  <div class="tabs" role="tablist" aria-label={$_('adv_search_title')}>
    <button
      type="button"
      role="tab"
      id="tab-pubchem"
      aria-selected={activeTab === 'pubchem'}
      aria-controls="panel-pubchem"
      tabindex={activeTab === 'pubchem' ? 0 : -1}
      class:active={activeTab === 'pubchem'}
      bind:this={tabButtons.pubchem}
      on:click={() => switchTab('pubchem')}
      on:keydown={handleTabListKeydown}
    >
      {$_('adv_tab_pubchem')}
    </button>
    <button
      type="button"
      role="tab"
      id="tab-pdb_ccd"
      aria-selected={activeTab === 'pdb_ccd'}
      aria-controls="panel-pdb_ccd"
      tabindex={activeTab === 'pdb_ccd' ? 0 : -1}
      class:active={activeTab === 'pdb_ccd'}
      bind:this={tabButtons.pdb_ccd}
      on:click={() => switchTab('pdb_ccd')}
      on:keydown={handleTabListKeydown}
    >
      {$_('adv_tab_pdb_ccd')}
    </button>
    <button
      type="button"
      role="tab"
      id="tab-cactus"
      aria-selected={activeTab === 'cactus'}
      aria-controls="panel-cactus"
      tabindex={activeTab === 'cactus' ? 0 : -1}
      class:active={activeTab === 'cactus'}
      bind:this={tabButtons.cactus}
      on:click={() => switchTab('cactus')}
      on:keydown={handleTabListKeydown}
    >
      {$_('adv_tab_cactus')}
    </button>
    <button
      type="button"
      role="tab"
      id="tab-cod"
      aria-selected={activeTab === 'cod'}
      aria-controls="panel-cod"
      tabindex={activeTab === 'cod' ? 0 : -1}
      class:active={activeTab === 'cod'}
      bind:this={tabButtons.cod}
      on:click={() => switchTab('cod')}
      on:keydown={handleTabListKeydown}
    >
      {$_('adv_tab_cod')}
    </button>
    <button
      type="button"
      role="tab"
      id="tab-draw"
      aria-selected={activeTab === 'draw'}
      aria-controls="panel-draw"
      tabindex={activeTab === 'draw' ? 0 : -1}
      class:active={activeTab === 'draw'}
      bind:this={tabButtons.draw}
      on:click={() => switchTab('draw')}
      on:keydown={handleTabListKeydown}
    >
      {$_('adv_tab_draw')}
    </button>
  </div>

  {#if !$isOnline && activeTab !== 'draw'}
    <div class="alert alert-warning d-flex align-items-center gap-2 mt-3 mb-0 small" role="status">
      <span class="material-symbols-outlined flex-shrink-0" aria-hidden="true">cloud_off</span>
      <span>{$_('offline_search_notice')}</span>
    </div>
  {/if}

  <!-- 1. PUBCHEM -->
  {#if activeTab === 'pubchem'}
    <div class="tab-content" role="tabpanel" id="panel-pubchem" aria-labelledby="tab-pubchem">
      <form on:submit|preventDefault={handlePubChemSearch}>
        <label for="adv-pubchem-input" class="field-label">{$_('adv_pubchem_label')}</label>
        <p id="adv-pubchem-hint" class="field-hint">{$_('adv_pubchem_hint')}</p>
        <div class="input-group autocomplete-container">
          <input
            id="adv-pubchem-input"
            name="pubchem"
            type="text"
            bind:value={pubchemQuery}
            on:input={handlePubchemInput}
            on:keydown={handlePubchemKeydown}
            aria-describedby="adv-pubchem-hint"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="form-control adv-input"
            placeholder={$_('adv_pubchem_placeholder')}
          />
          <button type="submit" class="btn btn-primary" disabled={isSearchingList}>
            {#if isSearchingList}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {$_('adv_searching')}
            {:else}
              {$_('adv_search_button')}
            {/if}
          </button>
          {#if pubchemSuggestions.length > 0}
            <ul class="autocomplete-results" role="list">
              {#each pubchemSuggestions as s, i}
                <li>
                  <button
                    type="button"
                    class="suggestion-btn"
                    class:highlighted={i === activePubchemIndex}
                    on:click={() => selectPubchemSuggestion(s)}
                  >
                    {s}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="form-check conformer-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="adv-pubchem-conformer"
            bind:checked={chooseConformer}
            on:change={resetConformers}
            aria-describedby="adv-pubchem-conformer-hint"
          />
          <label class="form-check-label small-label" for="adv-pubchem-conformer">
            {$_('adv_conformer_toggle')}
          </label>
          <p id="adv-pubchem-conformer-hint" class="field-hint mb-0">{$_('adv_conformer_hint')}</p>
        </div>
      </form>
      <div class="example-row">
        <span class="example-label">{$_('adv_examples_label')}</span>
        <button type="button" class="example-chip" on:click={() => selectPubchemSuggestion('Aspirin')}>Aspirin</button>
        <button type="button" class="example-chip" on:click={() => selectPubchemSuggestion('Caffeine')}>Caffeine</button>
        <button type="button" class="example-chip" on:click={() => selectPubchemSuggestion('50-78-2')}>50-78-2</button>
        <button type="button" class="example-chip" on:click={() => selectPubchemSuggestion('H2SO4')}>H2SO4</button>
        <button type="button" class="example-chip" on:click={() => selectPubchemSuggestion('C2H6O')}>C2H6O</button>
      </div>

      {#if conformerCompound}
        <section class="conformer-section" aria-labelledby="adv-conformer-title">
          <div class="conformer-header">
            <h3 id="adv-conformer-title" class="conformer-title">
              {$_('adv_conformer_list_title')}: <span class="hit-title">{conformerCompound.title}</span>
              <span class="hit-badge">CID {conformerCompound.cid}</span>
            </h3>
          </div>
          {#if conformerListLoading}
            <p class="empty-results"><span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>{$_('adv_searching')}</p>
          {:else if conformerIds.length === 0}
            <p class="empty-results">{$_('adv_conformer_none')}</p>
            <button type="button" class="btn btn-outline-primary btn-sm" on:click={loadCompoundWithoutConformer}>
              {$_('adv_conformer_load_anyway')}
            </button>
          {:else}
            <ul class="hit-list" role="list">
              {#each conformerIds as id, i (id)}
                {@const conformer = conformers[id]}
                <li>
                  <button type="button" class="hit-item" on:click={() => selectConformer(id, i)}>
                    <div class="hit-main">
                      <span class="hit-badge">{i + 1}</span>
                      <span class="hit-title">
                        {$_('adv_conformer_label')} {i + 1}
                        {#if i === 0}<span class="conformer-default">· {$_('adv_conformer_default')}</span>{/if}
                      </span>
                    </div>
                    <div class="hit-meta">
                      {#if conformer === undefined}
                        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                      {:else if conformer?.energy !== undefined}
                        <span class="hit-formula" title={$_('adv_conformer_energy_title')}>
                          {conformer.energy.toFixed(1)} kcal/mol
                          {#if Number.isFinite(conformerEnergyMin) && conformer.energy > conformerEnergyMin + 0.05}
                            (+{(conformer.energy - conformerEnergyMin).toFixed(1)})
                          {/if}
                        </span>
                      {/if}
                    </div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {:else if pubchemFormulaHits.length > 0}
        <p class="field-hint mt-3 mb-1">{$_('adv_formula_results_hint')}</p>
        <ul class="hit-list" role="list">
          {#each pubchemFormulaHits as hit (hit.cid)}
            <li>
              <button type="button" class="hit-item" on:click={() => selectPubchemCompound(hit)}>
                <div class="hit-main">
                  <span class="hit-badge">{hit.cid}</span>
                  <span class="hit-title">{hit.title}</span>
                </div>
                <div class="hit-meta">
                  <span class="hit-formula">{hit.formula}</span>
                  {#if hit.weight}<span>· {hit.weight}</span>{/if}
                </div>
              </button>
            </li>
          {/each}
        </ul>
      {:else if hasSearchedCurrentList && !isSearchingList}
        <p class="empty-results">{$_('adv_no_results')}</p>
      {/if}
    </div>
  {/if}

  <!-- 2. RCSB PDB / LIGANDS (CCD) -->
  {#if activeTab === 'pdb_ccd'}
    <div class="tab-content" role="tabpanel" id="panel-pdb_ccd" aria-labelledby="tab-pdb_ccd">
      <fieldset class="submode-fieldset">
        <legend class="visually-hidden">{$_('adv_pdb_mode_legend')}</legend>
        <div class="submode-segmented">
          <input
            type="radio"
            id="pdb-mode-ccd"
            name="pdbSubMode"
            value="ccd"
            bind:group={pdbSubMode}
            on:change={clearFeedback}
            class="visually-hidden"
          />
          <label for="pdb-mode-ccd" class="submode-pill" class:selected={pdbSubMode === 'ccd'}>
            {$_('adv_pdb_mode_ccd')}
          </label>

          <input
            type="radio"
            id="pdb-mode-entry"
            name="pdbSubMode"
            value="pdb"
            bind:group={pdbSubMode}
            on:change={clearFeedback}
            class="visually-hidden"
          />
          <label for="pdb-mode-entry" class="submode-pill" class:selected={pdbSubMode === 'pdb'}>
            {$_('adv_pdb_mode_entry')}
          </label>
        </div>
      </fieldset>

      {#if pdbSubMode === 'ccd'}
        <form on:submit|preventDefault={handleCcdSubmit}>
          <label for="adv-ccd-input" class="field-label">{$_('adv_ccd_label')}</label>
          <p id="adv-ccd-hint" class="field-hint">{$_('adv_ccd_hint')}</p>
          <div class="input-group">
            <input
              id="adv-ccd-input"
              name="ccd"
              type="text"
              bind:value={ccdQuery}
              on:input={handleCcdInput}
              aria-describedby="adv-ccd-hint"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              class="form-control adv-input"
              placeholder={$_('adv_ccd_placeholder')}
            />
            <button type="submit" class="btn btn-primary" disabled={isLoading || isSearchingList}>
              {#if isLoading || isSearchingList}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {$_('adv_searching')}
              {:else}
                {$_('adv_search_button')}
              {/if}
            </button>
          </div>
        </form>

        <div class="example-row">
          <span class="example-label">{$_('adv_examples_label')}</span>
          <button type="button" class="example-chip" on:click={() => selectCcdLigand('HEM')}>HEM (Heme)</button>
          <button type="button" class="example-chip" on:click={() => selectCcdLigand('ATP')}>ATP</button>
          <button type="button" class="example-chip" on:click={() => selectCcdLigand('CLA')}>CLA (Chlorophyll a)</button>
          <button type="button" class="example-chip" on:click={() => selectCcdLigand('NAD')}>NAD</button>
          <button type="button" class="example-chip" on:click={() => selectCcdLigand('B12')}>B12</button>
        </div>

        {#if ccdResults.length > 0}
          <ul class="hit-list" role="list">
            {#each ccdResults as hit (hit.id)}
              <li>
                <button
                  type="button"
                  class="hit-item"
                  disabled={isLoading}
                  on:click={() => selectCcdLigand(hit.id)}
                >
                  <div class="hit-main">
                    <span class="hit-badge">{hit.id}</span>
                    <span class="hit-title">{hit.name}</span>
                  </div>
                  <div class="hit-meta">
                    {#if loadingItemId === hit.id}
                      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    {:else if hit.formula}
                      <span class="hit-formula">{hit.formula}</span>
                    {/if}
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {:else if hasSearchedCurrentList && !isSearchingList && ccdQuery.trim().length >= 2}
          <p class="empty-results">{$_('adv_no_results')}</p>
        {/if}
      {:else}
        <form on:submit|preventDefault={handlePdbSubmit}>
          <label for="adv-pdb-input" class="field-label">{$_('adv_pdb_label')}</label>
          <p id="adv-pdb-hint" class="field-hint">{$_('adv_pdb_hint')}</p>
          <div class="input-group">
            <input
              id="adv-pdb-input"
              name="pdb"
              type="text"
              bind:value={pdbQuery}
              on:input={handlePdbInput}
              aria-describedby="adv-pdb-hint"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              class="form-control adv-input"
              placeholder={$_('adv_pdb_placeholder')}
            />
            <button type="submit" class="btn btn-primary" disabled={isLoading || isSearchingList}>
              {#if isSearchingList}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {$_('adv_searching')}
              {:else}
                {$_('adv_search_button')}
              {/if}
            </button>
          </div>

          <div class="pdb-options-row">
            <div class="pdb-chain-field">
              <label for="adv-pdb-chain" class="small-label">{$_('adv_pdb_chain_label')}</label>
              <input
                id="adv-pdb-chain"
                name="chain"
                type="text"
                maxlength="4"
                bind:value={pdbChain}
                autocorrect="off"
                autocapitalize="characters"
                spellcheck="false"
                class="form-control form-control-sm adv-chain-input"
                placeholder={$_('adv_pdb_chain_placeholder')}
              />
            </div>
            <div class="form-check pdb-water-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="adv-pdb-waters"
                bind:checked={pdbIncludeWaters}
              />
              <label class="form-check-label small-label" for="adv-pdb-waters">
                {$_('adv_pdb_waters_label')}
              </label>
            </div>
          </div>
        </form>

        <div class="example-row">
          <span class="example-label">{$_('adv_examples_label')}</span>
          <button type="button" class="example-chip" on:click={() => selectPdbEntry('1CRN', '')}>1CRN</button>
          <button type="button" class="example-chip" on:click={() => selectPdbEntry('1BNA', '')}>1BNA (DNA)</button>
          <button type="button" class="example-chip" on:click={() => selectPdbEntry('4HHB', 'A')}>4HHB:A</button>
          <button type="button" class="example-chip" on:click={() => selectPdbEntry('1UBQ', '')}>1UBQ</button>
        </div>

        {#if pdbResults.length > 0}
          <ul class="hit-list" role="list">
            {#each pdbResults as hit (hit.id)}
              <li>
                <button
                  type="button"
                  class="hit-item"
                  on:click={() => selectPdbEntry(hit.id)}
                >
                  <div class="hit-main">
                    <span class="hit-badge pdb-badge">{hit.id}</span>
                    <span class="hit-title">{hit.title}</span>
                  </div>
                  <div class="hit-meta">
                    {#if hit.molecularWeight}
                      <span>{hit.molecularWeight}</span>
                    {/if}
                    {#if hit.atomCount}
                      <span>· {hit.atomCount} {$_('adv_pdb_atoms_unit')}</span>
                    {/if}
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {:else if hasSearchedCurrentList && !isSearchingList && pdbQuery.trim().length >= 2}
          <p class="empty-results">{$_('adv_no_results')}</p>
        {/if}
      {/if}
    </div>
  {/if}

  <!-- 3. SMILES -> 3D (CACTUS) -->
  {#if activeTab === 'cactus'}
    <div class="tab-content" role="tabpanel" id="panel-cactus" aria-labelledby="tab-cactus">
      <form on:submit|preventDefault={handleCactusSubmit}>
        <label for="adv-cactus-input" class="field-label">{$_('adv_cactus_label')}</label>
        <p id="adv-cactus-hint" class="field-hint">{$_('adv_cactus_hint')}</p>
        <div class="input-group">
          <input
            id="adv-cactus-input"
            name="cactus"
            type="text"
            bind:value={cactusQuery}
            on:input={clearFeedback}
            aria-describedby="adv-cactus-hint"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="form-control adv-input"
            placeholder={$_('adv_cactus_placeholder')}
          />
          <button type="submit" class="btn btn-primary" disabled={isLoading}>
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {$_('adv_loading')}
            {:else}
              {$_('adv_load_button')}
            {/if}
          </button>
        </div>
      </form>

      <div class="example-row">
        <span class="example-label">{$_('adv_examples_label')}</span>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCactusExample('C12C3C4C1C5C2C3C45')}>
          {$_('adv_cactus_chip_cubane')}
        </button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCactusExample('C1CCCCC1')}>
          {$_('adv_cactus_chip_cyclohexane')}
        </button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCactusExample('CC(=O)Oc1ccccc1C(=O)O')}>
          {$_('adv_cactus_chip_aspirin')}
        </button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCactusExample('ferrocene')}>
          {$_('adv_cactus_chip_ferrocene')}
        </button>
      </div>
    </div>
  {/if}

  <!-- 4. CRYSTALLOGRAPHY OPEN DB (COD) -->
  {#if activeTab === 'cod'}
    <div class="tab-content" role="tabpanel" id="panel-cod" aria-labelledby="tab-cod">
      <form on:submit|preventDefault={handleCodSubmit}>
        <label for="adv-cod-input" class="field-label">{$_('adv_cod_label')}</label>
        <p id="adv-cod-hint" class="field-hint">{$_('adv_cod_hint')}</p>
        <div class="input-group">
          <input
            id="adv-cod-input"
            name="cod"
            type="text"
            bind:value={codQuery}
            on:input={handleCodInput}
            aria-describedby="adv-cod-hint"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="form-control adv-input"
            placeholder={$_('adv_cod_placeholder')}
          />
          <button type="submit" class="btn btn-primary" disabled={isLoading || isSearchingList}>
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {$_('adv_loading')}
            {:else if isSearchingList}
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {$_('adv_searching')}
            {:else if isDirectCodId}
              {$_('adv_cod_fetch_id_button')}
            {:else}
              {$_('adv_search_button')}
            {/if}
          </button>
        </div>
      </form>

      <div class="example-row">
        <span class="example-label">{$_('adv_examples_label')}</span>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCodExample('calcite')}>calcite</button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCodExample('quartz')}>quartz</button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCodExample('NaCl')}>NaCl</button>
        <button type="button" class="example-chip" disabled={isLoading} on:click={() => applyCodExample('1506182')}>1506182</button>
      </div>

      {#if codResults.length > 0}
        <ul class="hit-list" role="list">
          {#each codResults as hit (hit.id)}
            <li>
              <button
                type="button"
                class="hit-item"
                disabled={isLoading}
                on:click={() => loadCodById(hit.id)}
              >
                <div class="hit-main">
                  <span class="hit-badge cod-badge">{hit.id}</span>
                  <span class="hit-title">{hit.name}</span>
                </div>
                <div class="hit-meta">
                  {#if loadingItemId === hit.id}
                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  {:else}
                    {#if hit.formula}
                      <span class="hit-formula">{hit.formula}</span>
                    {/if}
                    {#if hit.spaceGroup}
                      <span>· {hit.spaceGroup}</span>
                    {/if}
                  {/if}
                </div>
              </button>
            </li>
          {/each}
        </ul>
      {:else if hasSearchedCurrentList && !isSearchingList && !isDirectCodId && codQuery.trim().length >= 2}
        <p class="empty-results">{$_('adv_no_results')}</p>
      {/if}
    </div>
  {/if}

  <!-- 5. DRAW 2D -> 3D (Kekule.js) -->
  {#if activeTab === 'draw' && show}
    <div class="tab-content" role="tabpanel" id="panel-draw" aria-labelledby="tab-draw">
      <MoleculeDrawPanel on:generated={handleDrawGenerated} />
    </div>
  {/if}

  {#if errorMsg}
    <div class="alert alert-danger mt-3 mb-0" role="alert">{errorMsg}</div>
  {/if}
</dialog>

<style>
  .adv-dialog {
    --adv-bg: #ffffff;
    --adv-text: #212529;
    --adv-muted: #5c636a;
    --adv-border: #dee2e6;
    --adv-surface: #f8f9fa;
    --adv-hover: #eef2f6;
    --adv-accent: #0d6efd;

    border: 1px solid var(--adv-border);
    border-radius: 12px;
    padding: 1.5rem;
    width: min(94vw, 600px);
    transition: width 0.15s ease;
    max-height: min(88vh, 720px);
    background-color: var(--adv-bg);
    color: var(--adv-text);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
    margin: auto;
  }

  .adv-dialog.wide {
    width: min(94vw, 760px);
    max-height: min(92vh, 860px);
  }

  .adv-dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .adv-dialog:modal {
    overscroll-behavior: contain;
  }

  .adv-dialog::backdrop {
    overflow: hidden;
    overscroll-behavior: contain;
    background-color: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
  }

  :global(html.dark) .adv-dialog {
    --adv-bg: #2b3035;
    --adv-text: #f8f9fa;
    --adv-muted: #adb5bd;
    --adv-border: #495057;
    --adv-surface: #212529;
    --adv-hover: #343a40;
    --adv-accent: #5294ff;
  }

  :global(html.dark) .adv-dialog .close-button {
    filter: invert(1) grayscale(100%) brightness(200%);
  }

  :global(html.dark) .adv-dialog .form-control {
    background-color: #1d2124;
    border-color: #495057;
    color: #f8f9fa;
  }

  :global(html.dark) .adv-dialog .form-control::placeholder {
    color: #868e96;
  }

  .adv-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .adv-dialog-title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
  }

  .close-button {
    min-width: 28px;
    min-height: 28px;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    border-bottom: 1px solid var(--adv-border);
    margin-bottom: 1rem;
  }

  .tabs button {
    padding: 0.55rem 0.85rem;
    min-height: 40px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    color: var(--adv-muted);
    font-size: 0.92rem;
    font-weight: 500;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .tabs button:hover {
    color: var(--adv-text);
  }

  .tabs button:focus-visible {
    outline: 2px solid var(--adv-accent);
    outline-offset: -2px;
    border-radius: 6px 6px 0 0;
  }

  .tabs button.active {
    border-bottom-color: var(--adv-accent);
    font-weight: 600;
    color: var(--adv-text);
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .field-label {
    display: block;
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.2rem;
    color: var(--adv-text);
  }

  .field-hint {
    font-size: 0.84rem;
    color: var(--adv-muted);
    margin: 0 0 0.65rem 0;
    line-height: 1.35;
  }

  .adv-input {
    font-size: 1rem;
    min-height: 44px;
  }

  .submode-fieldset {
    border: 0;
    padding: 0;
    margin: 0 0 0.85rem 0;
  }

  .submode-segmented {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    background-color: var(--adv-surface);
    border: 1px solid var(--adv-border);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .submode-pill {
    padding: 0.35rem 0.75rem;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    font-size: 0.86rem;
    font-weight: 500;
    color: var(--adv-muted);
    cursor: pointer;
    user-select: none;
    margin: 0;
  }

  .submode-pill.selected {
    background-color: var(--adv-accent);
    color: #ffffff;
    font-weight: 600;
  }

  .submode-segmented input:focus-visible + .submode-pill {
    outline: 2px solid var(--adv-accent);
    outline-offset: 2px;
  }

  .pdb-options-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    margin-top: 0.65rem;
  }

  .pdb-chain-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .adv-chain-input {
    width: 72px;
    font-size: 0.95rem;
  }

  .pdb-water-check {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .small-label {
    font-size: 0.84rem;
    color: var(--adv-muted);
    margin: 0;
  }

  .example-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.7rem;
  }

  .example-label {
    font-size: 0.8rem;
    color: var(--adv-muted);
    margin-right: 0.15rem;
  }

  .example-chip {
    border: 1px solid var(--adv-border);
    background-color: var(--adv-surface);
    color: var(--adv-text);
    border-radius: 999px;
    padding: 0.2rem 0.65rem;
    min-height: 28px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .example-chip:hover:not(:disabled) {
    background-color: var(--adv-hover);
    border-color: var(--adv-accent);
  }

  .example-chip:focus-visible {
    outline: 2px solid var(--adv-accent);
    outline-offset: 2px;
  }

  .autocomplete-container {
    position: relative;
  }

  .autocomplete-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--adv-bg);
    border: 1px solid var(--adv-border);
    list-style: none;
    padding: 0.25rem 0;
    margin: 0.15rem 0 0 0;
    z-index: 20;
    border-radius: 0.375rem;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
    max-height: 220px;
    overflow-y: auto;
  }

  .suggestion-btn {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--adv-text);
    padding: 0.45rem 0.9rem;
    font-size: 0.92rem;
    cursor: pointer;
  }

  .suggestion-btn:hover,
  .suggestion-btn.highlighted {
    background-color: var(--adv-hover);
  }

  .hit-list {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0 0;
    border: 1px solid var(--adv-border);
    border-radius: 8px;
    max-height: 240px;
    overflow-y: auto;
  }

  .hit-list li + li {
    border-top: 1px solid var(--adv-border);
  }

  .hit-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.55rem 0.75rem;
    background: transparent;
    border: none;
    color: var(--adv-text);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .hit-item:hover:not(:disabled) {
    background-color: var(--adv-hover);
  }

  .hit-item:focus-visible {
    outline: 2px solid var(--adv-accent);
    outline-offset: -2px;
  }

  .hit-main {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    flex: 1;
  }

  .hit-badge {
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background-color: rgba(13, 110, 253, 0.14);
    color: var(--adv-accent);
  }

  .pdb-badge {
    background-color: rgba(25, 135, 84, 0.15);
    color: #198754;
  }

  :global(html.dark) .pdb-badge {
    color: #5dd39e;
  }

  .cod-badge {
    background-color: rgba(111, 66, 193, 0.15);
    color: #6f42c1;
  }

  :global(html.dark) .cod-badge {
    color: #b197fc;
  }

  .hit-title {
    font-size: 0.88rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hit-meta {
    flex-shrink: 0;
    font-size: 0.78rem;
    color: var(--adv-muted);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .hit-formula {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .conformer-check {
    margin-top: 0.6rem;
  }

  .conformer-section {
    margin-top: 1rem;
  }

  .conformer-title {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .conformer-default {
    opacity: 0.7;
    font-weight: 400;
  }

  .empty-results {
    margin: 0.85rem 0 0 0;
    font-size: 0.88rem;
    color: var(--adv-muted);
    text-align: center;
  }

  .visually-hidden:where(:not(:focus-within, :active)) {
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
