import { expect, it, beforeEach } from "vitest";
import { specialDays, startDate, endDate } from "./specialDays";
import { getDates } from "../src/lib/getAllClassDays";
import { getClassDaysByType } from "../src/lib/getClassDaysByType";

/** @type {Array <{ date: String, weekday: Number, description: String, note: String, type: String }>} */
let allClassDays;

beforeEach(() => {
  allClassDays = getDates(specialDays);
});

it('get all classes of class days for CLIL', () => {
  const classDays = getClassDaysByType(allClassDays, [1, 3, 5], 'CLIL');
  // days should not have any days other than indicated weekdays
  let otherDaysCount = classDays.filter(day => day.weekday===2 || day.weekday===4).length;

  expect(otherDaysCount).toBe(0);
});

it('get all classes of class days for Comm', () => {
  const classDays = getClassDaysByType(allClassDays, [2, 4],'Comm');
  // days should not have any days other than indicated weekdays
  let otherDaysCount = classDays.filter(day => day.weekday === 3 || day.weekday === 3 || day.weekday === 5).length;

  expect(otherDaysCount).toBe(0);
});

it('G7/8 Comm class has Comm but no CLIL nor G9 entries', () => {
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm');
   // only Comm entries
  let commDaysCount = classDays.filter(day => day.note === 'Passport check').length;
  let clilDaysCount = classDays.filter(day => day.note === 'WB check').length;
  let g9DaysCount = classDays.filter(day => day.note === 'G9 Mock Exam').length;

  expect (commDaysCount).toBeGreaterThan(0);
  expect(clilDaysCount).toBe(0);
  expect(g9DaysCount).toBe(0);});

it('G9 Comm class has Comm but no CLIL entries', () => {
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'G9');
   // 6 oral exams, 2 before each exam
  let commDaysCount = classDays.filter(day => day.note === 'Passport check').length;
  let clilDaysCount = classDays.filter(day => day.note === 'WB check').length;

  expect (commDaysCount).toBeGreaterThan(0);
  expect(clilDaysCount).toBe(0);
});

it('H10 class has no CLIL or Comm entries', () => {
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'H');
   // no CLIL nor Comm
  let clilDaysCount = classDays.filter(day => day.note === 'WB check').length;
  let commDaysCount = classDays.filter(day => day.type === 'Passport check').length;

  expect(clilDaysCount).toBe(0);
  expect(commDaysCount).toBe(0);
});
it('H11 class has no CLIL  or Comm entries', () => {
  let classDays = getClassDaysByType(allClassDays, [3], 'H');
   // no CLIL nor Comm
  let clilDaysCount = classDays.filter(day => day.note === 'WB check').length;
  let commDaysCount = classDays.filter(day => day.type === 'Passport check').length;

  expect(clilDaysCount).toBe(0);
  expect(commDaysCount).toBe(0);
});

it('G7/8 Comm class 6 Oral exam days inserted', () => {
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm');
   // 6 oral exams, 2 before each exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(6);
});

it('G9 Comm class 6 Oral exam days inserted', () => {
  let classDays = getClassDaysByType(allClassDays, [1, 3], 'G9');
   // 6 oral exams, 2 before each exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(6);
});

it('H10/11 Comm class 2 Oral exam days inserted', () => {
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'H');
   // no oral exams except before the final exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(2);
});


it('G7/8 CLIL class has no Oral exam days inserted', () => {
  let classDays = getClassDaysByType(allClassDays, [1, 3, 5], 'CLIL');
  // no oral exams
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(0);
});

