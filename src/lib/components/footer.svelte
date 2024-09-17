<script lang="ts">
    import vscht from '$lib/images/logoVSCHT.svg';
    import lf1 from '$lib/images/logo1LF.svg';
    import { _ } from 'svelte-i18n';
</script>

<div class="container">
    <footer class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
      <div class="col-md-4 d-flex align-items-center">
        <a href="/" class="mb-3 me-2 mb-md-0 text-muted text-decoration-none lh-1">
          <svg class="bi" width="30" height="24"><use xlink:href="#bootstrap"></use></svg>
        </a>
        <span class="mb-3 mb-md-0 text-muted">© 2024</span>
      </div>

      <ul class="nav col-md-4 justify-content-end list-unstyled d-flex">
        <li class="ms-2">
            <a class="text-muted" href="mailto:jakub.vavra456@student.cuni.cz?subject=3D%20Printing%20Molecules%20-%20Bug%20Report">{$_('bug_report')}</a>
        </li>
        <li class="ms-2">
            <a class="text-muted" href="https://www.vscht.cz">
                <img src={vscht} alt="VSCHT Logo" class="text-muted" width="24" height="24">
            </a>
        </li>
        <li class="ms-2">
            <a class="text-muted" href="https://www.lf1.cuni.cz">
                <img src={lf1} alt="1LF Logo" class="text-muted" width="24" height="24">
            </a>
        </li>
    </ul>

    </footer>
</div>

<style>
.text-muted img {
    filter: invert(50%) sepia(100%) saturate(0%) hue-rotate(0deg) brightness(80%) contrast(90%);
  }
</style>