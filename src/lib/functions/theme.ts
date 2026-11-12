/**
 * Theme handling.
 *
 * The user picks a *preference* ('auto' | 'light' | 'dark'); the *applied* theme is always
 * 'light' or 'dark'. With 'auto' (the default) the site follows the operating system's
 * `prefers-color-scheme`, live – so when the OS switches to dark mode in the evening,
 * the page follows without a reload. Only an explicit choice is persisted.
 */
export type ThemePreference = 'auto' | 'light' | 'dark';
export type AppliedTheme = 'light' | 'dark';

// New key on purpose: the previous version auto-saved the OS theme under 'theme' on every
// visit, so that value does not reflect a real user choice and is discarded.
const STORAGE_KEY = 'theme-preference';
const LEGACY_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export const THEME_PREFERENCES: ThemePreference[] = ['auto', 'light', 'dark'];

export function getStoredPreference(): ThemePreference {
    try {
        localStorage.removeItem(LEGACY_KEY);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {
        /* storage blocked – fall back to auto */
    }
    return 'auto';
}

export function setStoredPreference(pref: ThemePreference): void {
    try {
        if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, pref);
    } catch {
        /* ignore */
    }
}

export function systemPrefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(pref: ThemePreference): AppliedTheme {
    if (pref === 'auto') return systemPrefersDark() ? 'dark' : 'light';
    return pref;
}

/** Applies the theme to the document (does not persist anything). */
export function applyTheme(theme: AppliedTheme): void {
    const htmlElement = document.documentElement;
    const dark = theme === 'dark';

    htmlElement.classList.toggle('dark', dark);
    document.querySelectorAll('header, table').forEach((el) => {
        el.classList.toggle('bg-dark', dark);
        el.classList.toggle('text-white', dark);
    });
    document.querySelectorAll('.table').forEach((el) => {
        el.classList.toggle('table-dark', dark);
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', dark ? '#212529' : '#ffffff');
}

/** Calls `callback` whenever the OS colour scheme changes. Returns an unsubscribe function. */
export function onSystemThemeChange(callback: () => void): () => void {
    const mq = window.matchMedia(DARK_QUERY);
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
}
