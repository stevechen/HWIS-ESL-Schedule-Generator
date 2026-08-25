import { parseISO, format, getDay, add, isSunday, isSaturday } from 'date-fns';

export interface SchoolEvent {
	date: string;
	description: string;
	note: string;
	type: string;
}

export interface SchoolEvents {
	countdown: number | null;
	date: string;
	weekday: number;
	description: string;
	note: string;
	type: string;
	events: SchoolEvent[];
}

const REMINDER_PATTERN = /(passport|recording|\b(?:wb|workbook)\b|\bunit\s+\d+\s+test\b)/i;

export const normalizeEventText = (value: string): string =>
	value
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
		.replace(/homewor\b/g, 'homework')
		.replace(/\bwb\b/g, 'workbook');

export const isAssignmentReminder = (event: SchoolEvent): boolean =>
	REMINDER_PATTERN.test(`${event.description} ${event.note}`);

export const getReminderKey = (event: SchoolEvent): string =>
	`${normalizeEventText(event.type)}|${normalizeEventText(event.description)}|${normalizeEventText(event.note)}`;

export const mergeEventValues = (values: string[]): string =>
	[...new Set(values.map((value) => value.trim()).filter(Boolean))].join('; ');

const summarizeEvents = (events: SchoolEvent[]) => ({
	description: mergeEventValues(events.map((event) => event.description)),
	note: mergeEventValues(events.map((event) => event.note)),
	type: events[0]?.type ?? ''
});

/**
 * Parses a string of school event data and returns an array of date objects for each valid school day.
 *
 * - Ignores empty lines and lines with missing or invalid date formats.
 * - Fills in all dates from the earliest to the latest valid date, skipping Sundays.
 * - For each date, looks up event data (description, note, type); if missing, uses empty strings.
 * - For Saturdays, if the note contains a valid make-up date, updates the weekday and note accordingly;
 *   otherwise, skips that Saturday.
 * - Returns an array of objects with fields: countdown, date, weekday, description, note, and type.
 *
 * @param schoolEvents Tab-separated string of events, one per line, with date as the first field.
 * @returns Array of SchoolEvents objects for each valid school day in the range.
 */
export const getDates = (schoolEvents: string): SchoolEvents[] => {
	// Split and filter out empty lines
	const lines = schoolEvents
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');

	// Filter out lines with missing or invalid date
	const validLines = lines.filter((line) => {
		const dateStr = line.split('\t')[0];
		// Must have a non-empty date string
		if (!dateStr) return false;
		// Must be a valid ISO date
		const parsed = parseISO(dateStr);
		// parseISO returns Invalid Date for bad input
		return !isNaN(parsed.getTime());
	});

	if (validLines.length === 0) return [];

	const rawEvents: SchoolEvent[] = validLines.map((line) => {
		const [date, description = '', note = '', type = ''] = line.split('\t');
		return { date: format(parseISO(date), 'yyyy-MM-dd'), description, note, type };
	});
	const dates = rawEvents.map((event) => event.date);
	const startDate = dates.reduce((a, b) => (a < b ? a : b));
	const endDate = parseISO(dates.reduce((a, b) => (a > b ? a : b)));
	const dateArray: SchoolEvents[] = [];
	let processDate = parseISO(startDate);

	while (processDate <= endDate) {
		let weekday = getDay(processDate);
		if (!isSunday(processDate)) {
			const dateStr = format(processDate, 'yyyy-MM-dd');
			const sourceEvents = rawEvents.filter((event) => event.date === dateStr);
			const eventData = sourceEvents.map((event) => ({ ...event }));

			if (isSaturday(processDate)) {
				const noteField = eventData.map((event) => event.note).find((note) => note) ?? '';
				const noteDate = noteField.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
				if (noteDate && noteDate[0]) {
					weekday = getDay(noteDate[0]);
					const formattedDate = format(noteDate[0], 'yyyy-MM-dd(EEE)');
					for (const event of eventData) {
						event.note = event.note.replace(noteDate[0], formattedDate);
					}
				} else {
					processDate = add(processDate, { days: 1 });
					continue;
				}
			}

			dateArray.push({
				countdown: 0,
				date: dateStr,
				weekday,
				...summarizeEvents(eventData),
				events: eventData
			});
		}
		processDate = add(processDate, { days: 1 });
	}

	return dateArray;
};
