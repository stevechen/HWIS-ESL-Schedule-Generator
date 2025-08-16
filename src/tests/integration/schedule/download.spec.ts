import { test, expect } from '@playwright/test';

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
	const getExpectedScheduleName = (grade: string, classType: string) => {
		const year = new Date().getFullYear();
		const month = new Date().getMonth();
		const schoolYear = month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
		const semester = month >= 7 || month === 0 ? '1' : '2';
		const [year1, year2] = schoolYear.split('-');
		const shortYear = `${year1.slice(-2)}-${year2.slice(-2)}`;
		const semesterText = `S${semester}`;

		let gradeText;
		if (grade === 'G7/8') {
			gradeText = `Junior ${classType}`;
		} else {
			gradeText = grade;
		}

		return `${shortYear} ${semesterText} ${gradeText} schedule`;
	};

	const classTypes = [
		{ label: 'G7/8 CLIL', grade: 'G7/8', type: 'CLIL' },
		{ label: 'G7/8 Comm', grade: 'G7/8', type: 'Comm' },
		{ label: 'G9', grade: 'G9', type: 'G9' },
		{ label: 'H10', grade: 'H', type: 'H' }
	];

	for (const { label, grade, type } of classTypes) {
		await page.getByText(label).click();

		// Wait for the output to be generated after changing class type
		await expect(page.locator('#csv-output')).not.toHaveText('Loading data...');

		const expectedName = getExpectedScheduleName(grade, type);

		// Check the h3 title
		await expect(page.locator('#output h3')).toHaveText(expectedName);

		// Check the downloaded filename
		const downloadPromise = page.waitForEvent('download');
		await page.locator('#download_button').click();
		const download = await downloadPromise;
		await expect(download.suggestedFilename()).toBe(`${expectedName}.csv`);
	}
});
