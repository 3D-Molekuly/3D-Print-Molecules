import { locale } from 'svelte-i18n';
import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

export type SupportedLocale = 'cs' | 'en';
export const supportedLocales: SupportedLocale[] = ['cs', 'en'];
export const defaultLocale: SupportedLocale = 'en';

export function normalizeLocale(lang: string | null | undefined): SupportedLocale {
  if (!lang) return defaultLocale;
  const lower = lang.toLowerCase().trim();
  if (lower.startsWith('cs') || lower.startsWith('sk')) return 'cs';
  if (lower.startsWith('en')) return 'en';
  return defaultLocale;
}

export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(cs|en)(\/|$)/);
  return match ? (match[1] as SupportedLocale) : null;
}

export function getTargetSwitchPath(newLocale: string, currentPathname: string): string {
  const validLocale = normalizeLocale(newLocale);
  const pathLocale = getLocaleFromPath(currentPathname);
  if (pathLocale) {
    return currentPathname.replace(/^\/(cs|en)/, `/${validLocale}`);
  }
  return currentPathname;
}

function getInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const fromPath = getLocaleFromPath(window.location.pathname);
    if (fromPath) return fromPath;

    const fromStorage = localStorage.getItem('language') || sessionStorage.getItem('language');
    if (fromStorage === 'cs' || fromStorage === 'en') return fromStorage;

    return normalizeLocale(window.navigator.language);
  }
  return defaultLocale;
}

export const currentLocale = writable<SupportedLocale>(getInitialLocale());

export function switchLocale(newLocale: string, event?: Event) {
  if (event) {
    event.preventDefault();
  }

  const validLocale = normalizeLocale(newLocale);

  if (typeof window !== 'undefined') {
    localStorage.setItem('language', validLocale);
    sessionStorage.setItem('language', validLocale);
    document.cookie = `locale=${validLocale};path=/;max-age=31536000;SameSite=Lax`;

    locale.set(validLocale);
    currentLocale.set(validLocale);

    const pathname = window.location.pathname;
    const pathLocale = getLocaleFromPath(pathname);

    if (pathLocale) {
      const newPath = getTargetSwitchPath(validLocale, pathname);
      if (newPath !== pathname) {
        goto(newPath);
      }
    }
  }
}

export function buildLocalizedPath(path: string, localeOverride?: string): string {
  const localeValue = localeOverride ? normalizeLocale(localeOverride) : get(currentLocale);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${localeValue}${cleanPath}`;
}