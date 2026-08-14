import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommunicationHarness from './CommunicationHarness.svelte';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

describe('AssignmentForm save-state (lives in the store interface)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('hides Save until the form is saveable AND modified, then shows it', async () => {
		// No class number yet -> not saveable -> Save hidden.
		await render(CommunicationHarness, { seed: MOCK_STUDENTS });
		await expect.element(page.getByRole('button', { name: 'Save' })).not.toBeInTheDocument();

		// Adding a class number makes the form saveable (and modified) -> Save shows.
		await render(CommunicationHarness, { seed: MOCK_STUDENTS, classNum: '1' });
		await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
	});

	it('hides Save after saving and re-shows it on the next edit', async () => {
		render(CommunicationHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await page.getByRole('button', { name: 'Save' }).click(); // store.saveRecord() -> clean
		await expect.element(page.getByRole('button', { name: 'Save' })).not.toBeInTheDocument();

		await page.getByRole('textbox', { name: /Due/i }).fill('08/20'); // edit -> modified again
		await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
	});

	it('Clear empties the form and its saveable/modified state', async () => {
		render(CommunicationHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		// A populated, saveable form shows Clear and Save.
		await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Clear' })).toBeVisible();

		await page.getByRole('button', { name: 'Clear' }).click(); // store.clearAll()

		// Form is empty again: no rows, no Save, no Clear.
		await expect
			.element(page.getByRole('textbox', { name: /English Name/ }).first())
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Save' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});
});
