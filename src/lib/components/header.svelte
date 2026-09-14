<script lang="ts">
  import logo from '$lib/images/logo_v2.svg';
  import { _, locale } from 'svelte-i18n';
  import DarkmodeButton from '$lib/buttons/darkmodeButton.svelte';
  import { switchLocale, currentLocale, buildLocalizedPath, getTargetSwitchPath } from '$lib/functions/language';
  import { page } from '$app/stores';

  $: activeLang = ($currentLocale || $locale || 'en').toUpperCase();
  $: localizedPath = (path: string) => buildLocalizedPath(path, $currentLocale || $locale || 'en');
  $: currentPath = $page.url.pathname;
  $: csSwitchPath = getTargetSwitchPath('cs', currentPath);
  $: enSwitchPath = getTargetSwitchPath('en', currentPath);
</script>

<header class="p-3 mb-1 border-bottom">
  <div class="container">
    <div class="d-flex flex-wrap align-items-center justify-content-between">
      <a href="/" class="d-flex align-items-center mb-2 mb-sm-0 text-decoration-none">
        <img src={logo} alt="Logo" width="40" height="40" class="me-2">
        <span class="fs-3 text-black font-tittle">{$_('app_tittle')}</span>
      </a>

      <div class="d-flex align-items-center">
        <ul class="nav mb-2 justify-content-center mb-md-0 me-3">
          <li><a href="/" class="nav-link px-2 fs-4 text-grey">{$_('make_model_tittle')}</a></li>
          <li><a href={localizedPath('/tutorials')} class="nav-link px-2 fs-4 text-grey">{$_('tutorials_tittle')}</a></li>
          <li><a href="https://www.printables.com/@3DPMol_5381976/models" target="_blank" rel="noopener noreferrer" class="nav-link px-2 fs-4 text-grey">{$_('examples_tittle')}</a></li>
          <li><a href={localizedPath('/about')} class="nav-link px-2 fs-4 text-grey">{$_('about_tittle')}</a></li>
        </ul>

        <div class="dropdown me-2">
          <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            {$_('app_language') || activeLang}
          </button>
          <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton">
            <li>
              <a
                class="dropdown-item"
                class:active={activeLang === 'CS'}
                href={csSwitchPath}
                on:click={(event) => switchLocale('cs', event)}
              >
                CS
              </a>
            </li>
            <li>
              <a
                class="dropdown-item"
                class:active={activeLang === 'EN'}
                href={enSwitchPath}
                on:click={(event) => switchLocale('en', event)}
              >
                EN
              </a>
            </li>
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
</style>