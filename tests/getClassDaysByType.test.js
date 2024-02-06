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

it('get all classes of class days for Comm', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  const classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm');
  // days should not have any days other than indicated weekdays
  let numberOfOtherDays = 0;

  classDays.forEach(day => {
    if (day.weekday===1 || day.weekday ===3 || day.weekday ===5) numberOfOtherDays++;
  });

  expect(numberOfOtherDays).toBe(0);
});

it('Comm class Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  const classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm');
  // days should not have any days other than indicated weekdays
  let numberOfOralExamDays = 0;

  classDays.forEach(day => {
    if (day.description==='Oral Exam') numberOfOralExamDays++;
  });

  expect(numberOfOralExamDays).toBe(6);
});
