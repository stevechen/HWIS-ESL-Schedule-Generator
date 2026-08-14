import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StudentTableHarness from './StudentTableHarness.svelte';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const checkboxes = () => page.getByRole('checkbox');
const checkedBoxes = () => page.getByRole('checkbox', { checked: true });
const master = () => page.getByRole('checkbox').first();

describe('StudentTable (record entry via store.handlePaste)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('starts empty with a paste hint and a disabled master checkbox', async () => {
		render(StudentTableHarness);
		await expect
			.element(page.getByText(/Paste students from spreadsheet here/))
			.toBeInTheDocument();
		await expect.element(master()).toBeDisabled();
		await expect.poll(() => checkboxes().length).toBe(1);
		await expect.poll(() => checkedBoxes().length).toBe(0);
	});

	it('parses pasted students, auto-detects the grade, and shows a selection count', async () => {
		render(StudentTableHarness, { seed: MOCK_STUDENTS });
		await expect.poll(() => checkboxes().length).toBe(3); // master + 2 rows
		await expect.element(master()).toBeChecked();
		await expect.element(page.getByText('G7')).toBeInTheDocument();
		await expect.element(page.getByText(/2 selected/)).toBeInTheDocument();
	});

	it('checks / unchecks all rows via the master checkbox', async () => {
		render(StudentTableHarness, { seed: MOCK_STUDENTS });

		await expect.element(master()).toBeChecked();
		await expect.poll(() => checkedBoxes().length).toBe(3);

		await master().click();
		await expect.element(master()).not.toBeChecked();
		await expect.poll(() => checkedBoxes().length).toBe(0);

		await master().click();
		await expect.element(master()).toBeChecked();
		await expect.poll(() => checkedBoxes().length).toBe(3);
	});

	it('marks the master checkbox as indeterminate when some rows are selected', async () => {
		render(StudentTableHarness, { seed: MOCK_STUDENTS });

		// Uncheck exactly one row: master becomes indeterminate (neither all nor none).
		await page.getByRole('checkbox').nth(1).click();
		await expect.element(master()).not.toBeChecked();
		await expect.poll(() => checkedBoxes().length).toBe(1);

		const indeterminate = (master().element() as HTMLInputElement).indeterminate;
		expect(indeterminate).toBe(true);

		// Re-check the row: master returns to fully checked.
		await page.getByRole('checkbox').nth(1).click();
		await expect.element(master()).toBeChecked();
		await expect.poll(() => checkedBoxes().length).toBe(3);
	});
});
