import { parseISO, compareDesc } from 'date-fns';
import {
	getReminderKey,
	isAssignmentReminder,
	mergeEventValues,
	type SchoolEvent,
	type SchoolEvents
} from '$lib/utils/getAllClassDays';

// Helper to determine if a day is an 'Off' day
function isOffDay(desc: string): boolean {
	if (!desc) return false;
	const d = desc.trim().toLowerCase();
	return d === 'off' || d.includes('no class');
}

/**
 * Retrieves all class days for a class type. Need input from getAllClassDays() that contains class days mixed with event days.
 * - filters out event descriptions and notes if type is mismatched
 * - add oral exam days for all except CLIL (rules are different for g7/8, g9, H10/11)
 * - remove days after graduation for G9
 * - add a class countdown column
 */

type Day = SchoolEvents;

const isEligibleReminderDay = (day: Day): boolean =>
	!day.events.some(
		(event) => isOffDay(event.description) || event.description.toLowerCase().includes('no class')
	);

const applyReminderRanges = (days: Day[], weekdays: number[]): Day[] => {
	const groups = new Map<string, { day: Day; event: SchoolEvent }[]>();
	for (const day of days) {
		for (const event of day.events) {
			if (!isAssignmentReminder(event)) continue;
			const key = getReminderKey(event);
			const group = groups.get(key) ?? [];
			if (!group.some((candidate) => candidate.day.date === day.date)) group.push({ day, event });
			groups.set(key, group);
		}
	}

	const rangedKeys = new Set(
		[...groups.entries()].filter(([, group]) => group.length > 1).map(([key]) => key)
	);
	if (rangedKeys.size === 0) return days;

	const targetByKey = new Map<string, string>();
	for (const [key, group] of groups) {
		if (!rangedKeys.has(key)) continue;
		const start = group.reduce(
			(earliest, candidate) => (candidate.day.date < earliest ? candidate.day.date : earliest),
			group[0].day.date
		);
		const end = group.reduce(
			(latest, candidate) => (candidate.day.date > latest ? candidate.day.date : latest),
			group[0].day.date
		);
		const target = days
			.filter(
				(day) =>
					day.date >= start &&
					day.date <= end &&
					weekdays.includes(day.weekday) &&
					isEligibleReminderDay(day)
			)
			.sort((a, b) => b.date.localeCompare(a.date))[0];
		if (target) targetByKey.set(key, target.date);
	}

	return days.map((day) => {
		const keptEvents = day.events.filter(
			(event) => !rangedKeys.has(getReminderKey(event)) || event.type === ''
		);
		const movedEvents = [...targetByKey.entries()]
			.filter(([, target]) => target === day.date)
			.flatMap(([key]) => {
				const source = groups.get(key)?.[0];
				return source ? [source.event] : [];
			});
		const events = [...keptEvents, ...movedEvents].filter(
			(event, index, all) =>
				all.findIndex(
					(candidate) =>
						candidate.description === event.description && candidate.note === event.note
				) === index
		);
		return {
			...day,
			description: mergeEventValues(events.map((event) => event.description)),
			note: mergeEventValues(events.map((event) => event.note)),
			type: events[0]?.type ?? '',
			events
		};
	});
};

