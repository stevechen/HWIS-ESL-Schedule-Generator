import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StudentTableHarness from './StudentTableHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

function pasteText(text: string) {
	const dt = new DataTransfer();
	dt.setData('text/plain', text);
	return new ClipboardEvent('paste', {
		clipboardData: dt,
		bubbles: true,
		cancelable: true
	});
}

describe('Paste (real ClipboardEvent dispatch through the DOM handlers)', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('parses pasted students via the empty-state overlay', async () => {
		render(StudentTableHarness);

		// Empty table shows the contenteditable overlay that handles paste on iOS/iPad.
		await expect.element(page.getByCSS('#student-paste-area')).toBeInTheDocument();
		await page.getByCSS('#student-paste-area').element().dispatchEvent(pasteText(MOCK_STUDENTS));

		// Students were parsed and rendered (master + 2 rows), grade auto-detected.
		await expect.poll(() => page.getByRole('checkbox').elements().length).toBe(3);
		await expect.element(page.getByText('G7')).toBeInTheDocument();
		await expect.element(page.getByText(/2 selected/)).toBeInTheDocument();
	});

	it('replaces the table via the wrapper onpaste once rows exist', async () => {
		render(StudentTableHarness);
		await page.getByCSS('#student-paste-area').element().dispatchEvent(pasteText(MOCK_STUDENTS));
		await expect.poll(() => page.getByRole('checkbox').elements().length).toBe(3);

		// Overlay is gone once students exist; the wrapper's onGlobalPaste takes over.
		await expect.element(page.getByCSS('#student-paste-area')).not.toBeInTheDocument();

		// handlePaste replaces the list (merging status/selection only on matching IDs).
		const more = `3456789\t李四\tSi Li 2\tJ103`;
		await page.getByCSS('.border-dashed').element().dispatchEvent(pasteText(more));
		await expect.poll(() => page.getByRole('checkbox').elements().length).toBe(2);
		await expect.element(page.getByText(/1 selected/)).toBeInTheDocument();
		await expect.element(page.getByCSS('#student-id-3456789')).toBeInTheDocument();
		await expect.element(page.getByCSS('#student-id-1234567')).not.toBeInTheDocument();
	});

	it('ignores paste without tab/newline-delimited data', async () => {
		render(StudentTableHarness);
		await page.getByCSS('#student-paste-area').element().dispatchEvent(pasteText('plain text'));

		await new Promise((r) => setTimeout(r, 50));
		// No rows were added; overlay still present (table stays empty).
		await expect.poll(() => page.getByRole('checkbox').elements().length).toBe(1);
		await expect.element(page.getByCSS('#student-paste-area')).toBeInTheDocument();
	});
});
