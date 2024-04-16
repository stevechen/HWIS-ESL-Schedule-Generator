import { writable } from "svelte/store";

export const STATUS_TYPE = [
  { code: 0, text: { english: "hasn't been submitted", chinese: '未繳交' } },
  { code: 1, text: { english: "wasn't completed", chinese: '完成度不佳' } }
];

export let assignment = writable({
	esl: '',
	type: {code: '', english: '', chinese: ''},
	assigned: '',
	due: '',
	late: ''
});

export function createAssignment() {
  let detail = $state({
    esl: '',
    type: {code: '', english: '', chinese: ''},
    assigned: '',
    due: '',
    late: '',
  });
  return detail;
}

export function isValidDate(dateStr: string | null) { 
	const REGEX = /^((0?[13578]|1[02])\/(0?[1-9]|[12][0-9]|3[01])|(0?[469]|11)\/(0?[1-9]|[12][0-9]|30)|(0?2)\/(0?[1-9]|1[0-9]|2[0-9]))$/;
	return dateStr === null ? false : REGEX.test(dateStr);
}

export interface Student {
  id: string;
  name: {
    english: string;
    chinese: string;
  };
  cClass: string;
  status: string;
  selected: boolean; 
}
export interface Assignment {
  esl: string;
  type: {
    code: string;
    english: string;
    chinese: string;
  };
  assigned: string | null;
  due: string | null;
  late: string | null;
}

