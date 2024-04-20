// #region Functions
export function isValidMonthAndDay(dateStr: string | null) { 
	const REGEX = /^((0?[13578]|1[02])\/(0?[1-9]|[12][0-9]|3[01])|(0?[469]|11)\/(0?[1-9]|[12][0-9]|30)|(0?2)\/(0?[1-9]|1[0-9]|2[0-9]))$/;
	return dateStr === null ? false : REGEX.test(dateStr);
} 