/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;

const ASSETS = [
	...build,
	...files
];

self.addEventListener('install', (event) => {
	self.skipWaiting();

	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) {
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

	// For navigation (HTML): ALWAYS network first to ensure fresh HTML and matching asset hashes
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(async () => {
				const cached = await caches.match(event.request);
				if (cached) return cached;
				throw new Error('Offline and page not cached');
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

	// For all other GET requests: network first with cache fallback
	event.respondWith(
		fetch(event.request).catch(() => caches.match(event.request))
	);
});
