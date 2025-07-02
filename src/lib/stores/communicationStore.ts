import { isValidMonthAndDay } from '$lib/utils.ts.svelte';

// Define and export interfaces, enums, and constants
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

export enum AssignmentCode {
	workbook = 'workbook',
	passport = 'passport',
	recording = 'recording',
	exam = 'exam',
	speech = 'speech'
}

export const StatusTypeCode = {
	NOT_SUBMITTED: '0',
	NOT_COMPLETED: '1'
} as const;

export const STATUS_TYPE = [
	{
		code: StatusTypeCode.NOT_SUBMITTED,
		text: { english: "hasn't been submitted", chinese: '未繳交' }
	},
	{
		code: StatusTypeCode.NOT_COMPLETED,
		text: { english: "wasn't completed", chinese: '完成度不佳' }
	}
];

export const COMM_ASSIGNMENT_TYPES = [
	{ code: AssignmentCode.passport, english: 'Passport', chinese: '英文護照', isG9: true },
	{ code: AssignmentCode.recording, english: 'Recording', chinese: '錄影/錄音', isG9: true },
	{ code: AssignmentCode.workbook, english: 'Workbook', chinese: '作業本', isCLIL: true },
	{ code: AssignmentCode.exam, english: 'Oral Exam', chinese: '期中/末考口試', isG9: true },
	{ code: AssignmentCode.speech, english: 'Speech Practice', chinese: '演講練習', isCLIL: true }
];

export enum Level {
	PreElementary = 'Pre-Elementary',
	Elementary = 'Elementary',
	Basic = 'Basic',
	Intermediate = 'Intermediate',
	Advanced = 'Advanced'
}

export const LEVEL_TYPE = [
	{ id: 'pre-ele', label: 'Pre-Ele', value: Level.PreElementary },
	{ id: 'ele', label: 'Ele', value: Level.Elementary },
	{ id: 'bas', label: 'Basic', value: Level.Basic },
	{ id: 'int', label: 'Int', value: Level.Intermediate },
	{ id: 'adv', label: 'Adv', value: Level.Advanced }
];

export const ClassType = {
	COMM: 'Comm',
	CLIL: 'CLIL'
};

export const DATE_FIELDS = [
	{ label: 'Assigned:', key: 'assigned' },
	{ label: 'Due:', key: 'due' },
	{ label: 'Late:', key: 'late' }
];

export enum Limit {
	size = 200,
	height = 160
}

export class CommunicationStore {
	// We will move state and logic here in the next steps.
	constructor() {
		// Initialization logic will go here.
	}
}
