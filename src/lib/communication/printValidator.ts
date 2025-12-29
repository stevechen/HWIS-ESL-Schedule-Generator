import { isValidMonthAndDay, compareDates } from '$lib/utils/dateValidation';
import type { Student } from '$lib/stores/communication';

export interface PrintValidationState {
	isInvalid: boolean;
	hasCaution: boolean;
	message: string;
	missingItems: string[];
}

export interface PrintValidationInput {
	classNum: string;
	studentsParsed: Student[];
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
		studentsParsed,
		isAllChecked,
		assignmentDates,
		grade,
		signatureImage
	} = input;

	const missingItems: string[] = [];

	// Blocking error: No students selected
	const noStudentsSelected = !isAllChecked.indeterminate && !isAllChecked.checked;
	if (noStudentsSelected) {
		return {
			isInvalid: true,
			hasCaution: false,
			message: studentsParsed.length === 0 ? 'No students added' : 'No students selected',
			missingItems: []
		};
	}

	// Cautions (warnings)
	if (!classNum) missingItems.push('Class number');
	if (!grade) missingItems.push('Grade level');
	
	const isAssignedValid = isValidMonthAndDay(assignmentDates.assigned);
	const isDueValid = isValidMonthAndDay(assignmentDates.due);
	const isLateValid = isValidMonthAndDay(assignmentDates.late);

	if (!isAssignedValid) missingItems.push('Assigned date');
	if (!isDueValid) missingItems.push('Due date');
	if (!isLateValid) missingItems.push('Late date');
	
	if (!signatureImage) missingItems.push('Signature');

	// Date comparison checks
	if (isAssignedValid && isDueValid && compareDates(assignmentDates.assigned, assignmentDates.due) >= 0) {
		missingItems.push('Assigned date must be before Due date');
	}
	if (isDueValid && isLateValid && compareDates(assignmentDates.late, assignmentDates.due) <= 0) {
		missingItems.push('Make up date must be after Due date');
	}

	// Check for incomplete student information for selected students
	const selectedStudents = studentsParsed.filter((s) => s.selected);
	const hasIncompleteStudent = selectedStudents.some(
		(s) => !s.id || !s.name.english || !s.name.chinese || !s.cClass
	);
	if (hasIncompleteStudent) missingItems.push('Student information (ID, name, or class)');

	const hasCaution = missingItems.length > 0;

	return {
		isInvalid: false,
		hasCaution,
		message: hasCaution ? 'Missing Info!' : 'Ready to print',
		missingItems
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