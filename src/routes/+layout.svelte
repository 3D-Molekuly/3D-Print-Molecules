<script lang="ts">
	import { inject } from '@vercel/analytics';
	inject();

	import { _ } from 'svelte-i18n';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '../app.css';

	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';

	import { onMount } from 'svelte';

	let theme = 'light';

	onMount(() => {
		import('bootstrap/dist/js/bootstrap.bundle.min.js');

		theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		updateTheme();

		// Přidání pozorování na změny obsahu
		const observer = new MutationObserver(() => {
			updateTheme();
		});
		observer.observe(document.body, { childList: true, subtree: true });

		return () => observer.disconnect(); // Uvolnění observeru při zničení komponenty
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		updateTheme();
	}

	function updateTheme() {
		const htmlElement = document.documentElement;

		// Globální přepínání třídy pro tmavý režim
		if (theme === 'dark') {
			htmlElement.classList.add('dark');

			// Dynamické úpravy pro Bootstrap prvky
			document.querySelectorAll('header, table').forEach(el => {
				el.classList.add('bg-dark', 'text-white');
			});
			document.querySelectorAll('.table').forEach(el => {
				el.classList.add('table-dark');
			});
		} else {
			htmlElement.classList.remove('dark');

			// Odebrání tmavých tříd
			document.querySelectorAll('header, table').forEach(el => {
				el.classList.remove('bg-dark', 'text-white');
			});
			document.querySelectorAll('.table').forEach(el => {
				el.classList.remove('table-dark');
			});
		}

		localStorage.setItem('theme', theme);
	}
</script>

<button class="btn btn-primary" on:click={toggleTheme}>
	Přepnout na {theme === 'dark' ? 'světlý' : 'tmavý'} režim
</button>


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