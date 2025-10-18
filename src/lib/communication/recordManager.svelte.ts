import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
import type { Student, Level, AssignmentCode } from '$lib/stores/communication';

export interface CommunicationRecord {
	studentsText: string;
	grade: string;
	level: Level;
	classType: string;
	classNum: string;
	assignment: AssignmentCode;
	dates: { [key: string]: string };
	studentsRaw: Student[];
}

export interface RecordManagerState {
	savedRecords: string[];
	lastLoadedRecord: CommunicationRecord | null;
	isModified: boolean;
	isSaveable: boolean;
}

export class RecordManager {
	private state = $state<RecordManagerState>({
		savedRecords: [],
		lastLoadedRecord: null,
		isModified: true,
		isSaveable: false
	});

	constructor() {
		if (typeof window !== 'undefined') {
			this.refreshSavedRecords();
		}
	}

	get savedRecords() {
		return this.state.savedRecords;
	}

	get lastLoadedRecord() {
		return this.state.lastLoadedRecord;
	}

	get isModified() {
		return this.state.isModified;
	}

	get isSaveable() {
		return this.state.isSaveable;
	}

	/**
	 * Updates the saveable and modified state based on current record
	 */
	updateState(currentRecord: CommunicationRecord) {
		this.state.isSaveable =
			!!currentRecord.classNum && currentRecord.studentsRaw.filter((s) => s.selected).length > 0;

		if (!this.state.lastLoadedRecord) {
			this.state.isModified = true;
		} else {
			this.state.isModified = !recordMatches(currentRecord, this.state.lastLoadedRecord);
		}
	}

	/**
	 * Refreshes the list of saved records
	 */
	refreshSavedRecords() {
		this.state.savedRecords = getSavedRecordNames();
	}

	/**
	 * Saves a record and updates state
	 */
	save(record: CommunicationRecord): { success: boolean; recordName?: string; error?: string } {
		try {
			const recordName = saveRecord(record);

			if (!this.state.savedRecords.includes(recordName)) {
				this.state.savedRecords = [...this.state.savedRecords, recordName].sort().reverse();
			}

			this.state.lastLoadedRecord = JSON.parse(JSON.stringify(record));
			this.state.isModified = false;

			return { success: true, recordName };
		} catch (error) {
			console.error('Failed to save record:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to save record'
			};
		}
	}

	/**
	 * Loads a record and updates state
	 */
	load(recordName: string): { success: boolean; record?: CommunicationRecord; error?: string } {
		const record = loadRecord(recordName);

		if (record) {
			this.state.lastLoadedRecord = record;
			this.state.isModified = false;
			return { success: true, record };
		}

		return { success: false, error: 'Record not found or corrupted' };
	}

	/**
	 * Deletes a record and updates state
	 */
	delete(recordName: string): { success: boolean; error?: string } {
		try {
			// Check if we're deleting the currently loaded record
			if (this.state.lastLoadedRecord) {
				const currentRecordName = generateRecordName(this.state.lastLoadedRecord);
				if (currentRecordName === recordName) {
					this.state.lastLoadedRecord = null;
					this.state.isModified = true;
				}
			}

			deleteRecord(recordName);
			this.state.savedRecords = this.state.savedRecords.filter((r) => r !== recordName);

			return { success: true };
		} catch (error) {
			console.error('Failed to delete record:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to delete record'
			};
		}
	}

	/**
	 * Auto-loads the most recent record if no data is currently loaded
	 */
	autoLoadMostRecent(): { success: boolean; record?: CommunicationRecord; recordName?: string } {
		const mostRecentRecord = getMostRecentRecordName();

		if (mostRecentRecord) {
			const result = this.load(mostRecentRecord);
			if (result.success) {
				return { ...result, recordName: mostRecentRecord };
			}
		}

		return { success: false };
	}

	/**
	 * Clears the current loaded record state
	 */
	clearLoadedRecord() {
		this.state.lastLoadedRecord = null;
		this.state.isModified = true;
	}
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
	let datePart = record.dates.due;
	if (isValidMonthAndDay(record.dates.due)) {
		const [month, day] = record.dates.due.split('/');
		const year = new Date().getFullYear();
		datePart = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
	}

	const selectedStudentCount = record.studentsRaw.filter((student) => student.selected).length;

	const baseRecordName = capitalizeWords(
		`${datePart}-${record.grade} ${record.level} ${record.classType} ${record.classNum}-${record.assignment}-${selectedStudentCount} students`
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
