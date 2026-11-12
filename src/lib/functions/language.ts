import { locale } from 'svelte-i18n';
import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

export const supportedLocales = ['cs', 'en', 'de', 'fr', 'es', 'pt', 'zh', 'ja'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultLocale: SupportedLocale = 'en';

/** Native names shown in the language switcher. */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  cs: 'Čeština',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  zh: '简体中文',
  ja: '日本語'
};

/**
 * Locales translated by AI (not reviewed by the authors). The switcher marks them with an
 * icon, and the pages show nothing else – remove a locale from here once a native speaker
 * has reviewed it.
 */
export const MACHINE_TRANSLATED_LOCALES: ReadonlySet<SupportedLocale> = new Set([
  'de',
  'fr',
  'es',
  'pt',
  'zh',
  'ja'
]);

/** BCP 47 tags for hreflang / html lang where they differ from the URL code. */
export const HREFLANG: Record<SupportedLocale, string> = {
  cs: 'cs',
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  zh: 'zh-Hans',
  ja: 'ja'
};

/** Open Graph locale codes. */
export const OG_LOCALES: Record<SupportedLocale, string> = {
  cs: 'cs_CZ',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
  pt: 'pt_PT',
  zh: 'zh_CN',
  ja: 'ja_JP'
};

const LOCALE_GROUP = supportedLocales.join('|');
/** Matches a leading locale segment, e.g. `/de` or `/de/about`. Group 1 is the locale. */
export const LOCALE_PATH_RE = new RegExp(`^/(${LOCALE_GROUP})(?=/|$)`);

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (supportedLocales as readonly string[]).includes(value);
}

/** Maps any language tag (e.g. `de-AT`, `pt-BR`, `sk`) to a supported locale. */
export function normalizeLocale(lang: string | null | undefined): SupportedLocale {
  if (!lang) return defaultLocale;
  const primary = lang.toLowerCase().trim().split(/[-_]/)[0];
  if (primary === 'sk') return 'cs';
  if (isSupportedLocale(primary)) return primary;
  return defaultLocale;
}

/** Picks the best supported locale from an Accept-Language header (respects q-weights). */
export function localeFromAcceptLanguage(header: string | null | undefined): SupportedLocale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    if (primary === 'sk') return 'cs';
    if (isSupportedLocale(primary)) return primary;
  }
  return defaultLocale;
}

/** Picks the best supported locale from the browser's language list. */
export function localeFromNavigator(nav: Pick<Navigator, 'language' | 'languages'>): SupportedLocale {
  const list = nav.languages?.length ? nav.languages : [nav.language];
  return localeFromAcceptLanguage(list.filter(Boolean).join(','));
}

export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(LOCALE_PATH_RE);
  return match ? (match[1] as SupportedLocale) : null;
}

/** Removes the leading locale segment: `/de/about` → `/about`, `/de` → ``. */
export function stripLocaleFromPath(pathname: string): string {
  return pathname.replace(LOCALE_PATH_RE, '');
}

export function getTargetSwitchPath(newLocale: string, currentPathname: string): string {
  const validLocale = normalizeLocale(newLocale);
  const pathLocale = getLocaleFromPath(currentPathname);
  if (pathLocale) {
    return currentPathname.replace(LOCALE_PATH_RE, `/${validLocale}`);
  }
  if (!currentPathname || currentPathname === '/') {
    return `/${validLocale}`;
  }
  return currentPathname;
}

export function getStoredLocale(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem('language') || sessionStorage.getItem('language');
    return isSupportedLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Client-side locale detection: URL → saved choice → browser languages. */
export function detectClientLocale(): SupportedLocale {
  if (typeof window === 'undefined') return defaultLocale;
  return (
    getLocaleFromPath(window.location.pathname) ??
    getStoredLocale() ??
    localeFromNavigator(window.navigator)
  );
}

export const currentLocale = writable<SupportedLocale>(detectClientLocale());

export function persistLocale(value: SupportedLocale) {
  if (typeof window === 'undefined') return;
  document.documentElement.lang = HREFLANG[value];
  try {
    localStorage.setItem('language', value);
    sessionStorage.setItem('language', value);
  } catch {
    /* ignore */
  }
  document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
}

export function switchLocale(newLocale: string, event?: Event) {
  if (event) {
    event.preventDefault();
  }

  const validLocale = normalizeLocale(newLocale);

  if (typeof window !== 'undefined') {
    persistLocale(validLocale);

    locale.set(validLocale);
    currentLocale.set(validLocale);

    const pathname = window.location.pathname;
    const pathLocale = getLocaleFromPath(pathname);

    if (pathLocale) {
      const newPath = getTargetSwitchPath(validLocale, pathname);
      if (newPath !== pathname) {
        goto(`${newPath}${window.location.search}${window.location.hash}`);
      }
    }
  }
}

export function buildLocalizedPath(path: string, localeOverride?: string): string {
  const localeValue = localeOverride ? normalizeLocale(localeOverride) : get(currentLocale);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${localeValue}${cleanPath}`;
}
