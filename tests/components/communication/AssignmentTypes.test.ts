import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';

const G9_STUDENTS = `1234567\t張三\tSan Chang\tJ301
7654321\t李四\tSi Li\tJ302`;

const COMM_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const radio = (name: string | RegExp) => page.getByRole('radio', { name });

describe('Assignment type visibility (derived from grade/classType)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('hides workbook and speech assignment types for G9 students', async () => {
		render(FullHarness, { seed: G9_STUDENTS, classNum: '1' });

		await expect.element(radio(/Passport/)).toBeInTheDocument();
		await expect.element(radio(/Recording/)).toBeInTheDocument();
		await expect.element(radio(/Oral Exam/)).toBeInTheDocument();
		await expect.element(radio(/Workbook/)).not.toBeInTheDocument();
		await expect.element(radio(/Speech Practice/)).not.toBeInTheDocument();
		await expect.element(radio(/Worksheet/)).not.toBeInTheDocument();
	});

	it('shows only the appropriate assignment types for a CLIL class', async () => {
		render(FullHarness, { seed: COMM_STUDENTS, classNum: '1', classType: 'CLIL' });

		await expect.element(radio(/Workbook/)).toBeInTheDocument();
		await expect.element(radio(/Speech Practice/)).toBeInTheDocument();
		await expect.element(radio(/Worksheet/)).toBeInTheDocument();
		await expect.element(radio(/Passport/)).not.toBeInTheDocument();
		await expect.element(radio(/Recording/)).not.toBeInTheDocument();
		await expect.element(radio(/Oral Exam/)).not.toBeInTheDocument();
	});

	it('defaults a CLIL class to the workbook assignment', async () => {
		render(FullHarness, { seed: COMM_STUDENTS, classNum: '1', classType: 'CLIL' });
		await expect.element(radio(/Workbook/)).toBeChecked();
	});
});
