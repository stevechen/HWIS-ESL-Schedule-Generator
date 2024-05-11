<script context="module" lang="ts">
	import { parseISO, compareDesc } from 'date-fns';
	/**
	 * Retrieves all class days for a class type. Need input from getAllClassDays() that contains class days mixed with event days.
	 * - filters out event descriptions and notes if type is mismatched
	 * - add oral exam days for all except CLIL (rules are different for g7/8, g9, H10/11)
	 * - remove days after graduation for G9
	 * - add a class countdown column
	 */

	interface ClassDay {
		countdown: number | null;
		date: string;
		weekday: number;
		description: string;
		note: string;
		type: string;
	}

	interface AllClassDays {
		countdown: number | null;
		date: string;
		weekday: number;
		description: string;
		note: string;
		type: string;
	}

	export const getClassDaysByType = (
		allClassDays: AllClassDays[],
		weekdays: number[],
		selectedClassType: string = '',
		grade = ''
	): ClassDay[] => {
		//This should NOT happen
		if (selectedClassType === '' && grade === '')
			alert('Error: No type and no grade are selected!');
		const GENERIC_CLASS_DAYS = allClassDays.filter((day) => weekdays.includes(day.weekday));

		let graduationDay: object | null = null;

		// setup graduationDay for G9
		if (selectedClassType === 'G9') {
			const GRAD_DAYS_ARRAY = allClassDays.filter((day) => day.description.includes('Graduation'));
			graduationDay = GRAD_DAYS_ARRAY.length > 0 ? parseISO(GRAD_DAYS_ARRAY[0].date) : null;
		}

		// compose classes with/without attributes according to selected class type
		let typedClassDays = GENERIC_CLASS_DAYS.map((genericClassDay) => {
			const SHOULD_INCLUDE_DAY_ATTRIBUTE =
				genericClassDay.type === '' || //generic event
				selectedClassType === genericClassDay.type || //matched type
				(selectedClassType === 'G9' && genericClassDay.type === 'Comm') //G9 should include Comm events
					? true
					: false;

			if (!SHOULD_INCLUDE_DAY_ATTRIBUTE) {
				genericClassDay.description = '';
				genericClassDay.note = '';
			}

			return genericClassDay;
		}).filter((classDay) => {
			// Exclude null days
			if (classDay === null) return false;
			// Exclude days after graduationDay when 'G9' is selected
			if (
				selectedClassType === 'G9' &&
				graduationDay !== null &&
				parseISO(classDay.date) > graduationDay
			)
				return false;
			return true;
		});

		// get all exam days
		let examDays = allClassDays.filter((day) => day.description === 'Exam');

		// add 'Oral Exam days for Comm classes
		if (selectedClassType !== 'CLIL') {
			//find the first exam date for each term
			const firstExamDays =
				selectedClassType === 'G9' && graduationDay
					? [examDays[0], examDays[2]]
					: [examDays[0], examDays[2], examDays[4]];

			//sort in descending order so it would find the nearest none-off days prior to the exam date
			typedClassDays.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
			if (selectedClassType !== 'H')
				//high school classes don't need to sort exam days
				firstExamDays.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

			//Search for the two class days before the next exam by allowing the loop to start from where it left off in the previous iteration
			let startIndex = 0;
			//loop through the first exam dates array
			firstExamDays.forEach((theDay) => {
				let examDate = parseISO(theDay.date);
				let daysMatched = 0;
				//compare first exam date with all sorted Comm class days
				for (let index = startIndex; index < typedClassDays.length; index++) {
					let commClassDay = typedClassDays[index];
					let allClassDay = parseISO(commClassDay.date);
					// collect the date if it's earlier than the exam day and it's not an off day
					// if (allClassDay.isBefore(examDate) && commClassDay.description !== 'Off') {
					if (allClassDay < examDate && commClassDay.description !== 'Off') {
						// mark matching day as 'Oral Exam'
						typedClassDays[index].description = 'Oral Exam';
						daysMatched++;
					}

					// if two days are marked, stop comparing
					if (daysMatched >= 2) {
						// set starting point for the next iteration
						startIndex += index;
						// breakout of the loop to prevent further matching
						break;
					}
				}
			});
			//restore to original order
			typedClassDays = typedClassDays.reverse();
		}

		// stores each term's class days count and off days count
		// not using the off days count now
		let classCounts = [
			{ term: 1, classes: 0, offs: 0 },
			{ term: 2, classes: 0, offs: 0 },
			{ term: 3, classes: 0, offs: 0 }
		];

		typedClassDays.forEach((day) => {
			let thisDay = parseISO(day.date);

			let termIndex =
				thisDay < parseISO(examDays[0].date)
					? 0 //term 1
					: thisDay > parseISO(examDays[1].date) && thisDay < parseISO(examDays[2].date)
						? 1 //term 2
						: thisDay > parseISO(examDays[3].date) && thisDay < parseISO(examDays[4].date)
							? 2
							: undefined; //term 3

			if (termIndex !== undefined) {
				day.description !== 'Off'
					? classCounts[termIndex].classes++
					: classCounts[termIndex].offs++;
			}
		});

		let totalTerms = classCounts.length;
		//Adding countdown
		// typedClassDays.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
		// Find the index of the closest non-off class day before the first exam day
		let zeroIndex = typedClassDays.findIndex(
			// (day) => moment(day.date).isBefore(moment(examDays[0].date)) && day.description !== 'Off'
			(day) => parseISO(day.date) < parseISO(examDays[0].date) && day.description !== 'Off'
		);

		// Add class count
		let termIndex = 0;
		let countdown = classCounts[termIndex].classes; // start at total classes of the 1st semester

		typedClassDays = typedClassDays.map((day, index) => {
			// If we've reached the end of a term, move to the next term
			if (countdown === 0 && termIndex < classCounts.length - 1) {
				termIndex++;
				countdown = classCounts[termIndex].classes; // reset to total classes for the next term
			}

			if (index >= zeroIndex && day.description !== 'Off' && day.description !== 'Exam') {
				day.countdown = countdown - 1; // assign first
				countdown--; // then decrement
			} else {
				day.countdown = null; // set countdown to null if the day is an Exam day or Off
			}

			return day;
		});

		typedClassDays = typedClassDays.reverse();

		return typedClassDays;
	};
</script>
