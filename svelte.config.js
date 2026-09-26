import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
	kit: {
		adapter: adapter(),
		// Registered by hand in +layout.svelte, so it can be left out of
		// `pnpm dev` — see docs/service-worker.md.
		serviceWorker: { register: false }
	}
};

export default config;
