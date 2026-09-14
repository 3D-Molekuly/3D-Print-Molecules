// hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { locale } from 'svelte-i18n'
import { getLocaleFromPath, normalizeLocale, type SupportedLocale } from '$lib/functions/language'

export const handle: Handle = async ({ event, resolve }) => {
	const pathLocale = getLocaleFromPath(event.url.pathname);
	let serverLocale: SupportedLocale = 'en';

	if (pathLocale) {
		serverLocale = pathLocale;
	} else {
		const cookieLocale = event.cookies.get('locale');
		if (cookieLocale === 'cs' || cookieLocale === 'en') {
			serverLocale = cookieLocale;
		} else {
			const acceptLang = event.request.headers.get('accept-language')?.split(',')[0];
			serverLocale = normalizeLocale(acceptLang);
		}
	}

	locale.set(serverLocale);
	return resolve(event);
}