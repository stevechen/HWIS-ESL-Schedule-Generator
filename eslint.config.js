import globals from 'globals'; // <--- Import 'globals' package
import js from '@eslint/js';
import tseslint from 'typescript-eslint'; // <--- Renamed import to 'tseslint'
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default [
	// Standard ESLint recommended rules
	js.configs.recommended,

	// TypeScript ESLint recommended rules
	...tseslint.configs.recommended,

	// Svelte plugin recommended rules
	// Use 'flat/recommended' for ESLint v9
	...svelte.configs['flat/recommended'],

	// Prettier config (should be last)
	prettier,

	{
		// Global language options for all files
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			// Correctly apply browser and node globals using the 'globals' package
			globals: {
				...globals.browser, // <--- Correct way to enable browser globals
				...globals.node // <--- Correct way to enable node globals
				// If you have other specific globals, define them here:
				// exampleGlobal: 'readonly'
			},
			// Specify the TypeScript parser explicitly here for global settings
			// This is especially important for files not explicitly handled by a 'files' config
			parser: tseslint.parser,
			parserOptions: {
				project: './tsconfig.json', // Ensure this points to your tsconfig
				extraFileExtensions: ['.svelte']
			}
		},
		// General rules can go here if you have any
		rules: {
			// example-rule: 'error'
		}
	},
	{
		// Specific settings for Svelte files
		files: ['**/*.svelte'],
		languageOptions: {
			// Svelte files need the Svelte parser, which in turn uses the TS parser
			parser: svelte.parsers.svelte, // <--- Use svelte.parsers.svelte
			parserOptions: {
				parser: tseslint.parser // This ensures TypeScript parsing within Svelte files
			}
		}
	}
];
