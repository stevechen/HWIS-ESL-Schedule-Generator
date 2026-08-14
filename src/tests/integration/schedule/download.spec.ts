import { test, expect } from '@playwright/test';

test('Download CSV smoke: filename and content match the rendered title', async ({ page }) => {
	await page.goto('/');

	// Wait for the output to be generated
	await expect(page.locator('#csv-output')).not.toHaveText('Loading data...');

	const downloadPromise = page.waitForEvent('download');
	await page.locator('#download_button').click();
	const download = await downloadPromise;

	// Filename derives from the title rendered from the single schedule module.
	const title = (await page.locator('#output h3').textContent())?.trim() ?? '';
	expect(download.suggestedFilename()).toBe(`${title}.csv`);

	// Stream content matches the rendered output.
	const stream = await download.createReadStream();
	const chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	const content = Buffer.concat(chunks).toString('utf-8');
	const expectedContent = await page.locator('#csv-output').textContent();
	expect(content).toBe(expectedContent?.replace(/\t/g, ','));
});
