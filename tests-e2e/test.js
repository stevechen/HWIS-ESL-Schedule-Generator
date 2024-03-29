import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

const isMac = async () => {
  if (navigator.userAgentData) {
    const brands = await navigator.userAgentData.getHighEntropyValues(["platform"]);
    return brands.platform === "macOS";
  } else {
    // Fallback for browsers that do not support navigator.userAgentData
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }
}

let modifier = isMac ? 'Meta' : 'Control';

test('should allow grade selection and update class type for G9', async ({ page }) => {
  // Navigate to your Svelte application page
  await page.goto(`${BASE_URL}/commslip`);

  // Select grade G8 and check if selected correctly
  await page.click('input[type="radio"][value="G8"]');
  await expect(page.locator('input[type="radio"][value="G8"]')).toBeChecked();

  // Select grade G9 and verify class type switches to 'Comm'
  await page.click('input[type="radio"][value="G9"]');
  await expect(page.locator('input[type="radio"][value="Comm"]')).toBeChecked();
  await expect(page.locator('input[type="radio"][value="CLIL"]')).toBeHidden();

  // Select grade G7 and check if selected correctly and CLIL is shown
  await page.click('input[type="radio"][value="G7"]');
  await expect(page.locator('input[type="radio"][value="G7"]')).toBeChecked();
  await expect(page.locator('input[type="radio"][value="CLIL"]')).toBeVisible();
});

test('should hide assignment type for different classes', async({ page }) => {
  await page.goto(`${BASE_URL}/commslip`);
  const passport = page.locator('input[type="radio"][value="passport"]');
  const recording = page.locator('input[type="radio"][value="recording"]');
  const workbook = page.locator('input[type="radio"][value="workbook"]');
  const oral = page.locator('input[type="radio"][value="oral"]');

  await page.click('input[type="radio"][value="G7"]');
  await page.click('input[type="radio"][value="CLIL"]');
  await expect(passport).toBeHidden();
  await expect(recording).toBeHidden();
  await expect(oral).toBeHidden();
  await expect(workbook).toBeVisible();


  await page.click('input[type="radio"][value="G9"]');
  await expect(page.locator('input[type="radio"][value="workbook"]')).toBeHidden();
});

test('should process pasted student data correctly', async ({ page, context }) => {
  // Navigate to your Svelte application page
  await page.goto(`${BASE_URL}/commslip`);

    // focus on the input
  await page.locator('#sList').focus();

  // grant access to clipboard (you can also set this in the playwright.config.ts file)
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

// Simulate pasting student data into the textarea
let studentData = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

// Set the clipboard content to the desired data
await page.evaluate((data) => navigator.clipboard.writeText(data), studentData);
  // const clipboardContent = await page.evaluateHandle(() => navigator.clipboard.readText());

    // paste text from clipboard
  await page.keyboard.press(`${modifier}+V`);

  // Verify that the student data is processed and displayed in the table
  await expect(page.locator('text=1234567')). toBeVisible();
  await expect(page.locator('text=張三')).toBeVisible();
  await expect(page.locator('text=San Chang')).toBeVisible();
  await expect(page.locator('text=J101')).toBeVisible();

    // Verify that the student data is processed and displayed in the table
  await expect(page.locator('text=7654321')). toBeVisible();
  await expect(page.locator('text=李四')).toBeVisible();
  await expect(page.locator('text=Si Li')).toBeVisible();
  await expect(page.locator('text=J102')).toBeVisible();
  // Check for the status in the dropdown
  await expect(page.locator('select >> nth=0')).toHaveValue('0');
});