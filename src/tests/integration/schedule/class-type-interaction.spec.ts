import { test, expect } from '@playwright/test';

test.describe('Class Type Interaction', () => {
	test('should update the schedule when the class type is changed', async ({ page }) => {
		page.on('console', (msg) => {
			console.log(`Browser console: ${msg.text()}`);
		});
		await page.goto('/');

		// 1. Wait for the page to be fully loaded
		await page.locator('#output_table').getByText('Loading data...').waitFor({ state: 'hidden' });

		// 2. Initial state check
		await expect(page.getByLabel('G7/8 CLIL')).toBeChecked();
		await expect(page.locator('#output h3')).toContainText(/CLIL schedule$/);

		// 3. Change class type to "G7/8 Comm"
		await page.locator('label[for="Comm"]').click();
		await page.waitForLoadState('domcontentloaded');

		// 4. Assert that the schedule has updated
		await expect(page.locator('label[for="Comm"]')).toBeChecked();
		await page.waitForFunction(
			(selector) => document.querySelector(selector)?.textContent?.endsWith('Comm schedule'),
			'#output h3',
			{ timeout: 15000 }
		);

		// 5. Check that the table content has changed.
		// 5. Check that the table content has changed.
		await expect(page.locator('#output_table')).toContainText('Passport Check');
		await expect(page.locator('#output_table')).toContainText('Oral Exam');
	});
});
