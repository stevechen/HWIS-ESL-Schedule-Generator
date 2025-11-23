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
		expect(store.studentsParsed).toEqual([]);
		expect(store.shouldHideTextarea).toBe(false);
		expect(store.grade).toBe('');
		expect(store.level).toBe(Level.Basic); // LEVEL_TYPE[2].value
		expect(store.classType).toBe(ClassType.COMM);
		expect(store.classNum).toBe('');
		expect(store.assignment).toBe(AssignmentCode.passport);
		expect(store.signatureImage).toBe('');
	});

	it('should initialize dates correctly', () => {
		const today = new Date();
		const expectedDueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const expectedLateDate = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;

		expect(store.dates.due).toBe(expectedDueDate);
		expect(store.dates.late).toBe(expectedLateDate);
		expect(store.dates.assigned).toBe('');
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
		store.grade = 'G7';
		store.classNum = '1';
		store.signatureImage = 'test-signature';
		store.dates.assigned = '1/1';

		// Reset
		store.reset();

		// Verify all values are back to defaults
		expect(store.studentsText).toBe('');
		expect(store.studentsParsed).toEqual([]);
		expect(store.shouldHideTextarea).toBe(false);
		expect(store.grade).toBe('');
		expect(store.level).toBe(Level.Basic);
		expect(store.classType).toBe(ClassType.COMM);
		expect(store.classNum).toBe('');
		expect(store.assignment).toBe(AssignmentCode.passport);
		expect(store.signatureImage).toBe('');

		// Verify dates are re-initialized
		const today = new Date();
		const expectedDueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		expect(store.dates.due).toBe(expectedDueDate);
	});

	it('should handle state updates correctly', () => {
		// Test that state variables can be updated
		store.studentsText = 'new students';
		expect(store.studentsText).toBe('new students');

		store.grade = 'G8';
		expect(store.grade).toBe('G8');

		store.classNum = '2';
		expect(store.classNum).toBe('2');

		store.signatureImage = 'data:image/png;base64,test';
		expect(store.signatureImage).toBe('data:image/png;base64,test');
	});

	it('should handle assignment updates correctly', () => {
		store.assignment = AssignmentCode.workbook;
		expect(store.assignment).toBe(AssignmentCode.workbook);

		store.assignmentRaw.esl = 'G7 Basic Comm 1';
		expect(store.assignmentRaw.esl).toBe('G7 Basic Comm 1');
	});

	it('should handle date updates correctly', () => {
		store.dates.assigned = '1/15';
		store.dates.due = '1/22';
		store.dates.late = '1/29';

		expect(store.dates.assigned).toBe('1/15');
		expect(store.dates.due).toBe('1/22');
		expect(store.dates.late).toBe('1/29');
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

		store.studentsParsed = mockStudents;
		expect(store.studentsParsed).toEqual(mockStudents);
		expect(store.studentsParsed.length).toBe(1);
		expect(store.studentsParsed[0].name.english).toBe('John Doe');
	});

	it('should handle textarea visibility state', () => {
		expect(store.shouldHideTextarea).toBe(false);

		store.shouldHideTextarea = true;
		expect(store.shouldHideTextarea).toBe(true);
	});

	it('should use correct default level', () => {
		// Verify that the default level is LEVEL_TYPE[2] (Basic)
		expect(store.level).toBe(LEVEL_TYPE[2].value);
		expect(store.level).toBe(Level.Basic);
	});
});
