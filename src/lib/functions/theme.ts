export function getStoredTheme(): string {
    // Získání uložené hodnoty z localStorage nebo nastavení výchozí
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function toggleTheme(currentTheme: string): string {
    // Přepnutí aktuálního tématu
    return currentTheme === 'dark' ? 'light' : 'dark';
}

export function updateTheme(theme: string): void {
    const htmlElement = document.documentElement;

    // Globální přepínání třídy pro tmavý režim
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        document.querySelectorAll('header, table').forEach(el => {
            el.classList.add('bg-dark', 'text-white');
        });
        document.querySelectorAll('.table').forEach(el => {
            el.classList.add('table-dark');
        });
    } else {
        htmlElement.classList.remove('dark');
        document.querySelectorAll('header, table').forEach(el => {
            el.classList.remove('bg-dark', 'text-white');
        });
        document.querySelectorAll('.table').forEach(el => {
            el.classList.remove('table-dark');
        });
    }

    // Uložení aktuálního tématu do localStorage
    localStorage.setItem('theme', theme);
}