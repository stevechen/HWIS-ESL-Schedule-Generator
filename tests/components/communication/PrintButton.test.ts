import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

describe('PrintButton (warning dialog lives in the print path)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('shows a warning dialog when printing with missing info but ALLOWS printing', async () => {
		const onPrint = vi.fn();
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1', onPrint });

		const printButton = page.getByRole('button', { name: /Print 2 Slips/ });
		await expect.element(printButton).toBeInTheDocument();

		// No signature set yet -> "Missing Info!" caution, button opens the popover.
		await expect.element(page.getByText('Missing Info!')).toBeInTheDocument();
		await printButton.click();

		const popover = page.getByCSS('#print-warning-popover');
		await expect.element(popover).toBeInTheDocument();
		await expect.element(popover.getByText('Missing Information')).toBeInTheDocument();
		await expect.element(popover.getByText(/Signature/)).toBeInTheDocument();

		// Print Anyway proceeds despite the warnings.
		await popover.getByRole('button', { name: 'Print Anyway' }).click();
		await expect.poll(() => onPrint).toHaveBeenCalledOnce();
	});

	it('does NOT show a warning dialog when 0 slips are selected', async () => {
		const onPrint = vi.fn();
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1', onPrint });

		// Deselect every student so nothing is printable.
		await page.getByCSS('#master-checkbox').click();
		await expect.element(page.getByRole('button', { name: 'Print 0 Slips' })).toBeInTheDocument();

		// Printing is blocked outright, so no warning dialog appears and onPrint never runs.
		await page.getByRole('button', { name: 'Print 0 Slips' }).click();
		await expect.element(page.getByCSS('#print-warning-popover')).not.toBeVisible();
		await expect.poll(() => onPrint).not.toHaveBeenCalled();
	});
});
