import { locale } from 'svelte-i18n';
import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

let storedLocale = 'en';
if (typeof window !== 'undefined') {
  storedLocale = sessionStorage.getItem('language') || 'en';
}
export const currentLocale = writable(storedLocale);

export function switchLocale(newLocale: string, event: Event) {
  event.preventDefault();

  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const newPath = path.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    locale.set(newLocale);
    sessionStorage.setItem("language", newLocale);
    currentLocale.set(newLocale);

    goto(newPath);
  }
}

export function buildLocalizedPath(path: string): string {
  const localeValue = get(currentLocale); // Získáme aktuální hodnotu store
  return `/${localeValue}${path}`;
}