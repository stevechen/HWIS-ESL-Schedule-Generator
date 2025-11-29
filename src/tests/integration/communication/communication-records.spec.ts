import { test, expect, type Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

interface CustomWindow extends Window {
	setStudentsText: (studentsText: string) => void;
}

declare let window: CustomWindow;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function uploadSignature(page: Page, image: string) {
	const fixturePath = path.join(__dirname, '../fixtures', image);
	try {
		await fs.access(fixturePath);
	} catch {
		throw new Error(`Test setup error: Fixture file not found at ${fixturePath}`);
	}

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('#browse').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(fixturePath);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/communication');
	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
});

const sampleStudentsText = `1234567	張三	Chang San	J101
2345678	李四	Si Li	J102`;

const fillForm = async (page: Page) => {
	await page.waitForFunction(() => window.setStudentsText !== undefined);
	await page.locator('#student-list-input').fill(sampleStudentsText);
	await expect(page.locator('table.table-auto')).toBeVisible();
	await expect(page.locator('label:has-text("Passport")')).toBeVisible();
	await page.locator('label:has-text("Passport")').click();
	await expect(page.locator('label:has-text("Passport") input')).toBeChecked();
	await page.locator('#due').fill('08/15');
	await expect(page.locator('#due')).toHaveValue('08/15');
	await page.locator('#late').fill('08/16');
	await expect(page.locator('#late')).toHaveValue('08/16');
	await page.locator('label:has-text("Basic")').click();
	await expect(page.locator('label:has-text("Basic") input')).toBeChecked();
	await page.locator('label:has-text("CLIL")').click();
	await expect(page.locator('label:has-text("CLIL") input')).toBeChecked();
	await page.locator('input[placeholder="#?"]').fill('1');
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue('1');
	await page.waitForLoadState('domcontentloaded');
};

const getExpectedRecordName = (studentsCount: number) => {
	const date = new Date();
	const year = date.getFullYear();
	const month = '08';
	const day = '15';
	return `${year}/${month}/${day}-G7 Basic CLIL 1-Workbook-${studentsCount} Students`;
};

test('1. Saving a New Record', async ({ page }) => {
	await expect(page.locator('summary:has-text("Saved Records")')).not.toBeVisible();
	await expect(page.locator('#save_button')).not.toBeVisible();
	await fillForm(page);
	await expect(page.locator('#save_button')).toBeVisible();
	await page.locator('#save_button').click();
	await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator('#records_list')).toBeVisible();
	const expectedRecordName = getExpectedRecordName(2);
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();
	const savedData = await page.evaluate(
		(name) => localStorage.getItem(`comm_${name}`),
		expectedRecordName
	);
	expect(savedData).not.toBeNull();
	const parsedData = JSON.parse(savedData!);
	expect(parsedData.studentsText).toBe(sampleStudentsText);
	expect(parsedData.assignment).toBe('workbook');
	expect(parsedData.dates.due).toBe('08/15');
	expect(parsedData.dates.late).toBe('08/16');
	expect(parsedData.level).toBe('Basic');
	expect(parsedData.classType).toBe('CLIL');
	expect(parsedData.classNum).toBe(1);
	await expect(page.locator('#save_button')).not.toBeVisible();
});

