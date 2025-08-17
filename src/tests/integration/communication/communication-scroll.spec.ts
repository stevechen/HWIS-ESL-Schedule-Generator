import { test, expect } from '@playwright/test';

// Helper function to generate a long list of student data
function generateStudentList(count: number): string {
	let students = '';
	for (let i = 1; i <= count; i++) {
		const id = (1000000 + i).toString();
		const cClass = `J1${100 + i}`;
		const chineseName = `王小明${i}`;
		const englishName = `Daniel Wang ${i}`;
		students += `${id}\t${cClass}\t${chineseName}\t${englishName}\n`;
	}
	return students;
}

test.describe('Communication Controls Scrolling', () => {
	test('should become scrollable when the student list is long', async ({ page }) => {
		await page.goto('/communication');

		// Generate a list of 30 students to ensure the controls panel overflows
		const longStudentList = generateStudentList(30);

		// Fill the textarea with the student list
		await page.locator('#student-list-input').fill(longStudentList);

		// Wait for the table to be populated
		await expect(page.locator('table tbody tr').nth(29)).toBeVisible();

		const controls = page.locator('#controls');

		// 1. Check for the correct CSS properties
		await expect(controls).toHaveCSS('overflow-y', 'auto');

		// 2. Check that the max-height is correctly calculated
		// Note: Playwright computes the value, so we check against the computed pixel value.
		// 2.5rem is typically 40px in a default browser setting.
		const calculatedMaxHeight = await controls.evaluate((element) => {
			return window.getComputedStyle(element).maxHeight;
		});
		const viewportHeight = page.viewportSize()?.height ?? 0;
		const expectedMaxHeight = viewportHeight - 40; // 100vh - 2.5rem (40px)
		
		// We check if the calculated max-height is close to the expected value
		// This is more robust than checking for an exact string like "calc(100vh - 40px)"
		expect(parseFloat(calculatedMaxHeight)).toBeCloseTo(expectedMaxHeight, 0);


		// 3. Verify that the "Print" button at the bottom is visible after scrolling
		const printButton = page.locator('button.print-slips');
		await printButton.scrollIntoViewIfNeeded();
		await expect(printButton).toBeInViewport();
	});
});
