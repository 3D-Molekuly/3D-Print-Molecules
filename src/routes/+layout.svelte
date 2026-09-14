<script lang="ts">
	import { inject } from '@vercel/analytics';
	inject();

	import { _ } from 'svelte-i18n';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '../app.css';

	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';

	import { onMount } from 'svelte';
	import { getCurrentUrl } from '$lib/functions/utils';

	let currentUrl: string = '';

	$: localizedMeta = {
		title: $_('og_title'),
		description: $_('og_description'),
		keywords: $_('meta_keywords'),
		author: $_('meta_author'),
		url: currentUrl,
	};

	$: jsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": localizedMeta.title || "Default App",
		"description": localizedMeta.description || "Default description",
		"applicationCategory": "GraphicsApplication",
		"operatingSystem": "Cross-platform",
		"offers": {
			"@type": "Offer",
			"price": "0.00",
			"priceCurrency": ""
		},
		"author": {
			"@type": "Organization",
			"name": localizedMeta.author || "Default Author"
		},
		"url": localizedMeta.url || "",
	});

	onMount(() => {
	  currentUrl = getCurrentUrl();
	  // @ts-ignore
	  import('bootstrap/dist/js/bootstrap.bundle.min.js');

	  // Inside +layout.svelte or wherever you're registering the service worker
	  if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
			console.log('Service Worker registered: ', registration);
			})
			.catch((error) => {
			console.error('Service Worker registration failed: ', error);
			});
		}
	});

  </script>

<svelte:head>
	<title>{$_('app_tittle')}</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Handjet:wght@100..900&display=swap" rel="stylesheet" />

	<meta name="description" content="{$_('meta_description')}">
	<meta name="keywords" content="{$_('meta_keywords')}">
	<meta name="author" content="{$_('meta_author')}">
	<meta property="og:title" content="{$_('og_title')}">
	<meta property="og:description" content="{$_('og_description')}">
	<meta property="og:url" content={currentUrl}>
	<meta property="og:image" content="">

	{#if jsonLd}
		<script type="application/ld+json">{jsonLd}</script>
	{/if}
</svelte:head>

<div class="app">
	<Header />

	<main class="main-content">
		<slot />
	</main>

	<Footer />
</div>

<style>

</style>