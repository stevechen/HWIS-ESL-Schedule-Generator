/**
 * Date validation utilities for the HWIS Class Scheduler
 */

/**
 * Validates if a string is a valid month/day format (M/D or MM/DD)
 * Supports various month lengths (28-31 days)
 *
 * @param dateStr - Date string in M/D or MM/DD format
 * @returns true if valid, false otherwise
 */
export function isValidMonthAndDay(dateStr: string | null): boolean {
	const REGEX =
		/^((0?[13578]|1[02])\/(0?[1-9]|[12][0-9]|3[01])|(0?[469]|11)\/(0?[1-9]|[12][0-9]|30)|(0?2)\/(0?[1-9]|1[0-9]|2[0-9]))$/;
	return dateStr === null ? false : REGEX.test(dateStr);
}

/**
 * Compares two date strings in M/D or MM/DD format.
 * Handles year wrap-around: if one date is in November/December and the other in January,
 * the January date is considered to be in the next year.
 *
 * @returns negative if d1 < d2, positive if d1 > d2, 0 if equal
 */
export function compareDates(d1: string, d2: string): number {
	const [m1, day1] = d1.split('/').map(Number);
	const [m2, day2] = d2.split('/').map(Number);

	// Special case: November/December vs January wrap-around
	if ((m1 === 11 || m1 === 12) && m2 === 1) return -1; // d1 (Nov/Dec) is earlier than d2 (Jan next year)
	if (m1 === 1 && (m2 === 11 || m2 === 12)) return 1; // d1 (Jan next year) is later than d2 (Nov/Dec)

	if (m1 !== m2) return m1 - m2;
	return day1 - day2;
}
