import { getDates } from '$lib/utils/getAllClassDays';
import { getClassDaysByType } from '$lib/utils/getClassDaysByType';
import { getGradeForClassType, type ClassType } from '$lib/config/classTypes';

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

/** The schedule module's loading result, keyed to a prefix so the name is stable. */
export function scheduleLoading(name: string): ScheduleResult {
	return { status: 'loading', output: LOADING_OUTPUT, rows: emptyTable(), name };
}

/** The schedule module's error result — used when the data file for a prefix is missing or fails to load. */
export function scheduleError(name: string): ScheduleResult {
	return { status: 'error', output: ERROR_OUTPUT, rows: emptyTable(), name };
}

/**
 * Derives the schedule CSV output, the parsed table, and the schedule name
 * from raw school-events text and a school-year prefix. The prefix is an
 * explicit parameter so the module is a pure function of its inputs — the
 * same inputs yield the same name regardless of the clock. Returns a
 * discriminated result the route renders: loading, error, or success.
 */
export function deriveSchedule(
	eventsText: string | null,
	classType: ClassType,
	checkedDays: boolean[],
	prefix: string
): ScheduleResult {
	const name = buildScheduleName(classType, prefix);

	if (!eventsText || eventsText === 'Loading...') {
		return scheduleLoading(name);
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
		return scheduleError(name);
	}
}

/**
 * Loads the school-events text for a school-year prefix. Resolves the data
 * file (injectable at a seam: real modules in production, a fixture in tests),
 * drops blank lines, and returns `null` only when no file exists for the
 * prefix. A file that exists but fails to load is not treated as missing —
 * the importer's error propagates to the caller.
 */
export type SchoolEventsImporter = (prefix: string) => Promise<{ schoolEvents: string } | null>;

/**
 * Best-effort test for a *missing* dynamic import, as opposed to a module
 * that exists but fails when evaluated. Vite marks a failed resolution with
 * the `ERR_LOAD_URL` code (SSR); the browser client instead rejects with
 * "Failed to fetch dynamically imported module", which the browser produces
 * for both a missing file and a module that fails to transform — so in the
 * browser path this can only be best-effort. The route surfaces an error
 * schedule for either case; this predicate only sharpens the log.
 */
const MISSING_MODULE_MESSAGES = [
	'Failed to fetch dynamically imported module',
	'Failed to resolve import',
	'Failed to load url',
	'Does the file exist?'
];
export function isMissingModuleError(error: unknown): boolean {
	if (error && typeof error === 'object' && 'code' in error) {
		if ((error as { code?: unknown }).code === 'ERR_LOAD_URL') return true;
	}
	const message = error instanceof Error ? error.message : String(error);
	return MISSING_MODULE_MESSAGES.some((needle) => message.includes(needle));
}

async function defaultImporter(prefix: string): Promise<{ schoolEvents: string } | null> {
	try {
		return await import(`$lib/data/${prefix}-schoolEvents.ts`);
	} catch (error) {
		if (isMissingModuleError(error)) return null;
		throw error;
	}
}

export async function loadSchoolEventsText(
	prefix: string,
	importer: SchoolEventsImporter = defaultImporter
): Promise<string | null> {
	const module = await importer(prefix);
	if (!module) return null;
	return module.schoolEvents
		.split('\n')
		.filter((line) => line.trim() !== '')
		.join('\n');
}
