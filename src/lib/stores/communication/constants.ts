import { StatusTypeCode, AssignmentCode, Level, type AssignmentType } from './types';

// Status type definitions with bilingual text
export const STATUS_TYPE = {
    [StatusTypeCode.NOT_SUBMITTED]: {
        code: StatusTypeCode.NOT_SUBMITTED,
        text: { english: "hasn't been submitted", chinese: '未繳交' }
    },
    [StatusTypeCode.NOT_COMPLETED]: {
        code: StatusTypeCode.NOT_COMPLETED,
        text: { english: "wasn't completed", chinese: '完成度不佳' }
    }
} as const;

// Assignment type definitions with grade and class type filters
export const COMM_ASSIGNMENT_TYPES: AssignmentType[] = [
    { code: AssignmentCode.passport, english: 'Passport', chinese: '英文護照', isG9: true },
    { code: AssignmentCode.recording, english: 'Recording', chinese: '錄影/錄音', isG9: true },
    { code: AssignmentCode.workbook, english: 'Workbook', chinese: '作業本', isCLIL: true },
    { code: AssignmentCode.exam, english: 'Oral Exam', chinese: '期中/末考口試', isG9: true },
    { code: AssignmentCode.speech, english: 'Speech Practice', chinese: '演講練習', isCLIL: true }
];

// Level type definitions for UI
export const LEVEL_TYPE = [
    { id: 'pre-ele', label: 'Pre-Ele', value: Level.PreElementary },
    { id: 'ele', label: 'Ele', value: Level.Elementary },
    { id: 'bas', label: 'Basic', value: Level.Basic },
    { id: 'int', label: 'Int', value: Level.Intermediate },
    { id: 'adv', label: 'Adv', value: Level.Advanced }
];

// Date field definitions for form rendering
export const DATE_FIELDS = [
    { label: 'Assigned:', key: 'assigned' },
    { label: 'Due:', key: 'due' },
    { label: 'Make up:', key: 'late' }
];