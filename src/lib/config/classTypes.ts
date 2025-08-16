export const ClassTypeCode = {
	Comm: 'Comm',
	CLIL: 'CLIL',
	G9: 'G9',
	H: 'H'
} as const;

export type ClassType = (typeof ClassTypeCode)[keyof typeof ClassTypeCode];

export const classControl: { code: ClassType; key: string; label: string }[] = [
	{ code: ClassTypeCode.CLIL, key: 'CLIL', label: 'G7/8 CLIL' },
	{ code: ClassTypeCode.Comm, key: 'Comm', label: 'G7/8 Comm' },
	{ code: ClassTypeCode.G9, key: 'G9', label: 'G9' },
	{ code: ClassTypeCode.H, key: 'H', label: 'H10' }
];

export function getGradeForClassType(classType: ClassType): string {
	const gradeMap: Record<ClassType, string> = {
		[ClassTypeCode.CLIL]: 'G7/8',
		[ClassTypeCode.Comm]: 'G7/8',
		[ClassTypeCode.G9]: 'G9',
		[ClassTypeCode.H]: 'H'
	};
	return gradeMap[classType];
}
