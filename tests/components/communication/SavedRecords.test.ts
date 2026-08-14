import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

// Build a full record and write it to localStorage exactly like saveRecord() does
function seedRecord(name: string, record: Record<string, unknown>) {
	localStorage.setItem(`comm_${name}`, JSON.stringify(record));
	const index = JSON.parse(localStorage.getItem('comm_index') || '[]') as string[];
	if (!index.includes(name)) index.push(name);
	localStorage.setItem('comm_index', JSON.stringify(index));
}

describe('SavedRecords (record lifecycle through the store interface)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('saves a new record and lists it under Saved Records', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		const saveButton = page.getByRole('button', { name: 'Save' });
		await expect.element(saveButton).toBeVisible();
		await saveButton.click();

		const today = new Date();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const expectedName = new RegExp(
			`${today.getFullYear()}/${month}/${day}-G7 Basic 1 Comm-Passport-2 Students`
		);

		await expect.element(page.getByText('Saved Records (1)')).toBeInTheDocument();
		await page.getByText(/Saved Records/).click();
		await expect.element(page.getByText(expectedName)).toBeInTheDocument();

		// Save is hidden after a successful save.
		await expect.element(saveButton).not.toBeInTheDocument();
	});

	it('loads a seeded record into the form and highlights it', async () => {
		seedRecord('2026/08/20-G8 Advanced CLIL 5-Workbook-2 Students', {
			grade: 'G8',
			level: 'Advanced',
			classType: 'CLIL',
			classNum: '5',
			assignment: 'workbook',
			dates: { assigned: '08/10', due: '08/20', late: '08/21' },
			studentsParsed: [
				{
					id: '9876543',
					name: { english: 'Wang Wu', chinese: '王五' },
					cClass: 'J203',
					status: 0,
					selected: true
				}
			]
		});

		render(FullHarness);

		await expect.element(page.getByText('Saved Records (1)')).toBeInTheDocument();
		await page.getByText(/Saved Records/).click();
		const record = page.getByText(/2026\/08\/20-G8 Advanced CLIL 5-Workbook-2 Students/);
		await expect.element(record).toBeInTheDocument();
		await record.click();

		// The loaded record populates the form fields.
		await expect
			.poll(() => (page.getByCSS('#class-number').element() as HTMLInputElement).value)
			.toBe('5');
		await expect
			.poll(() => (page.getByRole('textbox', { name: /Due/ }).element() as HTMLInputElement).value)
			.toBe('08/20');
		await expect.element(page.getByText(/Wang Wu/)).toBeInTheDocument();
		await expect.element(page.getByCSS('#grade')).toHaveTextContent('G8');
	});

	it('deletes a seeded record from the list and localStorage', async () => {
		seedRecord('RecordToDelete', {
			grade: 'G9',
			level: 'Basic',
			classType: 'CLIL',
			classNum: '2',
			assignment: 'homework',
			dates: { assigned: '08/01', due: '08/02', late: '08/03' },
			studentsParsed: [
				{
					id: '1111111',
					name: { english: 'Ming Liu', chinese: '小明' },
					cClass: 'J304',
					status: 0,
					selected: true
				}
			]
		});

		render(FullHarness);
		await page.getByText(/Saved Records/).click();
		await expect.element(page.getByText('RecordToDelete')).toBeInTheDocument();

		await page.getByCSS('button[aria-label="Delete record"]').click();
		await expect.element(page.getByText('RecordToDelete')).not.toBeInTheDocument();
		expect(localStorage.getItem('comm_RecordToDelete')).toBeNull();
	});

	it('does not mark a loaded record as modified despite extra legacy fields', async () => {
		seedRecord('2026/10/25-G9 Basic COMM 3-Homework-1 Students', {
			grade: 'G9',
			level: 'Basic',
			classType: 'COMM',
			classNum: '3',
			assignment: 'homework',
			dates: { assigned: '10/20', due: '10/25', late: '10/26' },
			studentsParsed: [
				{
					id: '1234567',
					name: { english: 'Test Student', chinese: '測試生' },
					cClass: 'J303',
					status: 0,
					selected: true
				}
			],
			// Extraneous legacy properties that the equality check must ignore.
			studentsText: '1234567\t測試生\tTest Student\tJ303',
			extraLegacyField: 'some old data',
			metadata: { lastEditor: 'Old System' }
		});

		render(FullHarness);
		await page.getByText(/Saved Records/).click();
		await page.getByText(/2026\/10\/25-G9 Basic COMM 3-Homework-1 Students/).click();

		// Loading must not re-show Save (record is unmodified).
		await expect.element(page.getByRole('button', { name: 'Save' })).not.toBeInTheDocument();

		// Editing the loaded student marks the form modified again.
		const englishInput = page.getByCSS('td.english-name input').first();
		const el = englishInput.element() as HTMLInputElement;
		el.value = 'Modified Name';
		el.dispatchEvent(new Event('input'));
		await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
	});
});
