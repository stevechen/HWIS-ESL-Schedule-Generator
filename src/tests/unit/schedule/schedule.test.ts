import { describe, it, expect } from 'vitest';
import {
	deriveSchedule,
	buildScheduleName,
	loadSchoolEventsText,
	scheduleError,
	LOADING_OUTPUT,
	ERROR_OUTPUT,
	type ScheduleResult
} from '$lib/schedule';
import { getGradeForClassType, type ClassType } from '$lib/config/classTypes';
import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';

const FIXTURE = `2026-09-01\t\tCLIL WB Check\tCLIL
2026-09-02\t\tPassport Check\tComm`;
const FIXED_PREFIX = '2026-2027-1';
const DEFAULT_CHECKED_DAYS = [true, false, true, false, true];
const ALL_CHECKED_DAYS = [true, true, true, true, true];

describe('buildScheduleName', () => {
	it('formats CLIL as a Junior schedule', () => {
		expect(buildScheduleName('CLIL', '2026-2027-1')).toBe('26-27 S1 Junior CLIL schedule');
	});

	it('formats Comm as a Junior schedule', () => {
		expect(buildScheduleName('Comm', '2026-2027-1')).toBe('26-27 S1 Junior Comm schedule');
	});

	it('formats G9 with the plain grade', () => {
		expect(buildScheduleName('G9', '2026-2027-1')).toBe('26-27 S1 G9 schedule');
	});

	it('formats H with the Senior grade', () => {
		expect(buildScheduleName('H', '2026-2027-1')).toBe('26-27 S1 Senior schedule');
	});

	it('formats semester 2 with the short year', () => {
		expect(buildScheduleName('G9', '2025-2026-2')).toBe('25-26 S2 G9 schedule');
	});
});

describe('deriveSchedule', () => {
	it('returns a CSV output, parsed table, and name for fixed input', () => {
		const result: ScheduleResult = deriveSchedule(
			FIXTURE,
			'CLIL',
			DEFAULT_CHECKED_DAYS,
			FIXED_PREFIX
		);
		expect(result.status).toBe('success');
		expect(result.name).toBe(buildScheduleName('CLIL', FIXED_PREFIX));
		expect(result.output).toContain('#\tDate\tDescription\tNote');
		expect(result.rows.header).toEqual(['#', 'Date', 'Description', 'Note']);
		// 2026-09-01 is a Tuesday (weekday 2), excluded from Mon/Wed/Fri filtering.
		// The Comm event's attributes are stripped for the CLIL class type.
		expect(result.rows.rows).toEqual([['0', '2026-09-02', '', '']]);
	});

	it('filters by checked days', () => {
		const allDays = deriveSchedule(FIXTURE, 'CLIL', ALL_CHECKED_DAYS, FIXED_PREFIX);
		const monWedFri = deriveSchedule(FIXTURE, 'CLIL', DEFAULT_CHECKED_DAYS, FIXED_PREFIX);
		expect(allDays.rows.rows.length).toBe(2);
		expect(monWedFri.rows.rows.length).toBe(1);
	});

	it('returns a stable empty state for null eventsText', () => {
		const result = deriveSchedule(null, 'CLIL', DEFAULT_CHECKED_DAYS, FIXED_PREFIX);
		expect(result.status).toBe('loading');
		expect(result.output).toBe(LOADING_OUTPUT);
		expect(result.rows).toEqual({ header: [], rows: [] });
	});

	it('returns a stable empty state for the Loading sentinel', () => {
		const result = deriveSchedule('Loading...', 'CLIL', DEFAULT_CHECKED_DAYS, FIXED_PREFIX);
		expect(result.status).toBe('loading');
		expect(result.output).toBe(LOADING_OUTPUT);
		expect(result.rows).toEqual({ header: [], rows: [] });
	});

	it('keeps the name computed even in the loading state', () => {
		const result = deriveSchedule(null, 'G9', DEFAULT_CHECKED_DAYS, FIXED_PREFIX);
		expect(result.name).toBe(buildScheduleName('G9', FIXED_PREFIX));
	});
});

describe('loadSchoolEventsText (data seam)', () => {
	it('returns the events text with blank lines removed', async () => {
		const importer = async () => ({ schoolEvents: 'a\n\nb\n' });
		expect(await loadSchoolEventsText('2026-2027-1', importer)).toBe('a\nb');
	});

	it('returns null when no data file exists for the prefix', async () => {
		const importer = async () => null;
		expect(await loadSchoolEventsText('2030-2031-1', importer)).toBeNull();
	});
});

describe('scheduleError', () => {
	it('produces the error result the route uses when a data file is missing', () => {
		// The route previously fed the string 'Failed to load data' into
		// deriveSchedule, which parsed it into a successful empty schedule.
		// Now the route calls scheduleError directly for a missing file.
		const result = scheduleError('26-27 S1 Junior CLIL schedule');
		expect(result).toEqual({
			status: 'error',
			output: ERROR_OUTPUT,
			rows: { header: [], rows: [] },
			name: '26-27 S1 Junior CLIL schedule'
		});
	});
});

describe('getSchoolYearAndSemesterPrefix', () => {
	it('returns semester 1 for an August date', () => {
		expect(getSchoolYearAndSemesterPrefix(new Date('2026-08-15'))).toBe('2026-2027-1');
	});

	it('returns semester 2 for a January date (month 0 falls in the Jan-Jul branch)', () => {
		expect(getSchoolYearAndSemesterPrefix(new Date('2027-01-15'))).toBe('2026-2027-2');
	});

	it('returns semester 2 for a February date', () => {
		expect(getSchoolYearAndSemesterPrefix(new Date('2027-02-15'))).toBe('2026-2027-2');
	});
});

describe('getGradeForClassType', () => {
	const cases: [ClassType, string][] = [
		['CLIL', 'G7/8'],
		['Comm', 'G7/8'],
		['G9', 'G9'],
		['H', 'Senior']
	];
	for (const [classType, grade] of cases) {
		it(`maps ${classType} to ${grade}`, () => {
			expect(getGradeForClassType(classType)).toBe(grade);
		});
	}
});
