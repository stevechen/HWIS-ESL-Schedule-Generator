import moment from "moment";
import { expect, it, beforeEach } from "vitest";
import { getDates } from "../src/lib/getAllClassDays";
import { specialDays } from './specialDays';

/**
 * Retrieves all class days between the given start and end dates.
 * @param {String} specialDays - A list of special school days
 * @returns {Number} The number of days between the start and end dates, excluding Sundays and Saturdays, but includes special Saturdays.
*/
function countDaysExcludingSundays(specialDays) {
  	let dates = specialDays.split('\n').map((line) => line.split('\t')[0]);
    let start = dates.reduce((a, b) => (a < b ? a : b));
    let end = dates.reduce((a, b) => (a > b ? a : b));
    let totalDays = 0;
    let saturdays = 0;
    let sundays = 0;
    let specialSaturdays = 0;

    // Parse specialDays and count Saturdays
    const specialDaysArray = specialDays.split('\n');
    specialDaysArray.forEach(day => {
        const date = moment(day.split('\t')[0]);
        if (date.day() === 6) { // 6 stands for Saturday. These are the working Saturdays make up for another holiday
            specialSaturdays++;
        }
    });

    for (let currentDay = moment(start); currentDay.isSameOrBefore(end); currentDay.add(1, 'days')) {
        totalDays++;
        if (currentDay.day() === 0) { // 0 stands for Sunday
            sundays++;
        }
        if (currentDay.day() === 6) {
          saturdays++;
        }
    }

    return totalDays - saturdays - sundays + specialSaturdays;
}

/** @type {Array <{ date: String, weekday: Number }>} */
let classDates;

beforeEach(() => {
  classDates = getDates(specialDays);
});

it('returns correct number of days without Sundays', () => {
  let days = countDaysExcludingSundays(specialDays);

  expect(classDates.length).toEqual(days);
});

it('has an entry for 2023-09-23 with weekday 1', () => {
  const targetDate = classDates.find(date => date.date === '2023-09-23');

  expect(targetDate).toBeDefined();
  if (targetDate) {
    expect(targetDate.weekday).toEqual(1);
  }
});