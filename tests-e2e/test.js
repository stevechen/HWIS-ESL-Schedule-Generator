import { test, expect } from '@playwright/test';
import fs from 'fs/promises'; // Use promises-based fs for async/await
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'http://localhost:5173';

const MOCK_STUDENT_DATA = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

const MOCK_STUDENT_DATA_G9 = `1234567\t張三\tSan Chang\tJ301
7654321\t李四\tSi Li\tJ302`;

const MOCK_STUDENT_DATA_G9_FULL =
`1100396\tTina Yang\t楊凱鈞\tJ306
1100274\tEd Chen\t陳秉鋒\tJ304
1100159\tJerry Wang\t王俊捷\tJ305
1100028\tGina Lin\t林妤庭\tJ308
1100229\tTim Qiu\t邱皇錞\tJ306
1100232\tAlan Ko\t柯宇宸\tJ306
1100027\tCindy Lin\t林佑蓁\tJ306
1100122\tKelly Liu\t劉奕瑄\tJ305
1100112\tUna Zou\t鄒勻芊\tJ308
1100161\tNico Wang\t王奕斌\tJ304
1100039\tIris Lin\t林昱辰\tJ306
1100278\tAndy Chen\t陳奕嘉\tJ306
1100216\tBaron Lin\t林柏丞\tJ308
1100318\tJeffrey Huang\t黃竑睿\tJ304`

function initializeLocators(page) {
  return {
    locatorRadioCLIL: page.locator('input[type="radio"][value="CLIL"]'),
    locatorRadioComm: page.locator('input[type="radio"][value="COMM"]'),
    locatorRadioPassport: page.locator('input[type="radio"][value="passport"]'),
    locatorRadioRecording: page.locator('input[type="radio"][value="recording"]'),
    locatorRadioWorkbook: page.locator('input[type="radio"][value="workbook"]'),
    locatorRadioExam: page.locator('input[type="radio"][value="exam"]'),
    locatorRadioSpeech: page.locator('input[type="radio"][value="speech"]'),

    locatorLabelCLIL: page.locator('label[for="CLIL"]'),
    locatorLabelComm: page.locator('label[for="COMM"]'),
    locatorLabelPassport: page.locator('label[for="passport"]'),
    locatorLabelRecording: page.locator('label[for="recording"]'),
    locatorLabelWorkbook: page.locator('label[for="workbook"]'),
    locatorLabelExam: page.locator('label[for="exam"]'),
    locatorLabelSpeech: page.locator('label[for="speech"]'),
  };
}

//#region paste function
async function pasteDataIntoInput(page, context, selector, mockData) {
  // focus on the input
  await page.locator(selector).focus();
  // *** poll regularly so data won't be pasted before focus is complete
  await page.waitForFunction(([selector]) => {
    const element = document.querySelector(selector);
    return document.activeElement === element;
  }, [selector]);

  // grant access to clipboard (you can also set this in the playwright.config.ts file)
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Set the clipboard content to the desired data
  await page.evaluate((data) => navigator.clipboard.writeText(data), mockData);
  // simulate paste event
  await page.keyboard.press(`${modifier}+V`);

  // Wait for the #master-checkbox to appear
  await page.locator('#master-checkbox').waitFor({ state: 'visible', timeout: 1000 });
}

//#region platform detection
const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

//#region before test
test.beforeEach(async ({ page }) => {
  const uniqueParam = new Date().getTime(); // Using current timestamp as a unique parameter
  await page.goto(`${BASE_URL}/communication?timestamp=${uniqueParam}`);
});

// #region auto assignment display
test('should hide workbook, speech assignment type for G9', async({ page, context }) => {
  const ctrl = {...initializeLocators(page)};
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9);

  await expect(ctrl.locatorLabelPassport).toBeVisible();
  await expect(ctrl.locatorLabelRecording).toBeVisible();
  await expect(ctrl.locatorLabelExam).toBeVisible();
  await expect(ctrl.locatorLabelWorkbook).toBeHidden();
  await expect(ctrl.locatorLabelSpeech).toBeHidden();

  await expect(ctrl.locatorRadioPassport).toBeHidden();
  await expect(ctrl.locatorRadioRecording).toBeHidden();
  await expect(ctrl.locatorRadioExam).toBeHidden();
  await expect(ctrl.locatorRadioWorkbook).toBeHidden();
  await expect(ctrl.locatorRadioSpeech).toBeHidden();
});

