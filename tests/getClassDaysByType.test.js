import { expect, it } from "vitest";
import { specialDays } from "./specialDays";
import { getDates } from "./getAllClassDays";
import { getClassDaysByType } from "./getClassDaysByType";

it('get all classes of class days for CLIL', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  const classDays = getClassDaysByType(allClassDays, [1, 3, 5], 'CLIL');
  // days should not have any days other than indicated weekdays
  let numberOfOtherDays = 0;

  classDays.forEach(day => {
    if (day.weekday===2 || day.weekday ===4) numberOfOtherDays++;
  });

  expect(numberOfOtherDays).toBe(0);
});