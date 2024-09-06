<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '../app.css';

 	import { onMount } from 'svelte';
  	onMount(() => {
		import('bootstrap/dist/js/bootstrap.bundle.min.js');
	});

	import Header from '$lib/components/header.svelte';
</script>

<svelte:head>
	<title>3D Print Molecules</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Handjet:wght@100..900&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<footer>

	</footer>
</div>