test('2. Loading a Saved Record & Verifying Checkbox State', async ({ page }) => {
	const year = new Date().getFullYear();
	const recordName = `${year}/08/20-G8 Advanced CLIL 5-Workbook-2 Students`;
	const recordKey = `comm_${recordName}`;
	const savedSettings = {
		studentsText: '9876543	王五	Wang Wu	J203  8765432	趙六	Zhao Liu	J204',
		grade: 'G8',
		level: 'Advanced',
		classType: 'CLIL',
		assignment: 'workbook',
		classNum: 5,
		dates: { assigned: '08/10', due: '08/20', late: '08/21' },
		studentsParsed: [
			{
				id: '9876543',
				name: { english: 'Wang Wu', chinese: '王五' },
				cClass: 'J203',
				status: 0,
				selected: false
			},
			{
				id: '8765432',
				name: { english: 'Zhao Liu', chinese: '趙六' },
				cClass: 'J204',
				status: 0,
				selected: true
			}
		]
	};
	await page.evaluate(
		([key, settings]) => {
			localStorage.setItem(String(key), JSON.stringify(settings));
		},
		[recordKey, savedSettings]
	);
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator('#records_list')).toBeVisible();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText);
	await expect(page.locator('input[name="due"]')).toHaveValue(savedSettings.dates.due);
	await expect(page.locator('input[name="late"]')).toHaveValue(savedSettings.dates.late);
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue(String(savedSettings.classNum));
	await expect(page.locator('label:has-text("Workbook") input')).toBeChecked();
	await expect(page.locator('label[for="adv"] input')).toBeChecked();
	await expect(page.locator('label:has-text("CLIL") input')).toBeChecked();
	await expect(page.locator('#grade:has-text("G8")')).toBeVisible();
	await expect(page.locator('table.table-auto')).toBeVisible();
	const rows = page.locator('table.table-auto tbody tr');
	await expect(rows).toHaveCount(2);
	const row1 = rows.nth(0);
	await expect(row1.locator('td.english-name input')).toHaveValue('Wang Wu');
	await expect(row1.locator('input[type="checkbox"]')).not.toBeChecked();
	const row2 = rows.nth(1);
	await expect(row2.locator('td.english-name input')).toHaveValue('Zhao Liu');
	await expect(row2.locator('input[type="checkbox"]')).toBeChecked();
});

test('3. Deleting a Saved Record', async ({ page }) => {
	const recordName = 'RecordToDelete';
	const recordKey = `comm_${recordName}`;
	const savedSettings = {
		studentsText: '1111111	小明	Ming Liu	J304',
		grade: 'G9',
		level: 'intermediate',
		classType: 'CLIL',
		assignment: 'quiz',
		classNum: 2,
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
	};
	await page.evaluate(
		([key, settings]) => {
			localStorage.setItem(String(key), JSON.stringify(settings));
		},
		[recordKey, savedSettings]
	);
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator('#records_list')).toBeVisible();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	await page
		.locator(`.record:has-text("${recordName}") button[aria-label="Delete record"]`)
		.click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator(`.record:has-text("${recordName}")`)).not.toBeVisible();
	const savedData = await page.evaluate((name) => localStorage.getItem(name), recordKey);
	expect(savedData).toBeNull();
	await page.evaluate(
		([key, settings]) => {
			localStorage.setItem(String(key), JSON.stringify(settings));
		},
		[recordKey, savedSettings]
	);
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator('#records_list')).toBeVisible();
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText);
	await page
		.locator(`.record:has-text("${recordName}") button[aria-label="Delete record"]`)
		.click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText);
});

test('4. Clearing the Form', async ({ page }) => {
	// Populate form first to ensure the page is in a stable state, mimicking other tests
	await fillForm(page);

	// Upload a signature to ensure it is not cleared
	await uploadSignature(page, 'sig_test.png');
	const signaturePreview = page.locator('img.signature-preview');
	await expect(signaturePreview).toHaveAttribute('src', /data:image/);
	await expect(signaturePreview).toBeVisible();
	const signatureSrc = await signaturePreview.getAttribute('src');
	expect(signatureSrc).not.toBe('');
	expect(signatureSrc).not.toBeNull();

	// Verify form is populated
	await expect(page.locator('#student-list-input')).toHaveValue(sampleStudentsText);
	await expect(page.locator('button:has-text("Clear")')).toBeVisible();

	// Clear form
	await page.locator('button:has-text("Clear")').click();
	await page.reload();
	await page.waitForLoadState('domcontentloaded');

	// Verify cleared state
	await expect(page.locator('#student-list-input')).toHaveValue('');
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue('');
	await expect(page.locator('table.table-auto')).not.toBeVisible();
	await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();

	// Verify signature is NOT cleared (it's reloaded from localStorage)
	await expect(signaturePreview).toBeVisible();
	const signatureSrcAfterClear = await signaturePreview.getAttribute('src');
	expect(signatureSrcAfterClear).toBe(signatureSrc);
});

test('5. Save Button State Management', async ({ page }) => {
	await fillForm(page);
	await expect(page.locator('#save_button')).toBeVisible();
	await page.locator('#save_button').click();
	await expect(page.locator('#save_button')).not.toBeVisible();
	const expectedRecordName = getExpectedRecordName(2);
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();
	await page.locator(`.record:has-text("${expectedRecordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('#save_button')).not.toBeVisible();
	await page.locator('td.english-name input').first().fill('A New Name');
	await expect(page.locator('#save_button')).toBeVisible();
});
