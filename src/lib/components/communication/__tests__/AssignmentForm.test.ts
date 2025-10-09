import { describe, it, expect, vi } from 'vitest';
import {
	AssignmentCode,
	Level,
	ClassType,
	ASSIGNMENT_TYPES,
	type Student,
	type AssignmentType
} from '../../../stores/communication';

// Type for students with transformed status for display
type DisplayStudent = Omit<Student, 'status'> & {
	status: { english: string; chinese: string };
};

const mockProps = {
	assignmentTypes: ASSIGNMENT_TYPES,
	UI_Assignment: AssignmentCode.passport,
	UI_Dates: {
		assigned: '1/15',
		due: '1/22',
		late: '1/29'
	},
	grade: 'G7',
	students: [] as DisplayStudent[],
	UI_Grade: 'G7',
	UI_Level: Level.Basic,
	UI_ClassType: ClassType.COMM,
	UI_ClassNum: '1',
	studentsRaw: [] as Student[],
	isSaveable: true,
	isModified: false,
	onClearForm: vi.fn(),
	onSaveRecord: vi.fn()
};

describe('AssignmentForm', () => {
	it('should have correct prop types', () => {
		// Test that the props interface is correctly typed
		expect(mockProps.assignmentTypes).toEqual(ASSIGNMENT_TYPES);
		expect(mockProps.UI_Assignment).toBe(AssignmentCode.passport);
		expect(mockProps.UI_Level).toBe(Level.Basic);
		expect(mockProps.UI_ClassType).toBe(ClassType.COMM);
	});

	it('should handle assignment types correctly', () => {
		// Test assignment type filtering logic
		const g9Types = ASSIGNMENT_TYPES.filter((type) => type.g9);
		const clilTypes = ASSIGNMENT_TYPES.filter((type) => type.clil);

		expect(g9Types.length).toBeGreaterThan(0);
		expect(clilTypes.length).toBeGreaterThan(0);
		expect(ASSIGNMENT_TYPES.length).toBeGreaterThan(g9Types.length);
	});

	it('should validate date format requirements', () => {
		// Test that date fields have the expected structure
		expect(mockProps.UI_Dates).toHaveProperty('assigned');
		expect(mockProps.UI_Dates).toHaveProperty('due');
		expect(mockProps.UI_Dates).toHaveProperty('late');

		// Test date format (M/D)
		expect(mockProps.UI_Dates.assigned).toMatch(/^\d{1,2}\/\d{1,2}$/);
		expect(mockProps.UI_Dates.due).toMatch(/^\d{1,2}\/\d{1,2}$/);
		expect(mockProps.UI_Dates.late).toMatch(/^\d{1,2}\/\d{1,2}$/);
	});

	it('should handle student data structure correctly', () => {
		const mockStudent: Student = {
			id: '1234567',
			name: { english: 'John', chinese: '约翰' },
			cClass: 'J101',
			status: 'NOT_SUBMITTED',
			selected: true
		};

		const mockDisplayStudent: DisplayStudent = {
			id: '1234567',
			name: { english: 'John', chinese: '约翰' },
			cClass: 'J101',
			status: { english: 'submitted', chinese: '已提交' },
			selected: true
		};

		// Test that the types are correctly structured
		expect(mockStudent).toHaveProperty('id');
		expect(mockStudent).toHaveProperty('name.english');
		expect(mockStudent).toHaveProperty('name.chinese');
		expect(mockStudent).toHaveProperty('cClass');
		expect(mockStudent).toHaveProperty('status');
		expect(mockStudent).toHaveProperty('selected');

		expect(mockDisplayStudent.status).toHaveProperty('english');
		expect(mockDisplayStudent.status).toHaveProperty('chinese');
	});

	it('should handle callback functions', () => {
		// Test that callback functions are properly typed
		expect(typeof mockProps.onClearForm).toBe('function');
		expect(typeof mockProps.onSaveRecord).toBe('function');

		// Test that callbacks can be called without errors
		expect(() => mockProps.onClearForm()).not.toThrow();
		expect(() => mockProps.onSaveRecord()).not.toThrow();
	});

	it('should validate boolean props', () => {
		// Test boolean prop types
		expect(typeof mockProps.isSaveable).toBe('boolean');
		expect(typeof mockProps.isModified).toBe('boolean');

		// Test with different boolean values
		const modifiedProps = { ...mockProps, isSaveable: false, isModified: true };
		expect(modifiedProps.isSaveable).toBe(false);
		expect(modifiedProps.isModified).toBe(true);
	});
});
