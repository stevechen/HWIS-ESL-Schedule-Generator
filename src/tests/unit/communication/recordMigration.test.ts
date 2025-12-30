import { describe, it, expect } from 'vitest';
import { migrateRecord } from '$lib/communication/recordManager.svelte';
import { Levels, AssignmentCode } from '$lib/stores/communication';

describe('Record Migration', () => {
    it('should migrate a legacy record to the new format', () => {
        // Legacy record structure (based on commit 9180221)
        const legacyRecord = {
            studentsText: '1. John\n2. Doe',
            grade: 'G9',
            level: 'Basic', // Was string in old version, enum in new? Need to check values
            classType: 'Comm',
            classNum: '101',
            assignment: 'passport',
            dates: {
                due: '10/20',
                late: '10/27'
            },
            studentsRaw: [
                {
                    id: '1',
                    name: { english: 'John', chinese: '' },
                    status: '0',
                    selected: true
                },
                {
                    id: '2',
                    name: { english: 'Doe', chinese: '' },
                    status: '1',
                    selected: false
                }
            ]
        };

        const migrated = migrateRecord(legacyRecord);

        // Check structure
        expect(migrated).toHaveProperty('studentsParsed');
        expect(migrated).not.toHaveProperty('studentsRaw');
        expect(migrated).not.toHaveProperty('studentsText');

        // Check students
        expect(migrated.studentsParsed).toHaveLength(2);
        expect(migrated.studentsParsed[0].name.english).toBe('John');
        expect(migrated.studentsParsed[0].selected).toBe(true);

        // Check dates
        expect(migrated.dates).toHaveProperty('assigned');
        expect(migrated.dates.due).toBe('10/20');
        expect(migrated.dates.late).toBe('10/27');

        // Check other fields
        expect(migrated.grade).toBe('G9');
        expect(migrated.classNum).toBe('101');
    });

    it('should return the record as is if it is already in the new format', () => {
        const newRecord = {
            grade: 'G8',
            level: Levels.Advanced,
            classType: 'Comm',
            classNum: '202',
            assignment: AssignmentCode.workbook,
            dates: { assigned: '10/1', due: '10/2', late: '10/9' },
            studentsParsed: [
                {
                    id: '3',
                    name: { english: 'Jane', chinese: '简' },
                    cClass: '',
                    status: '0',
                    selected: true
                }
            ]
        };

        // @ts-ignore - passing a valid record that matches the return type partially to test identity
        const result = migrateRecord(newRecord);
        expect(result).toEqual(newRecord);
    });

    it('should handle missing dates in legacy record', () => {
        const legacyRecord = {
            grade: 'G7',
            level: 'Basic', 
            classType: 'Comm',
            classNum: '303',
            assignment: 'workbook',
            dates: {}, // Empty dates
            studentsRaw: []
        };

        const migrated = migrateRecord(legacyRecord);

        expect(migrated.dates.assigned).toBe('');
        expect(migrated.dates.due).toBe('');
        expect(migrated.dates.late).toBe('');
    });
    it('should handle real legacy data with UI_ prefixes', () => {
        const legacyRecord = {
            studentsText: "...",
            UI_Grade: "G8",
            UI_Level: "Basic",
            UI_ClassType: "Comm",
            UI_ClassNum: 5,
            UI_Assignment: "passport",
            UI_Dates: {
                assigned: "9/5",
                due: "9/12",
                late: "9/19"
            },
            studentsRaw: [
               {
                   id: "1130315",
                   name: { english: "Alan Fan", chinese: "范育齊" },
                   cClass: "J205",
                   status: "0",
                   selected: false
               }
            ]
        };

        const migrated = migrateRecord(legacyRecord);

        expect(migrated.grade).toBe('G8');
        expect(migrated.level).toBe('Basic');
        expect(migrated.classType).toBe('Comm');
        expect(migrated.classNum).toBe('5');
        expect(migrated.assignment).toBe('passport');
        expect(migrated.dates.assigned).toBe('9/5');
        expect(migrated.dates.due).toBe('9/12');
        expect(migrated.dates.late).toBe('9/19');
        expect(migrated.studentsParsed).toHaveLength(1);
    });
});
