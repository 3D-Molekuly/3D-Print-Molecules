<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('/cs');
  });
</script>

<svelte:head>
  <meta http-equiv="refresh" content="0; url=/cs" />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container py-5 text-center" style="max-width: 640px; min-height: 50vh;">
  <div class="card shadow-sm p-4 mt-4">
    <h1 class="h3 mb-3">Příklady modelů molekul</h1>
    <p class="text-muted mb-4">
      Hledáte ukázky vytištěných 3D modelů molekul? Tato stránka byla přesunuta. Hotové modely připravené k tisku najdete v naší kolekci na Printables, případně si můžete vytvořit vlastní model přímo v aplikaci.
    </p>
    <div class="d-flex flex-wrap gap-2 justify-content-center">
      <a href="/cs" class="btn btn-primary">
        Přejít do generátoru molekul
      </a>
      <a
        href="https://www.printables.com/@3DPMol_5381976/models"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-outline-secondary"
      >
        Modely na Printables
      </a>
      <a href="/cs/tutorials" class="btn btn-outline-secondary">
        Návody a postupy
      </a>
    </div>
  </div>
</div>
