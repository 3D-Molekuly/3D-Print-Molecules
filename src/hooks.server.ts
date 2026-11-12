// hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { locale } from 'svelte-i18n'
import { getLocaleFromPath, isSupportedLocale, localeFromAcceptLanguage, HREFLANG, type SupportedLocale } from '$lib/functions/language'

export const handle: Handle = async ({ event, resolve }) => {
	const pathLocale = getLocaleFromPath(event.url.pathname);
	let serverLocale: SupportedLocale = 'en';

	if (pathLocale) {
		serverLocale = pathLocale;
	} else {
		const cookieLocale = event.cookies.get('locale');
		if (isSupportedLocale(cookieLocale)) {
			serverLocale = cookieLocale;
		} else {
			serverLocale = localeFromAcceptLanguage(event.request.headers.get('accept-language'));
		}
	}

	event.locals.locale = serverLocale;
	locale.set(serverLocale);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', HREFLANG[serverLocale])
	});
}