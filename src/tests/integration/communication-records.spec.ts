import { test, expect, type Page } from '@playwright/test';
interface CustomWindow extends Window {
	setStudentsText: (studentsText: string) => void;
}

declare let window: CustomWindow;

test.beforeEach(async ({ page }) => {
	await page.goto('/communication');
	await page.evaluate(() => localStorage.clear());
	await page.reload(); // Reload to ensure localStorage is cleared and component re-initializes
	await page.waitForLoadState('domcontentloaded'); // Wait for the DOM to be loaded
});

const sampleStudentsText = `1234567\t張三\tChang San\tJ101
2345678\t李四\tSi Li\tJ102`;

const fillForm = async (page: Page) => {
	// Use window.setStudentsText for direct state manipulation
	await page.waitForFunction(() => window.setStudentsText !== undefined);
	await page.locator('#student-list-input').fill(sampleStudentsText);
	// Wait for the student table to appear after setting studentsText
	await expect(page.locator('table.table-auto')).toBeVisible();

	// Add explicit wait for the Passport label to be visible and click it
	await expect(page.locator('label:has-text("Passport")')).toBeVisible();
	await page.locator('label:has-text("Passport")').click(); // Select Passport assignment type
	await expect(page.locator('label:has-text("Passport") input')).toBeChecked();

	await page.locator('#due').fill('08/15');
	await expect(page.locator('#due')).toHaveValue('08/15');

	await page.locator('#late').fill('08/16');
	await expect(page.locator('#late')).toHaveValue('08/16');

	await page.locator('label:has-text("Basic")').click(); // Select Basic CLIL level
	await expect(page.locator('label:has-text("Basic") input')).toBeChecked();

	await page.locator('label:has-text("CLIL")').click(); // Select CLIL class type
	await expect(page.locator('label:has-text("CLIL") input')).toBeChecked();

	await page.locator('input[placeholder="#?"]').fill('1'); // Fill class number
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue('1');

	// Ensure the UI has settled after all inputs
	await page.waitForLoadState('domcontentloaded');
};
const getExpectedRecordName = (studentsCount: number) => {
	const date = new Date();
	const year = date.getFullYear();
	const month = '08'; // Based on the due date '08/15'
	const day = '15';
	// The component capitalizes words and formats the date as YYYY/MM/DD
	// The assignment type is now Passport
	return `${year}/${month}/${day}-G7 Basic CLIL 1-Workbook-${studentsCount} Students`;
};

test('1. Saving a New Record', async ({ page }) => {
	// Verify initial state
	await expect(page.locator('h3:has-text("Saved Records")')).not.toBeVisible();
	await expect(page.locator('#save_button')).not.toBeVisible();

	// Populate form
	await fillForm(page);

	// Click save button
	await expect(page.locator('#save_button')).toBeVisible();
	await page.locator('#save_button').click();

	// Verify saved state
	await expect(page.locator('h3:has-text("Saved Records")')).toBeVisible();
	const expectedRecordName = getExpectedRecordName(2); // 2 students in sampleStudentsText
	// The displayed record name in the UI does not have the "comm_" prefix
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();

	// Verify data in localStorage (with "comm_" prefix)
	const savedData = await page.evaluate(
		(name) => localStorage.getItem(`comm_${name}`),
		expectedRecordName
	);
	expect(savedData).not.toBeNull();
	const parsedData = JSON.parse(savedData!);
	expect(parsedData.studentsText).toBe(sampleStudentsText);
	expect(parsedData.UI_Assignment).toBe('workbook');
	expect(parsedData.UI_Dates.due).toBe('08/15');
	expect(parsedData.UI_Dates.late).toBe('08/16');
	expect(parsedData.UI_Level).toBe('Basic');
	expect(parsedData.UI_ClassType).toBe('CLIL');
	expect(parsedData.UI_ClassNum).toBe(1);

	// Verify save button disappears after saving
	await expect(page.locator('#save_button')).not.toBeVisible();
});

