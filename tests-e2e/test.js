import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const MOCK_STUDENT_DATA = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const MOCK_STUDENT_DATA_G9 = `1234567\t張三\tSan Chang\tJ301
7654321\t李四\tSi Li\tJ302`;

const MOCK_STUDENT_DATA_G9_FULL =
`1100396	Tina Yang	楊凱鈞	J306
1100274	Ed Chen	陳秉鋒	J304
1100159	Jerry Wang	王俊捷	J305
1100028	Gina Lin	林妤庭	J308
1100229	Tim Qiu	邱皇錞	J306
1100232	Alan Ko	柯宇宸	J306
1100027	Cindy Lin	林佑蓁	J306
1100122	Kelly Liu	劉奕瑄	J305
1100112	Una Zou	鄒勻芊	J308
1100161	Nico Wang	王奕斌	J304
1100039	Iris Lin	林昱辰	J306
1100278	Andy Chen	陳奕嘉	J306
1100216	Baron Lin	林柏丞	J308
1100318	Jeffrey Huang	黃竑睿	J304`

function initializeLocators(page) {
  return {
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

test('should hide assignment type for different classes', async({ page, context }) => {
  await page.goto(`${BASE_URL}/commslip`);
  const { locatorRadioPassport, locatorRadioRecording, locatorRadioWorkbook, locatorRadioExam } = initializeLocators(page);

  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA_G9);

  await expect(locatorRadioPassport).toBeVisible();
  await expect(locatorRadioRecording).toBeVisible();
  await expect(locatorRadioExam).toBeVisible();
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

  //change second row data
  await page.fill('tr:nth-child(2) .student-id > input', '5555555');
  await expect(page.locator('.slip:nth-child(2) .student-id')).toContainText("5555555");

  await page.fill('tr:nth-child(2) .chinese-name > input', '王八');
  await expect(page.locator('.slip:nth-child(2) .chinese-name')).toContainText("王八");

  await page.fill('tr:nth-child(2) .english-name > input', 'Mary Jane');
  await expect(page.locator('.slip:nth-child(2) .english-name')).toContainText("Mary Jane");

  await page.fill('tr:nth-child(2) .chinese-class > input', 'J112');
  await expect(page.locator('.slip:nth-child(2) .chinese-class')).toContainText("J112");

  await page.click('tr:nth-child(2) > td > select');
  await page.selectOption('tr:nth-child(2) > td > select', { value: "1" });

  await expect(page.locator('.slip:nth-child(2) .assignment.name:nth-child(1) span')).toContainText("wasn't completed");
});

test('should correctly remove and add back SlipTemplate on checkbox operation', async ({ page, context }) => {
  await page.goto(`${BASE_URL}/commslip`);
  await pasteDataIntoInput(page, context, '#sList', MOCK_STUDENT_DATA_G9_FULL);

  // Assuming checkboxes have a class '.student-checkbox' within a <td>
  const checkboxes = await page.locator('td.student-checkbox > input[type="checkbox"]');
  const count = await checkboxes.count();
  const randomIndex = Math.floor(Math.random() * count);

  // Uncheck the random checkbox
  await checkboxes.nth(randomIndex).uncheck();
  // Navigate to the parent <td>, then to the parent <tr>, and finally to the next <td> to find the .student-id
  let studentIdValue = await checkboxes.nth(randomIndex).locator('xpath=ancestor::tr').locator('td.student-id > input').inputValue();
  // Verify the SlipTemplate is removed
  await expect(page.locator(`.slip .student-id input[value="${studentIdValue}"]`)).toBeHidden();

  // Check the checkbox
  // await checkboxes.nth(randomIndex).check();
  // Verify the SlipTemplate is added back
  // await expect(page.locator(`.slip .student-id input[value="${studentIdValue}"]`)).toBeVisible();
  //   let studentChineseName = await checkboxes.nth(randomIndex).locator('xpath=ancestor::tr').locator('td.chinese-name > input').inputValue();

  // let isVisible = await page.isVisible(`.slip .chinese-name input[value="${studentChineseName}"]`);
  // expect(isVisible).toBe(true);

  
});