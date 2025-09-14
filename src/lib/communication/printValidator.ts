import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
import type { Student } from '$lib/stores/communication';

export interface PrintValidationState {
	isInvalid: boolean;
	hasCaution: boolean;
	message: string;
}

export interface PrintValidationInput {
	classNum: string;
	studentsRaw: Student[];
	isAllChecked: { checked: boolean; indeterminate: boolean };
	assignmentDates: {
		assigned: string;
		due: string;
		late: string;
	};
	grade: string | null;
	signatureImage: string;
}

/**
 * Validates if the form is ready for printing
 * Returns validation state with error/caution messages
 */
export function validatePrintReadiness(input: PrintValidationInput): PrintValidationState {
	const {
		classNum,
		studentsRaw,
		isAllChecked,
		assignmentDates,
		grade,
		signatureImage
	} = input;

	// Check for invalid conditions (blocking errors)
	const invalidConditions = [
		{ condition: !classNum, message: 'Class number is required' },
		{ condition: !studentsRaw.length, message: 'No students added' },
		{ condition: !isAllChecked.indeterminate && !isAllChecked.checked, message: 'No students selected' },
		{ condition: !isValidMonthAndDay(assignmentDates.assigned), message: 'Invalid assigned date' },
		{ condition: !isValidMonthAndDay(assignmentDates.due), message: 'Invalid due date' },
		{ condition: !isValidMonthAndDay(assignmentDates.late), message: 'Invalid late date' },
		{ condition: !grade, message: 'Grade could not be determined' }
	];

	const failedCondition = invalidConditions.find(({ condition }) => condition);
	
	if (failedCondition) {
		return {
			isInvalid: true,
			hasCaution: false,
			message: failedCondition.message
		};
	}

	// Check for caution conditions (warnings but not blocking)
	const hasCaution = !signatureImage;

	return {
		isInvalid: false,
		hasCaution,
		message: hasCaution ? 'Missing signature' : 'Ready to print'
	};
}

/**
 * Gets the appropriate print button styling based on validation state
 */
export function getPrintButtonStyle(validation: PrintValidationState): {
	className: string;
	title: string;
} {
	const baseClasses = 'print-slips my-2 px-4 py-1 rounded-lg text-white shadow-sm';
	
	if (validation.isInvalid) {
		return {
			className: `${baseClasses} animate-none! cursor-default bg-red-500 shadow-red-800`,
			title: `Cannot print: ${validation.message}`
		};
	}

	if (validation.hasCaution) {
		return {
			className: `${baseClasses} bg-orange-500 shadow-orange-800 hover:bg-orange-600`,
			title: `Warning: ${validation.message}`
		};
	}

	return {
		className: `${baseClasses} animate-pulse bg-blue-500 shadow-blue-800 hover:animate-none`,
		title: ''
	};
}

/**
 * Gets the print status message for display
 */
export function getPrintStatusMessage(validation: PrintValidationState, studentCount: number): string {
	if (validation.isInvalid || validation.hasCaution) {
		return 'Missing Info!';
	}
	
	return `Single Sided  B5/JIS-B5`;
}

/**
 * Gets the print button text
 */
export function getPrintButtonText(studentCount: number): string {
	return `Print ${studentCount} Slip${studentCount === 1 ? '' : 's'}`;
}