test('2. Loading a Saved Record', async ({ page }) => {
	const year = new Date().getFullYear();
	// This name must match the data in savedSettings
	const recordName = `${year}/08/20-G8 Advanced CLIL 5-Workbook-1 Students`;
	const recordKey = `comm_${recordName}`;
	const savedSettings = {
		studentsText: '9876543\t王五\tWang Wu\tJ203',
		UI_Grade: 'G8',
		UI_Level: 'Advanced', // Capitalized to match component's expected value
		UI_ClassType: 'CLIL', // Capitalized to match component's expected value
		UI_Assignment: 'Workbook', // Capitalized to match component's expected value
		UI_ClassNum: 5,
		UI_Dates: { assigned: '08/10', due: '08/20', late: '08/21' },
		studentsRaw: [
			{
				id: '9876543',
				name: { english: 'Wang Wu', chinese: '王五' },
				cClass: 'J203',
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
	await page.reload(); // Reload to load the saved record into the component
	await page.waitForLoadState('domcontentloaded');

	// Verify initial state
	await expect(page.locator('h3:has-text("Saved Records")')).toBeVisible();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();

	// Load record
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');

	// Verify loaded state
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText);
	await expect(page.locator('input[name="due"]')).toHaveValue(savedSettings.UI_Dates.due);
	await expect(page.locator('input[name="late"]')).toHaveValue(savedSettings.UI_Dates.late);
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue(
		String(savedSettings.UI_ClassNum)
	);
	await expect(page.locator('label:has-text("Workbook") input')).toBeChecked();
	// Add explicit wait for the Advanced input to be visible
	// await expect(page.locator('label[for="adv"] input')).toBeVisible();
	await expect(page.locator('label[for="adv"] input')).toBeChecked();
	await expect(page.locator('label:has-text("CLIL") input')).toBeChecked();
	await expect(page.locator('#grade:has-text("G8")')).toBeVisible(); // Check grade derived from studentsText

	// Verify student table is populated
	await expect(page.locator('table.table-auto')).toBeVisible();
	await expect(page.locator('td.english-name input')).toHaveValue('Wang Wu');
});

test('3. Deleting a Saved Record', async ({ page }) => {
	const recordName = 'RecordToDelete';
	const recordKey = `comm_${recordName}`;
	const savedSettings = {
		studentsText: '1111111\t小明\tMing Liu\tJ304',
		UI_Grade: 'G9',
		UI_Level: 'intermediate',
		UI_ClassType: 'CLIL',
		UI_Assignment: 'quiz',
		UI_ClassNum: 2,
		UI_Dates: { assigned: '08/01', due: '08/02', late: '08/03' },
		studentsRaw: [
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

	// Verify initial state
	await expect(page.locator('h3:has-text("Saved Records")')).toBeVisible();
	await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();

	// Delete record
	await page
		.locator(`.record:has-text("${recordName}") button[aria-label="Delete record"]`)
		.click();
	await page.waitForLoadState('domcontentloaded');

	// Verify deleted state
	await expect(page.locator(`.record:has-text("${recordName}")`)).not.toBeVisible();
	const savedData = await page.evaluate((name) => localStorage.getItem(name), recordKey);
	expect(savedData).toBeNull();

	// Test: If the deleted record was the one currently loaded, the form should remain populated.
	// First, load the record
	await page.evaluate(
		([key, settings]) => {
			localStorage.setItem(String(key), JSON.stringify(settings));
		},
		[recordKey, savedSettings]
	);
	await page.reload();
	await page.waitForLoadState('domcontentloaded');
	await page.locator(`.record:has-text("${recordName}")`).click();
	await page.waitForLoadState('domcontentloaded');
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText); // Ensure it's loaded

	// Now delete it
	await page
		.locator(`.record:has-text("${recordName}") button[aria-label="Delete record"]`)
		.click();
	await page.waitForLoadState('domcontentloaded');
	// The component does NOT clear the form when a loaded record is deleted. This is the expected behavior for now.
	await expect(page.locator('#student-list-input')).toHaveValue(savedSettings.studentsText); // Should still have the value
});

test('4. Clearing the Form', async ({ page }) => {
	// Populate form
	await fillForm(page);
	await expect(page.locator('#student-list-input')).toHaveValue(sampleStudentsText);
	await expect(page.locator('button:has-text("Clear")')).toBeVisible();

	// Clear form
	await page.locator('button:has-text("Clear")').click();
	await page.waitForLoadState('domcontentloaded');

	// Verify cleared state
	await expect(page.locator('#student-list-input')).toHaveValue('');
	await expect(page.locator('input[placeholder="#?"]')).toHaveValue('');
	await expect(page.locator('table.table-auto')).not.toBeVisible(); // Student table should be hidden
	await expect(page.locator('button:has-text("Clear")')).not.toBeVisible(); // Clear button should disappear
});

test('5. Save Button State Management', async ({ page }) => {
	// 1. Fill the form and save the record.
	await fillForm(page);
	await expect(page.locator('#save_button')).toBeVisible();
	await page.locator('#save_button').click();
	await expect(page.locator('#save_button')).not.toBeVisible();

	// 2. Get the name of the created record.
	const expectedRecordName = getExpectedRecordName(2);
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();

	// 3. Reload the page to ensure a clean state for loading.
	await page.reload();
	await page.waitForLoadState('domcontentloaded');

	// 4. Load the created record.
	await expect(page.locator(`.record:has-text("${expectedRecordName}")`)).toBeVisible();
	await page.locator(`.record:has-text("${expectedRecordName}")`).click();
	await page.waitForLoadState('domcontentloaded');

	// 5. Verify that the save button is not visible after loading.
	await expect(page.locator('#save_button')).not.toBeVisible();

	// 6. Modify a student's name in the table and verify the save button appears.
	await page.locator('td.english-name input').first().fill('A New Name');
	await expect(page.locator('#save_button')).toBeVisible();
});
