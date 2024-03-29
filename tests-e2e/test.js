import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const MOCK_STUDENT_DATA = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

function initializeLocators(page) {
  return {
    locatorRadioG7: page.locator('input[type="radio"][value="G7"]'),
    locatorRadioG8: page.locator('input[type="radio"][value="G8"]'),
    locatorRadioG9: page.locator('input[type="radio"][value="G9"]'),
    locatorRadioCLIL: page.locator('input[type="radio"][value="CLIL"]'),
    locatorRadioComm: page.locator('input[type="radio"][value="Comm"]'),
    locatorRadioPassport: page.locator('input[type="radio"][value="passport"]'),
    locatorRadioRecording: page.locator('input[type="radio"][value="recording"]'),
    locatorRadioWorkbook: page.locator('input[type="radio"][value="workbook"]'),
    locatorRadioExam: page.locator('input[type="radio"][value="exam"]'),
  };
}

async function pasteDataIntoInput(page, context, selector, mockData) {
    // focus on the input
  await page.locator(selector).focus();

  // grant access to clipboard (you can also set this in the playwright.config.ts file)
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // Set the clipboard content to the desired data
  await page.evaluate((data) => navigator.clipboard.writeText(data), mockData);

  // simulate paste event
  await page.keyboard.press(`${modifier}+V`);
}

const isMac = async () => 'userAgentData' in navigator ? 
  (await navigator.userAgentData.getHighEntropyValues(["platform"])).platform === "macOS" :
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;

let modifier = isMac ? 'Meta' : 'Control';

test('should allow grade selection and update class type for G9', async ({ page }) => {
  // Navigate to your Svelte application page
  await page.goto(`${BASE_URL}/commslip`);
  const { locatorRadioG7, locatorRadioG8, locatorRadioCLIL, locatorRadioComm } = initializeLocators(page);

  // Select grade G8 and check if selected correctly
  await page.click('input[type="radio"][value="G8"]');
  await expect(locatorRadioG8).toBeChecked();

  // Select grade G9 and verify class type switches to 'Comm'
  await page.click('input[type="radio"][value="G9"]');
  await expect(locatorRadioComm).toBeChecked();
  await expect(locatorRadioCLIL).toBeHidden();

  // Select grade G7 and check if selected correctly and CLIL is shown
  await page.click('input[type="radio"][value="G7"]');
  await expect(locatorRadioG7).toBeChecked();
  await expect(locatorRadioCLIL).toBeVisible();
});

test('should hide assignment type for different classes', async({ page }) => {
  await page.goto(`${BASE_URL}/commslip`);
  const { locatorRadioPassport, locatorRadioRecording, locatorRadioWorkbook, locatorRadioExam } = initializeLocators(page);

  await page.click('input[type="radio"][value="G7"]');
  await page.click('input[type="radio"][value="CLIL"]');
  await expect(locatorRadioPassport).toBeHidden();
  await expect(locatorRadioRecording).toBeHidden();
  await expect(locatorRadioExam).toBeHidden();
  await expect(locatorRadioWorkbook).toBeVisible();

  await page.click('input[type="radio"][value="G9"]');
  await expect(locatorRadioWorkbook).toBeHidden();
});

test('should process pasted student data correctly', async ({ page, context }) => {
  // Navigate to your Svelte application page
  await page.goto(`${BASE_URL}/commslip`);

  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA);

   // Get today's date in MM/DD format
  const today = new Date();
  const formattedDate = (today.getMonth() + 1).toString().padStart(2, '0') + '/' + today.getDate().toString().padStart(2, '0');

  // Check if the due date input field has today's date
  await expect(page.locator('#due')).toHaveValue(formattedDate);

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

test('should update communication slips according to manual assignment type changes', async ({ page, context }) => {
  // Navigate to your Svelte application page
  await page.goto(`${BASE_URL}/commslip`);
  const { locatorRadioPassport, locatorRadioRecording, locatorRadioWorkbook, locatorRadioExam } = initializeLocators(page);

  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA);

  await page.click('input[type="radio"][value="CLIL"]');
  await expect(locatorRadioWorkbook).toBeVisible();
  await expect(locatorRadioWorkbook).toBeChecked();
 // Test for two spans with the text "Workbook" and "作業本"
  await expect(page.locator('span:text("Workbook"), span:text("作業本")')).toHaveCount(4);

  await page.click('input[type="radio"][value="Comm"]');
  await expect(locatorRadioPassport).toBeVisible();
  await expect(locatorRadioPassport).toBeChecked();
  await expect(locatorRadioRecording).toBeVisible();
  await expect(locatorRadioWorkbook).toBeVisible();
  await expect(locatorRadioExam).toBeVisible();

  await expect(page.locator('span:text("Passport"), span:text("英文護照")')).toHaveCount(4);

  await page.click('input[type="radio"][value="recording"]');
  await expect(page.locator('span:text("Recording"), span:text("錄影(錄音)")')).toHaveCount(4);

  await page.click('input[type="radio"][value="exam"]');
  await expect(page.locator('span:text("Oral Exam"), span:text("期末考口試")')).toHaveCount(4);
});

test('should update assigned date and late date on slips', async ({ page, context }) => {
  // Navigate to your page
  await page.goto(`${BASE_URL}/commslip`);

  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA);

  // Type in the Assign date and Late Date
  const assignDate = '01/01';
  const lateDate = '12/31';
  await page.fill('#assigned', assignDate);
  await page.fill('#late', lateDate);

  // Assert that the dates are correctly displayed on the SlipTemplate cards
  const assignDateOnCard = await page.$eval('#assigned', el => el.value);
  const lateDateOnCard = await page.$eval('#late', el => el.value);
  expect(assignDateOnCard).toBe(assignDate);
  expect(lateDateOnCard).toBe(lateDate);

  const assignDateInParagraph = await page.textContent('.date.assigned > p');
  expect(assignDateInParagraph).toContain(assignDate);

  const lateDateInParagraph = await page.textContent('.date.late > p');
  expect(lateDateInParagraph).toContain(lateDate);
});

test('should update slip fields with manual data change', async ({ page, context }) => {
  // Navigate to your page
  await page.goto(`${BASE_URL}/commslip`);

  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA);

  await page.fill('tr:nth-child(2) .id', '5555555');
  await expect(page.locator('.slip:nth-child(2) .id')).toContainText("5555555");

  await page.fill('tr:nth-child(2) .chinese_name', '王八');
  await expect(page.locator('.slip:nth-child(2) .chinese_name')).toContainText("王八");

  await page.fill('tr:nth-child(2) .english_name', 'Mary Jane');
  await expect(page.locator('.slip:nth-child(2) .english_name')).toContainText("Mary Jane");

  await page.fill('tr:nth-child(2) .chinese_class', 'J112');
  await expect(page.locator('.slip:nth-child(2) .chinese_class')).toContainText("J112");

  await page.click('tr:nth-child(2) > td > select');
  await page.selectOption('tr:nth-child(2) > td > select', { value: "1" });

  await expect(page.locator('.slip:nth-child(2) .assignment.name:nth-child(1) span')).toContainText("wasn't completed");
});


