import { isValidMonthAndDay } from '$lib/utils/dateValidation';
import type { Student, Levels, AssignmentCode, StatusCode } from '$lib/stores/communication';

export interface CommunicationRecord {
	grade: string;
	level: Levels;
	classType: string;
	classNum: string;
	assignment: AssignmentCode;
	dates: { assigned: string; due: string; late: string };
	studentsParsed: Student[];
}

export interface RecordManagerState {
	savedRecords: string[];
	lastLoaded: { name: string; record: CommunicationRecord } | null;
}

export class RecordManager {
	private state = $state<RecordManagerState>({
		savedRecords: [],
		lastLoaded: null
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

	get lastLoadedRecordName(): string | null {
		return this.state.lastLoaded?.name ?? null;
	}

	/**
	 * Refreshes the list of saved records from storage
	 */
	refreshSavedRecords = () => (this.state.savedRecords = getSavedRecordNames());

	/**
	 * Saves a record and updates state
	 */
	save(record: CommunicationRecord): { success: boolean; recordName?: string; error?: string } {
		try {
			const recordName = saveRecord(record);

			this.refreshSavedRecords();

			this.state.lastLoaded = { name: recordName, record: JSON.parse(JSON.stringify(record)) };

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
			this.state.lastLoaded = { name: recordName, record: JSON.parse(JSON.stringify(record)) };
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
const saveRecordIndex = (names: string[]): void =>
	localStorage.setItem(RECORD_INDEX_KEY, JSON.stringify(names));

/**
 * Capitalizes the first letter of each word in a string
 */
const capitalizeWords = (str: string): string => str.replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Generates a unique record name based on the record's content and existing names.
 */
function generateRecordName(record: CommunicationRecord, existingNames: string[]): string {
	let datePart = record.dates.due;
	if (isValidMonthAndDay(record.dates.due)) {
		const [month, day] = record.dates.due.split('/');
		const year = new Date().getFullYear();
		datePart = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
	}

	const selectedStudentCount = record.studentsParsed.filter((student) => student.selected).length;

	const baseRecordName = capitalizeWords(
		`${datePart}-${record.grade} ${record.level} ${record.classNum} ${record.classType}-${record.assignment}-${selectedStudentCount} students`
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
function saveRecord(record: CommunicationRecord): string {
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
function loadRecord(recordName: string): CommunicationRecord | null {
	const settingsText = localStorage.getItem(`${RECORD_PREFIX}${recordName}`);
	if (settingsText) {
		try {
			const rawRecord = JSON.parse(settingsText);
			// TODO: REMOVE_NEXT_YEAR - Remove this migration call and just return rawRecord (with type check/cast)
			return migrateRecord(rawRecord);
		} catch (error) {
			console.error('Failed to parse saved record:', error);
			return null;
		}
	}
	return null;
}

/**
 * Loose shape of a stored record — the current format or a legacy (pre-9180221)
 * one. Legacy records stored string values where the current types use enums.
 */
interface LegacyRecord {
	studentsParsed?: Student[];
	studentsRaw?: LegacyStudent[];
	dates?: { assigned?: string; due?: string; late?: string };
	UI_Dates?: { assigned?: string; due?: string; late?: string };
	grade?: string;
	UI_Grade?: string;
	level?: string;
	UI_Level?: string;
	classType?: string;
	UI_ClassType?: string;
	classNum?: string | number;
	UI_ClassNum?: string | number;
	assignment?: string;
	UI_Assignment?: string;
}

interface LegacyStudent {
	id: string;
	name?: { english?: string; chinese?: string };
	cClass?: string;
	status?: string;
	selected?: boolean;
}

/**
 * Migrates a legacy record to the current format.
 * Legacy records (pre-9180221) used studentsRaw instead of studentsParsed,
 * and had different date structures.
 *
 * TODO: REMOVE_NEXT_YEAR - This function and its usage can be removed when legacy data support is no longer needed.
 */
export function migrateRecord(record: unknown): CommunicationRecord {
	const legacy = record as LegacyRecord;

	// If it already looks correct, return it
	if (legacy.studentsParsed && !legacy.studentsRaw) {
		return legacy as CommunicationRecord;
	}

	// Migrate dates
	const dates = {
		assigned: legacy.dates?.assigned || legacy.UI_Dates?.assigned || '',
		due: legacy.dates?.due || legacy.UI_Dates?.due || '',
		late: legacy.dates?.late || legacy.UI_Dates?.late || ''
	};

	// Migrate students
	let studentsParsed = legacy.studentsParsed || [];
	if (legacy.studentsRaw) {
		studentsParsed = legacy.studentsRaw.map((s) => ({
			id: s.id,
			name: {
				english: s.name?.english || '',
				chinese: s.name?.chinese || ''
			},
			cClass: s.cClass || '',
			status: s.status as StatusCode,
			selected: !!s.selected
		}));
	}

	return {
		grade: legacy.grade || legacy.UI_Grade || '',
		level: (legacy.level || legacy.UI_Level || '') as Levels,
		classType: legacy.classType || legacy.UI_ClassType || '',
		classNum: String(legacy.classNum || legacy.UI_ClassNum || ''),
		assignment: (legacy.assignment || legacy.UI_Assignment || '') as AssignmentCode,
		dates,
		studentsParsed
	};
}

/**
 * Deletes a communication record from localStorage and the index.
 */
function deleteRecord(recordName: string): void {
	localStorage.removeItem(`${RECORD_PREFIX}${recordName}`);
	const index = getRecordIndex();
	const newIndex = index.filter((name) => name !== recordName);
	saveRecordIndex(newIndex);
}

/**
 * Gets all saved record names, sorted by most recent first.
 */
function getSavedRecordNames(): string[] {
	return getRecordIndex().sort().reverse();
}

/**
 * Checks if two records are deeply equal.
 * Note: This uses JSON.stringify for a quick but potentially brittle comparison.
 * It's fast but can fail if key order differs between objects. For this app's
 * data structures, it's a reasonable trade-off.
 */
/**
 * Checks if two records are deeply equal, only considering relevant properties.
 */
export function areRecordsEqual(
	record1: CommunicationRecord,
	record2: CommunicationRecord
): boolean {
	// Normalize both to ensure they only contain the expected keys for comparison
	const clean1 = cleanRecord(record1);
	const clean2 = cleanRecord(record2);
	return deepEqual(clean1, clean2);
}

/**
 * Creates a clean version of a record containing only the properties in the interface.
 * Also normalizes types (like ensuring classNum is a string).
 */
function cleanRecord(record: CommunicationRecord): CommunicationRecord {
	return {
		grade: record.grade || '',
		level: record.level,
		classType: record.classType,
		classNum: String(record.classNum || ''),
		assignment: record.assignment,
		dates: {
			assigned: record.dates?.assigned || '',
			due: record.dates?.due || '',
			late: record.dates?.late || ''
		},
		studentsParsed: (record.studentsParsed || []).map((s) => ({
			id: s.id,
			name: {
				english: s.name?.english || '',
				chinese: s.name?.chinese || ''
			},
			cClass: s.cClass || '',
			status: s.status,
			selected: !!s.selected
		}))
	};
}

/**
 * Robust deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		if (Array.isArray(a) !== Array.isArray(b)) return false;
		if (Array.isArray(a)) {
			const arrA: unknown[] = a;
			const arrB: unknown[] = b as unknown[];
			if (arrA.length !== arrB.length) return false;
			for (let i = 0; i < arrA.length; i++) {
				if (!deepEqual(arrA[i], arrB[i])) return false;
			}
			return true;
		}
		const objA = a as Record<string, unknown>;
		const objB = b as Record<string, unknown>;
		const keysA = Object.keys(objA);
		const keysB = Object.keys(objB);
		if (keysA.length !== keysB.length) return false;
		for (const key of keysA) {
			if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
			if (!deepEqual(objA[key], objB[key])) return false;
		}
		return true;
	}
	// Handle NaN
	return a !== a && b !== b;
}

/**
 * Gets the most recent record name, or null if no records exist
 */
function getMostRecentRecordName(): string | null {
	const recordNames = getSavedRecordNames();
	return recordNames.length > 0 ? recordNames[0] : null;
}
