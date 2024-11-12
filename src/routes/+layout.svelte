<script>
	import { inject } from '@vercel/analytics';
	inject();

	import { _ } from 'svelte-i18n';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '../app.css';

	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';

	import { onMount } from 'svelte';
  	onMount(() => {
		import('bootstrap/dist/js/bootstrap.bundle.min.js');
	});
</script>

<svelte:head>
	<title>{$_('app_tittle')}</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Handjet:wght@100..900&display=swap" rel="stylesheet" />
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