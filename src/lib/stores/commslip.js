import { writable } from 'svelte/store';

export const assignment = writable({
  /**  @type {string} */
	esl: '',
	type: {code: '', english: '', chinese: ''},
  /**  @type {string | null} */
	assigned: '',
  /**  @type {string | null} */
	due: '',
  /**  @type {string | null} */
	late: ''
});

/** @param {string | null} dateStr */
	export function isValidDate(dateStr) {
		// allow 2/29
    const regex = /^((0?[13578]|1[02])\/(0?[1-9]|[12][0-9]|3[01])|(0?[469]|11)\/(0?[1-9]|[12][0-9]|30)|(0?2)\/(0?[1-9]|1[0-9]|2[0-9]))$/;
		return regex.test(dateStr);
	}