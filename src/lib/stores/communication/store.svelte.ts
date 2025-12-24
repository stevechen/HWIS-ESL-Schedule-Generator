import { untrack, tick } from 'svelte';
import { browser } from '$app/environment';
import type { Student, DisplayStudent } from '$lib/stores/communication/types';
import { AssignmentCode, Levels } from '$lib/stores/communication/types';
import { ESL_TYPE, LEVELS, ASSIGNMENT_TYPE, STATUSES } from '$lib/stores/communication/constants';
import { parseStudentsFromText, determineGradeFromStudents } from '$lib/communication/studentParser';
import type { CommunicationRecord } from '$lib/communication/recordManager.svelte';
import { validatePrintReadiness, type PrintValidationState } from '$lib/communication/printValidator';

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
	studentsParsed: Student[] = $state([]);

	// Class information
	grade = $derived(determineGradeFromStudents(this.studentsParsed));
	level = $state(Levels.Basic);
	classType: string = $state(ESL_TYPE.COMM);
	classNum: string = $state('');
	className = $derived([this.grade, this.level, this.classNum, this.classType].join(' '));

	// Assignment information
	assignmentRaw = $state({
		type: '',
		assigned: '',
		due: '',
		late: ''
	});
	assignment: AssignmentCode = $state(AssignmentCode.passport);

	// Date fields
	dates: { assigned: string; due: string; late: string } = $state({
		assigned: '',
		due: '',
		late: ''
	});

	// Signature
	signatureImage: string = $state('');
	isSignatureInitialized = $state(false);
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
	
	isAllChecked = $derived(
		(() => {
			let allChecked = this.studentsParsed.length > 0 && this.studentsParsed.every((student) => student.selected);
			let anyChecked = this.studentsParsed.some((student) => student.selected);
			return {
				checked: allChecked,
				indeterminate: !allChecked && anyChecked
			};
		})()
	);

	printValidation: PrintValidationState = $derived(
		validatePrintReadiness({
			classNum: this.classNum,
			studentsParsed: this.studentsParsed,
			isAllChecked: this.isAllChecked,
			assignmentDates: this.dates,
			grade: this.grade,
			signatureImage: this.signatureImage
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
				esl: this.className,
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
			if (this.classType === ESL_TYPE.CLIL) this.assignment = AssignmentCode.workbook;
		});

		// Load signature from localStorage on mount
		$effect(() => {
			if (browser) {
				const savedSignature = localStorage.getItem('signatureImage');
				if (savedSignature) {
					this.signatureImage = savedSignature;
				}
				this.isSignatureInitialized = true;
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

	toggleAll = () => {
		const newCheckedState = !this.isAllChecked.checked;
		this.studentsParsed = this.studentsParsed.map((student) => ({
			...student,
			selected: newCheckedState
		}));
	};

	loadRecordData = async (record: CommunicationRecord) => {
		this._isLoadingRecord = true;
		this.level = record.level as Levels;
		this.classType = record.classType;
		this.classNum = record.classNum;
		this.assignment = record.assignment as AssignmentCode;
		this.dates = record.dates;
		this.studentsParsed = JSON.parse(JSON.stringify(record.studentsParsed));
		
		await tick(); // Wait for effect to run (blocked by _isLoadingRecord=true)
		
		this._isLoadingRecord = false;
	};

	handlePaste = (text: string) => {
		try {
			const rawParsed = parseStudentsFromText(text);
			const currentParsed = untrack(() => this.studentsParsed);

			// Merge existing statuses/selection if IDs match
			const mergedParsed = rawParsed.map((newStudent) => {
				const existing = currentParsed.find((s) => s.id === newStudent.id);
				if (existing) {
					return {
						...newStudent,
						status: existing.status,
						selected: existing.selected
					};
				}
				return newStudent;
			});

			this.studentsParsed = mergedParsed;
		} catch (e) {
			console.error('[STORE] Paste error:', e);
		}
	};

	/**
	 * Reset all store values to defaults
	 */
	reset = () => {
		this._isLoadingRecord = false;
		this.studentsParsed = [];
		this.level = Levels.Basic;
		this.classType = ESL_TYPE.COMM;
		this.classNum = '';
		this.assignment = AssignmentCode.passport;
		this.assignmentRaw = {
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
