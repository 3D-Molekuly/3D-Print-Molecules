import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// Kekule.js loads OpenBabel (WASM) for offline 3D generation at runtime by URL,
// so the files must be served as static assets. Copy them from node_modules into
// static/kekule/extra (git-ignored) before SvelteKit collects static files.
function copyKekuleOpenBabelAssets() {
	const srcDir = resolve('node_modules/kekule/dist/extra');
	const destDir = resolve('static/kekule/extra');
	const files = ['openbabel.js', 'openbabel.wasm', 'openbabel.data', 'kekule.worker.obStructureGenerator.js'];
	if (!existsSync(srcDir)) return;
	mkdirSync(destDir, { recursive: true });
	for (const file of files) {
		const src = resolve(srcDir, file);
		const dest = resolve(destDir, file);
		if (!existsSync(dest) || statSync(dest).size !== statSync(src).size) {
			copyFileSync(src, dest);
		}
	}
}
copyKekuleOpenBabelAssets();

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es'
	},
	server: {
		port: 3000,
		host: true
	},
	test: {
		include: ['src/**/*.test.ts'],
		exclude: ['src/lib/geometry/movingJoints.test.ts', 'node_modules/**']
	}
});