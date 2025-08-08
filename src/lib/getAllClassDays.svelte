<script module lang="ts">
	import { parseISO, format, getDay, add, isSunday, isSaturday } from 'date-fns';

	interface SchoolEvents {
		countdown: number | null;
		date: string;
		weekday: number;
		description: string;
		note: string;
		type: string;
	}

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
		let lines = schoolEvents
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line !== '');

		// Filter out lines with missing or invalid date
		let validLines = lines.filter((line) => {
			const dateStr = line.split('\t')[0];
			// Must have a non-empty date string
			if (!dateStr) return false;
			// Must be a valid ISO date
			const parsed = parseISO(dateStr);
			// parseISO returns Invalid Date for bad input
			return !isNaN(parsed.getTime());
		});

		if (validLines.length === 0) return [];

		let dates = validLines.map((line) => line.split('\t')[0]);
		let startDate = dates.reduce((a, b) => (a < b ? a : b));
		let endDate = parseISO(dates.reduce((a, b) => (a > b ? a : b)));

		let dateArray = [];
		let processDate = parseISO(startDate);
		let eventMap = new Map(
			validLines.map((item) => {
				let fields = item.split('\t');
				// Always use formatted yyyy-MM-dd as key for consistency
				let dateKey = '';
				try {
					dateKey = format(parseISO(fields[0]), 'yyyy-MM-dd');
				} catch {
					dateKey = fields[0];
				}
				return [dateKey, fields.slice(1)];
			})
		);

		while (processDate <= endDate) {
			let weekday = getDay(processDate);
			if (!isSunday(processDate)) {
				let dateStr = format(processDate, 'yyyy-MM-dd');
				let eventData = eventMap.get(dateStr) || ['', '', ''];
				// Try to find a Saturday make up date in specialDays
				// Make up date is marked by having 'Make up' in the description field and a date at the beginning of note field
				if (isSaturday(processDate)) {
					let noteField = typeof eventData[1] === 'string' ? eventData[1] : '';
					let noteDate = noteField.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
					// If there's a date in the note field
					if (noteDate && noteDate[0]) {
						// Change the weekday to the weekday of the date in the note field
						weekday = getDay(noteDate[0]);

						// Format the date with the day of the week
						let formattedDate = format(noteDate[0], 'yyyy-MM-dd(EEE)');

						// Replace the date in the note with the formatted date
						eventData[1] = noteField.replace(noteDate[0], formattedDate);
					} else {
						// Skip this iteration if there's no matching Saturday in specialDays
						processDate = add(processDate, { days: 1 });
						continue;
					}
				}

				dateArray.push({
					countdown: 0,
					date: dateStr,
					weekday: weekday,
					description: typeof eventData[0] === 'string' ? eventData[0] : '',
					note: typeof eventData[1] === 'string' ? eventData[1] : '',
					type: typeof eventData[2] === 'string' ? eventData[2] : ''
				});
			}
			processDate = add(processDate, { days: 1 });
		}

		return dateArray;
	};
</script>
