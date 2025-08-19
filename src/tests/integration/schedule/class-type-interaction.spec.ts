import { test, expect } from '@playwright/test';

test.describe('Class Type Interaction', () => {
	// test.beforeEach(async ({ page, context }) => {
	// 	await context.clearCookies();
	// 	await page.goto('/'); // Navigate to the app
	// 	await page.waitForLoadState('networkidle'); // Wait for the page to be fully loaded
	// });

	test('should update the schedule when the class type is changed', async ({ page }) => {
		await page.goto('/'); // Navigate to the app
		await page.waitForLoadState('networkidle'); // Wait for the page to be fully loaded
		const clilLabel = page.locator('label[for="CLIL"]');
		const commLabel = page.locator('label[for="Comm"]');
		const outputTable = page.locator('#output_table');
		const outputTitle = page.locator('#output h3');

		// 1. Initial state check
		await expect(clilLabel).toBeChecked();
		await expect(outputTitle).toContainText(/CLIL schedule$/);

		// 2. Change class type to "G7/8 Comm"
		await commLabel.click();

		// 3. Wait for the output title to change to "Comm schedule"
		await page.waitForSelector('#output h3:has-text("Comm schedule")');

		// 4. Assert that the schedule has updated
		await expect(commLabel).toBeChecked();

		// 5. Check that the table content has changed.
		await expect(outputTable).toContainText('Passport Check');
		await expect(outputTable).toContainText('Oral Exam');
	});
});
