// Core interfaces for communication feature
export interface Student {
	id: string;
	name: {
		english: string;
		chinese: string;
	};
	cClass: string;
	status: string;
	selected: boolean;
}

// Assignment and status enums
export enum AssignmentCode {
	workbook = 'workbook',
	passport = 'passport',
	recording = 'recording',
	exam = 'exam',
	speech = 'speech'
}

export enum Level {
	PreElementary = 'Pre-Elementary',
	Elementary = 'Elementary',
	Basic = 'Basic',
	Intermediate = 'Intermediate',
	Advanced = 'Advanced'
}

// Status type constants
export const StatusTypeCode = {
	NOT_SUBMITTED: '0',
	NOT_COMPLETED: '1'
} as const;

// Class type constants
export const ClassType = {
	COMM: 'Comm',
	CLIL: 'CLIL'
} as const;

// File upload limits
export enum Limit {
	size = 1024,
	height = 160
}

// Assignment type with grade and class filters
export interface AssignmentType {
	code: AssignmentCode;
	english: string;
	chinese: string;
	isG9?: boolean;
	isCLIL?: boolean;
}
