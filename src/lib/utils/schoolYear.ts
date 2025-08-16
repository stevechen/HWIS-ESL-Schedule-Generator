export function getSchoolYearAndSemesterPrefix(currentDate: Date = new Date()): string {
	const CUT_OFF_MONTH = 6; // Month of June
	const currentMonth = currentDate.getMonth(); // 0-indexed (0-11)

	const currentYear = currentDate.getFullYear();

	// If the current month is before May, it is considered the second semester of the previous school year
	if (currentMonth < CUT_OFF_MONTH - 1) {
		return `${currentYear - 1}-${currentYear}-2`;
	} else {
		return `${currentYear}-${currentYear + 1}-1`;
	}
}
