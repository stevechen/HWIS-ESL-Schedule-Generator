import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

describe('Slip (content driven by the store interface)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('renders one slip per selected student with bilingual content', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await expect.poll(() => page.getByTestId('communication-slip').length).toBe(2);
		await expect.element(page.getByText(/San Chang/)).toBeInTheDocument();
		await expect.element(page.getByText(/張三/)).toBeInTheDocument();
		await expect.element(page.getByText(/Si Li/)).toBeInTheDocument();
	});

	it('matches slip content as the assignment type changes', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		// Default COMM class starts with Passport.
		await expect.element(page.getByRole('radio', { name: 'Passport' })).toBeChecked();
		const slip = page.getByTestId('communication-slip').first();
		await expect.element(slip.getByText(/Passport/)).toBeInTheDocument();

		// Switch to Workbook (available for COMM) and verify the slip updates.
		// The radio input is `appearance-none`, so click its label instead.
		await page.getByCSS('label[for="workbook"]').click();
		await expect.element(page.getByRole('radio', { name: 'Workbook' })).toBeChecked();
		await expect.element(slip.getByText(/Workbook/)).toBeInTheDocument();
		await expect.element(slip.getByText(/作業本/)).toBeInTheDocument();
	});

	it('pre-populates due/late dates and shows them on the slips', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		const today = new Date();
		const due = `${today.getMonth() + 1}/${today.getDate()}`;
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const late = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;

		const assignedInput = page.getByRole('textbox', { name: /Assigned/ });
		const dueInput = page.getByRole('textbox', { name: /Due/ });
		const lateInput = page.getByRole('textbox', { name: /Make up/ });

		await expect.element(assignedInput).toBeInTheDocument();
		await expect.poll(() => (dueInput.element() as HTMLInputElement).value).toBe(due);
		await expect.poll(() => (lateInput.element() as HTMLInputElement).value).toBe(late);
	});

	it('updates slip dates when the assigned/late inputs change', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		const assignedInput = page.getByRole('textbox', { name: /Assigned/ });
		const lateInput = page.getByRole('textbox', { name: /Make up/ });

		await assignedInput.fill('1/1');
		await lateInput.fill('12/31');

		await expect.element(page.getByText(/1\/1/).first()).toBeInTheDocument();
		await expect.element(page.getByText(/12\/31/).last()).toBeInTheDocument();
	});

	it('removes and re-adds a slip when its student is unselected/selected', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });
		await expect.poll(() => page.getByTestId('communication-slip').length).toBe(2);

		// Students sort by English name: row 0 = San Chang, row 1 = Si Li.
		await page.getByCSS('#checkbox-1234567').click(); // uncheck San Chang
		await expect.poll(() => page.getByTestId('communication-slip').length).toBe(1);
		await expect.element(page.getByText(/San Chang/)).not.toBeInTheDocument();
		await expect.element(page.getByText(/Si Li/)).toBeInTheDocument();

		await page.getByCSS('#checkbox-1234567').click(); // re-check San Chang
		await expect.poll(() => page.getByTestId('communication-slip').length).toBe(2);
		await expect.element(page.getByText(/San Chang/)).toBeInTheDocument();
	});

	it('updates slip student info when a table row is edited', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		// The row inputs have zero width in the component test env (no page layout),
		// so fill() can't act on them. Set the value directly and dispatch 'input'
		// to drive Svelte's bind:value on the store's parsed student.
		const englishInput = page.getByCSS('td.english-name input').first();
		const el = englishInput.element() as HTMLInputElement;
		el.value = 'Mary Jane';
		el.dispatchEvent(new Event('input'));

		await expect.element(page.getByText(/Mary Jane/)).toBeInTheDocument();
	});

	it('renders zero slips when nothing is selected', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		// Deselect all via the master checkbox.
		await page.getByCSS('#master-checkbox').click();
		await expect.poll(() => page.getByTestId('communication-slip').length).toBe(0);
	});
});

describe('Slip status text per student', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('shows "hasn\'t been submitted" for a NOT_SUBMITTED student', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });
		await expect.element(page.getByText(/hasn't been submitted/).first()).toBeInTheDocument();
	});
});
