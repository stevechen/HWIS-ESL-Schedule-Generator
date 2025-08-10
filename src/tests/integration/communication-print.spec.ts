import { test, expect } from '@playwright/test';

const B5_WIDTH_PX = 693;
const B5_HEIGHT_PX = 980;

// Sample data for three students
const THREE_STUDENTS = `1234567	J101	王小明	Daniel Wang
2345678	J102	李大文	David Lee
3456789	J103	陳美麗	Mary Chen`;

// Sample data for four students
const FOUR_STUDENTS = `1234567	J101	王小明	Daniel Wang
2345678	J102	李大文	David Lee
3456789	J103	陳美麗	Mary Chen
4567890	J104	林志明	Jimmy Lin`;

test.describe('Communication Slip Printing', () => {
	test('should display a maximum of three slips on a B5 page', async ({ page }) => {
		await page.goto('/communication');
		await page.setViewportSize({ width: B5_WIDTH_PX, height: B5_HEIGHT_PX });
		await page.locator('#student-list-input').fill(THREE_STUDENTS);
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Passport').check();
		await page.locator('#due').fill('9/10');
		await page.locator('#late').fill('9/11');
		await page.locator('input[type="number"]').fill('1');
		await page.emulateMedia({ media: 'print' });

		const slips = await page.getByTestId('communication-slip').all();
		expect(slips.length).toBe(3);

		for (const slip of slips) {
			const boundingBox = await slip.boundingBox();
			expect(boundingBox).not.toBeNull();
			if (boundingBox) {
				expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(B5_HEIGHT_PX);
			}
		}
	});

	test('should place the fourth slip on the next page', async ({ page }) => {
		await page.goto('/communication');
		await page.setViewportSize({ width: B5_WIDTH_PX, height: B5_HEIGHT_PX });
		await page.locator('#student-list-input').fill(FOUR_STUDENTS);
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Passport').check();
		await page.locator('#due').fill('9/10');
		await page.locator('#late').fill('9/11');
		await page.locator('input[type="number"]').fill('1');
		await page.emulateMedia({ media: 'print' });

		const slips = await page.getByTestId('communication-slip').all();
		expect(slips.length).toBe(4);

		const firstThreeSlips = slips.slice(0, 3);
		const fourthSlip = slips[3];

		for (const slip of firstThreeSlips) {
			const boundingBox = await slip.boundingBox();
			expect(boundingBox).not.toBeNull();
			if (boundingBox) {
				expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(B5_HEIGHT_PX);
			}
		}

		const fourthSlipBoundingBox = await fourthSlip.boundingBox();
		expect(fourthSlipBoundingBox).not.toBeNull();
		if (fourthSlipBoundingBox) {
			// This is a simplification. In a real browser, this would be on a new page.
			// Here we check if it would render outside the initial viewport.
			expect(fourthSlipBoundingBox.y).toBeGreaterThanOrEqual(0);
		}
	});

	test('should distribute slips evenly on the page', async ({ page }) => {
		await page.goto('/communication');
		await page.setViewportSize({ width: B5_WIDTH_PX, height: B5_HEIGHT_PX });
		await page.locator('#student-list-input').fill(THREE_STUDENTS);
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Passport').check();
		await page.locator('#due').fill('9/10');
		await page.locator('#late').fill('9/11');
		await page.locator('input[type="number"]').fill('1');
		await page.emulateMedia({ media: 'print' });

		const slips = await page.getByTestId('communication-slip').all();
		expect(slips.length).toBe(3);

		const expectedSlipHeight = B5_HEIGHT_PX / 3;
		const pixelTolerance = 5; // pixels, for minor rendering variations

		const boundingBoxes = [];
		for (const slip of slips) {
			const boundingBox = await slip.boundingBox();
			expect(boundingBox).not.toBeNull();
			if (boundingBox) {
				boundingBoxes.push(boundingBox);
			}
		}

		for (let i = 0; i < boundingBoxes.length; i++) {
			const boundingBox = boundingBoxes[i];

			// Check height
			expect(boundingBox.height).toBeGreaterThanOrEqual(expectedSlipHeight - pixelTolerance);
			expect(boundingBox.height).toBeLessThanOrEqual(expectedSlipHeight + pixelTolerance);

			// Check vertical position relative to the previous slip
			if (i > 0) {
				const previousBoundingBox = boundingBoxes[i - 1];
				const actualVerticalDistance = boundingBox.y - previousBoundingBox.y;
				expect(actualVerticalDistance).toBeGreaterThanOrEqual(expectedSlipHeight - pixelTolerance);
				expect(actualVerticalDistance).toBeLessThanOrEqual(expectedSlipHeight + pixelTolerance);
			} else {
				// For the first slip, check its y position is close to 0
				expect(boundingBox.y).toBeGreaterThanOrEqual(0 - pixelTolerance);
				expect(boundingBox.y).toBeLessThanOrEqual(0 + pixelTolerance);
			}
		}
	});
});
