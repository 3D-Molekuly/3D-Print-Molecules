<script lang="ts">
  import type { SupportedLocale } from '$lib/functions/language';
  import { modelText, type PrintedModel } from '$lib/data/printedModels';
  import { getContent } from '$lib/i18n/content';

  export let model: PrintedModel;
  export let lang: SupportedLocale;
  /** Heading level of the card title (h2 in the main grid, h3 inside a category). */
  export let headingLevel: 'h2' | 'h3' = 'h2';

  $: t = getContent(lang).modelCard;
  $: text = modelText(model, lang);
  $: editorHref = model.editorQuery
    ? `/${lang}?mol=${encodeURIComponent(model.editorQuery)}`
    : null;
</script>

<li class="model-card" id={model.id}>
  <a href={model.printablesUrl} target="_blank" rel="noopener" class="model-photo" tabindex="-1">
    <img
      src={model.image}
      alt={`${t.photoAlt}: ${text.name}`}
      width="640"
      height="480"
      loading="lazy"
      decoding="async"
    />
  </a>
  <div class="model-body">
    <svelte:element this={headingLevel} class="model-title">{text.name}</svelte:element>
    <p>{text.description}</p>
    <div class="model-links">
      <a href={model.printablesUrl} target="_blank" rel="noopener" class="model-link printables">
        Printables <span aria-hidden="true">↗</span>
      </a>
      {#if model.makerworldUrl}
        <a href={model.makerworldUrl} target="_blank" rel="noopener" class="model-link makerworld">
          MakerWorld <span aria-hidden="true">↗</span>
        </a>
      {:else}
        <span class="model-link pending">{t.makerworldPending}</span>
      {/if}
    </div>
    {#if editorHref}
      <a href={editorHref} class="editor-link">
        <span class="material-symbols-outlined" aria-hidden="true">deployed_code</span>
        {t.openEditor}
      </a>
    {/if}
  </div>
</li>

<style>
  .model-card {
    display: flex;
    flex-direction: column;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .model-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
  .model-photo {
    display: block;
    aspect-ratio: 4 / 3;
    background: #ddd;
  }
  .model-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .model-body {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem 1.1rem 1.2rem;
    flex: 1;
  }
  .model-title {
    font-size: 1.2rem;
    margin: 0;
  }
  .model-body p {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
    flex: 1;
  }
  .model-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .model-link {
    text-align: center;
    font-weight: 600;
    padding: 0.45rem 0.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.95rem;
  }
  .model-link.printables {
    background: #fa6831;
    color: #fff;
  }
  .model-link.printables:hover {
    background: #e0531c;
  }
  .model-link.makerworld {
    background: #111;
    color: #fff;
  }
  .model-link.makerworld:hover {
    background: #333;
  }
  :global(html.dark) .model-link.makerworld {
    background: #f2f2f2;
    color: #111;
  }
  .model-link.pending {
    border: 1px dashed var(--card-border);
    color: var(--muted);
    font-weight: 500;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .editor-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    padding: 0.4rem;
    border-radius: 6px;
    border: 1px solid var(--card-border);
    color: inherit;
  }
  .editor-link:hover {
    background: rgba(127, 127, 127, 0.1);
  }
  .editor-link .material-symbols-outlined {
    font-size: 1.2rem;
  }
</style>
