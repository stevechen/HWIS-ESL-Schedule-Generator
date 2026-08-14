import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const label = (forName: string) => page.getByCSS(`label[for="${forName}"]`);
const input = (name: string) => page.getByCSS(`#${name}`);

describe('Date validation (red labels and print-warning popover)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('flags Assigned later than Due with red labels and a popover warning', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await input('assigned').fill('10/11');
		await input('due').fill('10/10');

		await expect.element(label('assigned')).toHaveClass(/text-red-400/);
		await expect.element(label('due')).toHaveClass(/text-red-400/);

		await page.getByRole('button', { name: /Print 2 Slips/ }).click();
		const popover = page.getByCSS('#print-warning-popover');
		await expect.element(popover).toBeVisible();
		await expect.element(popover.getByText('Assigned date must be before Due date')).toBeVisible();
	});

	it('flags Make up earlier than Due with red labels and a popover warning', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await input('due').fill('10/10');
		await input('late').fill('10/09');

		await expect.element(label('due')).toHaveClass(/text-red-400/);
		await expect.element(label('late')).toHaveClass(/text-red-400/);

		await page.getByRole('button', { name: /Print 2 Slips/ }).click();
		const popover = page.getByCSS('#print-warning-popover');
		await expect.element(popover).toBeVisible();
		await expect.element(popover.getByText('Make up date must be after Due date')).toBeVisible();
	});

	it('accepts year wrap-around (Dec assigned -> Jan due) as valid', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await input('assigned').fill('12/31');
		await input('due').fill('1/1');

		await expect.element(label('assigned')).not.toHaveClass(/text-red-400/);
		await expect.element(label('due')).not.toHaveClass(/text-red-400/);
	});

	it('accepts November to January wrap-around as valid', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await input('assigned').fill('11/27');
		await input('due').fill('1/5');

		await expect.element(label('assigned')).not.toHaveClass(/text-red-400/);
		await expect.element(label('due')).not.toHaveClass(/text-red-400/);
	});

	it('flags reverse year wrap-around (Jan assigned -> Dec due) with a popover warning', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await input('assigned').fill('1/1');
		await input('due').fill('12/31');

		await expect.element(label('assigned')).toHaveClass(/text-red-400/);
		await expect.element(label('due')).toHaveClass(/text-red-400/);

		await page.getByRole('button', { name: /Print 2 Slips/ }).click();
		const popover = page.getByCSS('#print-warning-popover');
		await expect.element(popover).toBeVisible();
		await expect.element(popover.getByText('Assigned date must be before Due date')).toBeVisible();
	});
});
