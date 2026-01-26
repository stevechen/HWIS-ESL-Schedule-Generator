export function getSchoolYearAndSemesterPrefix(currentDate: Date = new Date()): string {
	const currentMonth = currentDate.getMonth(); // 0-indexed (0-11)
	const currentYear = currentDate.getFullYear();

	// Semester 1: August (7) to January (0)
	// Semester 2: February (1) to July (6)

	if (currentMonth >= 0 && currentMonth <= 6) {
		// January to July -> Semester 2 of (Previous Year - Current Year)
		return `${currentYear - 1}-${currentYear}-2`;
	} else {
		// August to January -> Semester 1
		if (currentMonth === 0) {
			// January is the end of Semester 1 that started the previous year
			return `${currentYear - 1}-${currentYear}-1`;
		} else {
			// August to December is the start of Semester 1 for the upcoming year
			return `${currentYear}-${currentYear + 1}-1`;
		}
	}
}
