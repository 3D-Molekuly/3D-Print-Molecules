<!--
    PrusaSlicerPluginNote
    =====================
    Points users to the PrusaSlicer plugin, a lite version of this web app.

    variant="compact" – small footer row, e.g. at the bottom of the slicer dropdown
    variant="card"    – standalone card, e.g. on the About page
-->
<script lang="ts">
  import { _ } from 'svelte-i18n';

  export let variant: 'compact' | 'card' = 'card';

  const MARKETPLACE_URL = 'https://plugin-marketplace.prusa3d.com/plugins/io.github.molekuly3d.molecules';
  const GITHUB_URL = 'https://github.com/molekuly3d/3d-molekuly-prusaslicer-plugin';
</script>

{#if variant === 'compact'}
  <div class="plugin-note-compact">
    <span class="material-symbols-outlined plugin-icon" aria-hidden="true">extension</span>
    <div class="plugin-note-text">
      <span class="plugin-note-title">{$_('prusaslicer_plugin_title')}</span>
      <span class="plugin-badge">{$_('prusaslicer_plugin_lite_badge')}</span>
      <div class="plugin-note-hint">{$_('prusaslicer_plugin_lite_hint')}</div>
      <div class="plugin-note-links">
        <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">{$_('prusaslicer_plugin_marketplace_link')} ↗</a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </div>
    </div>
  </div>
{:else}
  <aside class="plugin-note-card">
    <div class="plugin-note-header">
      <span class="material-symbols-outlined plugin-icon" aria-hidden="true">extension</span>
      <h3 class="plugin-note-heading">{$_('prusaslicer_plugin_title')}</h3>
      <span class="plugin-badge">{$_('prusaslicer_plugin_lite_badge')}</span>
    </div>
    <p class="plugin-note-desc">{$_('prusaslicer_plugin_desc')}</p>
    <div class="plugin-note-actions">
      <a class="btn btn-sm btn-outline-secondary" href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
        {$_('prusaslicer_plugin_marketplace_link')} ↗
      </a>
      <a class="btn btn-sm btn-outline-secondary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        {$_('prusaslicer_plugin_github_link')} ↗
      </a>
    </div>
  </aside>
{/if}

<style>
  .plugin-icon {
    font-size: 18px;
    color: #fa6831;
    flex-shrink: 0;
  }

  .plugin-badge {
    display: inline-block;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #b34a1f;
    background-color: rgba(250, 104, 49, 0.12);
    border: 1px solid rgba(250, 104, 49, 0.35);
    vertical-align: middle;
  }

  /* --- compact --- */
  .plugin-note-compact {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    margin-top: 0.35rem;
    padding: 0.6rem 1.1rem 0.3rem;
    border-top: 1px solid #e3e3e3;
    font-size: 0.8rem;
    color: #6c757d;
    white-space: normal;
    max-width: 280px;
  }

  .plugin-note-title {
    color: #495057;
    font-weight: 500;
    margin-right: 0.3rem;
  }

  .plugin-note-hint {
    margin-top: 0.1rem;
    line-height: 1.3;
  }

  .plugin-note-links {
    display: flex;
    gap: 0.9rem;
    margin-top: 0.2rem;
  }

  .plugin-note-links a {
    color: #6c757d;
    text-decoration: none;
  }

  .plugin-note-links a:hover,
  .plugin-note-links a:focus-visible {
    color: #fa6831;
    text-decoration: underline;
  }

  /* --- card --- */
  .plugin-note-card {
    margin: 2rem 0;
    padding: 1rem 1.25rem;
    border: 1px solid #e3e3e3;
    border-radius: 6px;
    background-color: rgba(250, 104, 49, 0.04);
  }

  .plugin-note-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .plugin-note-heading {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    border: none;
    padding: 0;
  }

  .plugin-note-desc {
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }

  .plugin-note-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  /* --- dark mode --- */
  :global(html.dark) .plugin-note-compact {
    border-top-color: #495057;
    color: #adb5bd;
  }

  :global(html.dark) .plugin-note-title {
    color: #dee2e6;
  }

  :global(html.dark) .plugin-note-links a {
    color: #adb5bd;
  }

  :global(html.dark) .plugin-badge {
    color: #ff9a70;
  }

  :global(html.dark) .plugin-note-card {
    border-color: #495057;
    background-color: rgba(250, 104, 49, 0.08);
  }
</style>
