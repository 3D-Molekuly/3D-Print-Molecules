<script lang="ts">
    import { onMount } from 'svelte';
    import { updateTheme, toggleTheme, getStoredTheme } from '$lib/functions/theme';

    let theme: string = 'light'; // Výchozí hodnota

    onMount(() => {
    // Načtení aktuálního tématu nebo výchozí hodnoty
    theme = getStoredTheme();
    updateTheme(theme);

    // Pozorování změn v DOM
    const observer = new MutationObserver(() => {
        updateTheme(theme);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect(); // Uvolnění observeru při odpojení komponenty
});

const handleClick = () => {
    theme = toggleTheme(theme); // Přepnutí tématu
    updateTheme(theme); // Aktualizace tématu
};
</script>

<button type="button" class="btn btn-secondary btn-sm" on:click={handleClick}>
    {theme === 'dark' ? '🌞' : '🌑'}
</button>

<style>

</style>