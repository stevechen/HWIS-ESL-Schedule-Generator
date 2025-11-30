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

export type DisplayStudent = Omit<Student, 'status'> & {
	status: { english: string; chinese: string };
};

// Assignment and status enums
export enum AssignmentCode {
	workbook = 'workbook',
	passport = 'passport',
	recording = 'recording',
	exam = 'exam',
	speech = 'speech',
	worksheet = 'worksheet'
}

// Assignment type with grade and class filters
export interface AssignmentType {
	code: AssignmentCode;
	english: string;
	chinese: string;
	comm?: boolean;
	g9?: boolean;
	clil?: boolean;
}

export enum Levels {
	PreElementary = 'Pre-Elementary',
	Elementary = 'Elementary',
	Basic = 'Basic',
	Intermediate = 'Intermediate',
	Advanced = 'Advanced'
}

// File upload limits
export enum Limit {
	height = 160
}
