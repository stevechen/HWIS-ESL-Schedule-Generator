/* global Event, window, document, localStorage */

import { test, expect } from '@playwright/test';
import { seedStudents } from './seedStudents';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const MOCK_STUDENT_DATA = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function uploadSignature(page, image) {
	// Construct the absolute path to the fixture file. Using path.join for the
	// full path is more robust across different operating systems.
	const fixturePath = path.join(__dirname, '../fixtures', image);

	try {
		await fs.access(fixturePath);
	} catch {
		throw new Error(`Test setup error: Fixture file not found at ${fixturePath}`);
	}

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('#browse').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(fixturePath);
}

test.describe('Signature reload journey', () => {
	test('should save and load signature image from local storage', async ({ page }) => {
		await seedStudents(page, MOCK_STUDENT_DATA);

		// Clear local storage before starting the test to ensure a clean state
		await page.evaluate(() => localStorage.clear());

		const signaturePreview = page.locator('.signature-preview');
		const removeSignatureButton = page.locator('#remove-signature');

		// 1. Upload a signature image
		await uploadSignature(page, 'sig_test.png');

		// Wait for the image to be processed and displayed
		await expect(signaturePreview).toBeVisible();
		await expect(signaturePreview).toHaveAttribute('src', /data:image\/(png|jpeg);base64,.+/);

		// Check that the image data is in local storage
		const storedImage = await page.evaluate(() => localStorage.getItem('signatureImage'));
		expect(storedImage).toMatch(/data:image\/(png|jpeg);base64,.+/);

		// 2. Reload the page and verify image persists
		await page.reload();
		await seedStudents(page, MOCK_STUDENT_DATA);
		await expect(signaturePreview).toBeVisible();
		await expect(signaturePreview).toHaveAttribute('src', /data:image\/(png|jpeg);base64,.+/);

		// 3. Remove the signature
		await removeSignatureButton.click();
		await expect(signaturePreview).not.toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('signatureImage'))).toBeNull();

		// 4. Reload the page and verify image is still gone
		await page.reload();
		await seedStudents(page, MOCK_STUDENT_DATA);
		await expect(signaturePreview).not.toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('signatureImage'))).toBeNull();
	});
});
