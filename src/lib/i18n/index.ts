// src/lib/i18n/index.ts
import { browser } from '$app/environment'
import { init, register } from 'svelte-i18n'

const defaultLocale = 'en'

register('en', () => import('../translations/en.json'))
register('cs', () => import('../translations/cs.json'))

let initial = defaultLocale;
if (browser) {
	const pathMatch = window.location.pathname.match(/^\/(cs|en)(\/|$)/);
	if (pathMatch) {
		initial = pathMatch[1];
	} else {
		const saved = localStorage.getItem('language') || sessionStorage.getItem('language');
		if (saved === 'cs' || saved === 'en') {
			initial = saved;
		} else {
			const nav = window.navigator.language?.toLowerCase() || '';
			initial = (nav.startsWith('cs') || nav.startsWith('sk')) ? 'cs' : 'en';
		}
	}
}

init({
	fallbackLocale: defaultLocale,
	initialLocale: initial,
})