import { readable } from 'svelte/store';

/** Reactive `navigator.onLine` – `true` during SSR and until the browser reports otherwise. */
export const isOnline = readable(true, (set) => {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

	const update = () => set(navigator.onLine);
	update();
	window.addEventListener('online', update);
	window.addEventListener('offline', update);
	return () => {
		window.removeEventListener('online', update);
		window.removeEventListener('offline', update);
	};
});

/** Synchronous check usable inside event handlers. */
export function isOffline(): boolean {
	return typeof navigator !== 'undefined' && navigator.onLine === false;
}
