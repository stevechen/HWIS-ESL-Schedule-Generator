import { test, expect } from '@playwright/test';

test('Download CSV Test', async ({ page }) => {
  await page.goto('/');

  // Wait for the output to be generated
  await expect(page.locator('textarea').nth(1)).not.toHaveValue('Loading data...');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download_button').click();
  const download = await downloadPromise;

  // Check the file name
  expect(download.suggestedFilename()).toBe('class_schedule.csv');

  // Check the file content
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks).toString('utf-8');
  
  // Get the expected content from the textarea
  const expectedContent = await page.locator('textarea').nth(1).inputValue();
  const expectedCsv = expectedContent.replace(/\t/g, ',');

  expect(content).toBe(expectedCsv);
});
