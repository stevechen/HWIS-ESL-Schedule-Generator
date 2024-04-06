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

/** @param {string} dateStr */
	export function isValidDate(dateStr) {
		const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
		return regex.test(dateStr);
	}