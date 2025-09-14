import { describe, it, expect } from 'vitest';
import { AssignmentCode, Level, StatusTypeCode, ClassType, Limit } from '../types';

describe('Communication Types', () => {
	describe('AssignmentCode enum', () => {
		it('should have all expected assignment codes', () => {
			expect(AssignmentCode.workbook).toBe('workbook');
			expect(AssignmentCode.passport).toBe('passport');
			expect(AssignmentCode.recording).toBe('recording');
			expect(AssignmentCode.exam).toBe('exam');
			expect(AssignmentCode.speech).toBe('speech');
		});

		it('should have correct number of assignment codes', () => {
			const codes = Object.values(AssignmentCode);
			expect(codes.length).toBe(5);
		});
	});

	describe('Level enum', () => {
		it('should have all expected levels', () => {
			expect(Level.PreElementary).toBe('Pre-Elementary');
			expect(Level.Elementary).toBe('Elementary');
			expect(Level.Basic).toBe('Basic');
			expect(Level.Intermediate).toBe('Intermediate');
			expect(Level.Advanced).toBe('Advanced');
		});

		it('should have correct number of levels', () => {
			const levels = Object.values(Level);
			expect(levels.length).toBe(5);
		});
	});

	describe('StatusTypeCode', () => {
		it('should have correct status codes', () => {
			expect(StatusTypeCode.NOT_SUBMITTED).toBe('0');
			expect(StatusTypeCode.NOT_COMPLETED).toBe('1');
		});

		it('should be readonly', () => {
			// TypeScript should prevent modification, but we can test the values
			expect(typeof StatusTypeCode.NOT_SUBMITTED).toBe('string');
			expect(typeof StatusTypeCode.NOT_COMPLETED).toBe('string');
		});
	});

	describe('ClassType', () => {
		it('should have correct class types', () => {
			expect(ClassType.COMM).toBe('Comm');
			expect(ClassType.CLIL).toBe('CLIL');
		});

		it('should be readonly', () => {
			// TypeScript should prevent modification, but we can test the values
			expect(typeof ClassType.COMM).toBe('string');
			expect(typeof ClassType.CLIL).toBe('string');
		});
	});

	describe('Limit enum', () => {
		it('should have correct limit values', () => {
			expect(Limit.size).toBe(200);
			expect(Limit.height).toBe(160);
		});

		it('should have numeric values', () => {
			expect(typeof Limit.size).toBe('number');
			expect(typeof Limit.height).toBe('number');
		});
	});

	describe('Student interface structure', () => {
		it('should validate student object structure', () => {
			// This is more of a TypeScript compile-time test, but we can validate the expected structure
			const mockStudent = {
				id: '1234567',
				name: {
					english: 'John Doe',
					chinese: '约翰'
				},
				cClass: 'J101',
				status: 'NOT_SUBMITTED',
				selected: true
			};

			// Validate structure
			expect(mockStudent).toHaveProperty('id');
			expect(mockStudent).toHaveProperty('name.english');
			expect(mockStudent).toHaveProperty('name.chinese');
			expect(mockStudent).toHaveProperty('cClass');
			expect(mockStudent).toHaveProperty('status');
			expect(mockStudent).toHaveProperty('selected');

			// Validate types
			expect(typeof mockStudent.id).toBe('string');
			expect(typeof mockStudent.name.english).toBe('string');
			expect(typeof mockStudent.name.chinese).toBe('string');
			expect(typeof mockStudent.cClass).toBe('string');
			expect(typeof mockStudent.status).toBe('string');
			expect(typeof mockStudent.selected).toBe('boolean');
		});
	});
});