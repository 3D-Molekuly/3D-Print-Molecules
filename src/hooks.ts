import type { Reroute } from '@sveltejs/kit';
import { supportedLocales } from '$lib/functions/language';

const LOCALE_HOME_RE = new RegExp(`^/(${supportedLocales.join('|')})/?$`);

export const reroute: Reroute = ({ url }) => {
	if (LOCALE_HOME_RE.test(url.pathname)) {
		return '/';
	}
};
