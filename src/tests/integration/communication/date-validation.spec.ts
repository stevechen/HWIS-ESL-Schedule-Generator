import { test, expect } from '@playwright/test';

const THREE_STUDENTS = `1234567	J101	王小明	Daniel Wang
2345678	J102	李大文	David Lee
3456789	J103	陳美麗	Mary Chen`;

test.describe('Date Validation & Logic', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/communication');
		// Add valid students so we can focus on date warnings (Print button otherwise disabled/error for no students)
		await page.waitForFunction(() => typeof (window as any).setStudentsText === 'function');
		await page.evaluate((text) => (window as any).setStudentsText(text), THREE_STUDENTS);
		await page.waitForTimeout(200);
	});

	test('should flag invalid date sequence: Assigned must be earlier than Due', async ({ page }) => {
		// Assigned: 10/11, Due: 10/10 (Invalid: Assigned > Due)
		await page.locator('#assigned').fill('10/11');
		await page.locator('#due').fill('10/10');
		
		// Check inputs are flagged (using the error class we added)
		await expect(page.locator('label[for="assigned"]')).toHaveClass(/text-red-400/);
		await expect(page.locator('label[for="due"]')).toHaveClass(/text-red-400/);
		
		// Check Print button warning
		const printButton = page.locator('button.print-slips');
		await printButton.click();
		
		const dialog = page.locator('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Assigned date must be before Due date');
	});

	test('should flag invalid date sequence: Make up must be later than Due', async ({ page }) => {
		// Due: 10/10, Make up: 10/9 (Invalid: Make up < Due)
		await page.locator('#due').fill('10/10');
		await page.locator('#late').fill('10/9');
		
		// Check inputs are flagged
		await expect(page.locator('label[for="due"]')).toHaveClass(/text-red-400/);
		await expect(page.locator('label[for="late"]')).toHaveClass(/text-red-400/);
		
		// Check Print button warning
		const printButton = page.locator('button.print-slips');
		await printButton.click();
		
		const dialog = page.locator('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Make up date must be after Due date');
	});

	test('should handle year wrap-around correctly (Dec -> Jan)', async ({ page }) => {
		// Assigned: 12/31, Due: 1/1 (Valid: Jan is next year)
		await page.locator('#assigned').fill('12/31');
		await page.locator('#due').fill('1/1');
		
		// Check inputs are NOT flagged (should be white/valid)
		await expect(page.locator('label[for="assigned"]')).not.toHaveClass(/text-red-400/);
		await expect(page.locator('label[for="due"]')).not.toHaveClass(/text-red-400/);
		
		// Due: 12/31, Make up: 1/5 (Valid)
		await page.locator('#due').fill('12/31');
		await page.locator('#late').fill('1/5');
		await expect(page.locator('label[for="late"]')).not.toHaveClass(/text-red-400/);
	});

	test('should flag invalid reverse year wrap-around (Jan -> Dec)', async ({ page }) => {
		await page.locator('#assigned').fill('1/1');
		await page.locator('#due').fill('12/31');
		
		// Check inputs are flagged
		await expect(page.locator('label[for="assigned"]')).toHaveClass(/text-red-400/);
		await expect(page.locator('label[for="due"]')).toHaveClass(/text-red-400/);
		
		// Check Print button warning
		const printButton = page.locator('button.print-slips');
		await printButton.click();
		
		const dialog = page.locator('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Assigned date must be before Due date');
	});
});
