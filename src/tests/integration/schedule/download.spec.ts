import { test, expect } from '@playwright/test';
// Helper function to get the expected schedule name
import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';
import { getGradeForClassType, ClassType } from '$lib/config/classTypes'; // NEW IMPORT - ClassType added

test('Download CSV Test', async ({ page }) => {
	await page.goto('/');

	// Wait for the output to be generated
	await expect(page.locator('#csv-output')).not.toHaveText('Loading data...');

	const downloadPromise = page.waitForEvent('download');
	await page.locator('#download_button').click();
	const download = await downloadPromise;

	// Check the file content
	const stream = await download.createReadStream();
	const chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	const content = Buffer.concat(chunks).toString('utf-8');

	// Get the expected content from the csv-output div
	const expectedContent = await page.locator('#csv-output').textContent();
	const expectedCsv = expectedContent?.replace(/\t/g, ',');

	expect(content).toBe(expectedCsv);
});

test('Schedule title and download filename update dynamically', async ({ page }) => {
	await page.goto('/');

	// Helper function to get the expected schedule name
	const getExpectedScheduleName = (classType: string) => {
		// Changed parameter from grade to classType
		const grade = getGradeForClassType(classType as ClassType); // Get grade using the app's logic - CAST ADDED

		let gradeText;
		if (grade === 'G7/8') {
			gradeText = `Junior ${classType}`;
		} else {
			gradeText = grade;
		}

		const schoolYearAndSemesterPrefix = getSchoolYearAndSemesterPrefix();
		const [year1, year2, semester] = schoolYearAndSemesterPrefix.split('-');
		const shortYear = `${year1.slice(-2)}-${year2.slice(-2)}`;
		const semesterText = `S${semester}`;

		return `${shortYear} ${semesterText} ${gradeText} schedule`;
	};

	const classTypes = [
		{ label: 'G7/8 CLIL', type: 'CLIL' }, // Removed grade property
		{ label: 'G7/8 Comm', type: 'Comm' }, // Removed grade property
		{ label: 'G9', type: 'G9' },
		{ label: 'H10', type: 'H' } // Changed type from 'Comm' to 'H' to match ClassTypeCode.H
	];

	for (const { label, type } of classTypes) { // Changed iteration to use 'type'
		await page.getByText(label).click();

		// Wait for the output to be generated after changing class type
		await expect(page.locator('#csv-output')).not.toHaveText('Loading data...');

		const expectedName = getExpectedScheduleName(type); // Pass type to the helper function

		// Check the h3 title
		await expect(page.locator('#output h3')).toHaveText(expectedName);

		// Check the downloaded filename
		const downloadPromise = page.waitForEvent('download');
		await page.locator('#download_button').click();
		const download = await downloadPromise;
		await expect(download.suggestedFilename()).toBe(`${expectedName}.csv`);
	}
});

test('Download button shows "Downloaded!" toast message', async ({ page }) => {
	await page.goto('/');

	// Wait for the output to be generated
	await expect(page.locator('#csv-output')).not.toHaveText('Loading data...');

	await page.locator('#download_button').click();

	// Check for the toast message
	const toastMessage = page.locator('.toast-message');
	await expect(toastMessage).toBeVisible();
	await expect(toastMessage).toHaveText('Downloaded!');

	// Wait for the toast message to disappear
	await expect(toastMessage).not.toBeVisible();
});