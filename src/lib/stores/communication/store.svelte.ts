import { browser } from '$app/environment';
import type { Student, DisplayStudent } from '$lib/stores/communication/types';
import { AssignmentCode, Levels } from '$lib/stores/communication/types';
import { ESL_TYPE, LEVELS, ASSIGNMENT_TYPE, STATUSES } from '$lib/stores/communication/constants';
import { parseStudentsFromText, determineGradeFromText } from '$lib/communication/studentParser';
import type { CommunicationRecord } from '$lib/communication/recordManager.svelte';

const G9_ASSIGNMENT_TYPES = ASSIGNMENT_TYPE.filter((type) => type.g9);
const CLIL_ASSIGNMENT_TYPES = ASSIGNMENT_TYPE.filter((type) => type.clil);
const COMM_ASSIGNMENT_TYPES = ASSIGNMENT_TYPE.filter((type) => type.comm);

/**
 * Communication Store - Manages state for the communication slip feature
 * Handles student data, assignment details, dates, and signature image
 */
export class CommunicationStore {
	// Loading flag
	_isLoadingRecord = $state(false);

	// Student data
	studentsText: string = $state('');
	studentsParsed: Student[] = $state([]);
	hideTextarea: boolean = $derived(this.studentsParsed.length > 0);

	// Class information
	grade = $derived(determineGradeFromText(this.studentsText));
	level = $state(LEVELS[2].value); // Default to Basic
	classType: string = $state(ESL_TYPE.COMM);
	classNum: string = $state('');
	className = $derived([this.grade, this.level, this.classNum, this.classType].join(' '));

	// Assignment information
	assignmentRaw = $state({
		esl: '',
		type: '',
		assigned: '',
		due: '',
		late: ''
	});
	assignment: AssignmentCode = $state(AssignmentCode.passport);

	// Date fields
	dates: { [key: string]: string } = $state({
		assigned: '',
		due: '',
		late: ''
	});

	// Signature
	signatureImage: string = $state('');
	private _previousSignatureImage: string | null = $state(null);

	// DERIVED STATE ----------------

	students: DisplayStudent[] = $derived(
		this.studentsParsed
			.filter((student) => student.selected) // filter out unselected
			.map(({ status, ...rest }) => {
				// Lookup the status in STATUS_TYPE to find the corresponding {english, chinese} object to pass to Slip
				const studentStatus = STATUSES[status as keyof typeof STATUSES];
				return {
					...rest,
					status: studentStatus
						? { english: studentStatus.text.english, chinese: studentStatus.text.chinese }
						: { english: 'Unknown', chinese: '未知' }
				};
			})
	);

	assignmentTypes = $derived(
		this.grade === 'G9'
			? G9_ASSIGNMENT_TYPES
			: this.classType === ESL_TYPE.CLIL
				? CLIL_ASSIGNMENT_TYPES
				: COMM_ASSIGNMENT_TYPES
	);

	assignmentDetails = $derived(
		(() => {
			const assignmentTypeText = this.assignmentTypes.find((type) => type.code === this.assignment);
			return {
				...this.assignmentRaw,
				assigned: this.dates.assigned,
				due: this.dates.due,
				late: this.dates.late,
				type: {
					english: assignmentTypeText ? assignmentTypeText.english : 'Unknown',
					chinese: assignmentTypeText ? assignmentTypeText.chinese : '未知'
				}
			};
		})()
	);

	constructor() {
		this.initializeDates();

		$effect(() => {
			if (this._isLoadingRecord) return;
			this.studentsParsed = parseStudentsFromText(this.studentsText);
		});

		$effect(() => {
			if (this.classType === ESL_TYPE.CLIL) this.assignment = AssignmentCode.workbook;
			this.assignmentRaw.esl = this.className;
		});

		// Load signature from localStorage on mount
		$effect(() => {
			if (browser) {
				const savedSignature = localStorage.getItem('signatureImage');
				if (savedSignature) {
					this.signatureImage = savedSignature;
				}
			}
		});

		// Handle signature image changes: save to localStorage and revoke old blob URLs
		$effect(() => {
			if (browser) {
				if (this._previousSignatureImage && this._previousSignatureImage.startsWith('blob:')) {
					URL.revokeObjectURL(this._previousSignatureImage);
				}

				if (this.signatureImage) {
					localStorage.setItem('signatureImage', this.signatureImage);
					this._previousSignatureImage = this.signatureImage;
				} else {
					localStorage.removeItem('signatureImage');
					this._previousSignatureImage = null; // Clear previous if signatureImage is empty
				}
			}
		});
	}

	/**
	 * Initialize default dates - due date is today, late date is 7 days later
	 */
	private initializeDates() {
		const today = new Date();
		const dueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const lateDate = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;

		this.dates.due = dueDate;
		this.dates.late = lateDate;
	}

	loadRecordData = (record: CommunicationRecord) => {
		this._isLoadingRecord = true;
		this.studentsText = record.studentsText;
		this.level = record.level as Levels;
		this.classType = record.classType;
		this.classNum = record.classNum;
		this.assignment = record.assignment as AssignmentCode;
		this.dates = record.dates;
		this.studentsParsed = JSON.parse(JSON.stringify(record.studentsParsed));
	};

	/**
	 * Reset all store values to defaults
	 */
	reset = () => {
		this._isLoadingRecord = false;
		this.studentsText = '';
		this.studentsParsed = [];
		this.level = LEVELS[2].value;
		this.classType = ESL_TYPE.COMM;
		this.classNum = '';
		this.assignment = AssignmentCode.passport;
		this.assignmentRaw = {
			esl: '',
			type: '',
			assigned: '',
			due: '',
			late: ''
		};
		this.dates = {
			assigned: '',
			due: '',
			late: ''
		};
		this.initializeDates();
	};
}
