<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cifToSdf } from '$lib/utils/cifToSdf';

  export let show: boolean;

  const dispatch = createEventDispatcher();

  let activeTab: 'pubchem' | 'cod' = 'pubchem';
  let pubchemQuery = '';
  let codQuery = '';
  let isLoading = false;
  let errorMsg = '';
  
  // PubChem Autocomplete
  let suggestions: string[] = [];
  let autocompleteTimeout: number;

  async function handlePubchemInput() {
    clearTimeout(autocompleteTimeout);
    if (pubchemQuery.length < 3) {
      suggestions = [];
      return;
    }
    autocompleteTimeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(pubchemQuery)}/synonyms/JSON`);
        if (!response.ok) return;
        const data = await response.json();
        suggestions = data.InformationList.Information[0].Synonym.slice(0, 5);
      } catch (e) {
        console.error("Autocomplete failed", e);
        suggestions = [];
      }
    }, 300);
  }

  function selectSuggestion(suggestion: string) {
    pubchemQuery = suggestion;
    suggestions = [];
    handlePubChemSearch();
  }


  function handlePubChemSearch() {
    if (!pubchemQuery.trim()) return;
    dispatch('search', {
      source: 'pubchem',
      query: pubchemQuery.trim(),
    });
    close();
  }

  async function handleCodSearch() {
    if (!codQuery.trim()) return;
    isLoading = true;
    errorMsg = '';
    try {
      // For client-side requests, a CORS proxy is often needed
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const cifUrl = `https://www.crystallography.net/cod/${encodeURIComponent(codQuery.trim())}.cif`;
      const response = await fetch(proxyUrl + cifUrl);
      
      if (!response.ok) {
        throw new Error(`COD entry not found or server error (Status: ${response.status})`);
      }
      const cifContent = await response.text();
      if (cifContent.includes("404 Not Found") || cifContent.trim().startsWith("data_error")) {
         throw new Error(`COD entry '${codQuery}' does not exist.`);
      }

      // *** FIXED: Added 'await' to correctly handle the async conversion ***
      const sdfContent = await cifToSdf(cifContent); 
      
      dispatch('search', {
        source: 'cod',
        content: sdfContent,
        query: codQuery.trim(),
      });
      close();
    } catch (e: any) {
      console.error("COD Search failed", e);
      errorMsg = e.message || "An unknown error occurred.";
    } finally {
      isLoading = false;
    }
  }
  
  function close() {
    // Reset state on close
    pubchemQuery = '';
    codQuery = '';
    errorMsg = '';
    isLoading = false;
    suggestions = [];
    dispatch('close');
  }

  // Handle Escape key to close
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if show}
  <div class="popup-overlay" on:click={close}>
    <div class="popup-content" on:click|stopPropagation>
      <button class="btn-close close-button" on:click={close} aria-label="Close"></button>
      
      <h2>Advanced Search</h2>

      <div class="tabs">
        <button class:active={activeTab === 'pubchem'} on:click={() => activeTab = 'pubchem'}>PubChem</button>
        <button class:active={activeTab === 'cod'} on:click={() => activeTab = 'cod'}>Crystallography Open DB</button>
      </div>

      {#if activeTab === 'pubchem'}
        <div class="tab-content">
          <p>Search by Name, CID, or CAS number.</p>
          <div class="input-group autocomplete-container">
            <input 
              type="text" 
              bind:value={pubchemQuery} 
              on:input={handlePubchemInput}
              on:keydown={(e) => e.key === 'Enter' && handlePubChemSearch()}
              class="form-control" 
              placeholder="e.g., Aspirin, 2244, 50-78-2"
            >
            <button class="btn btn-primary" on:click={handlePubChemSearch}>Search</button>
            {#if suggestions.length > 0}
            <ul class="autocomplete-results">
              {#each suggestions as s}
                <li on:click={() => selectSuggestion(s)}>{s}</li>
              {/each}
            </ul>
            {/if}
          </div>
        </div>
      {/if}

      {#if activeTab === 'cod'}
        <div class="tab-content">
          <p>Search by COD ID.</p>
           <div class="input-group">
            <input 
              type="text" 
              bind:value={codQuery} 
              on:keydown={(e) => e.key === 'Enter' && handleCodSearch()}
              class="form-control" 
              placeholder="e.g., 1506182"
            >
            <button class="btn btn-primary" on:click={handleCodSearch} disabled={isLoading}>
              {#if isLoading}
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Loading...
              {:else}
                Fetch & Convert
              {/if}
            </button>
          </div>
          {#if errorMsg}
            <div class="alert alert-danger mt-2">{errorMsg}</div>
          {/if}
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
  }
  .popup-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    position: relative;
    color: #212529; /* Added text color for better readability on white background */
  }
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid #ccc;
    margin-bottom: 1rem;
  }
  .tabs button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    color: #6c757d; /* Softer color for inactive tabs */
  }
  .tabs button.active {
    border-bottom-color: var(--bs-primary, #0d6efd); /* Use Bootstrap primary color if available */
    font-weight: bold;
    color: #212529;
  }
  .tab-content {
    padding-top: 1rem;
  }
  .tab-content p {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
  }
  .autocomplete-container {
    position: relative;
  }
  .autocomplete-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    list-style: none;
    padding: 0;
    margin: 0;
    z-index: 10;
    border-radius: 0 0 0.25rem 0.25rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .autocomplete-results li {
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
  .autocomplete-results li:hover {
    background: #f0f0f0;
  }
  .alert {
    padding: 0.75rem 1.25rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
  }
  .alert-danger {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
  }
</style>