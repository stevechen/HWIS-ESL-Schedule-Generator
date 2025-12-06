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
