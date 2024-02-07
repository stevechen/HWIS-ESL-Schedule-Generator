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
  let otherDaysCount = classDays.filter(day => day.weekday===2 || day.weekday===4).length;

  expect(otherDaysCount).toBe(0);
});

it('get all classes of class days for Comm', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  const classDays = getClassDaysByType(allClassDays, [2, 4],'Comm');
  // days should not have any days other than indicated weekdays
  let otherDaysCount = classDays.filter(day => day.weekday === 3 || day.weekday === 3 || day.weekday === 5).length;
  
  expect(otherDaysCount).toBe(0);
});

it('G7 Comm class 6 Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm', 'G7');
   // 6 oral exams, 2 before each exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(6);
});

it('G8 Comm class 6 Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [2, 4], 'Comm', 'G8');
   // 6 oral exams, 2 before each exam
  let oralExamDaysCount = classDays.filter(day => day.description ==='Oral Exam').length;

  expect(oralExamDaysCount).toBe(6);
});

it('G9 Comm class 6 Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [1, 3], '', 'G9');
   // 6 oral exams, 2 before each exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(6);
});

it('H10 Comm class 2 Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [2, 4], '', 'H10');
   // no oral exams except before the final exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(2);
});

it('H11 Comm class 2 Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [2, 4], '', 'H11');
  // no oral exams except before the final exam
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(2);
});

it('G7 CLIL class has no Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [1, 3, 5], 'CLIL', 'G7');
  // no oral exams
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(0);
});

it('G8 CLIL class has no Oral exam days inserted', () => {
  let startDate = '2023-08-30';
  let endDate = '2024-01-19'
  const allClassDays = getDates(startDate, endDate, specialDays);
  let classDays = getClassDaysByType(allClassDays, [2, 4, 5], 'CLIL', 'G8');
  // no oral exams
  let oralExamDaysCount = classDays.filter(day => day.description === 'Oral Exam').length;

  expect(oralExamDaysCount).toBe(0);
});