export const getClassDaysByType = (
	days: Day[],
	weekdays: number[],
	type = '',
	grade = ''
): Day[] => {
	//This should NOT happen
	if (type === '' && grade === '') alert('Error: No type and no grade are selected!');
	const daysWithReminderRanges = applyReminderRanges(days, weekdays);
	const GENERIC_CLASS_DAYS = daysWithReminderRanges.filter((day) => weekdays.includes(day.weekday));

	let graduationDay: object | null = null;

	// set graduationDay for G9
	if (type === 'G9') {
		const GRAD_DAYS_ARRAY = days.filter((day) => day.description.includes('Graduation'));
		graduationDay = GRAD_DAYS_ARRAY.length > 0 ? parseISO(GRAD_DAYS_ARRAY[0].date) : null;
	}

	// compose days w/wo attributes base on the selected class type
	let classDays = GENERIC_CLASS_DAYS.map((classDay) => {
		const visibleEvents = classDay.events.filter(
			(event) =>
				event.type === '' || type === event.type || (type === 'G9' && event.type === 'Comm')
		);

		return {
			...classDay,
			events: visibleEvents,
			description: mergeEventValues(visibleEvents.map((event) => event.description)),
			note: mergeEventValues(visibleEvents.map((event) => event.note)),
			type: visibleEvents[0]?.type ?? ''
		};
	}).filter((classDay) => {
		return (
			classDay && //remove nulls
			!(type === 'G9' && graduationDay && parseISO(classDay.date) > graduationDay) //remove days after graduation
		);
	});

	// get all exam days
	const examDays = days.filter((day) => day.description === 'Exam');

	// Defensive check: if no exam days found, we cannot proceed with exam calculation
	if (examDays.length === 0) {
		return classDays.reverse();
	}

	// add 'Oral Exam' days
	if (type !== 'CLIL') {
		//find the first exam date for each term
		const examStartDays =
			type === 'G9' && graduationDay
				? [examDays[0], examDays[2]].filter(Boolean)
				: [examDays[0], examDays[2], examDays[4]].filter(Boolean);

		// If we don't even have one exam day, skip oral exam matching
		if (examStartDays.length > 0) {
			//sort in descending order so it would find the nearest none-off days prior to the exam date
			classDays.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
			examStartDays.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

			//Search for the two class days before the next exam by allowing the loop to start from where it left off in the previous iteration
			let startIndex = 0;
			//loop through the first exam dates array
			examStartDays.forEach((examStartDay, examStartDaysIndex) => {
				const isFinalExam = examStartDaysIndex === 0;
				const examStartDate = parseISO(examStartDay.date);
				let daysMarked = 0;
				//compare first exam date with all sorted Comm class days
				for (let index = startIndex; index < classDays.length; index++) {
					const classDay = classDays[index];
					const classDate = parseISO(classDay.date);
					// mark the oral exam day if it's earlier than the exam day and it's not an off day
					if (classDate < examStartDate && !isOffDay(classDay.description)) {
						if (type === 'H' && !isFinalExam) {
							// H classes don't need 'Oral Exam' on the first 2 terms
							classDays[index].description = '';
						} else {
							// mark matching day as 'Oral Exam'
							classDays[index].description = 'Oral Exam';
						}
						daysMarked++;
					}

					// if two days are marked as 'Oral Exam', break out to stop matching
					if (daysMarked >= 2) {
						startIndex += index; // set start index for the next iteration
						break; // breakout of the loop to prevent further matching
					}
				}
			});
			//restore to original order
			classDays = classDays.reverse();
		}
	}

	// stores each term's class days count and off days count
	// not using the off days count currently, might come in handy
	const classCounts = [
		{ term: 1, classes: 0, offs: 0 },
		{ term: 2, classes: 0, offs: 0 },
		{ term: 3, classes: 0, offs: 0 }
	];

	classDays.forEach((day) => {
		const thisDay = parseISO(day.date);

		let termIndex = undefined;
		if (examDays.length >= 1 && thisDay < parseISO(examDays[0].date)) {
			termIndex = 0; //term 1
		} else if (
			examDays.length >= 3 &&
			thisDay > parseISO(examDays[1].date) &&
			thisDay < parseISO(examDays[2].date)
		) {
			termIndex = 1; //term 2
		} else if (
			examDays.length >= 5 &&
			thisDay > parseISO(examDays[3].date) &&
			thisDay < parseISO(examDays[4].date)
		) {
			termIndex = 2; //term 3
		}

		if (termIndex !== undefined) {
			if (!isOffDay(day.description)) {
				classCounts[termIndex].classes++;
			} else {
				classCounts[termIndex].offs++;
			}
		}
	});

	// Adding countdown
	// Find the index of the closest non-off class day before the first exam day
	const zeroIndex = classDays.findIndex(
		(day) =>
			examDays.length > 0 &&
			parseISO(day.date) < parseISO(examDays[0].date) &&
			!isOffDay(day.description)
	);

	// Add class count
	let termIndex = 0;
	let countdown = classCounts[termIndex].classes; // start at total classes of the 1st semester

	classDays = classDays.map((day, index) => {
		// If at the end of a term, move to the next term until the last term
		if (countdown === 0 && termIndex < classCounts.length - 1) {
			termIndex++;
			countdown = classCounts[termIndex].classes; // reset to total classes for the next term
		}

		if (index >= zeroIndex && !isOffDay(day.description) && day.description !== 'Exam') {
			day.countdown = countdown - 1;
			countdown--;
		} else {
			day.countdown = null; // skip countdown if the day is an Exam day or Off
		}

		return day;
	});

	classDays = classDays.reverse();

	return classDays;
};
