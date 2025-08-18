import { test, expect } from '@playwright/test';

test.describe('Day of the Week Filtering', () => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const initialCheckedState = [true, false, true, false, true];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial schedule to load by waiting for the loading message to disappear
    await page.locator('#output_table').getByText('Loading data...').waitFor({ state: 'hidden' });
    // and then for the first row to be present
    await page.locator('#output_table tbody tr').first().waitFor();
  });

  test('should filter the schedule when a day is unchecked and restore it when re-checked', async ({ page }) => {
    // 1. Verify the initial state of checkboxes.
    for (let i = 0; i < daysOfWeek.length; i++) {
      const day = daysOfWeek[i];
      if (initialCheckedState[i]) {
        await expect(page.locator(`#${day}`)).toBeChecked();
      } else {
        await expect(page.locator(`#${day}`)).not.toBeChecked();
      }
    }

    // 2. Get the initial table text to serve as a baseline.
    const initialTableText = await page.locator('#output_table').innerText();

    // 3. Uncheck Monday (which is initially checked).
    await page.locator('label[for="Mon"]').click();
    await expect(page.locator('#Mon')).not.toBeChecked();

    // 4. Verify the table content has changed.
    const filteredTableText = await page.locator('#output_table').innerText();
    expect(filteredTableText).not.toEqual(initialTableText);

    // 5. Re-check Monday.
    await page.locator('label[for="Mon"]').click();
    await expect(page.locator('#Mon')).toBeChecked();

    // 6. Verify the table content is restored to its original state.
    const restoredTableText = await page.locator('#output_table').innerText();
    expect(restoredTableText).toEqual(initialTableText);
  });

  test('should show an empty schedule when all days are unchecked', async ({ page }) => {
    // 1. Uncheck all days that are initially checked.
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (initialCheckedState[i]) {
        await page.locator(`label[for="${daysOfWeek[i]}"]`).click();
      }
    }

    // Verify all checkboxes are unchecked
    for (const day of daysOfWeek) {
        await expect(page.locator(`#${day}`)).not.toBeChecked();
    }

    // 2. Verify the table body has no rows.
    await expect(page.locator('#output_table tbody tr')).toHaveCount(0);
  });

  test('should only show Wednesdays when only Wednesday is checked', async ({ page }) => {
    // 1. Uncheck all days except Wednesday.
    for (let i = 0; i < daysOfWeek.length; i++) {
        const day = daysOfWeek[i];
        const isChecked = await page.locator(`#${day}`).isChecked();
        // We want only Wed to be checked. Wed is initially checked.
        // Uncheck Mon and Fri. Tue and Thu are already unchecked.
        if(day === 'Mon' || day === 'Fri'){
            if(isChecked){
                await page.locator(`label[for="${day}"]`).click();
            }
        }
    }
    await expect(page.locator('#Wed')).toBeChecked();
    await expect(page.locator('#Mon')).not.toBeChecked();
    await expect(page.locator('#Fri')).not.toBeChecked();
    await expect(page.locator('#Tue')).not.toBeChecked();
    await expect(page.locator('#Thu')).not.toBeChecked();

    // 2. Verify that all dates in the schedule are Wednesdays.
    const tableRows = await page.locator('#output_table tbody tr').all();
    expect(tableRows.length).toBeGreaterThan(0); // Make sure there are some rows

    for (const row of tableRows) {
      const dateCellText = await row.locator('td:nth-child(2)').innerText();
      // The date is in the second column, format 'YYYY-MM-DD'
      const date = new Date(dateCellText);
      // In JS, getUTCDay() is 0 for Sunday, 1 for Monday, ..., 3 for Wednesday.
      expect(date.getUTCDay()).toBe(3);
    }
  });
});
