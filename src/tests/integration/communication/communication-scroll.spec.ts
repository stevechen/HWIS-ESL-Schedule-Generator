import { test, expect } from '@playwright/test';
import { seedStudents } from './seedStudents';

// Generate a long list of student data so the controls panel overflows.
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

test.describe('Communication controls scrolling', () => {
	test('should become scrollable when the student list is long', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });

		// A list long enough that the controls panel must scroll.
		const longStudentList = generateStudentList(30);
		await seedStudents(page, longStudentList);

		const controls = page.locator('#controls');

		// 1. The panel scrolls vertically once it overflows.
		await expect(controls).toHaveCSS('overflow-y', 'auto');

		// 2. max-height is calc(100dvh - 2.5rem): the panel never fills the viewport.
		const calculatedMaxHeight = await controls.evaluate((element) => {
			return window.getComputedStyle(element).maxHeight;
		});
		const viewportHeight = page.viewportSize()?.height ?? 0;
		const expectedMaxHeight = viewportHeight - 40; // 2.5rem ≈ 40px
		expect(parseFloat(calculatedMaxHeight)).toBeCloseTo(expectedMaxHeight, 0);

		// 3. The Print button sits at the bottom of the scrolled panel and is reachable.
		const printButton = page.locator('button.print-slips');
		await printButton.scrollIntoViewIfNeeded();
		await expect(printButton).toBeInViewport({ ratio: 1 });
	});
});
