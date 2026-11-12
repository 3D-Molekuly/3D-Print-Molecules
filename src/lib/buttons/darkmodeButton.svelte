<script lang="ts">
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import {
        THEME_PREFERENCES,
        applyTheme,
        getStoredPreference,
        onSystemThemeChange,
        resolveTheme,
        setStoredPreference,
        type AppliedTheme,
        type ThemePreference
    } from '$lib/functions/theme';

    let preference: ThemePreference = 'auto';
    let applied: AppliedTheme = 'light';

    const ICONS: Record<ThemePreference, string> = {
        auto: 'brightness_auto',
        light: 'light_mode',
        dark: 'dark_mode'
    };

    function refresh() {
        applied = resolveTheme(preference);
        applyTheme(applied);
    }

    onMount(() => {
        preference = getStoredPreference();
        refresh();

        // Follow the OS live while in auto mode (e.g. macOS/Android "Auto" switching at dusk).
        const unsubscribe = onSystemThemeChange(() => {
            if (preference === 'auto') refresh();
        });

        // Newly rendered headers/tables need the dark classes too.
        const observer = new MutationObserver(() => applyTheme(applied));
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            unsubscribe();
            observer.disconnect();
        };
    });

    function choose(pref: ThemePreference) {
        preference = pref;
        setStoredPreference(pref);
        refresh();
    }
</script>

<div class="dropdown">
    <button
        type="button"
        class="btn btn-secondary btm-m"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={$_('theme_label')}
        title={`${$_('theme_label')}: ${$_(`theme_${preference}`)}`}
    >
        <span class="material-symbols-outlined">{ICONS[preference]}</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
        {#each THEME_PREFERENCES as pref}
            <li>
                <button
                    type="button"
                    class="dropdown-item d-flex align-items-center gap-2"
                    class:active={preference === pref}
                    aria-pressed={preference === pref}
                    on:click={() => choose(pref)}
                >
                    <span class="material-symbols-outlined item-icon" aria-hidden="true">{ICONS[pref]}</span>
                    {$_(`theme_${pref}`)}
                </button>
            </li>
        {/each}
    </ul>
</div>

<style>
.material-symbols-outlined {
    margin: 0;
    padding: 0;
    display: inline-block;
}

.item-icon {
    font-size: 18px;
}

.dropdown-item {
    font-family: "Handjet";
    font-size: 1.1rem;
}

button.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.25rem;
    height: 31px;
    width: 31px;
}
</style>
