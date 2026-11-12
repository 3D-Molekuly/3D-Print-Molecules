<script lang="ts">
  import type { SupportedLocale } from '$lib/functions/language';
  import { onMount } from 'svelte';
  import ModelCard from '$lib/components/ModelCard.svelte';
  import { getContent } from '$lib/i18n/content';
  import { supportedLocales } from '$lib/functions/language';
  import {
    PRINTED_MODELS,
    AMINO_ACIDS,
    type PrintedModel,
    modelText,
    PRINTABLES_PROFILE_URL,
    MAKERWORLD_PROFILE_URL
  } from '$lib/data/printedModels';

  export let lang: SupportedLocale;

  $: t = getContent(lang).gallery;
  $: aminoSorted = [...AMINO_ACIDS].sort((a, b) => modelText(a, lang).name.localeCompare(modelText(b, lang).name, lang));

  // Four visually distinct prints for the category's collage icon.
  const COLLAGE_IDS = ['tryptophan', 'histidine', 'cysteine', 'phenylalanine'];
  const collage = COLLAGE_IDS.map((id) => AMINO_ACIDS.find((m) => m.id === id)).filter(
    (m): m is (typeof AMINO_ACIDS)[number] => !!m
  );

  let aminoOpen = false;

  // --- Search -------------------------------------------------------------
  const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
  /** Lower-case, strip diacritics and turn formula subscripts into plain digits. */
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[₀-₉]/g, (c) => String(SUBSCRIPTS.indexOf(c)))
      .toLowerCase();

  // Words separated by single spaces, with a leading space, so terms can match from a word start.
  const haystack = (model: PrintedModel) =>
    ' ' +
    normalize(
      [
        model.id,
        ...supportedLocales.flatMap((l) => Object.values(modelText(model, l))),
        model.editorQuery ?? ''
      ].join(' ')
    )
      .replace(/[^a-z0-9]+/g, ' ');
  const INDEX = new Map([...PRINTED_MODELS, ...AMINO_ACIDS].map((m) => [m.id, haystack(m)]));

  let query = '';
  $: terms = normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
  $: searching = terms.length > 0;
  $: matches = (model: PrintedModel) => {
    const text = INDEX.get(model.id) ?? '';
    return terms.every((term) => text.includes(' ' + term));
  };
  $: visibleModels = searching ? PRINTED_MODELS.filter(matches) : PRINTED_MODELS;
  $: visibleAmino = searching ? aminoSorted.filter(matches) : aminoSorted;
  // While searching, the generator opens with the typed molecule pre-filled.
  $: generatorHref = searching ? `/${lang}?mol=${encodeURIComponent(query.trim())}` : `/${lang}`;
  $: resultCount = visibleModels.length + visibleAmino.length;
  // Reveal matching amino acids without the extra click.
  $: if (searching && visibleAmino.length > 0) aminoOpen = true;

  // Open the category when a link points directly at one of its models (e.g. /en/examples#glycine).
  onMount(() => {
    const openForHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && AMINO_ACIDS.some((m) => m.id === id)) {
        aminoOpen = true;
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }));
      }
    };
    openForHash();
    window.addEventListener('hashchange', openForHash);
    return () => window.removeEventListener('hashchange', openForHash);
  });
</script>

