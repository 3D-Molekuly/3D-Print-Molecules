<script lang="ts">
  import type { SupportedLocale } from '$lib/functions/language';
  import {
    PRINTED_MODELS,
    PRINTABLES_PROFILE_URL,
    MAKERWORLD_PROFILE_URL
  } from '$lib/data/printedModels';

  export let lang: SupportedLocale;

  const TEXT = {
    cs: {
      heading: 'Vytištěné 3D modely molekul',
      intro:
        'Ukázky molekul, které jsme připravili v aplikaci a vytiskli. Hotové soubory 3MF a STL si můžete zdarma stáhnout z Printables nebo MakerWorld, nebo si model upravit a vygenerovat přímo v naší aplikaci.',
      channels: 'Celá sbírka na našich profilech',
      openEditor: 'Upravit v aplikaci',
      photoAlt: 'Vytištěný 3D model molekuly',
      ctaHeading: 'Chybí vám tu molekula?',
      ctaText: 'Vygenerujte si vlastní model z PubChem, PDB nebo COD během pár vteřin.',
      ctaButton: 'Otevřít generátor'
    },
    en: {
      heading: '3D Printed Molecular Models',
      intro:
        'Molecules we prepared in the app and printed. Download the ready-to-print 3MF and STL files for free from Printables or MakerWorld, or tweak and generate the model yourself in our web app.',
      channels: 'Full collection on our profiles',
      openEditor: 'Edit in the app',
      photoAlt: '3D printed molecular model',
      ctaHeading: 'Missing a molecule?',
      ctaText: 'Generate your own model from PubChem, PDB or COD in seconds.',
      ctaButton: 'Open the generator'
    }
  } as const;

  $: t = TEXT[lang];
  $: editorHref = (query: string) => `/${lang}?mol=${encodeURIComponent(query)}`;
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

  <ul class="model-grid">
    {#each PRINTED_MODELS as model (model.id)}
      <li class="model-card" id={model.id}>
        <a href={model.printablesUrl} target="_blank" rel="noopener" class="model-photo" tabindex="-1">
          <img
            src={model.image}
            alt={`${t.photoAlt}: ${model.name[lang]}`}
            width="640"
            height="480"
            loading="lazy"
            decoding="async"
          />
        </a>
        <div class="model-body">
          <h2>{model.name[lang]}</h2>
          <p>{model.description[lang]}</p>
          <div class="model-links">
            <a href={model.printablesUrl} target="_blank" rel="noopener" class="model-link printables">
              Printables <span aria-hidden="true">↗</span>
            </a>
            <a href={model.makerworldUrl} target="_blank" rel="noopener" class="model-link makerworld">
              MakerWorld <span aria-hidden="true">↗</span>
            </a>
          </div>
          {#if model.editorQuery}
            <a href={editorHref(model.editorQuery)} class="editor-link">
              <span class="material-symbols-outlined" aria-hidden="true">deployed_code</span>
              {t.openEditor}
            </a>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <section class="gallery-cta">
    <h2>{t.ctaHeading}</h2>
    <p>{t.ctaText}</p>
    <a href={`/${lang}`} class="btn btn-primary btn-lg">{t.ctaButton}</a>
  </section>
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
  .model-body h2 {
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

  .gallery-cta {
    text-align: center;
    margin-top: 3rem;
  }
  .gallery-cta h2 {
    font-size: 1.5rem;
  }
  .gallery-cta p {
    color: var(--muted);
  }
</style>
