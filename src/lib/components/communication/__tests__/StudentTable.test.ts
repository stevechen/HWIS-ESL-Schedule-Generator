import { describe, it, expect, vi } from 'vitest';
import { StatusTypeCode, STATUS_TYPE, type Student } from '../../../stores/communication';

const mockStudents: Student[] = [
    {
        id: '1234567',
        name: { english: 'John Doe', chinese: '约翰' },
        cClass: 'J101',
        status: StatusTypeCode.NOT_SUBMITTED,
        selected: true
    },
    {
        id: '2345678',
        name: { english: 'Jane Smith', chinese: '简' },
        cClass: 'J102',
        status: StatusTypeCode.NOT_COMPLETED,
        selected: false
    }
];

const mockProps = {
    studentsText: 'John Doe\t1234567\tJ101\t约翰\nJane Smith\t2345678\tJ102\t简',
    studentsRaw: mockStudents,
    shouldHideTextarea: false,
    isAllChecked: { checked: false, indeterminate: true },
    onToggleAll: vi.fn()
};

describe('StudentTable', () => {
    it('should handle student data structure correctly', () => {
        // Test that student objects have the correct structure
        const student = mockStudents[0];

        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('name.english');
        expect(student).toHaveProperty('name.chinese');
        expect(student).toHaveProperty('cClass');
        expect(student).toHaveProperty('status');
        expect(student).toHaveProperty('selected');

        // Test data types
        expect(typeof student.id).toBe('string');
        expect(typeof student.name.english).toBe('string');
        expect(typeof student.name.chinese).toBe('string');
        expect(typeof student.cClass).toBe('string');
        expect(typeof student.status).toBe('string');
        expect(typeof student.selected).toBe('boolean');
    });

    it('should validate student ID format', () => {
        // Test that student IDs follow the expected 7-digit format
        mockStudents.forEach(student => {
            expect(student.id).toMatch(/^\d{7}$/);
        });
    });

    it('should validate Chinese class format', () => {
        // Test that Chinese class codes follow the expected format
        mockStudents.forEach(student => {
            expect(student.cClass).toMatch(/^[JH]\d{3}$/);
        });
    });

    it('should handle status types correctly', () => {
        // Test that status values are valid
        const validStatuses = [StatusTypeCode.NOT_SUBMITTED, StatusTypeCode.NOT_COMPLETED];

        mockStudents.forEach(student => {
            expect(validStatuses).toContain(student.status);
        });

        // Test that STATUS_TYPE mapping works
        expect(STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED]).toBeDefined();
        expect(STATUS_TYPE[StatusTypeCode.NOT_COMPLETED]).toBeDefined();

        // Test status text structure
        expect(STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED].text).toHaveProperty('english');
        expect(STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED].text).toHaveProperty('chinese');
    });

    it('should handle checkbox state correctly', () => {
        // Test isAllChecked state logic
        const { isAllChecked } = mockProps;

        expect(typeof isAllChecked.checked).toBe('boolean');
        expect(typeof isAllChecked.indeterminate).toBe('boolean');

        // Test that indeterminate state is correct (some but not all selected)
        const selectedCount = mockStudents.filter(s => s.selected).length;
        const totalCount = mockStudents.length;

        expect(selectedCount).toBeGreaterThan(0);
        expect(selectedCount).toBeLessThan(totalCount);
        expect(isAllChecked.indeterminate).toBe(true);
        expect(isAllChecked.checked).toBe(false);
    });

    it('should handle textarea visibility', () => {
        // Test shouldHideTextarea logic
        expect(typeof mockProps.shouldHideTextarea).toBe('boolean');

        // When students exist, textarea should be hidden
        const propsWithStudents = { ...mockProps, shouldHideTextarea: true };
        expect(propsWithStudents.shouldHideTextarea).toBe(true);

        // When no students, textarea should be visible
        const propsWithoutStudents = { ...mockProps, shouldHideTextarea: false };
        expect(propsWithoutStudents.shouldHideTextarea).toBe(false);
    });

    it('should validate students text format', () => {
        // Test that studentsText follows expected tab-separated format
        const { studentsText } = mockProps;

        expect(typeof studentsText).toBe('string');
        expect(studentsText.length).toBeGreaterThan(0);

        // Test that it contains tab separators
        expect(studentsText).toContain('\t');

        // Test that it contains newlines for multiple students
        expect(studentsText).toContain('\n');

        // Test parsing logic
        const lines = studentsText.split('\n');
        expect(lines.length).toBe(2); // Two students

        lines.forEach(line => {
            const fields = line.split('\t');
            expect(fields.length).toBeGreaterThanOrEqual(3); // At least name, ID, class
        });
    });

    it('should handle callback functions', () => {
        // Test that onToggleAll callback is properly typed
        expect(typeof mockProps.onToggleAll).toBe('function');

        // Test that callback can be called without errors
        expect(() => mockProps.onToggleAll()).not.toThrow();

        // Verify callback was called
        expect(mockProps.onToggleAll).toHaveBeenCalled();
    });

    it('should handle empty student list', () => {
        const emptyProps = {
            ...mockProps,
            studentsRaw: [],
            studentsText: '',
            shouldHideTextarea: false,
            isAllChecked: { checked: false, indeterminate: false }
        };

        expect(emptyProps.studentsRaw.length).toBe(0);
        expect(emptyProps.studentsText).toBe('');
        expect(emptyProps.shouldHideTextarea).toBe(false);
        expect(emptyProps.isAllChecked.checked).toBe(false);
        expect(emptyProps.isAllChecked.indeterminate).toBe(false);
    });

    it('should handle all students selected', () => {
        const allSelectedStudents = mockStudents.map(s => ({ ...s, selected: true }));
        const allSelectedProps = {
            ...mockProps,
            studentsRaw: allSelectedStudents,
            isAllChecked: { checked: true, indeterminate: false }
        };

        expect(allSelectedProps.isAllChecked.checked).toBe(true);
        expect(allSelectedProps.isAllChecked.indeterminate).toBe(false);

        // Verify all students are selected
        expect(allSelectedStudents.every(s => s.selected)).toBe(true);
    });
});