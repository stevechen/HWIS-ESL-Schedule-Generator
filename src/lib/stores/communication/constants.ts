import { AssignmentCode, Levels, type AssignmentType } from './types';

// Status type constants
export const STATUS_CODE = {
	NOT_SUBMITTED: '0',
	NOT_COMPLETED: '1'
} as const;

// Class type constants
export const ESL_TYPE = {
	COMM: 'Comm',
	CLIL: 'CLIL'
} as const;

// Status type definitions with bilingual text
export const STATUSES = {
	[STATUS_CODE.NOT_SUBMITTED]: {
		code: STATUS_CODE.NOT_SUBMITTED,
		text: { english: "hasn't been submitted", chinese: '未繳交' }
	},
	[STATUS_CODE.NOT_COMPLETED]: {
		code: STATUS_CODE.NOT_COMPLETED,
		text: { english: "wasn't completed", chinese: '完成度不佳' }
	}
} as const;

// Assignment type definitions with grade and class type filters
export const ASSIGNMENT_TYPE: AssignmentType[] = [
	{
		code: AssignmentCode.passport,
		english: 'Passport',
		chinese: '英文護照',
		g9: true,
		comm: true
	},
	{
		code: AssignmentCode.recording,
		english: 'Recording',
		chinese: '錄影/錄音',
		g9: true,
		comm: true
	},
	{
		code: AssignmentCode.workbook,
		english: 'Workbook',
		chinese: '作業本',
		g9: false,
		comm: true,
		clil: true
	},
	{
		code: AssignmentCode.exam,
		english: 'Oral Exam',
		chinese: '期中/末考口試',
		g9: true,
		comm: true,
		clil: false
	},
	{
		code: AssignmentCode.speech,
		english: 'Speech Practice',
		chinese: '演講練習',
		g9: false,
		comm: true,
		clil: true
	},
	{
		code: AssignmentCode.worksheet,
		english: 'Worksheet',
		chinese: '學習單',
		g9: false,
		comm: false,
		clil: true
	}
];

// Level type definitions for UI
export const LEVELS = [
	{ id: 'pre-ele', label: 'Pre-Ele', value: Levels.PreElementary },
	{ id: 'ele', label: 'Ele', value: Levels.Elementary },
	{ id: 'bas', label: 'Basic', value: Levels.Basic },
	{ id: 'int', label: 'Int', value: Levels.Intermediate },
	{ id: 'adv', label: 'Adv', value: Levels.Advanced }
];

// Date field definitions for form rendering
export const DATES = [
	{ label: 'Assigned:', key: 'assigned' },
	{ label: 'Due:', key: 'due' },
	{ label: 'Make up:', key: 'late' }
];
