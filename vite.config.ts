import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true
	},
	test: {
		include: ['src/**/*.test.ts'],
		exclude: ['src/lib/geometry/movingJoints.test.ts', 'node_modules/**']
	}
});