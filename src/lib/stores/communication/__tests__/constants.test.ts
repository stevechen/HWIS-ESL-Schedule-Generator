import { describe, it, expect } from 'vitest';
import { STATUS_TYPE, ASSIGNMENT_TYPES, LEVEL_TYPE, DATE_FIELDS } from '../constants';
import { StatusTypeCode, AssignmentCode, Level } from '../types';

describe('Communication Constants', () => {
	describe('STATUS_TYPE', () => {
		it('should have correct structure for NOT_SUBMITTED', () => {
			const notSubmitted = STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED];

			expect(notSubmitted.code).toBe(StatusTypeCode.NOT_SUBMITTED);
			expect(notSubmitted.text.english).toBe("hasn't been submitted");
			expect(notSubmitted.text.chinese).toBe('未繳交');
		});

		it('should have correct structure for NOT_COMPLETED', () => {
			const notCompleted = STATUS_TYPE[StatusTypeCode.NOT_COMPLETED];

			expect(notCompleted.code).toBe(StatusTypeCode.NOT_COMPLETED);
			expect(notCompleted.text.english).toBe("wasn't completed");
			expect(notCompleted.text.chinese).toBe('完成度不佳');
		});

		it('should have bilingual text for all statuses', () => {
			Object.values(STATUS_TYPE).forEach((status) => {
				expect(status.text.english).toBeTruthy();
				expect(status.text.chinese).toBeTruthy();
				expect(status.text.chinese).toMatch(/[\u4e00-\u9fa5]/); // Contains Chinese characters
			});
		});
	});

	describe('COMM_ASSIGNMENT_TYPES', () => {
		it('should have correct number of assignment types', () => {
			expect(ASSIGNMENT_TYPES.length).toBe(5);
		});

		it('should have all required properties for each assignment type', () => {
			ASSIGNMENT_TYPES.forEach((assignment) => {
				expect(assignment).toHaveProperty('code');
				expect(assignment).toHaveProperty('english');
				expect(assignment).toHaveProperty('chinese');
				expect(Object.values(AssignmentCode)).toContain(assignment.code);
			});
		});

		it('should have G9 assignments marked correctly', () => {
			const g9Assignments = ASSIGNMENT_TYPES.filter((a) => a.g9);
			expect(g9Assignments.length).toBeGreaterThan(0);

			// Passport, Recording, and Exam should be G9
			expect(g9Assignments.some((a) => a.code === AssignmentCode.passport)).toBe(true);
			expect(g9Assignments.some((a) => a.code === AssignmentCode.recording)).toBe(true);
			expect(g9Assignments.some((a) => a.code === AssignmentCode.exam)).toBe(true);
		});

		it('should have CLIL assignments marked correctly', () => {
			const clilAssignments = ASSIGNMENT_TYPES.filter((a) => a.clil);
			expect(clilAssignments.length).toBeGreaterThan(0);

			// Workbook and Speech should be CLIL
			expect(clilAssignments.some((a) => a.code === AssignmentCode.workbook)).toBe(true);
			expect(clilAssignments.some((a) => a.code === AssignmentCode.speech)).toBe(true);
		});

		it('should have bilingual text for all assignments', () => {
			ASSIGNMENT_TYPES.forEach((assignment) => {
				expect(assignment.english).toBeTruthy();
				expect(assignment.chinese).toBeTruthy();
				expect(assignment.chinese).toMatch(/[\u4e00-\u9fa5]/); // Contains Chinese characters
			});
		});
	});

	describe('LEVEL_TYPE', () => {
		it('should have correct number of levels', () => {
			expect(LEVEL_TYPE.length).toBe(5);
		});

		it('should have all required properties for each level', () => {
			LEVEL_TYPE.forEach((level) => {
				expect(level).toHaveProperty('id');
				expect(level).toHaveProperty('label');
				expect(level).toHaveProperty('value');
				expect(Object.values(Level)).toContain(level.value);
			});
		});

		it('should have correct level mappings', () => {
			expect(LEVEL_TYPE[0].value).toBe(Level.PreElementary);
			expect(LEVEL_TYPE[1].value).toBe(Level.Elementary);
			expect(LEVEL_TYPE[2].value).toBe(Level.Basic);
			expect(LEVEL_TYPE[3].value).toBe(Level.Intermediate);
			expect(LEVEL_TYPE[4].value).toBe(Level.Advanced);
		});

		it('should have unique IDs', () => {
			const ids = LEVEL_TYPE.map((level) => level.id);
			const uniqueIds = [...new Set(ids)];
			expect(ids.length).toBe(uniqueIds.length);
		});
	});

	describe('DATE_FIELDS', () => {
		it('should have correct number of date fields', () => {
			expect(DATE_FIELDS.length).toBe(3);
		});

		it('should have all required properties for each date field', () => {
			DATE_FIELDS.forEach((field) => {
				expect(field).toHaveProperty('label');
				expect(field).toHaveProperty('key');
				expect(typeof field.label).toBe('string');
				expect(typeof field.key).toBe('string');
			});
		});

		it('should have correct date field mappings', () => {
			const assignedField = DATE_FIELDS.find((f) => f.key === 'assigned');
			const dueField = DATE_FIELDS.find((f) => f.key === 'due');
			const lateField = DATE_FIELDS.find((f) => f.key === 'late');

			expect(assignedField?.label).toBe('Assigned:');
			expect(dueField?.label).toBe('Due:');
			expect(lateField?.label).toBe('Make up:');
		});

		it('should have unique keys', () => {
			const keys = DATE_FIELDS.map((field) => field.key);
			const uniqueKeys = [...new Set(keys)];
			expect(keys.length).toBe(uniqueKeys.length);
		});
	});
});
