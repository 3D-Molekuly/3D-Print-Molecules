<script lang="ts">
  import logo from '$lib/images/logo_v2.svg';
  import { _, locale } from 'svelte-i18n';
  import DarkmodeButton from '$lib/buttons/darkmodeButton.svelte';
  import {
    switchLocale,
    currentLocale,
    buildLocalizedPath,
    getLocaleFromPath,
    getTargetSwitchPath,
    supportedLocales,
    LOCALE_NAMES
  } from '$lib/functions/language';
  import { page } from '$app/stores';

  $: activeLocale = $currentLocale || $locale || 'en';
  $: activeLang = activeLocale.toUpperCase();
  $: localizedPath = (path: string) => buildLocalizedPath(path, $currentLocale || $locale || 'en');
  $: currentPath = $page.url.pathname;
  $: pathLocale = getLocaleFromPath(currentPath);
  $: homePath = pathLocale ? `/${pathLocale}` : '/';
</script>

<header class="p-3 mb-1 border-bottom">
  <div class="container">
    <div class="d-flex flex-wrap align-items-center justify-content-between">
      <a href={homePath} class="d-flex align-items-center mb-2 mb-sm-0 text-decoration-none header-brand">
        <img src={logo} alt="" aria-hidden="true" width="40" height="40" class="me-2">
        <span class="fs-3 text-black font-tittle">{$_('app_tittle')}</span>
      </a>

      <div class="d-flex align-items-center header-actions">
        <nav aria-label={$_('primary_nav_label') || 'Primary'} class="header-primary-nav">
          <ul class="nav mb-2 justify-content-center mb-md-0 me-3 header-nav">
            <li><a href={homePath} class="nav-link px-2 fs-4 text-grey">{$_('make_model_tittle')}</a></li>
            <li><a href={localizedPath('/tutorials')} class="nav-link px-2 fs-4 text-grey">{$_('tutorials_tittle')}</a></li>
            <li><a href={localizedPath('/examples')} class="nav-link px-2 fs-4 text-grey">{$_('examples_tittle')}</a></li>
            <li><a href={localizedPath('/about')} class="nav-link px-2 fs-4 text-grey">{$_('about_tittle')}</a></li>
          </ul>
        </nav>

        <div class="dropdown me-2">
          <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            {$_('app_language') || activeLang}
          </button>
          <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton">
            {#each supportedLocales as code (code)}
              <li>
                <a
                  class="dropdown-item d-flex justify-content-between gap-3"
                  class:active={activeLocale === code}
                  aria-current={activeLocale === code ? 'true' : undefined}
                  href={getTargetSwitchPath(code, currentPath)}
                  hreflang={code}
                  lang={code}
                  on:click={(event) => switchLocale(code, event)}
                >
                  <span>{LOCALE_NAMES[code]}</span>
                  <span class="lang-code">{code.toUpperCase()}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>

        <DarkmodeButton />
      </div>
    </div>
  </div>
</header>

<style>
  .font-tittle {
    font-family: "Handjet";
    font-weight: 700;
  }

  ul, .dropdown {
    font-family: "Handjet";
    font-weight: 400;
  }

  .lang-code {
    opacity: 0.6;
  }

  /* Telefon: logo + jazyk + motiv v prvním řádku, menu přes celou šířku pod nimi */
  @media (max-width: 575.98px) {
    header {
      padding-block: 0.75rem !important;
    }
    .header-actions {
      display: contents !important;
    }
    .header-brand {
      margin-inline-end: auto;
      margin-block-end: 0 !important;
      min-width: 0;
    }
    .header-brand .font-tittle {
      font-size: 1.5rem !important;
      white-space: nowrap;
    }
    .header-primary-nav {
      order: 3;
      flex: 1 1 100%;
      margin-block-start: 0.5rem;
    }
    .header-nav {
      flex-wrap: nowrap;
      justify-content: space-between !important;
      margin: 0 !important;
    }
    .header-nav .nav-link {
      font-size: 1.25rem !important;
      padding: 0.15rem 0.25rem !important;
      white-space: nowrap;
    }
    .header-nav li:first-child .nav-link {
      padding-inline-start: 0 !important;
    }
    .header-nav li:last-child .nav-link {
      padding-inline-end: 0 !important;
    }
  }
</style>