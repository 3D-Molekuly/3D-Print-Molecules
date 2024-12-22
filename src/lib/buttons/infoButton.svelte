<script>
  import { onMount } from 'svelte';
  import 'bootstrap/dist/css/bootstrap.min.css';

  export let title = 'Nápověda';
  export let buttonText = '?';

  let showWindow = false;
  let showButton = true;
  let animateButton = true;

  onMount(() => {
      const savedState = localStorage.getItem('helpWindowClosed');
      if (savedState === 'true') {
          showButton = false;
      }

      setTimeout(() => {
          animateButton = false;
      }, 3000);
  });

  const minimizeWindow = () => {
      showWindow = false;
  };

  const closeWindow = () => {
      showWindow = false;
      showButton = false;
      localStorage.setItem('helpWindowClosed', 'true');
  };
</script>

<style>
  @keyframes bounce {
      0%, 100% {
          transform: translateY(0);
      }
      50% {
          transform: translateY(-10px);
      }
  }

  .bouncing {
      animation: bounce 0.5s ease-in-out infinite;
  }
</style>

{#if showButton}
  <button
      class="btn btn-primary rounded-circle position-fixed {animateButton ? 'bouncing' : ''}"
      style="bottom: 20px; right: 20px; width: 50px; height: 50px; z-index: 1050;"
      on:click={() => (showWindow = !showWindow)}
  >
      <b style="font-weight: 500; font-size: 1.5em;">{buttonText}</b>
  </button>
{/if}

{#if showWindow}
  <div
      class="position-fixed p-3 shadow text-dark bg-white"
      style="
          width: 380px;
          bottom: 80px;
          right: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          z-index: 1050;
      "
  >
      <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="m-0">{title}</h5>
          <div>
              <button class="btn btn-sm btn-outline-secondary me-1" on:click={minimizeWindow}>_</button>
              <button class="btn btn-sm btn-outline-danger" on:click={closeWindow}>×</button>
          </div>
      </div>
      <slot>
          <p>Výchozí text.</p>
      </slot>
  </div>
{/if}