// +layout.ts
import { browser } from '$app/environment'
import '$lib/i18n' // Import to initialize. Important :)
import { locale, waitLocale } from 'svelte-i18n'
import type { LayoutLoad } from './$types'
import { getLocaleFromPath, normalizeLocale, currentLocale, type SupportedLocale } from '$lib/functions/language'

export const load: LayoutLoad = async ({ url }) => {
	const pathLocale = getLocaleFromPath(url.pathname);
	let targetLocale: SupportedLocale = 'en';

	if (pathLocale) {
		targetLocale = pathLocale;
	} else if (browser) {
		const stored = localStorage.getItem('language') || sessionStorage.getItem('language');
		if (stored === 'cs' || stored === 'en') {
			targetLocale = stored;
		} else {
			targetLocale = normalizeLocale(window.navigator.language);
		}
	}

	locale.set(targetLocale);
	currentLocale.set(targetLocale);

	if (browser) {
		localStorage.setItem('language', targetLocale);
		sessionStorage.setItem('language', targetLocale);
		document.cookie = `locale=${targetLocale};path=/;max-age=31536000;SameSite=Lax`;
	}

	await waitLocale();

	return {
		locale: targetLocale
	};
}