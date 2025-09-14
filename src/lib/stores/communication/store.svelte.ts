import { AssignmentCode, ClassType, type Student } from './types';
import { LEVEL_TYPE } from './constants';

/**
 * Communication Store - Manages state for the communication slip feature
 * Handles student data, assignment details, dates, and signature image
 */
export class CommunicationStore {
	// Student data
	studentsText: string = $state('');
	studentsRaw: Student[] = $state([]);
	shouldHideTextarea: boolean = $state(false);

	// Class information
	UI_Grade: string = $state('');
	UI_Level = $state(LEVEL_TYPE[2].value); // Default to Basic
	UI_ClassType: string = $state(ClassType.COMM);
	UI_ClassNum: string = $state('');

	// Assignment information
	assignmentRaw = $state({
		esl: '',
		type: '',
		assigned: '',
		due: '',
		late: ''
	});
	UI_Assignment: AssignmentCode = $state(AssignmentCode.passport);

	// Date fields
	UI_Dates: { [key: string]: string } = $state({
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
		
		this.UI_Dates.due = dueDate;
		this.UI_Dates.late = lateDate;
	}

	/**
	 * Reset all store values to defaults
	 */
	reset() {
		this.studentsText = '';
		this.studentsRaw = [];
		this.shouldHideTextarea = false;
		this.UI_Grade = '';
		this.UI_Level = LEVEL_TYPE[2].value;
		this.UI_ClassType = ClassType.COMM;
		this.UI_ClassNum = '';
		this.UI_Assignment = AssignmentCode.passport;
		this.assignmentRaw = {
			esl: '',
			type: '',
			assigned: '',
			due: '',
			late: ''
		};
		this.UI_Dates = {
			assigned: '',
			due: '',
			late: ''
		};
		this.signatureImage = '';
		this.initializeDates();
	}
}