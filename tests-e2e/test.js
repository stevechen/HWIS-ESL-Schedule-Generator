import { test, expect } from '@playwright/test';
import fs from 'fs';
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
    locatorRadioComm: page.locator('input[type="radio"][value="Comm"]'),
    locatorRadioPassport: page.locator('input[type="radio"][value="passport"]'),
    locatorRadioRecording: page.locator('input[type="radio"][value="recording"]'),
    locatorRadioWorkbook: page.locator('input[type="radio"][value="workbook"]'),
    locatorRadioExam: page.locator('input[type="radio"][value="exam"]'),
    locatorRadioSpeech: page.locator('input[type="radio"][value="speech"]')
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
  await page.locator('#master-checkbox').waitFor({ state: 'visible', timeout: 500 });
}

//#region platform detection
const isMac = async () => {
  if ('userAgentData' in navigator) {
    const { platform } = await navigator.userAgentData.getHighEntropyValues(["platform"]);
    return platform === "macOS";
  } else {
    // Fallback for browsers that do not support User-Agent Client Hints
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }
};

let modifier = isMac ? 'Meta' : 'Control';

//#region before test
test.beforeEach(async ({ page }) => {
  const uniqueParam = new Date().getTime(); // Using current timestamp as a unique parameter
  await page.goto(`${BASE_URL}/communication?timestamp=${uniqueParam}`);
});

// #region auto assignment display
test('should hide workbook, speech assignment type for G9', async({ page, context }) => {
  const ctrl = {...initializeLocators(page)};
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9);

  await expect(ctrl.locatorRadioPassport).toBeVisible();
  await expect(ctrl.locatorRadioRecording).toBeVisible();
  await expect(ctrl.locatorRadioExam).toBeVisible();
  await expect(ctrl.locatorRadioWorkbook).toBeHidden();
  await expect(ctrl.locatorRadioSpeech).toBeHidden();
});

test('should show only workbook and speech assignment type for CLIL', async({ page, context }) => {
  const ctrl = {...initializeLocators(page)};
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

  await page.click('input[type="radio"][value="CLIL"]');

  await expect(ctrl.locatorRadioPassport).toBeHidden();
  await expect(ctrl.locatorRadioRecording).toBeHidden();
  await expect(ctrl.locatorRadioExam).toBeHidden();
  await expect(ctrl.locatorRadioWorkbook).toBeVisible();
  await expect(ctrl.locatorRadioSpeech).toBeVisible();
});

// #region paste student
test('should auto insert today as the due date and have matching students in the table', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

   // Get today's date in MM/DD format
  const today = new Date();
  const formattedDate = (today.getMonth() + 1).toString() + '/' + today.getDate().toString();

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

//#region assignment change
test('should match slips with assignment type changes', async ({ page, context }) => {
  const { locatorRadioPassport, locatorRadioRecording, locatorRadioWorkbook, locatorRadioExam } = initializeLocators(page);

  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

  await page.click('input[type="radio"][value="CLIL"]');
  await expect(locatorRadioWorkbook).toBeVisible();
  await expect(locatorRadioWorkbook).toBeChecked();
 // Test for two spans with the text "Workbook" and "作業本"
  await expect(page.locator('span:text("Workbook"), span:text("作業本")')).toHaveCount(4);

  await page.click('input[type="radio"][value="Comm"]');
  await page.click('input[type="radio"][value="passport"]');
  await expect(locatorRadioPassport).toBeVisible();
  await expect(locatorRadioPassport).toBeChecked();
  await expect(locatorRadioRecording).toBeVisible();
  await expect(locatorRadioWorkbook).toBeVisible();
  await expect(locatorRadioExam).toBeVisible();
  await expect(page.locator('span:text("Passport"), span:text("英文護照")')).toHaveCount(4);

  await page.click('input[type="radio"][value="recording"]');
  await expect(page.locator('span:text("Recording"), span:text("錄影(錄音)")')).toHaveCount(4);

  await page.click('input[type="radio"][value="exam"]');
  await expect(page.locator('span:text("Oral Exam"), span:text("期中/末考口試")')).toHaveCount(4);
});

//#region dates
test('should update assigned date and late date on slips', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);
  const assignDate = '1/1';
  const lateDate = '12/31';
  await page.fill('input#assigned', assignDate);
  await page.fill('input#late', lateDate);  
  const assignDateOnSlip = await page.textContent('.slip .date.assigned > p');
  expect(assignDateOnSlip).toContain(assignDate);
  const lateDateOnSlip = await page.textContent('.slip .date.late > p');
  expect(lateDateOnSlip).toContain(lateDate);
});

