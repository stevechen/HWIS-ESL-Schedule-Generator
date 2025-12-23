import { test, expect } from '@playwright/test';

test.describe('Communication App - Simplified UI (No Textarea)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/communication');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState('domcontentloaded');
	});

	test('should start with empty table and placeholder rows', async ({ page }) => {
		// Verify no textarea is present
		await expect(page.locator('#student-list-input')).not.toBeVisible();
		
		// Verify table is visible
		await expect(page.locator('table')).toBeVisible();
		
		// Verify placeholder text is present
		await expect(page.locator('text=Paste students from spreadsheet here')).toBeVisible();
	});

	test('should correctly parse data when "pasted" via helper', async ({ page }) => {
		const sampleStudentsText = `1234567\t張三\tChang San\tJ101
2345678\t李四\tSi Li\tJ102`;

		// Wait for helper to be ready
		await page.waitForFunction(() => typeof (window as any).setStudentsText === 'function');
		
		// Use the development helper to simulate paste
		await page.evaluate((text) => (window as any).setStudentsText(text), sampleStudentsText);

		// Verify students are in the table
		await expect(page.locator('td.english-name input').first()).toHaveValue('Chang San');
		await expect(page.locator('td.chinese-name input').first()).toHaveValue('張三');
		await expect(page.locator('td.english-name input').last()).toHaveValue('Si Li');
		
		// Verify grade is auto-detected
		await expect(page.locator('#grade')).toHaveText('G7');
	});

	test('should clear table when Clear button is clicked', async ({ page }) => {
		const sampleStudentsText = `1234567\t張三\tChang San\tJ101`;

		await page.waitForFunction(() => typeof (window as any).setStudentsText === 'function');
		await page.evaluate((text) => (window as any).setStudentsText(text), sampleStudentsText);
		await expect(page.locator('td.english-name input')).toHaveValue('Chang San');
		
		// Click clear button
		await expect(page.locator('button:has-text("Clear")')).toBeVisible();
		await page.locator('button:has-text("Clear")').click();
		
		// Verify table is empty again (shows placeholder)
		await expect(page.locator('text=Paste students from spreadsheet here')).toBeVisible();
		await expect(page.locator('td.english-name input')).not.toBeVisible();
	});

	test('should not auto-load student data from saved records initially', async ({ page }) => {
		// Create a saved record with student data in localStorage
		const recordName = 'Test Auto Load Record';
		const recordKey = `comm_${recordName}`;
		const savedSettings = {
			grade: 'G7',
			level: 'Basic',
			classType: 'ESL',
			assignment: 'passport',
			classNum: '1',
			dates: { assigned: '01/01', due: '01/15', late: '01/16' },
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
			([key, settings]: [string, any]) => {
				localStorage.setItem(key, JSON.stringify(settings));
			},
			[recordKey, savedSettings] as [string, any]
		);

		await page.reload();
		await page.waitForLoadState('domcontentloaded');

		// Verify table is still empty (no auto-load)
		await expect(page.locator('text=Paste students from spreadsheet here')).toBeVisible();
		
		// Verify the saved record is available
		await expect(page.locator('summary:has-text("Saved Records")')).toBeVisible();
		await page.locator('summary:has-text("Saved Records")').click();
		await expect(page.locator(`.record:has-text("${recordName}")`)).toBeVisible();
	});
});