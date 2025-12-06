import vercel from '@sveltejs/adapter-vercel';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	kit: {
		adapter: vercel(),
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	},
	// preprocess: vitePreprocess(),
	vitePlugin: {
		inspector: {
			toggleKeyCombo: 'meta-shift',
			// holdMode: true,
			showToggleButton: 'always',
			navKeys: {
				parent: 'ArrowUp',
				child: 'ArrowDown',
				next: 'ArrowRight',
				prev: 'ArrowLeft'
			}
		}
	}
};

export default config;
