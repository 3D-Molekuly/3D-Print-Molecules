<script>
    export let error;
    import { _ } from 'svelte-i18n';
</script>

<div class="error-container">
    <h1>{$_('error')} {error?.status}</h1>
    <p>{error?.message || $_('error_occurred')}</p>
</div>

<style>
    .error-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 50vh;
      text-align: center;
    }

    h1 {
      font-size: 3rem;
      color: red;
    }

    p {
      font-size: 1.5rem;
    }
</style>
