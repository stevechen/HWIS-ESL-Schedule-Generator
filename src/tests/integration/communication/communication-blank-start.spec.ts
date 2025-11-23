import { test, expect } from '@playwright/test';

test.describe('Communication App - Blank Student Input', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/communication');
		await page.evaluate(() => localStorage.clear());
		await page.reload(); // Reload to ensure localStorage is cleared and component re-initializes
		await page.waitForLoadState('domcontentloaded');
	});

	test('should start with blank student input field', async ({ page }) => {
		// Verify the student input textarea is empty
		await expect(page.locator('#student-list-input')).toHaveValue('');
		
		// Verify the textarea is visible (not hidden)
		await expect(page.locator('#student-list-input')).toBeVisible();
		
		// Verify placeholder text is present for Excel copy-paste workflow
		await expect(page.locator('#student-list-input')).toHaveAttribute(
			'placeholder', 
			/Paste students from spreadsheet/
		);
	});

	test('should not have any student table visible initially', async ({ page }) => {
		// Verify no student table is visible when student input is blank
		await expect(page.locator('table.table-auto')).not.toBeVisible();
	});

	test('should not auto-load student data from saved records', async ({ page }) => {
		// Create a saved record with student data in localStorage
		const recordName = 'Test Auto Load Record';
		const recordKey = `comm_${recordName}`;
		const savedSettings = {
			studentsText: '1234567\tTest Student\tTest Name\tJ101',
			UI_Grade: 'G7',
			UI_Level: 'Basic',
			UI_ClassType: 'ESL',
			UI_Assignment: 'passport',
			UI_ClassNum: 1,
			UI_Dates: { assigned: '01/01', due: '01/15', late: '01/16' },
			studentsParsed: [
				{
					id: '1234567',
					name: { english: 'Test Name', chinese: 'Test Student' },
					cClass: 'J101',
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

		// Reload the page
		await page.reload();
		await page.waitForLoadState('domcontentloaded');

		// Verify the student input field is still blank (not auto-loaded)
		await expect(page.locator('#student-list-input')).toHaveValue('');
		
		// Verify no student table is shown
		await expect(page.locator('table.table-auto')).not.toBeVisible();
		
		// Verify the saved record is available but not loaded
		await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
		await page.locator('summary:has-text("Saved Records")').click();
		await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	});

	test('should show student table immediately after pasting Excel data', async ({ page }) => {
		const sampleStudentsText = `1234567\t張三\tChang San\tJ101
2345678\t李四\tSi Li\tJ102`;

		// Initially no table
		await expect(page.locator('table.table-auto')).not.toBeVisible();

		// Paste student data (simulating Excel copy-paste)
		await page.locator('#student-list-input').fill(sampleStudentsText);

		// Now table should be visible immediately (no debouncing for Excel paste)
		await expect(page.locator('table.table-auto')).toBeVisible();
		
		// Verify student data is parsed correctly
		await expect(page.locator('td.english-name input').first()).toHaveValue('Chang San');
		await expect(page.locator('td.chinese-name input').first()).toHaveValue('張三');
		
		// Verify input field is now hidden since we have student data
		await expect(page.locator('#student-list-input')).not.toBeVisible();
	});

	test('should maintain blank student input after multiple page reloads', async ({ page }) => {
		// Test multiple reloads to ensure consistent blank state
		for (let i = 0; i < 3; i++) {
			await page.reload();
			await page.waitForLoadState('domcontentloaded');
			
			// Verify student input is still blank
			await expect(page.locator('#student-list-input')).toHaveValue('');
			await expect(page.locator('table.table-auto')).not.toBeVisible();
		}
	});

	test('should clear student input when Clear button is clicked', async ({ page }) => {
		const sampleStudentsText = `1234567\t張三\tChang San\tJ101`;

		// Fill student data
		await page.locator('#student-list-input').fill(sampleStudentsText);
		await expect(page.locator('table.table-auto')).toBeVisible();
		
		// Click clear button
		await expect(page.locator('button:has-text("Clear")')).toBeVisible();
		await page.locator('button:has-text("Clear")').click();
		
		// Verify student input is now blank
		await expect(page.locator('#student-list-input')).toHaveValue('');
		await expect(page.locator('table.table-auto')).not.toBeVisible();
		
		// Verify input field is visible again for new data
		await expect(page.locator('#student-list-input')).toBeVisible();
	});
});