import { expect, it, beforeEach } from "vitest";
import { getDates } from "../src/lib/getAllClassDays.ts.svelte";
import { schoolEvents } from './schoolEvents';
import { parseISO, eachDayOfInterval, getDay, parse, isEqual } from 'date-fns';

/**
 * @param {string} schoolEvents
 */
function countDaysExcludingSundays(schoolEvents) {
  let dates = schoolEvents.split('\n').map((line) => line.split('\t')[0]);
  let start = parseISO(dates.reduce((a, b) => (a < b ? a : b)));
  let end = parseISO(dates.reduce((a, b) => (a > b ? a : b)));
  let totalDays = 0;
  let saturdays = 0;
  let sundays = 0;
  let specialSaturdays = 0;

  // Parse schoolEvents and count special Saturdays
  const schoolEventsArray = schoolEvents.split('\n');
  schoolEventsArray.forEach(day => {
      const date = parseISO(day.split('\t')[0]);
      if (getDay(date) === 6) { // 6 stands for Saturday
          specialSaturdays++;
      }
  });

  eachDayOfInterval({ start, end }).forEach(day => {
      totalDays++;
      if (getDay(day) === 0) { // 0 stands for Sunday
          sundays++;
      }
      if (getDay(day) === 6) {
        saturdays++;
      }
  });

  return totalDays - saturdays - sundays + specialSaturdays;
}
/** @type {Array <{ date: String, weekday: Number }>} */
let classDates;

beforeEach(() => {
  classDates = getDates(schoolEvents);
});

it('returns correct number of days without Sundays', () => {
  let days = countDaysExcludingSundays(schoolEvents);

  expect(classDates.length).toEqual(days);
});

it('has an entry for 2023-09-23 with weekday 1', () => {
  const formats = ['yyyy-MM-dd', 'yyyy/MM/dd', 'MMM. dd, yyyy', 'MMMM dd, yyyy'];
  const targetDate = classDates.find(date => {
    return formats.some(format => {
      const parsedDate = parse(date.date, format, new Date());
      return isEqual(parsedDate, new Date(2023, 8, 23)); // Note: Month is 0-indexed, 8 = September
    });
  });
  expect(targetDate).toBeDefined();
  if (targetDate) {
    expect(targetDate.weekday).toEqual(1);
  }
});