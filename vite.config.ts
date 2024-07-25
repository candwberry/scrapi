import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 80,
		strictPort: false // means you can use another port if not 80
	},
	build: {
		rollupOptions: {
			external: [
				"sqlite"
			]
		},
	}
});
