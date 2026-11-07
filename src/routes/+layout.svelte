<script lang="ts">
	import { inject } from '@vercel/analytics';
	import { dev, browser } from '$app/environment';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '../app.css';

	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';

	import { onMount } from 'svelte';
	import { currentLocale, normalizeLocale } from '$lib/functions/language';
	import { getRouteSeo } from '$lib/seo';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	if (browser) {
		try {
			inject();
		} catch (_) {}
	}

	$: resolvedLocale = normalizeLocale($currentLocale || $locale || data?.locale || 'en');
	$: seo = getRouteSeo($page.url, resolvedLocale);

	onMount(() => {
		// @ts-ignore
		import('bootstrap/dist/js/bootstrap.bundle.min.js');

		if (dev) {
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.getRegistrations().then((registrations) => {
					for (const registration of registrations) {
						registration.unregister();
					}
				});
			}
			if ('caches' in window) {
				caches.keys().then((names) => {
					for (const name of names) {
						caches.delete(name);
					}
				});
			}
		} else if ('caches' in window) {
			// Clear legacy service worker cache if still present in client
			caches.delete('my-pwa-cache-v1').catch(() => {});
		}
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="color-scheme" content="light dark" />

	<meta name="description" content={seo.description} />
	<meta name="keywords" content={seo.keywords} />
	<meta name="author" content={seo.author} />
	<meta name="robots" content={seo.robots} />

	<link rel="canonical" href={seo.canonicalUrl} />
	{#each seo.alternates as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={seo.siteName} />
	<meta property="og:locale" content={seo.ogLocale} />
	<meta property="og:locale:alternate" content={seo.ogLocaleAlternate} />
	<meta property="og:title" content={seo.ogTitle} />
	<meta property="og:description" content={seo.ogDescription} />
	<meta property="og:url" content={seo.ogUrl} />
	<meta property="og:image" content={seo.ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="800" />
	<meta property="og:image:alt" content={seo.ogImageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.ogTitle} />
	<meta name="twitter:description" content={seo.ogDescription} />
	<meta name="twitter:image" content={seo.ogImage} />
	<meta name="twitter:image:alt" content={seo.ogImageAlt} />

	{@html seo.jsonLdHtml}
</svelte:head>

<div class="app">
	<Header />

	<main id="main-content" class="main-content">
		<slot />
	</main>

	<Footer />
</div>
