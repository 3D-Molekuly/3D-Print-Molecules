import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			runtime: 'nodejs24.x'
		}),
		paths: {
			relative: false
		},
		// Inline small CSS chunks into the HTML to cut render-blocking requests (PageSpeed).
		inlineStyleThreshold: 8192,
		// Registered manually in src/routes/+layout.svelte (production only)
		serviceWorker: {
			register: false
		}
	}
};

export default config;
