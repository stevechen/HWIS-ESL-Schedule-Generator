import { describe, it, expect } from 'vitest';
import { 
	validatePrintReadiness, 
	getPrintButtonStyle, 
	getPrintStatusMessage, 
	getPrintButtonText,
	type PrintValidationInput 
} from '../printValidator';

const mockValidInput: PrintValidationInput = {
	classNum: '1',
	studentsParsed: [
		{ id: '1234567', name: { english: 'John Doe', chinese: '约翰' }, cClass: 'J101', status: 'NOT_SUBMITTED', selected: true }
	],
	isAllChecked: { checked: true, indeterminate: false },
	assignmentDates: {
		assigned: '1/15',
		due: '1/22',
		late: '1/29'
	},
	grade: 'G7',
	signatureImage: 'data:image/png;base64,test'
};

describe('printValidator', () => {
	describe('validatePrintReadiness', () => {
		it('should return valid state for complete input', () => {
			const result = validatePrintReadiness(mockValidInput);
			
			expect(result.isInvalid).toBe(false);
			expect(result.hasCaution).toBe(false);
			expect(result.message).toBe('Ready to print');
		});

		it('should return invalid for missing class number', () => {
			const input = { ...mockValidInput, classNum: '' };
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(true);
			expect(result.message).toBe('Class number is required');
		});

		it('should return invalid for no students', () => {
			const input = { ...mockValidInput, studentsParsed: [] };
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(true);
			expect(result.message).toBe('No students added');
		});

		it('should return invalid for no students selected', () => {
			const input = { 
				...mockValidInput, 
				isAllChecked: { checked: false, indeterminate: false }
			};
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(true);
			expect(result.message).toBe('No students selected');
		});

		it('should return invalid for invalid dates', () => {
			const input = { 
				...mockValidInput, 
				assignmentDates: { ...mockValidInput.assignmentDates, due: 'invalid' }
			};
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(true);
			expect(result.message).toBe('Invalid due date');
		});

		it('should return invalid for missing grade', () => {
			const input = { ...mockValidInput, grade: null };
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(true);
			expect(result.message).toBe('Grade could not be determined');
		});

		it('should return caution for missing signature', () => {
			const input = { ...mockValidInput, signatureImage: '' };
			const result = validatePrintReadiness(input);
			
			expect(result.isInvalid).toBe(false);
			expect(result.hasCaution).toBe(true);
			expect(result.message).toBe('Missing signature');
		});
	});

	describe('getPrintButtonStyle', () => {
		it('should return red style for invalid state', () => {
			const validation = { isInvalid: true, hasCaution: false, message: 'Error' };
			const style = getPrintButtonStyle(validation);
			
			expect(style.className).toContain('print-slips');
			expect(style.className).toContain('bg-red-500');
			expect(style.title).toContain('Cannot print');
		});

		it('should return orange style for caution state', () => {
			const validation = { isInvalid: false, hasCaution: true, message: 'Warning' };
			const style = getPrintButtonStyle(validation);
			
			expect(style.className).toContain('print-slips');
			expect(style.className).toContain('bg-orange-500');
			expect(style.title).toContain('Warning');
		});

		it('should return blue style for valid state', () => {
			const validation = { isInvalid: false, hasCaution: false, message: 'Ready' };
			const style = getPrintButtonStyle(validation);
			
			expect(style.className).toContain('print-slips');
			expect(style.className).toContain('bg-blue-500');
			expect(style.title).toBe('');
		});
	});

	describe('getPrintStatusMessage', () => {
		it('should return "Missing Info!" for invalid or caution states', () => {
			const invalidValidation = { isInvalid: true, hasCaution: false, message: 'Error' };
			const cautionValidation = { isInvalid: false, hasCaution: true, message: 'Warning' };
			
			expect(getPrintStatusMessage(invalidValidation, 5)).toBe('Missing Info!');
			expect(getPrintStatusMessage(cautionValidation, 5)).toBe('Missing Info!');
		});

		it('should return paper size info for valid state', () => {
			const validation = { isInvalid: false, hasCaution: false, message: 'Ready' };
			
			expect(getPrintStatusMessage(validation, 5)).toBe('Single Sided  B5/JIS-B5');
		});
	});

	describe('getPrintButtonText', () => {
		it('should return singular text for one student', () => {
			expect(getPrintButtonText(1)).toBe('Print 1 Slip');
		});

		it('should return plural text for multiple students', () => {
			expect(getPrintButtonText(5)).toBe('Print 5 Slips');
		});
	});
});