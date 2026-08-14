import { getDates } from '$lib/utils/getAllClassDays';
import { getClassDaysByType } from '$lib/utils/getClassDaysByType';
import { getGradeForClassType, type ClassType } from '$lib/config/classTypes';
import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';

export const LOADING_OUTPUT = 'Loading data...';
export const ERROR_OUTPUT = 'Error processing data. Check console for details.';

export interface ScheduleTable {
	header: string[];
	rows: string[][];
}

export type ScheduleStatus = 'loading' | 'error' | 'success';

export interface ScheduleResult {
	status: ScheduleStatus;
	output: string;
	rows: ScheduleTable;
	name: string;
}

/**
 * Builds the schedule display/download name, e.g. "26-27 S1 Junior CLIL schedule".
 */
export function buildScheduleName(
	classType: ClassType,
	schoolYearAndSemesterPrefix: string
): string {
	const [year1, year2, semester] = schoolYearAndSemesterPrefix.split('-');
	const shortYear = `${year1.slice(-2)}-${year2.slice(-2)}`;
	const semesterText = `S${semester}`;
	const grade = getGradeForClassType(classType);
	const gradeText = grade === 'G7/8' ? `Junior ${classType}` : grade;
	return `${shortYear} ${semesterText} ${gradeText} schedule`;
}

const emptyTable = (): ScheduleTable => ({ header: [], rows: [] });

/**
 * Derives the schedule CSV output, the parsed table, and the schedule name
 * from raw school-events text. Returns a discriminated result the route
 * renders: loading, error, or success.
 */
export function deriveSchedule(
	eventsText: string | null,
	classType: ClassType,
	checkedDays: boolean[]
): ScheduleResult {
	const name = buildScheduleName(classType, getSchoolYearAndSemesterPrefix());

	if (!eventsText || eventsText === 'Loading...') {
		return { status: 'loading', output: LOADING_OUTPUT, rows: emptyTable(), name };
	}

	try {
		const allClassDays = getDates(eventsText);
		const grade = getGradeForClassType(classType);
		const weekdayNumbers = checkedDays
			.map((isChecked, index) => (isChecked ? index + 1 : null))
			.filter((index): index is number => index !== null);
		const classDays = getClassDaysByType(allClassDays, weekdayNumbers, classType, grade);
		const output = ['#\tDate\tDescription\tNote']
			.concat(classDays.map((r) => [r.countdown, r.date, r.description, r.note].join('\t')))
			.join('\n');
		const lines = output.split('\n');
		const header = lines[0].split('\t');
		const rows = lines.slice(1).map((line) => line.split('\t'));
		return { status: 'success', output, rows: { header, rows }, name };
	} catch (error) {
		console.error('Error processing data:', error);
		return { status: 'error', output: ERROR_OUTPUT, rows: emptyTable(), name };
	}
}
