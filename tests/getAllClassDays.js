import moment from "moment";	
/**
 * Retrieves all class days between the given start and end dates.
 * @param {string} startDate - The start date in the format 'YYYY/MM/DD'.
 * @param {string} endDate - The end date in the format 'YYYY/MM/DD'.
 * @param {string} specialDays - A list of special school days
 * @returns {Array <{ date: String, weekday: Number, description: String, note: String, type: String }>} - A set containing objects with the date and weekday index.
 */
export const getDates = (startDate, endDate, specialDays) => {
	let dateArray = [];
	let currentDate = moment(startDate);
	let specialMap = new Map(specialDays.split("\n").map(item => {
		let fields = item.split("\t");
		return [fields[0], fields.slice(1)];
	}));

	while (currentDate <= moment(endDate)) {
		let weekday = currentDate.day();
		if (weekday !== 0) {
			let dateStr = currentDate.format('YYYY-MM-DD');
			let specialData = specialMap.get(dateStr) || ["", "", ""];
		// If the weekday is Saturday
		if (weekday === 6) {
			let noteDate = specialData[1].match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
			// If there's a date in the note field
			if (noteDate && noteDate[0]) {
				// Change the weekday to the weekday of the date in the note field
				weekday = moment(noteDate[0], 'YYYY-MM-DD').day();
			} else {
				// Skip this iteration if there's no matching Saturday in specialDays
				currentDate.add(1, 'days');
				continue;
				}
			}

			dateArray.push({
				date: dateStr,
				weekday: weekday,
				description: specialData[0],
				note: specialData[1],
				type: specialData[2]
			});
		}

			currentDate.add(1, 'days');
	}

	// console.log(dateArray);
	return dateArray;
}