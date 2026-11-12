// +layout.ts
import { browser } from '$app/environment'
import '$lib/i18n' // Import to initialize. Important :)
import { locale, waitLocale } from 'svelte-i18n'
import type { LayoutLoad } from './$types'
import { getLocaleFromPath, getStoredLocale, localeFromNavigator, currentLocale, HREFLANG, type SupportedLocale } from '$lib/functions/language'

export const load: LayoutLoad = async ({ url, data }) => {
	const pathLocale = getLocaleFromPath(url.pathname);
	let targetLocale: SupportedLocale = data?.locale ?? 'en';

	if (pathLocale) {
		targetLocale = pathLocale;
	} else if (browser) {
		targetLocale = getStoredLocale() ?? localeFromNavigator(window.navigator);
	}

	locale.set(targetLocale);
	currentLocale.set(targetLocale);

	if (browser) {
		// Only an explicit choice in the switcher is persisted (see switchLocale), so the
		// browser language keeps working as the default until the user picks one.
		document.documentElement.lang = HREFLANG[targetLocale];
	}

	await waitLocale();

	return {
		locale: targetLocale
	};
}