import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
	if (
		url.pathname === '/cs' ||
		url.pathname === '/cs/' ||
		url.pathname === '/en' ||
		url.pathname === '/en/'
	) {
		return '/';
	}
};
