import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), svelteInspector(), sveltekit()],
	test: {
		include: ['src/tests/unit/**/*.{test,spec}.{js,ts}', 'src/lib/**/*.{test,spec}.{js,ts}']
	}
});
