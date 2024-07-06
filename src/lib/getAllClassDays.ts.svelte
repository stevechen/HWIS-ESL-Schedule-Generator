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

	export const getDates = (schoolEvents: string): SchoolEvents[] => {
		schoolEvents = schoolEvents
			.split('\n') // split the string into lines
			.filter((line) => line.trim() !== '') // filter out empty lines
			.join('\n'); // join the lines back together

		let lines = schoolEvents.split('\n');
		let dates = lines.map((line) => line.split('\t')[0]);
		let startDate = dates.reduce((a, b) => (a < b ? a : b));
		let endDate = parseISO(dates.reduce((a, b) => (a > b ? a : b)));

		let dateArray = [];
		let processDate = parseISO(startDate);
		let eventMap = new Map(
			lines.map((item) => {
				let fields = item.split('\t');
				return [fields[0], fields.slice(1)];
			})
		);

		while (processDate <= endDate) {
			let weekday = getDay(processDate);
			if (!isSunday(processDate)) {
				let dateStr = format(processDate, 'yyyy-MM-dd');
				let eventData = eventMap.get(dateStr) || ['', '', ''];
				// Try to find a Saturday make up date in specialDays
				// Make update is marked by having 'Make up' in the description field and a date at the beginning of note field
				if (isSaturday(processDate)) {
					let noteDate = eventData[1].match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
					// If there's a date in the note field
					if (noteDate && noteDate[0]) {
						// Change the weekday to the weekday of the date in the note field
						weekday = getDay(noteDate[0]);

						// Format the date with the day of the week
						let formattedDate = format(noteDate[0], 'yyyy-MM-dd(EEE)');

						// Replace the date in the note with the formatted date
						eventData[1] = eventData[1].replace(noteDate[0], formattedDate);
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
					description: eventData[0],
					note: eventData[1],
					type: eventData[2]
				});
			}
			processDate = add(processDate, { days: 1 });
		}

		return dateArray;
	};
</script>