test('should show only workbook and speech assignment type for CLIL', async({ page, context }) => {
  const ctrl = {...initializeLocators(page)};
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

  await ctrl.locatorLabelCLIL.click();

  await expect(ctrl.locatorLabelPassport).toBeHidden();
  await expect(ctrl.locatorLabelRecording).toBeHidden();
  await expect(ctrl.locatorLabelExam).toBeHidden();
  await expect(ctrl.locatorLabelWorkbook).toBeVisible();
  await expect(ctrl.locatorLabelSpeech).toBeVisible();
});

// #region paste student
test('should auto insert due, late dates and have matching pasted students in the table', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

   // Get today's date, and 7 days later in MM/DD format
  const today = new Date();
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const dueDate = `${today.getMonth() + 1}/${today.getDate()}`;
	const lateDate = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;

  // Check if the due date input field has today as the date and 7 days later as the late date
  await expect(page.locator('#due')).toHaveValue(dueDate);
  await expect(page.locator('#late')).toHaveValue(lateDate);

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

//#region assignment change
test('should match slips with assignment type changes', async ({ page, context }) => {
  const { locatorLabelCLIL,  locatorLabelComm, locatorLabelPassport, locatorLabelRecording, locatorLabelWorkbook, locatorLabelExam } = initializeLocators(page);

  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

  await locatorLabelCLIL.click();
  await expect(locatorLabelWorkbook).toBeVisible();
  await expect(locatorLabelWorkbook).toBeChecked();
 // Test for two spans with the text "Workbook" and "作業本"
  await expect(page.locator('span:text("Workbook"), span:text("**作業本**")')).toHaveCount(4);

  await locatorLabelComm.click();
  await locatorLabelPassport.click();
  await expect(locatorLabelPassport).toBeVisible();
  await expect(locatorLabelPassport).toBeChecked();
  await expect(locatorLabelRecording).toBeVisible();
  await expect(locatorLabelWorkbook).toBeVisible();
  await expect(locatorLabelExam).toBeVisible();
  await expect(page.locator('span:text("Passport"), span:text("**英文護照**")')).toHaveCount(4);

  await locatorLabelRecording.click();
  await expect(page.locator('span:text("Recording"), span:text("**錄影/錄音**")')).toHaveCount(4);

  await locatorLabelExam.click();
  await expect(page.locator('span:text("Oral Exam"), span:text("**期中/末考口試**")')).toHaveCount(4);
});

//#region dates
test('should update assigned date and late date on slips', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);
  const assignDate = '1/1';
  const lateDate = '12/31';
  await page.fill('input#assigned', assignDate);
  await page.fill('input#late', lateDate);  
  const assignDateOnSlip = await page.textContent('p.assigned');
  expect(assignDateOnSlip).toContain(assignDate);
  const lateDateOnSlip = await page.textContent('p.late');
  expect(lateDateOnSlip).toContain(lateDate);
});

//#region student info change
test('should update slip fields with data change', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9_FULL);

  const checkboxes = page.locator('td.student-checkbox > input[type="checkbox"]');
  const count = await checkboxes.count();
  const randomIndex = Math.floor(Math.random() * count);

  //change the random row data
  await page.fill(`tr:nth-child(${randomIndex}) td.student-id > input`, '5555555');
  await expect(page.locator(`.slip:nth-of-type(${randomIndex}) .student-info`)).toContainText("5555555");

  await page.fill(`tr:nth-child(${randomIndex}) .chinese-name > input`, '王八');
  await expect(page.locator(`.slip:nth-of-type(${randomIndex}) .student-info`)).toContainText("王八");

  await page.fill(`tr:nth-child(${randomIndex}) .english-name > input`, 'Mary Jane');
  await expect(page.locator(`.slip:nth-of-type(${randomIndex}) .student-info`)).toContainText("Mary Jane");

  await page.fill(`tr:nth-child(${randomIndex}) .chinese-class > input`, 'J112');
  await expect(page.locator(`.slip:nth-of-type(${randomIndex}) .class-info`)).toContainText("J112");

  await page.click(`tr:nth-child(${randomIndex}) > td > select`);
  await page.selectOption(`tr:nth-of-type(${randomIndex}) > td > select`, { value: "1" });

  await expect(page.locator(`.slip:nth-of-type(${randomIndex}) .assignment-info`)).toContainText("wasn't completed");
});