//#region student info change
test('should update slip fields with data change', async ({ page, context }) => {
  await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA_G9_FULL);

  const checkboxes = page.locator('td.student-checkbox > input[type="checkbox"]');
  const count = await checkboxes.count();
  const randomIndex = Math.floor(Math.random() * count);

  //change the random row data
  await page.fill(`tr:nth-child(${randomIndex}) .student-id > input`, '5555555');
  await expect(page.locator(`.slip:nth-child(${randomIndex}) .student-id`)).toContainText("5555555");

  await page.fill(`tr:nth-child(${randomIndex}) .chinese-name > input`, '王八');
  await expect(page.locator(`.slip:nth-child(${randomIndex}) .chinese-name`)).toContainText("王八");

  await page.fill(`tr:nth-child(${randomIndex}) .english-name > input`, 'Mary Jane');
  await expect(page.locator(`.slip:nth-child(${randomIndex}) .english-name`)).toContainText("Mary Jane");

  await page.fill(`tr:nth-child(${randomIndex}) .chinese-class > input`, 'J112');
  await expect(page.locator(`.slip:nth-child(${randomIndex}) .chinese-class`)).toContainText("J112");

  await page.click(`tr:nth-child(${randomIndex}) > td > select`);
  await page.selectOption(`tr:nth-child(${randomIndex}) > td > select`, { value: "1" });

  await expect(page.locator(`.slip:nth-child(${randomIndex}) .assignment.name:nth-child(1) span`)).toContainText("wasn't completed");
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
  await expect(page.locator(`text=Student ID 學號: ${studentIdValue}`)).toBeHidden(); 
  // Check the checkbox
  await checkboxes.nth(randomIndex).check();
  // Verify the Slip is added back
  await expect(page.locator(`text=Student ID 學號: ${studentIdValue}`)).toBeVisible(); 
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
test.describe('signature upload', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url)); //current file path
  async function uploadSignature(page, image) {
    const filePath = path.join(__dirname, 'fixtures');
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 500 });
    await page.locator('#browse').click()
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(`${filePath}/${image}`);
  }
  test.beforeEach(async ({ page, context }) => {    // remove signature first
    // Construct the path to the file
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, '..', 'static', 'sig.png');
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, async (err) => {
      if (err) {
        console.error('File does not exist:', filePath);
      } else {
        const removeSignatureButton = page.locator('#remove-signature');
        await removeSignatureButton.waitFor({ state: 'visible', timeout: 500 }).catch(() => console.log('#remove-signature not visible yet'));

        if (await removeSignatureButton.isVisible()) {
          await removeSignatureButton.focus();
          await removeSignatureButton.click();
        }
      }
    });
    await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);
  });

  //#region image too short
  test('should reject signature images that does is too short in height', async ({ page }) => {
    await uploadSignature(page, 'sig_short.png');

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('greater than');
      dialog.dismiss().catch(() => {});
    });
  });

  //#region image too big
  test('should reject signature images that is too big', async ({ page }) => {
    await uploadSignature(page, 'sig_big.jpg');

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('KB');
      dialog.dismiss().catch(() => {});
    });
  });

  //#region image wrong format
  test('should reject signature images that is not jpg or png', async ({ page }) => {
    await uploadSignature(page, 'sig_bmp.bmp');

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('JPG');
      expect(dialog.message()).toContain('PNG');
      dialog.dismiss().catch(() => {});
    });
  });

  //#region png upload
  test('should upload valid png signature and show up on Slip Templates', async ({ page }) => {
    await uploadSignature(page, 'sig_test.png');

    await expect(page.getByText('Drop signature image here or')).toBeHidden();
    await expect(page.locator('.signature-preview')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Teacher\'s Signature' })).toHaveCount(2);

    await page.locator('#remove-signature').click();
    await expect(page.locator('.signature-preview')).toBeHidden();
  });

  //#region jpg upload
  test('should upload valid jpg signature image', async ({ page }) => {
    await uploadSignature(page, 'sig_test.jpeg');

    await expect(page.getByText('Drop signature image here or')).toBeHidden();
    await expect(page.getByRole('button', { name: 'browse' })).toBeHidden();
    await expect(page.locator('.signature-preview')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Teacher\'s Signature' })).toHaveCount(2);
  });

});

// test('should upload valid signature image with drag & drop', async ({ page, context }) => {
//   await pasteDataIntoInput(page, context, '#student-list-input', MOCK_STUDENT_DATA);

// // Read your file into a buffer.
//   const buffer = readFileSync('./tests-e2e/fixtures/sig_test.png');

//   // Create the DataTransfer and File
//   const dataTransfer = await page.evaluateHandle((data) => {
//       const dt = new DataTransfer();
//       // Convert the buffer to a hex array
//       const file = new File([data.toString('hex')], 'sig_test.png', { type: 'img/*' });
//       dt.items.add(file);
//       return dt;
//   }, buffer);

//   // Now dispatch
//   await page.dispatchEvent('div#signature-drop-zone', 'drop', { dataTransfer });

//   // await expect(page.getByText('Drop signature image here or')).toBeHidden();
//   await expect(page.getByRole('button', { name: 'browse' })).toBeHidden();
//   await expect(page.locator('.signature-preview')).toBeVisible();
//   await expect(page.getByRole('img', { name: 'Teacher\'s Signature' })).toHaveCount(2);
// });