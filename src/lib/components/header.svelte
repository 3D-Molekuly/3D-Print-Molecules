<script lang="ts">
  import logo from '$lib/images/icon_v1.jpg';

  import { _, locale } from 'svelte-i18n'
  function switchLocale(newLocale: string) {
    locale.set(newLocale);
  }
</script>

<header class="p-3 mb-1 border-bottom">
  <div class="container">
    <div class="d-flex flex-wrap align-items-center justify-content-between">
      <a href="/" class="d-flex align-items-center mb-2 mb-lg-0 text-decoration-none">
        <img src={logo} alt="Logo" width="40" height="40" class="me-2">
        <span class="fs-3 text-black font-tittle">{$_('app_tittle')}</span>
      </a>

      <div class="d-flex align-items-center">
        <ul class="nav mb-2 justify-content-center mb-md-0 me-3">
          <li><a href="/" class="nav-link px-2 fs-4 text-grey">{$_('make_model_tittle')}</a></li>
          <li><a href="/" class="nav-link px-2 fs-4 text-grey">{$_('tutorials_tittle')}</a></li>
          <li><a href="/" class="nav-link px-2 fs-4 text-grey">{$_('examples_tittle')}</a></li>
          <li><a href="/about" class="nav-link px-2 fs-4 text-grey">{$_('about_tittle')}</a></li>
        </ul>

        <div class="dropdown">
          <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            {$_('app_language')}
          </button>
          <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton">
            <li><a class="dropdown-item" href="/" on:click={() => switchLocale('cs')}>CS</a></li>
            <li><a class="dropdown-item" href="/" on:click={() => switchLocale('en')}>EN</a></li>
          </ul>
        </div>
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