<div class="gallery-page container">
  <header class="gallery-header">
    <h1>{t.heading}</h1>
    <p class="gallery-intro">{t.intro}</p>

    <p class="channels-label">{t.channels}</p>
    <div class="channel-links">
      <a href={PRINTABLES_PROFILE_URL} target="_blank" rel="noopener" class="channel-btn printables">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
          <path d="M3.678 4.8 12 9.6v9.6l8.322-4.8V4.8L12 0ZM12 19.2l-8.322-4.8V24Z" />
        </svg>
        <span>Printables</span>
        <span class="external-arrow" aria-hidden="true">↗</span>
      </a>
      <a href={MAKERWORLD_PROFILE_URL} target="_blank" rel="noopener" class="channel-btn makerworld">
        <svg viewBox="19 10 168 167" fill="currentColor" width="26" height="26" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M23 31 L66 14 L103 28 L140 14 L183 31 L183 156 L140 173 L103 159 L66 173 L23 156 Z M67 21 L102 36 L102 86 L67 71 Z M140 21 L176 36 L176 86 L140 71 Z M31 94 L66 79 L101 94 L66 109 Z M105 94 L140 79 L175 94 L140 109 Z M30 102 L66 117 L66 167 L30 152 Z M104 102 L140 117 L140 167 L104 152 Z" />
        </svg>
        <span>MakerWorld</span>
        <span class="external-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
  </header>

  <div class="gallery-search" role="search">
    <label class="search-field">
      <span class="material-symbols-outlined" aria-hidden="true">search</span>
      <span class="visually-hidden">{t.searchLabel}</span>
      <input
        type="search"
        bind:value={query}
        placeholder={t.searchPlaceholder}
        autocomplete="off"
        spellcheck="false"
      />
      {#if query}
        <button type="button" class="search-clear" on:click={() => (query = '')} aria-label={t.searchClear}>
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      {/if}
    </label>
    {#if searching}
      <p class="search-status" aria-live="polite">{t.searchResults(resultCount)}</p>
    {/if}
  </div>

  <aside class="gallery-cta">
    <p>
      <strong>{t.ctaHeading}</strong>
      <span>{t.ctaText}</span>
    </p>
    <a href={generatorHref} class="btn btn-primary">{t.ctaButton}</a>
  </aside>

  {#if searching && resultCount === 0}
    <div class="search-empty">
      <p>{t.searchEmpty}</p>
    </div>
  {/if}

  {#if visibleAmino.length > 0}
  <details class="model-category" bind:open={aminoOpen}>
    <summary>
      <span class="category-collage" aria-hidden="true">
        {#each collage as model (model.id)}
          <img src={model.image} alt="" width="640" height="480" loading="lazy" decoding="async" />
        {/each}
      </span>
      <span class="category-title">
        <h2>{t.aminoHeading}</h2>
        <span class="category-meta">{t.aminoMeta(AMINO_ACIDS.length)}</span>
      </span>
      <span class="category-icon material-symbols-outlined" aria-hidden="true">expand_more</span>
    </summary>
    <p class="category-intro">{t.aminoIntro}</p>
    <ul class="model-grid">
      {#each visibleAmino as model (model.id)}
        <ModelCard {model} {lang} headingLevel="h3" />
      {/each}
    </ul>
  </details>
  {/if}

  <ul class="model-grid">
    {#each visibleModels as model (model.id)}
      <ModelCard {model} {lang} />
    {/each}
  </ul>

</div>

<style>
  .gallery-page {
    --card-bg: #ffffff;
    --card-border: #e4e4e4;
    --muted: #555;
    max-width: 1200px;
    padding: 2rem 1rem 3rem;
  }
  :global(html.dark) .gallery-page {
    --card-bg: #2b2f33;
    --card-border: #44494f;
    --muted: #c4c4c4;
  }

  .gallery-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .gallery-header h1 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    margin-bottom: 0.75rem;
  }
  .gallery-intro {
    max-width: 720px;
    margin: 0 auto 1.5rem;
    font-size: 1.05rem;
    color: var(--muted);
  }
  .channels-label {
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .channel-links {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .channel-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.15rem;
    font-weight: 700;
    padding: 0.7rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .channel-btn:hover {
    transform: translateY(-2px);
  }
  .channel-btn.printables {
    background: #fa6831;
    color: #fff;
    box-shadow: 0 4px 12px rgba(250, 104, 49, 0.25);
  }
  .channel-btn.printables:hover {
    background: #e0531c;
    color: #fff;
  }
  .channel-btn.makerworld {
    background: #fff;
    color: #111;
    border: 1px solid #dcdcdc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .channel-btn.makerworld:hover {
    background: #f5f5f5;
    color: #111;
  }

  .model-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .gallery-search {
    max-width: 560px;
    margin: 0 auto 2rem;
  }
  .search-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem 0 0.9rem;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin: 0;
  }
  .search-field:focus-within {
    border-color: #fa6831;
    box-shadow: 0 0 0 3px rgba(250, 104, 49, 0.2);
  }
  .search-field > .material-symbols-outlined {
    color: var(--muted);
  }
  .search-field input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font-size: 1.05rem;
    padding: 0.7rem 0;
  }
  .search-field input::-webkit-search-cancel-button {
    display: none;
  }
  .search-clear {
    display: flex;
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 0.3rem;
    border-radius: 50%;
    cursor: pointer;
  }
  .search-clear:hover {
    background: rgba(127, 127, 127, 0.15);
  }
  .search-status {
    text-align: center;
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0.5rem 0 0;
  }
  .search-empty {
    text-align: center;
    margin: 0 0 2rem;
    color: var(--muted);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .model-category {
    margin-bottom: 2rem;
    border: 1px solid var(--card-border);
    border-radius: 12px;
    background: var(--card-bg);
  }
  .model-category summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    cursor: pointer;
    list-style: none;
    border-radius: 12px;
  }
  .model-category summary::-webkit-details-marker {
    display: none;
  }
  .model-category summary:hover {
    background: rgba(127, 127, 127, 0.08);
  }
  .model-category summary:focus-visible {
    outline: 2px solid #fa6831;
    outline-offset: 2px;
  }
  .category-collage {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    width: 96px;
    height: 96px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--card-border);
  }
  .category-collage img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* Zoom past the promo banner at the top of the photos onto the molecule itself. */
    transform: scale(1.6);
    transform-origin: 50% 62%;
  }
  .category-icon {
    margin-left: auto;
    font-size: 2rem;
    transition: transform 0.2s ease;
  }
  .model-category[open] .category-icon {
    transform: rotate(180deg);
  }
  .category-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.75rem;
  }
  .category-title h2 {
    font-size: 1.5rem;
    margin: 0;
  }
  .category-meta {
    color: var(--muted);
    font-size: 0.95rem;
  }
  .category-intro {
    color: var(--muted);
    margin: 0 1.25rem 1.25rem;
  }
  .model-category .model-grid {
    padding: 0 1.25rem 1.25rem;
  }

  .gallery-cta {
    max-width: 760px;
    margin: -1rem auto 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    text-align: center;
  }
  .gallery-cta p {
    margin: 0;
    color: var(--muted);
  }
  .gallery-cta strong {
    color: var(--bs-body-color, inherit);
    margin-right: 0.25rem;
  }
</style>
