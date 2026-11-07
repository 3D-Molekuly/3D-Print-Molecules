<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('/en');
  });
</script>

<svelte:head>
  <meta http-equiv="refresh" content="0; url=/en" />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container py-5 text-center" style="max-width: 640px; min-height: 50vh;">
  <div class="card shadow-sm p-4 mt-4">
    <h1 class="h3 mb-3">Molecular Model Examples</h1>
    <p class="text-muted mb-4">
      Looking for 3D printed molecule models? This page has been moved. Explore ready-to-print models on Printables or generate custom molecules directly in our web app.
    </p>
    <div class="d-flex flex-wrap gap-2 justify-content-center">
      <a href="/en" class="btn btn-primary">
        Open 3D Molecule Generator
      </a>
      <a
        href="https://www.printables.com/@3DPMol_5381976/models"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-outline-secondary"
      >
        View Models on Printables
      </a>
      <a href="/en/tutorials" class="btn btn-outline-secondary">
        Tutorials & Guides
      </a>
    </div>
  </div>
</div>
