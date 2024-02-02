import { expect, it, beforeEach } from "vitest";
import { getDates } from "./getAllClassDays";
import moment from "moment";

const specialDays = 
`2024-01-19	Exam		
2024-01-18	Exam		
2024-01-17	Exam		
2024-01-01	Off	New Year	
2023-11-29	Exam		
2023-11-28	Exam		
2023-11-17	Sport’s day		
2023-11-15	Sport’s day rehersal		
2023-10-13	Exam		
2023-10-12	Exam		
2023-10-10	Off	Double Ten	
2023-10-09	Off	Double Ten	
2023-09-29	Off	Moon Festival	
2023-09-23	Make up (School BBQ)	2023/10/9 Mon Double Ten	
2023-12-22		Passport check	Comm
2023-12-21		Passport check	Comm
2023-12-20		Passport check	Comm
2023-12-19		Passport check	Comm
2023-12-18		Passport check	Comm
2023-12-29		WB check	CLIL
2023-12-28		WB check	CLIL
2023-12-27		WB check	CLIL
2023-12-26		WB check	CLIL
2023-12-25		WB check	CLIL
2023-12-08	CLIL Presentation		CLIL
2023-12-07	CLIL Presentation		CLIL
2023-12-06	CLIL Presentation		CLIL
2023-12-05	CLIL Presentation		CLIL
2023-12-04	CLIL Presentation		CLIL
2023-12-22	Off (G9 Mock exam)		G9
2023-12-21	Off (G9 Mock exam)		G9
2023-09-06	Off (Mock exam)		G9
2023-09-05	Off (Mock exam)		G9
2023-08-30	Class starts on period 3`;

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


