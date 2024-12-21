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

<button type="button" class="btn btn-secondary btm-m" on:click={handleClick}>
    <span class="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
</button>

<style>
.material-symbols-outlined {
    margin: 0; /* Odstraňte jakékoli vnější mezery */
    padding: 0; /* Odstraňte vnitřní mezery */
    display: inline-block; /* Zajistěte, že ikona má přesnou velikost */
}

button.btn {
    display: inline-flex; /* Zajistí konzistentní zarovnání obsahu tlačítka */
    align-items: center; /* Vertikální zarovnání obsahu ve středu */
    justify-content: center; /* Horizontální zarovnání obsahu ve středu */
    padding: 0.25rem 0.25rem; /* Použití stejného paddingu jako Bootstrap btn-sm */
    height: 31px;
    width: 31px;
}
</style>
