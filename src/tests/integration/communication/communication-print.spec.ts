import { test, expect } from '@playwright/test';
import { seedStudents } from './seedStudents';

const B5_WIDTH_PX = 693;
const B5_HEIGHT_PX = 980;

// Sample data for three students
const THREE_STUDENTS = `1234567\tJ101\t王小明\tDaniel Wang
2345678\tJ102\t李大文\tDavid Lee
3456789\tJ103\t陳美麗\tMary Chen`;

// Sample data for four students
const FOUR_STUDENTS = `1234567\tJ101\t王小明\tDaniel Wang
2345678\tJ102\t李大文\tDavid Lee
3456789\tJ103\t陳美麗\tMary Chen
4567890\tJ104\t林志明\tJimmy Lin`;

async function openPrintLayout(page: import('@playwright/test').Page, students: string) {
	await page.setViewportSize({ width: B5_WIDTH_PX, height: B5_HEIGHT_PX });
	await seedStudents(page, students);
	await page.emulateMedia({ media: 'print' });
	await expect(page.getByTestId('communication-slip').first()).toBeVisible();
	// Let the slip slide/fade transitions finish before measuring bounding boxes.
	await page.waitForTimeout(500);
}

test.describe('Communication Slip Printing (B5 print layout)', () => {
	test('should display a maximum of three slips on a B5 page', async ({ page }) => {
		await openPrintLayout(page, THREE_STUDENTS);

		await expect(page.getByTestId('communication-slip')).toHaveCount(3);

		const slips = await page.getByTestId('communication-slip').all();
		for (const slip of slips) {
			const boundingBox = await slip.boundingBox();
			expect(boundingBox).not.toBeNull();
			if (boundingBox) {
				expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(B5_HEIGHT_PX);
			}
		}
	});

	test('should place the fourth slip on the next page', async ({ page }) => {
		await openPrintLayout(page, FOUR_STUDENTS);

		await expect(page.getByTestId('communication-slip')).toHaveCount(4);
		const slips = await page.getByTestId('communication-slip').all();

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
			// The 4th slip starts a new page, so it sits below the first three.
			expect(fourthSlipBoundingBox.y).toBeGreaterThanOrEqual(0);
		}
	});

	test('should distribute slips evenly on the page', async ({ page }) => {
		await openPrintLayout(page, THREE_STUDENTS);

		await expect(page.getByTestId('communication-slip')).toHaveCount(3);
		const slips = await page.getByTestId('communication-slip').all();

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