//#region include/exclude students
test('should remove and add back a slip with checkbox operation', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9_FULL);
  // Assuming checkboxes have a class '.student-checkbox' within a <td>
  const checkboxes = page.locator('td.student-checkbox > input[type="checkbox"]');
  const count = await checkboxes.count();
  const randomIndex = Math.floor(Math.random() * count);
  // Uncheck the random checkbox
  await checkboxes.nth(randomIndex).uncheck();
  // Navigate to the parent <td>, then to the parent <tr>, and finally to the next <td> to find the .student-id
  let studentIdValue = await checkboxes.nth(randomIndex).locator('xpath=ancestor::tr').locator('td.student-id > input').inputValue();
  // Verify the Slip is removed
  // await expect(page.locator(`.slip .student-id input[value="${studentIdValue}"]`)).toBeHidden();
  await expect(page.locator(`text=(${studentIdValue})`)).toBeHidden(); 
  // Check the checkbox
  await checkboxes.nth(randomIndex).check();
  // Verify the Slip is added back
  await expect(page.locator(`text=(${studentIdValue})`)).toBeVisible(); 
});

//#region master-checkbox
test('should check, uncheck all with master-checkbox and master-checkbox should have a indeterminate state ', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9_FULL);

  await page.click('#master-checkbox'); //uncheck all
  const checkboxes = page.locator('td.student-checkbox > input[type="checkbox"]');
  const count = await checkboxes.count();
  // click to  uncheck all
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    await expect(checkbox).not.toBeChecked();
  }
  // check one student
  await checkboxes.nth(0).click();
  // master-checkbox is in indeterminate state
  expect(page.evaluate(() => document.querySelector('#master-checkbox').indeterminate)).toBeTruthy();
  // click to check all
  await page.click('#master-checkbox');
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    await expect(checkbox).toBeChecked();
  }
});
//#region signature upload-----------------------------------------------------------------
test.describe('Signature Upload', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  async function uploadSignature(page, image) {
    // Construct the absolute path to the fixture file. Using path.join for the
    // full path is more robust across different operating systems.
    const fixturePath = path.join(__dirname, 'fixtures', image);

    // Before asking Playwright to upload the file, we can add a quick check
    // to see if the file actually exists. This provides a much clearer error
    // message ("Fixture file not found...") than a generic Playwright timeout.
    try {
      await fs.access(fixturePath);
    } catch {
      // If fs.access throws, the file doesn't exist or we can't access it.
      throw new Error(`Test setup error: Fixture file not found at ${fixturePath}`);
    }

    // The rest of the upload logic remains the same.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#browse').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);
  }

  test.beforeEach(async ({ page, context }) => {
    await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

    // Safely remove the signature if it exists, awaiting every step.
    const filePath = path.join(__dirname, '..', 'static', 'sig.png');

    try {
      // Check if the file exists using promises
      await fs.access(filePath);

      // If the file exists, the signature preview should be visible.
      // Click the remove button and wait for the preview to disappear.
      const removeSignatureButton = page.locator('#remove-signature');
      await removeSignatureButton.click();
      await expect(page.locator('.signature-preview')).toBeHidden();
    } catch (error) {
      // If the file doesn't exist, fs.access throws. We can safely ignore it
      // as it means there's no signature to remove.
    }
  });

  test('should reject signature images too short in height', async ({ page }) => {
    // Set up the listener BEFORE performing the action that triggers it.
    const dialogPromise = page.waitForEvent('dialog');
    await uploadSignature(page, 'sig_short.png');

    // Await the dialog and perform assertions.
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('greater than');
    await dialog.dismiss();
  });

  test('should reject signature images over size limit', async ({ page }) => {
    await uploadSignature(page, 'sig_big.jpg');

   page.once('dialog', dialog => {
      expect(dialog.message()).toContain('KB');
      dialog.dismiss().catch(() => {});
    });
  });

  test('should only accept jpg or png signature images', async ({ page }) => {
    await uploadSignature(page, 'sig_bmp.bmp');

  page.once('dialog', dialog => {
      expect(dialog.message()).toContain('JPG');
      expect(dialog.message()).toContain('PNG');
      dialog.dismiss().catch(() => {});
    });

  });

  test('should upload valid png signature and display on Slip Templates', async ({ page }) => {
    await uploadSignature(page, 'sig_test.png');

    await expect(page.getByText('Drop signature image here or')).toBeHidden();
    await expect(page.locator('.signature-preview')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Teacher\'s Signature' })).toHaveCount(2);

    // Verify it can be removed
    await page.locator('#remove-signature').click();
    await expect(page.locator('.signature-preview')).toBeHidden();
  });

  test('should upload valid jpg signature image and display on Slip Templates', async ({ page }) => {
    await uploadSignature(page, 'sig_test.jpeg');

    await expect(page.locator('.signature-preview')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Teacher\'s Signature' })).toHaveCount(2);
  });
});