import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0', // nebo přímo vaše IP, např. '192.168.1.x'
		port: 3000,      // volitelně lze nastavit port
	  },
});