import { locators, type Locator } from 'vitest/browser';

// This version of vitest/browser does not expose `page.locator(selector)`.
// Register a CSS-selector locator (e.g. `page.getByCSS('#master-checkbox')`)
// through the documented `locators.extend` API.
locators.extend({
	getByCSS(css: string) {
		return `css=${css}`;
	}
});

declare module 'vitest/browser' {
	interface LocatorSelectors {
		getByCSS(css: string): Locator;
	}
}
