/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;

// Kekule/OpenBabel WASM assets (~8 MB) are not precached for every visitor;
// they are cached on first use by the drawing tool (see fetch handler below).
const KEKULE_PREFIX = '/kekule/';
const KEKULE_CACHE = 'kekule-openbabel-v1';

// Google Fonts (Exo 2, Handjet, Material Symbols icons) — without them the UI shows raw
// ligature text ("settings", "download") instead of icons when offline.
const FONT_CACHE = 'google-fonts-v1';
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

const ASSETS = [
	...build,
	...files.filter((f) => !f.startsWith(KEKULE_PREFIX))
];

// Main navigation routes precached so the app opens offline even if never visited before.
const PAGES = ['/', '/cs', '/en', '/cs/tutorials', '/en/tutorials', '/cs/about', '/en/about'];
const OFFLINE_FALLBACKS = ['/', '/cs', '/en'];
// SvelteKit client-side navigation loads server data from `<route>/__data.json`
const DATA_SUFFIX = '/__data.json';
const PAGE_DATA = PAGES.map((page) => (page === '/' ? '' : page) + DATA_SUFFIX);

/** @param {Response} response */
function isStorable(response) {
	return response.ok && response.type === 'basic' && !response.redirected;
}

self.addEventListener('install', (event) => {
	self.skipWaiting();

	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
		// Pages are best-effort: a single failing route must not abort SW installation
		await Promise.all(
			[...PAGES, ...PAGE_DATA].map((path) =>
				fetch(path)
					.then((response) => {
						if (isStorable(response)) return cache.put(path, response);
					})
					.catch(() => {})
			)
		);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE && key !== KEKULE_CACHE && key !== FONT_CACHE) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

	// For navigation (HTML): network first (fresh HTML with matching asset hashes),
	// store the response so the page is available offline next time
	if (event.request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				try {
					const response = await fetch(event.request);
					if (isStorable(response)) cache.put(event.request, response.clone());
					return response;
				} catch {
					const cached = await cache.match(event.request, { ignoreSearch: true });
					if (cached) return cached;
					for (const fallback of OFFLINE_FALLBACKS) {
						const page = await cache.match(fallback);
						if (page) return page;
					}
					return new Response('Offline and page not cached', {
						status: 503,
						headers: { 'Content-Type': 'text/plain; charset=utf-8' }
					});
				}
			})()
		);
		return;
	}

	// Google Fonts: stylesheet network first (it is tailored to the browser), font files cache first
	if (FONT_ORIGINS.includes(url.origin)) {
		event.respondWith(
			caches.open(FONT_CACHE).then(async (cache) => {
				const cached = await cache.match(event.request);
				if (cached && url.origin === 'https://fonts.gstatic.com') return cached;
				try {
					const response = await fetch(event.request);
					if (response.ok || response.type === 'opaque') cache.put(event.request, response.clone());
					return response;
				} catch (err) {
					if (cached) return cached;
					throw err;
				}
			})
		);
		return;
	}

	// Kekule/OpenBabel runtime files: cache first, store on first fetch (enables offline 3D generation)
	if (url.origin === self.location.origin && url.pathname.startsWith(KEKULE_PREFIX)) {
		event.respondWith(
			caches.open(KEKULE_CACHE).then(async (cache) => {
				const cached = await cache.match(event.request);
				if (cached) return cached;
				const response = await fetch(event.request);
				if (response.ok) cache.put(event.request, response.clone());
				return response;
			})
		);
		return;
	}

	// For immutable assets & static files: cache first with network fallback
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then((response) => response || fetch(event.request))
		);
		return;
	}

	// Route data for client-side navigation: network first, stored for offline use
	if (url.origin === self.location.origin && url.pathname.endsWith(DATA_SUFFIX)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => {
				try {
					const response = await fetch(event.request);
					if (isStorable(response)) cache.put(url.pathname, response.clone());
					return response;
				} catch (err) {
					const cached = await cache.match(url.pathname);
					if (cached) return cached;
					throw err;
				}
			})
		);
		return;
	}

	// For all other GET requests: network first with cache fallback
	event.respondWith(
		fetch(event.request).catch(async (err) => {
			const cached = await caches.match(event.request);
			if (cached) return cached;
			throw err;
		})
	);
});
