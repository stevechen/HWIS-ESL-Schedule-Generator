import { StatusTypeCode, type Student } from '$lib/stores/communication';

/**
 * Parses tab-separated student data from spreadsheet paste
 * Expected fields (order agnostic): ID, Chinese Name, English Name, Chinese Class
 */
export function parseStudentsFromText(data: string): Student[] {
	const ID_REGEX = /^\d{7}$/;
	const CLASS_REGEX = /^[JH]\d{3}$/;
	const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
	const ENGLISH_REGEX = /^[a-zA-Z]{2,}(\s[a-zA-Z]+){1,5}$/; // allow 5 groups of two or more alphabetical characters

	const lines = data
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');

	if (lines.length === 0) return [];

	return lines
		.map((row) => {
			const student: Student = {
				id: '',
				name: { english: '', chinese: '' },
				cClass: '',
				status: StatusTypeCode.NOT_SUBMITTED,
				selected: true
			};

			const fields = row.split('\t');

			for (const field of fields) {
				if (ID_REGEX.test(field)) {
					student.id = field;
				} else if (CLASS_REGEX.test(field)) {
					student.cClass = field;
				} else if (CHINESE_REGEX.test(field)) {
					student.name.chinese = field;
				} else if (ENGLISH_REGEX.test(field)) {
					student.name.english = field;
				}
			}
			return student;
		})
		.sort((a, b) => a.name.english.localeCompare(b.name.english));
}

/**
 * Determines grade from pasted text using Chinese class number
 * Matches J1xx to J3xx patterns and converts to G7-G9
 */
export function determineGradeFromText(pastedText: string): string | null {
	const gradeMatch = pastedText.match(/J1\d{2}|J2\d{2}|J3\d{2}/);
	if (gradeMatch) {
		// only matches the first record since the rest should be in the same grade
		const matchCode = Number(gradeMatch[0].charAt(1));
		// should be J1xx to J3xx
		if (matchCode >= 1 && matchCode <= 3) {
			return `G${matchCode + 6}`;
		}
	}
	return null; // out of range
}