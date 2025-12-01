import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
import type { Student, Levels, AssignmentCode } from '$lib/stores/communication';

export interface CommunicationRecord {
	studentsText: string;
	grade: string;
	level: Levels;
	classType: string;
	classNum: string;
	assignment: AssignmentCode;
	dates: { [key: string]: string };
	studentsParsed: Student[];
}

export interface RecordManagerState {
	savedRecords: string[];
	lastLoaded: { name: string; record: CommunicationRecord } | null;
	isModified: boolean;
	isSaveable: boolean;
}

export class RecordManager {
	private state = $state<RecordManagerState>({
		savedRecords: [],
		lastLoaded: null,
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

	get lastLoadedRecord(): CommunicationRecord | null {
		return this.state.lastLoaded?.record ?? null;
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
			!!currentRecord.classNum && currentRecord.studentsParsed.filter((s) => s.selected).length > 0;

		if (!this.state.lastLoaded) {
			this.state.isModified = true;
		} else {
			this.state.isModified = !areRecordsEqual(currentRecord, this.state.lastLoaded.record);
		}
	}

	/**
	 * Refreshes the list of saved records from storage
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

			this.refreshSavedRecords();

			this.state.lastLoaded = { name: recordName, record: JSON.parse(JSON.stringify(record)) };
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
			this.state.lastLoaded = { name: recordName, record };
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
			if (this.state.lastLoaded?.name === recordName) {
				this.state.lastLoaded = null;
				this.state.isModified = true;
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
		this.state.lastLoaded = null;
		this.state.isModified = true;
	}
}

const RECORD_PREFIX = 'comm_';
const RECORD_INDEX_KEY = 'comm_index';

/**
 * Gets the index of record names from localStorage.
 * Rebuilds the index if it's missing, corrupted, or out of sync with actual records.
 */
function getRecordIndex(): string[] {
	const keys = Object.keys(localStorage);
	const recordKeys = keys.filter(
		(key) => key.startsWith(RECORD_PREFIX) && key !== RECORD_INDEX_KEY
	);
	const indexJson = localStorage.getItem(RECORD_INDEX_KEY);

	if (indexJson) {
		try {
			const index: unknown = JSON.parse(indexJson);
			// Validate index: is it an array and is its length consistent with actual records?
			if (Array.isArray(index) && index.length === recordKeys.length) {
				// A more robust check could verify that all keys in recordKeys are in the index,
				// but for now, we'll trust the length. This is a good trade-off for performance.
				return index as string[];
			}
		} catch (e) {
			console.error('Could not parse record index, rebuilding...', e);
		}
	}

	// Fallback to rebuilding the index if it doesn't exist, is corrupt, or is out of sync.
	const names = recordKeys.map((key) => key.substring(RECORD_PREFIX.length));
	saveRecordIndex(names);
	return names;
}

/**
 * Saves the record index to localStorage.
 */
function saveRecordIndex(names: string[]): void {
	localStorage.setItem(RECORD_INDEX_KEY, JSON.stringify(names));
}

/**
 * Capitalizes the first letter of each word in a string
 */
function capitalizeWords(str: string): string {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generates a unique record name based on the record's content and existing names.
 */
export function generateRecordName(
	record: CommunicationRecord,
	existingNames: string[]
): string {
	let datePart = record.dates.due;
	if (isValidMonthAndDay(record.dates.due)) {
		const [month, day] = record.dates.due.split('/');
		const year = new Date().getFullYear();
		datePart = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
	}

	const selectedStudentCount = record.studentsParsed.filter((student) => student.selected).length;

	const baseRecordName = capitalizeWords(
		`${datePart}-${record.grade} ${record.level} ${record.classType} ${record.classNum}-${record.assignment}-${selectedStudentCount} students`
	);

	// Make the name unique by appending a counter if needed
	let recordName = baseRecordName;
	let counter = 1;
	while (existingNames.includes(recordName)) {
		recordName = `${baseRecordName} (${counter})`;
		counter++;
	}

	return recordName;
}

/**
 * Saves a communication record to localStorage and updates the index.
 */
export function saveRecord(record: CommunicationRecord): string {
	const existingNames = getRecordIndex();
	const recordName = generateRecordName(record, existingNames);

	if (recordName) {
		localStorage.setItem(`${RECORD_PREFIX}${recordName}`, JSON.stringify(record));
		if (!existingNames.includes(recordName)) {
			saveRecordIndex([...existingNames, recordName]);
		}
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
 * Deletes a communication record from localStorage and the index.
 */
export function deleteRecord(recordName: string): void {
	localStorage.removeItem(`${RECORD_PREFIX}${recordName}`);
	const index = getRecordIndex();
	const newIndex = index.filter((name) => name !== recordName);
	saveRecordIndex(newIndex);
}

/**
 * Gets all saved record names, sorted by most recent first.
 */
export function getSavedRecordNames(): string[] {
	return getRecordIndex().sort().reverse();
}

/**
 * Checks if two records are deeply equal.
 * Note: This uses JSON.stringify for a quick but potentially brittle comparison.
 * It's fast but can fail if key order differs between objects. For this app's
 * data structures, it's a reasonable trade-off.
 */
export function areRecordsEqual(
	record1: CommunicationRecord,
	record2: CommunicationRecord
): boolean {
	if (record1 === record2) return true;
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
 * Checks if a record with the given name exists by checking the index.
 */
export function recordExists(recordName: string): boolean {
	return getRecordIndex().includes(recordName);
}