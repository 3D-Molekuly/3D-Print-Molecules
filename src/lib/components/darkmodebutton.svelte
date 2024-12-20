<script lang="ts">
    import { onMount } from 'svelte';
    import { updateTheme, toggleTheme, getStoredTheme } from '$lib/functions/theme';

    let theme: string = 'light'; // Výchozí hodnota

    onMount(() => {
        // Načtení hodnoty z localStorage nebo výchozí nastavení podle preferencí uživatele
        theme = getStoredTheme();
        updateTheme(theme); // Aktualizace tématu na základě načtené hodnoty
    });

    // Přepínání tématu při kliknutí
    const handleClick = () => {
        theme = toggleTheme(theme); // Přepnutí hodnoty
        updateTheme(theme); // Aktualizace tématu
    };
</script>

<button type="button" class="btn btn-secondary btn-sm" on:click={handleClick}>
    {theme === 'dark' ? '🌞' : '🌑'}
</button>

<style>

</style>