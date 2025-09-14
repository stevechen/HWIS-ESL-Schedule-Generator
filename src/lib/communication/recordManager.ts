import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
import type { Student, Level, AssignmentCode } from '$lib/stores/communicationStore.svelte';

export interface CommunicationRecord {
	studentsText: string;
	UI_Grade: string;
	UI_Level: Level;
	UI_ClassType: string;
	UI_ClassNum: string;
	UI_Assignment: AssignmentCode;
	UI_Dates: { [key: string]: string };
	studentsRaw: Student[];
}

const RECORD_PREFIX = 'comm_';

/**
 * Capitalizes the first letter of each word in a string
 */
function capitalizeWords(str: string): string {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generates a unique record name based on the current form state
 */
export function generateRecordName(record: CommunicationRecord): string {
	let datePart = record.UI_Dates.due;
	if (isValidMonthAndDay(record.UI_Dates.due)) {
		const [month, day] = record.UI_Dates.due.split('/');
		const year = new Date().getFullYear();
		datePart = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
	}

	const selectedStudentCount = record.studentsRaw.filter((student) => student.selected).length;
	
	const baseRecordName = capitalizeWords(
		`${datePart}-${record.UI_Grade} ${record.UI_Level} ${record.UI_ClassType} ${record.UI_ClassNum}-${record.UI_Assignment}-${selectedStudentCount} students`
	);

	// Make the name unique by appending a counter if needed
	let recordName = baseRecordName;
	let counter = 1;
	while (localStorage.getItem(`${RECORD_PREFIX}${recordName}`)) {
		recordName = `${baseRecordName} (${counter})`;
		counter++;
	}

	return recordName;
}

/**
 * Saves a communication record to localStorage
 */
export function saveRecord(record: CommunicationRecord): string {
	const recordName = generateRecordName(record);
	
	if (recordName) {
		localStorage.setItem(`${RECORD_PREFIX}${recordName}`, JSON.stringify(record));
		return recordName;
	}
	
	throw new Error('Failed to generate record name');
}

/**
 * Loads a communication record from localStorage
 */
export function loadRecord(recordName: string): CommunicationRecord | null {
	const settingsText = localStorage.getItem(`${RECORD_PREFIX}${recordName}`);
	if (settingsText) {
		try {
			return JSON.parse(settingsText) as CommunicationRecord;
		} catch (error) {
			console.error('Failed to parse saved record:', error);
			return null;
		}
	}
	return null;
}

/**
 * Deletes a communication record from localStorage
 */
export function deleteRecord(recordName: string): void {
	localStorage.removeItem(`${RECORD_PREFIX}${recordName}`);
}

/**
 * Gets all saved record names, sorted by most recent first
 */
export function getSavedRecordNames(): string[] {
	const keys = Object.keys(localStorage);
	const recordKeys = keys.filter((key) => key.startsWith(RECORD_PREFIX));
	return recordKeys
		.map((key) => key.substring(RECORD_PREFIX.length))
		.sort()
		.reverse();
}

/**
 * Checks if a record matches the current form state (for detecting modifications)
 */
export function recordMatches(record1: CommunicationRecord, record2: CommunicationRecord): boolean {
	// Deep comparison using JSON.stringify as a heuristic
	return JSON.stringify(record1) === JSON.stringify(record2);
}

/**
 * Gets the most recent record name, or null if no records exist
 */
export function getMostRecentRecordName(): string | null {
	const recordNames = getSavedRecordNames();
	return recordNames.length > 0 ? recordNames[0] : null;
}

/**
 * Checks if a record with the given name exists
 */
export function recordExists(recordName: string): boolean {
	return localStorage.getItem(`${RECORD_PREFIX}${recordName}`) !== null;
}