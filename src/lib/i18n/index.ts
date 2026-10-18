import { browser } from '$app/environment'
import { init, addMessages } from 'svelte-i18n'
import en from '../translations/en.json'
import cs from '../translations/cs.json'

const defaultLocale = 'en'

addMessages('en', en)
addMessages('cs', cs)

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