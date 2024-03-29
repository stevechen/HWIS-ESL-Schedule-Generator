import { writable } from 'svelte/store';

export const assignment = writable({
  /**  @type {string} */
	esl: '',
	type: {english: '', chinese: ''},
  /**  @type {string | null} */
	assigned: '',
  /**  @type {string | null} */
	due: '',
  /**  @type {string | null} */
	late: ''
});