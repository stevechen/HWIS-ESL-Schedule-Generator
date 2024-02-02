import { expect, it, beforeEach } from "vitest";
import { getDates } from "./getAllClassDays";
import moment from "moment";
import { specialDays } from './specialDays';

/**
 * Retrieves all class days between the given start and end dates.
 * @param {string} startDate - The start date in the format 'YYYY/MM/DD'.
 * @param {string} endDate - The end date in the format 'YYYY/MM/DD'.
 * @param {string} specialDays - A list of special school days
 * @returns {number} The number of days between the start and end dates, excluding Sundays and Saturdays, but includes special Saturdays.
*/
function countDaysExcludingSundays(startDate, endDate, specialDays) {
    const start = moment(startDate);
    const end = moment(endDate);
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

let startDate;
let endDate;
let classDates;

beforeEach(() => {
  startDate = '2023-08-30';
  endDate = '2024-01-19';
  classDates = getDates(startDate, endDate, specialDays);
});

it('returns correct number of days without Sundays', () => {
  let days = countDaysExcludingSundays(startDate, endDate, specialDays);

  expect(classDates.length).toEqual(days);
});

it('has an entry for 2023-09-23 with weekday 1', () => {
  const targetDate = classDates.find(date => date.date === '2023-09-23');

  expect(targetDate).toBeDefined();
  expect(targetDate.weekday).toEqual(1);
});
//specialDays should make an array of data set from raw data


