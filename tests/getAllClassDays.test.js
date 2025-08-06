import { expect, it, beforeEach, describe } from "vitest";
import { getDates } from "../src/lib/getAllClassDays.ts.svelte";
import { schoolEvents } from './schoolEvents';
import { parseISO, eachDayOfInterval, getDay, parse, isEqual, format, add } from 'date-fns';

/**
 * @param {string} schoolEvents
 */
function countDaysLikeGetDates(schoolEvents) {
  let lines = schoolEvents
    .split('\n')
    .filter(line => line.trim() !== '');
  let dates = lines.map((line) => line.split('\t')[0]);
  let startDate = dates.reduce((a, b) => (a < b ? a : b));
  let endDate = parseISO(dates.reduce((a, b) => (a > b ? a : b)));
  let eventMap = new Map(
    lines.map((item) => {
      let fields = item.split('\t');
      return [fields[0], fields.slice(1)];
    })
  );
  let count = 0;
  let processDate = parseISO(startDate);
  while (processDate <= endDate) {
    if (getDay(processDate) !== 0) { // not Sunday
      if (getDay(processDate) === 6) { // Saturday
        let dateStr = format(processDate, 'yyyy-MM-dd');
        let eventData = eventMap.get(dateStr) || ['', '', ''];
        let noteDate = eventData[1].match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
        if (!(noteDate && noteDate[0])) {
          processDate = add(processDate, { days: 1 });
          continue;
        }
      }
      count++;
    }
    processDate = add(processDate, { days: 1 });
  }
  return count;
}
/** @type {Array <{ date: String, weekday: Number }>} */
let classDates;

beforeEach(() => {
  classDates = getDates(schoolEvents);
});

it('returns correct number of days without Sundays', () => {
  let days = countDaysLikeGetDates(schoolEvents);
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

describe("getDates - empty and malformed input", () => {
  it("returns empty array for empty string", () => {
    expect(getDates("")).toEqual([]);
  });
  it("returns empty array for only whitespace and empty lines", () => {
    expect(getDates("\n  \n\n")).toEqual([]);
  });
  it("ignores lines with missing date", () => {
    // Only one valid date, rest are malformed
    const input = "2024-01-01\tEvent1\tNote1\tType1\n\tNoDate\tNote2\tType2\n";
    const result = getDates(input);
    expect(result.length).toBe(1);
    expect(result[0].date).toBe("2024-01-01");
  });
  it("ignores lines with invalid date format", () => {
    const input = "not-a-date\tEvent1\tNote1\tType1\n2024-01-02\tEvent2\tNote2\tType2\n";
    // Only valid date should be included
    const result = getDates(input);
    expect(result.some(d => d.date === "2024-01-02")).toBe(true);
  });
});

describe("getDates - Saturday make-up logic", () => {
  it("skips Saturday with no valid make-up date in note", () => {
    // 2024-01-06 is a Saturday, but note does not contain a date
    const input = "2024-01-06\tMake up\tNo make up date\tType1\n2024-01-05\tEvent\tNote\tType2\n";
    const result = getDates(input);
    // Should only include 2024-01-05 (Friday), not 2024-01-06
    expect(result.some(d => d.date === "2024-01-06")).toBe(false);
    expect(result.some(d => d.date === "2024-01-05")).toBe(true);
  });
  it("updates weekday and note for Saturday with valid make-up date in note", () => {
    // 2024-01-06 is a Saturday, note contains a valid date (2024-01-03, Wednesday)
    const input = "2024-01-06\tMake up\t2024-01-03 make up for Wed\tType1\n2024-01-03\tEvent\tNote\tType2\n";
    const result = getDates(input);
    // Should include 2024-01-06 with weekday set to Wednesday (3)
    const sat = result.find(d => d.date === "2024-01-06");
    expect(sat).toBeDefined();
    if (sat) {
      expect(sat.weekday).toBe(3); // Wednesday
      expect(sat.note).toMatch(/2024-01-03\(Wed\)/);
    }
  });
});

describe("getDates - output structure", () => {
  it("returns objects with correct fields and types for all dates in input range", () => {
    const input = [
      "2024-01-01\tEvent1\tNote1\tType1",
      "2024-01-02\tEvent2\tNote2\tType2",
      "2024-01-04\tEvent3\tNote3\tType3"
    ].join("\n");
    const result = getDates(input);
    // Should  include 2024-01-01, 2024-01-02, 2024-01-03, 2024-01-04
    const expectedDates = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"];
    expectedDates.forEach(date => {
      const entry = result.find(d => d.date === date);
      expect(entry).toBeDefined();
      if (entry) {
        expect(typeof entry.countdown === "number" || entry.countdown === null).toBe(true);
        expect(typeof entry.date).toBe("string");
        expect(typeof entry.weekday).toBe("number");
        expect(typeof entry.description).toBe("string");
        expect(typeof entry.note).toBe("string");
        expect(typeof entry.type).toBe("string");
      }
    });
  });
});