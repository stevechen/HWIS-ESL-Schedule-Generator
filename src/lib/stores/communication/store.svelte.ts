import { AssignmentCode, ClassType, type Student } from './types';
import { LEVEL_TYPE } from './constants';
import { parseStudentsFromText } from '../../communication/studentParser';

/**
 * Communication Store - Manages state for the communication slip feature
 * Handles student data, assignment details, dates, and signature image
 */
export class CommunicationStore {
	// Student data
	studentsText: string = $state('');
	studentsRaw: Student[] = $derived.by(() => parseStudentsFromText(this.studentsText));
	shouldHideTextarea: boolean = $derived(this.studentsRaw.length > 0);

	// Class information
	grade: string = $state('');
	level = $state(LEVEL_TYPE[2].value); // Default to Basic
	classType: string = $state(ClassType.COMM);
	classNum: string = $state('');

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

	constructor() {
		this.initializeDates();
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

	/**
	 * Reset all store values to defaults
	 */
	reset() {
		this.studentsText = '';
		this.studentsRaw = [];
		this.shouldHideTextarea = false;
		this.grade = '';
		this.level = LEVEL_TYPE[2].value;
		this.classType = ClassType.COMM;
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
		this.signatureImage = '';
		this.initializeDates();
	}
}
