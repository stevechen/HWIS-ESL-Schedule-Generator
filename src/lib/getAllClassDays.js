import moment from "moment";	
/**
 * Retrieves all class days between the given start and end dates.
 * @param {string} schoolEvents - A list of special school days
 * @returns {Array <{ countdown: Number|null, date: String, weekday: Number, description: String, note: String, type: String }>} - A set containing objects with the date and weekday index.
 */
// export const getDates = (startDate, endDate, specialDays) => {
export const getDates = (schoolEvents) => {
	let dates = schoolEvents.split('\n')
    .map((line) => line.split('\t')[0])
	let startDate = dates.reduce((a, b) => (a < b ? a : b));
	let endDate = dates.reduce((a, b) => (a > b ? a : b));

	let dateArray = [];
	let processDate = moment(startDate);
	let eventMap = new Map(schoolEvents.split("\n").map(item => {
		let fields = item.split("\t");
		return [fields[0], fields.slice(1)];
	}));

	while (processDate <= moment(endDate)) {
		let weekday = processDate.day();
		if (weekday !== 0) { // if not Sunday
			let dateStr = processDate.format('YYYY-MM-DD');
			let eventData = eventMap.get(dateStr) || ["", "", ""];
			// If the weekday is Saturday, try to find a make up date in specialDays
			// Make update is marke by having 'Make up' in the description field and a date at the beginning of note field
			if (weekday === 6) {
				let noteDate = eventData[1].match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
				// If there's a date in the note field
				if (noteDate && noteDate[0]) {
				// Change the weekday to the weekday of the date in the note field
				weekday = moment(noteDate[0], 'YYYY-MM-DD').day();
				// Format the date with the day of the week
				let formattedDate = moment(noteDate[0], 'YYYY-MM-DD').format('YYYY/MM/DD(ddd)').toUpperCase();
				// Replace the date in the note with the formatted date
				eventData[1] = eventData[1].replace(noteDate[0], formattedDate);
				} else {
					// Skip this iteration if there's no matching Saturday in specialDays
					processDate.add(1, 'days');
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

		processDate.add(1, 'days');
	}

	// console.log(dateArray);
	return dateArray;
}