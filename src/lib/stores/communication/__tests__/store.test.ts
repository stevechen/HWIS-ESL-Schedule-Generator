import { describe, it, expect, beforeEach } from 'vitest';
import { CommunicationStore } from '../store.svelte';
import { AssignmentCode, ClassType, Level } from '../types';
import { LEVEL_TYPE } from '../constants';

describe('CommunicationStore', () => {
	let store: CommunicationStore;

	beforeEach(() => {
		store = new CommunicationStore();
	});

	it('should initialize with default values', () => {
		expect(store.studentsText).toBe('');
		expect(store.studentsRaw).toEqual([]);
		expect(store.shouldHideTextarea).toBe(false);
		expect(store.UI_Grade).toBe('');
		expect(store.UI_Level).toBe(Level.Basic); // LEVEL_TYPE[2].value
		expect(store.UI_ClassType).toBe(ClassType.COMM);
		expect(store.UI_ClassNum).toBe('');
		expect(store.UI_Assignment).toBe(AssignmentCode.passport);
		expect(store.signatureImage).toBe('');
	});

	it('should initialize dates correctly', () => {
		const today = new Date();
		const expectedDueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const expectedLateDate = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;

		expect(store.UI_Dates.due).toBe(expectedDueDate);
		expect(store.UI_Dates.late).toBe(expectedLateDate);
		expect(store.UI_Dates.assigned).toBe('');
	});

	it('should initialize assignmentRaw with empty values', () => {
		expect(store.assignmentRaw).toEqual({
			esl: '',
			type: '',
			assigned: '',
			due: '',
			late: ''
		});
	});

	it('should reset all values to defaults', () => {
		// Modify some values
		store.studentsText = 'test students';
		store.UI_Grade = 'G7';
		store.UI_ClassNum = '1';
		store.signatureImage = 'test-signature';
		store.UI_Dates.assigned = '1/1';

		// Reset
		store.reset();

		// Verify all values are back to defaults
		expect(store.studentsText).toBe('');
		expect(store.studentsRaw).toEqual([]);
		expect(store.shouldHideTextarea).toBe(false);
		expect(store.UI_Grade).toBe('');
		expect(store.UI_Level).toBe(Level.Basic);
		expect(store.UI_ClassType).toBe(ClassType.COMM);
		expect(store.UI_ClassNum).toBe('');
		expect(store.UI_Assignment).toBe(AssignmentCode.passport);
		expect(store.signatureImage).toBe('');

		// Verify dates are re-initialized
		const today = new Date();
		const expectedDueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		expect(store.UI_Dates.due).toBe(expectedDueDate);
	});

	it('should handle state updates correctly', () => {
		// Test that state variables can be updated
		store.studentsText = 'new students';
		expect(store.studentsText).toBe('new students');

		store.UI_Grade = 'G8';
		expect(store.UI_Grade).toBe('G8');

		store.UI_ClassNum = '2';
		expect(store.UI_ClassNum).toBe('2');

		store.signatureImage = 'data:image/png;base64,test';
		expect(store.signatureImage).toBe('data:image/png;base64,test');
	});

	it('should handle assignment updates correctly', () => {
		store.UI_Assignment = AssignmentCode.workbook;
		expect(store.UI_Assignment).toBe(AssignmentCode.workbook);

		store.assignmentRaw.esl = 'G7 Basic Comm 1';
		expect(store.assignmentRaw.esl).toBe('G7 Basic Comm 1');
	});

	it('should handle date updates correctly', () => {
		store.UI_Dates.assigned = '1/15';
		store.UI_Dates.due = '1/22';
		store.UI_Dates.late = '1/29';

		expect(store.UI_Dates.assigned).toBe('1/15');
		expect(store.UI_Dates.due).toBe('1/22');
		expect(store.UI_Dates.late).toBe('1/29');
	});

	it('should handle student data correctly', () => {
		const mockStudents = [
			{
				id: '1234567',
				name: { english: 'John Doe', chinese: '约翰' },
				cClass: 'J101',
				status: 'NOT_SUBMITTED',
				selected: true
			}
		];

		store.studentsRaw = mockStudents;
		expect(store.studentsRaw).toEqual(mockStudents);
		expect(store.studentsRaw.length).toBe(1);
		expect(store.studentsRaw[0].name.english).toBe('John Doe');
	});

	it('should handle textarea visibility state', () => {
		expect(store.shouldHideTextarea).toBe(false);
		
		store.shouldHideTextarea = true;
		expect(store.shouldHideTextarea).toBe(true);
	});

	it('should use correct default level', () => {
		// Verify that the default level is LEVEL_TYPE[2] (Basic)
		expect(store.UI_Level).toBe(LEVEL_TYPE[2].value);
		expect(store.UI_Level).toBe(Level.Basic);
	});
});