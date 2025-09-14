import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
	saveRecord, 
	loadRecord, 
	deleteRecord, 
	getSavedRecordNames, 
	recordMatches, 
	getMostRecentRecordName,
	generateRecordName,
	type CommunicationRecord 
} from '../recordManager';
import { Level, AssignmentCode } from '../../stores/communicationStore.svelte';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	key: vi.fn(),
	length: 0
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock Object.keys to return our test data
const mockKeys = ['comm_test1', 'comm_test2', 'other_key'];
Object.keys = vi.fn(() => mockKeys);

const mockRecord: CommunicationRecord = {
	studentsText: 'test students',
	UI_Grade: 'G7',
	UI_Level: Level.Basic,
	UI_ClassType: 'ESL',
	UI_ClassNum: '1',
	UI_Assignment: AssignmentCode.passport,
	UI_Dates: {
		assigned: '1/15',
		due: '1/22',
		late: '1/29'
	},
	studentsRaw: []
};

describe('recordManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generateRecordName', () => {
		it('should generate a record name with proper formatting', () => {
			const name = generateRecordName(mockRecord);
			expect(name).toContain('G7 A ESL 1');
			expect(name).toContain('homework');
			expect(name).toContain('0 students'); // no selected students
		});

		it('should format dates when valid', () => {
			const record = { ...mockRecord, UI_Dates: { ...mockRecord.UI_Dates, due: '1/22' } };
			const name = generateRecordName(record);
			expect(name).toMatch(/^\d{4}\/01\/22/); // Should start with current year
		});
	});

	describe('saveRecord', () => {
		it('should save a record to localStorage', () => {
			localStorageMock.getItem.mockReturnValue(null); // No existing record
			
			const recordName = saveRecord(mockRecord);
			
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				`comm_${recordName}`,
				JSON.stringify(mockRecord)
			);
			expect(recordName).toBeTruthy();
		});
	});

	describe('loadRecord', () => {
		it('should load a record from localStorage', () => {
			localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecord));
			
			const loaded = loadRecord('test-record');
			
			expect(localStorageMock.getItem).toHaveBeenCalledWith('comm_test-record');
			expect(loaded).toEqual(mockRecord);
		});

		it('should return null if record does not exist', () => {
			localStorageMock.getItem.mockReturnValue(null);
			
			const loaded = loadRecord('nonexistent');
			
			expect(loaded).toBeNull();
		});
	});

	describe('deleteRecord', () => {
		it('should remove a record from localStorage', () => {
			deleteRecord('test-record');
			
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('comm_test-record');
		});
	});

	describe('getSavedRecordNames', () => {
		it('should return sorted record names without prefix', () => {
			const names = getSavedRecordNames();
			
			expect(names).toEqual(['test2', 'test1']); // sorted reverse
		});
	});

	describe('recordMatches', () => {
		it('should return true for identical records', () => {
			const record1 = { ...mockRecord };
			const record2 = { ...mockRecord };
			
			expect(recordMatches(record1, record2)).toBe(true);
		});

		it('should return false for different records', () => {
			const record1 = { ...mockRecord };
			const record2 = { ...mockRecord, UI_Grade: 'G8' };
			
			expect(recordMatches(record1, record2)).toBe(false);
		});

		it('should return false for different enum values', () => {
			const record1 = { ...mockRecord };
			const record2 = { ...mockRecord, UI_Level: Level.Advanced };
			
			expect(recordMatches(record1, record2)).toBe(false);
		});
	});

	describe('getMostRecentRecordName', () => {
		it('should return the first record name from sorted list', () => {
			const mostRecent = getMostRecentRecordName();
			
			expect(mostRecent).toBe('test2');
		});
	});
});