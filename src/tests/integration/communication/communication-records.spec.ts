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
	await page.waitForFunction(() => typeof window.setStudentsText === 'function');
	await page.evaluate((text) => window.setStudentsText(text), sampleStudentsText);
	await expect(page.locator('table')).toBeVisible();
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
		studentsText: '9876543	王五	Wang Wu	J203\n8765432	趙六	Zhao Liu	J204',
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

	const anotherRecordName = `${year}/09/01-G9 Basic CLIL 1-Homework-5 Students`;
	const anotherRecordKey = `comm_${anotherRecordName}`;
	const anotherSavedSettings = {
		studentsText: '1112223	陳七	Chen Qi	J301',
		grade: 'G9',
		level: 'Basic',
		classType: 'CLIL',
		assignment: 'homework',
		classNum: 1,
		dates: { assigned: '08/30', due: '09/01', late: '09/02' },
		studentsParsed: [
			{
				id: '1112223',
				name: { english: 'Chen Qi', chinese: '陳七' },
				cClass: 'J301',
				status: 0,
				selected: true
			}
		]
	};

	await page.evaluate(
		(records: any[]) => {
			for (const [key, settings] of records) {
				localStorage.setItem(String(key), JSON.stringify(settings));
			}
		},
		[
			[recordKey, savedSettings],
			[anotherRecordKey, anotherSavedSettings]
		]
	);

	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator('#records_list')).toBeVisible();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	await expect(page.locator(`.record:has-text("${anotherRecordName}")`)).toBeVisible();

	// Check that nothing is highlighted initially by comparing colors
	const recordDivBeforeLoad = page.locator(`.record:has-text("${recordName}") > div`).first();
	const anotherRecordDivBeforeLoad = page
		.locator(`.record:has-text("${anotherRecordName}") > div`)
		.first();
	const bgColor1_before = await recordDivBeforeLoad.evaluate(
		(el) => window.getComputedStyle(el).backgroundColor
	);
	const bgColor2_before = await anotherRecordDivBeforeLoad.evaluate(
		(el) => window.getComputedStyle(el).backgroundColor
	);
	expect(bgColor1_before).toBe(bgColor2_before);

	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');

	// Check for highlight after loading by comparing colors
	const loadedRecordDiv = page.locator(`.record:has-text("${recordName}") > div`).first();
	const otherRecordDiv = page.locator(`.record:has-text("${anotherRecordName}") > div`).first();
	const loadedBgColor = await loadedRecordDiv.evaluate(
		(el) => window.getComputedStyle(el).backgroundColor
	);
	const otherBgColor = await otherRecordDiv.evaluate(
		(el) => window.getComputedStyle(el).backgroundColor
	);
	expect(loadedBgColor).not.toBe(otherBgColor);
	// Also check that the loaded color is not a default/transparent color
	expect(['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)']).not.toContain(loadedBgColor);

	await expect(page.locator('input[name="due"]')).toHaveValue(savedSettings.dates.due);
	await expect(page.locator('input[name="late"]')).toHaveValue(savedSettings.dates.late);
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue(String(savedSettings.classNum));
	await expect(page.locator('label:has-text("Workbook") input')).toBeChecked();
	await expect(page.locator('label[for="adv"] input')).toBeChecked();
	await expect(page.locator('label:has-text("CLIL") input')).toBeChecked();
	await expect(page.locator('#grade:has-text("G8")')).toBeVisible();
	await expect(page.locator('table')).toBeVisible();
	const rows = page.locator('table tbody tr');
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
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	await page
		.locator(`.record:has-text("${recordName}") button[aria-label="Delete record"]`)
		.click();
	await page.waitForLoadState('domcontentloaded');
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
	await expect(page.locator('table')).toBeVisible();
	await expect(page.locator('button:has-text("Clear")')).toBeVisible();

	// Clear form
	await page.locator('button:has-text("Clear")').click();
	await page.reload();
	await page.waitForLoadState('domcontentloaded');

	// Verify cleared state
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue('');
	await expect(page.locator('text=Paste students from spreadsheet here')).toBeVisible();
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

test('6. Load, Clear, then Paste New Data', async ({ page }) => {

	// 1. Load a record first
	const year = new Date().getFullYear();
	const recordName = `${year}/08/20-G8 Advanced CLIL 5-Workbook-2 Students`;
	const recordKey = `comm_${recordName}`;
	const savedSettings = {
		studentsText: '9876543	王五	Wang Wu	J203\n8765432	趙六	Zhao Liu	J204',
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
	await page.locator('summary:has-text("Saved Records")').click();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	
	// Verify loaded
	await expect(page.locator('table tbody tr')).toHaveCount(2);

	// 2. Clear the form
	await page.locator('button:has-text("Clear")').click();
	await expect(page.locator('text=Paste students from spreadsheet here')).toBeVisible();

	// 3. Paste new data
	const newStudentsText = `1234567	New Student	New Name	J101`;
	await page.waitForFunction(() => typeof window.setStudentsText === 'function');
	await page.evaluate((text) => window.setStudentsText(text), newStudentsText);

	// 4. Verify new data is parsed (this is where it allegedly fails)
	await expect(page.locator('table')).toBeVisible();
	await expect(page.locator('table tbody tr')).toHaveCount(1);
	await expect(page.locator('td.english-name input')).toHaveValue('New Name');
});

test('7. Save Button - Resilience to Legacy Data', async ({ page }) => {
	const year = new Date().getFullYear();
	const recordName = `${year}/10/25-G9 Basic COMM 3-Homework-1 Students`;
	const recordKey = `comm_${recordName}`;

	// Record with legacy 'studentsText' and extra unknown properties
	const recordWithLegacyData = {
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
		// Extraneous properties that should be ignored by the equality check
		studentsText: '1234567\t測試生\tTest Student\tJ303',
		extraLegacyField: 'some old data',
		metadata: { lastEditor: 'Old System' }
	};

	await page.evaluate(
		([key, settings]) => {
			localStorage.setItem(String(key), JSON.stringify(settings));
		},
		[recordKey, recordWithLegacyData]
	);

	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await page.locator('summary:has-text("Saved Records")').click();
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');

	// Verify the record is loaded
	await expect(page.locator('#grade:has-text("G9")')).toBeVisible();
	await expect(page.locator('td.english-name input')).toHaveValue('Test Student');

	// CRITICAL: Save button should STILL NOT be visible despite extra fields in the raw data
	await expect(page.locator('#save_button')).not.toBeVisible();

	// Verify it becomes visible on actual modification
	await page.locator('td.english-name input').first().fill('Modified Name');
	await expect(page.locator('#save_button')).toBeVisible();
});
