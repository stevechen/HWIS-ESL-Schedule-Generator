<script lang="ts">
	import { tooltip } from '$lib/utils.ts.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import Slip from '$lib/components/Slip.svelte';

	//#region Student ---------------------------------------------------------------
	interface Student {
		id: string;
		name: {
			english: string;
			chinese: string;
		};
		cClass: string;
		status: string;
		selected: boolean;
	}

	let studentsText: string = $state('');
	let studentsRaw: Student[] = $state([]);
	let shouldHideTextarea: boolean = $state(false);

	$effect(() => {
		shouldHideTextarea = studentsRaw.length > 0;
	});

	//#region Student table ---------------------------------------------------------------
	$effect(() => {
		studentsRaw = generateStudents(studentsText);
	});

	function generateStudents(data: string) {
		const ID_REGEX = /^\d{7}$/;
		const CLASS_REGEX = /^[JH]\d{3}$/;
		const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
		const ENGLISH_REGEX = /^[a-zA-Z]{2,}(\s[a-zA-Z]+){1,5}$/; //allow 5 groups of two or more alphabetical characters
		const LINES = data.split('\n').filter((line) => line.trim() !== '');
		if (LINES.length === 0) return [];

		return LINES.map((row) => {
			const student = {
				id: '',
				name: { english: '', chinese: '' },
				cClass: '',
				status: StatusTypeCode.NOT_SUBMITTED,
				selected: true
			};

			const FIELDS = row.split('\t');

			for (const FIELD_RAW of FIELDS) {
				const FIELD = FIELD_RAW.trim();
				if (ID_REGEX.test(FIELD)) {
					student.id = FIELD;
				} else if (CLASS_REGEX.test(FIELD)) {
					student.cClass = FIELD;
				} else if (CHINESE_REGEX.test(FIELD)) {
					student.name.chinese = FIELD;
				} else if (ENGLISH_REGEX.test(FIELD)) {
					student.name.english = FIELD;
				}
			}
			return student;
		}).sort((a, b) => a.name.english.localeCompare(b.name.english));
	}

	const students = $derived.by(() => {
		const studentsSelected = studentsRaw
			.filter((student) => student.selected) // filter out unselected
			.map(({ selected, status, ...rest }) => {
				// Lookup the status in STATUS_TYPE to find the corresponding {english, chinese} object to pass to Slip
				const studentStatus = STATUS_TYPE.find((type) => type.code === status);
				return {
					...rest,
					status: studentStatus
						? { english: studentStatus.text.english, chinese: studentStatus.text.chinese }
						: { english: 'Unknown', chinese: '未知' }
				};
			});
		return studentsSelected;
	});

	//#region Master checkbox -----------------------------------------------------------
	let isAllChecked = $derived.by(() => {
		let allChecked = studentsRaw.every((student) => student.selected);
		let anyChecked = studentsRaw.some((student) => student.selected);
		return {
			checked: allChecked,
			indeterminate: !allChecked && anyChecked
		};
	});

	function handleToggleAll() {
		const isAllChecked = studentsRaw.every((student) => student.selected);
		const newCheckedState = !isAllChecked;

		studentsRaw = studentsRaw.map((student) => ({
			...student,
			selected: newCheckedState
		}));
	}

	//#region ESL class ---------------------------------------------------------------
	const grade = $derived.by(() => determineGradeFromText(studentsText));
	enum Level {
		PreElementary = 'Pre-Elementary',
		Elementary = 'Elementary',
		Basic = 'Basic',
		Intermediate = 'Intermediate',
		Advanced = 'Advanced'
	}

	const LEVEL_TYPE = [
		{ id: 'pre-ele', label: 'Pre-Ele', value: Level.PreElementary },
		{ id: 'ele', label: 'Ele', value: Level.Elementary },
		{ id: 'bas', label: 'Basic', value: Level.Basic },
		{ id: 'int', label: 'Int', value: Level.Intermediate },
		{ id: 'adv', label: 'Adv', value: Level.Advanced }
	];

	const ClassType = {
		COMM: 'Comm',
		CLIL: 'CLIL'
	};

	let UI_Grade = $state('');
	let UI_Level = $state(LEVEL_TYPE[2].value);
	let UI_ClassType = $state(ClassType.COMM); //default to Comm if it's G9
	let UI_ClassNum = $state('');
	let className = $derived([UI_Grade, UI_Level, UI_ClassNum, UI_ClassType].join(' '));

	$effect(() => {
		UI_Grade = grade;
		if (UI_ClassType === ClassType.CLIL) UI_Assignment = AssignmentCode.workbook; //change default to Workbook if it's CLIL
		assignmentRaw.esl = className;
	});

	function determineGradeFromText(pastedText: string) {
		const gradeMatch = pastedText.match(/J1\d{2}|J2\d{2}|J3\d{2}/);
		if (gradeMatch) {
			//only matches the first record since the reset should be in the same grade
			const matchCode = Number(gradeMatch[0].charAt(1));
			//should be J1xx to J3xx
			if (matchCode >= 1 && matchCode <= 3) {
				return `G${matchCode + 6}`;
			}
		}
		return 'Unknown'; //out or range
	}

	// #region Assignment ----------------------------------------------------------------
	const enum AssignmentCode {
		workbook = 'workbook',
		passport = 'passport',
		recording = 'recording',
		exam = 'exam',
		speech = 'speech'
	}

	const COMM_ASSIGNMENT_TYPES = [
		{ code: AssignmentCode.passport, english: 'Passport', chinese: '英文護照', isG9: true },
		{ code: AssignmentCode.recording, english: 'Recording', chinese: '錄影/錄音', isG9: true },
		{ code: AssignmentCode.workbook, english: 'Workbook', chinese: '作業本', isCLIL: true },
		{ code: AssignmentCode.exam, english: 'Oral Exam', chinese: '期中/末考口試', isG9: true },
		{ code: AssignmentCode.speech, english: 'Speech Practice', chinese: '演講練習', isCLIL: true }
	];

	const G9_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isG9);

	const CLIL_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isCLIL);

	const assignmentTypes = $derived.by(() => {
		return UI_Grade === 'G9'
			? G9_ASSIGNMENT_TYPES
			: UI_ClassType === ClassType.CLIL
				? CLIL_ASSIGNMENT_TYPES
				: COMM_ASSIGNMENT_TYPES;
	});

	const StatusTypeCode = {
		NOT_SUBMITTED: '0',
		NOT_COMPLETED: '1'
	} as const;

	const STATUS_TYPE = [
		{
			code: StatusTypeCode.NOT_SUBMITTED,
			text: { english: "hasn't been submitted", chinese: '未繳交' }
		},
		{
			code: StatusTypeCode.NOT_COMPLETED,
			text: { english: "wasn't completed", chinese: '完成度不佳' }
		}
	];

	let assignmentRaw = $state({
		esl: '',
		type: '',
		assigned: '',
		due: '',
		late: ''
	});

	let UI_Assignment = $state(AssignmentCode.passport); //default to passport

	let assignment = $derived.by(() => {
		const assignmentTypeText = assignmentTypes.find((type) => type.code === UI_Assignment);
		return {
			...assignmentRaw,
			type: {
				english: assignmentTypeText ? assignmentTypeText.english : 'Unknown',
				chinese: assignmentTypeText ? assignmentTypeText.chinese : '未知'
			}
		};
	});

	// #region Date fields -------------------------------------------
	const DATE_FIELDS = [
		{ label: 'Assigned:', key: 'assigned' },
		{ label: 'Due:', key: 'due' },
		{ label: 'Late:', key: 'late' }
	];

	let UI_Dates: { [key: string]: string } = $state({
		assigned: '',
		due: '',
		late: ''
	});

	$effect(() => {
		assignmentRaw.assigned = UI_Dates.assigned;
		assignmentRaw.due = UI_Dates.due;
		assignmentRaw.late = UI_Dates.late;
	});

	// #region Signature -------------------------------------------
	let signatureImage: string = $state('');

	enum Limit {
		size = 200,
		height = 160
	}

	function validateAndSetImage(file: File): boolean {
		// Check if the file type is JPEG or PNG
		if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
			alert('Only JPG and PNG formats are allowed.');
			return false;
		}

		// Check if the file size is less than 200KB
		if (file.size > Limit.size * 1024) {
			alert(`File size must be under ${Limit.size}KB.`);
			return false;
		}

		// Create a URL for the file
		const fileURL = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			// Check if the image height is greater than 160px
			if (img.height <= Limit.height) {
				alert(`Image height must be greater than ${Limit.height}px.`);
				URL.revokeObjectURL(img.src); // Clean up the URL object
				return;
			}
			// Set the image URL if all checks pass
			signatureImage = fileURL;
		};

		img.onerror = () => {
			alert('Failed to load the image.');
			URL.revokeObjectURL(img.src); // Clean up the URL object
		};

		img.src = fileURL;
		return true;
	}

	function handleFileSelect(event: Event) {
		const inputField = event.target as HTMLInputElement | null;
		if (!inputField) return; // Null check

		const file = inputField.files?.[0];
		if (file) validateAndSetImage(file);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		(event.target as HTMLElement).classList.add('drag-over'); // Add the 'drag-over' class to show drag over effect
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		(event.target as HTMLElement).classList.remove('drag-over'); // Remove the 'drag-over' class when drag leaves
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const dataTransfer = event.dataTransfer;
		if (dataTransfer) {
			const file = dataTransfer.files[0]; // Get the dropped file
			validateAndSetImage(file); // Call the function to validate and set the image
		}
	}

	function removeSignature(event: MouseEvent) {
		event.stopPropagation(); // This stops the click event from bubbling up to parent elements
		signatureImage = ''; // Clear the signature image
	}

	// A11y functions
	function handleClick() {
		const element = document.getElementById('signature-upload');
		if (element) {
			element.click();
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		// Trigger click on 'Enter' or 'Space' keyup
		if (event.key === 'Enter' || event.key === ' ') {
			handleClick();
		}
	}

	//#region Print button -------------------------------------------
	let printInvalid = $derived(
		!UI_ClassNum ||
			(!isAllChecked.indeterminate && !isAllChecked.checked) ||
			!studentsRaw.length ||
			!isValidMonthAndDay(assignment.due) ||
			!isValidMonthAndDay(assignment.late) ||
			grade === 'Unknown'
	);

	let printCaution = $derived(
		!printInvalid && !isValidMonthAndDay(assignment.assigned)
		// (!isValidMonthAndDay(assignment.assigned) ||
		// 	!isValidMonthAndDay(assignment.due) ||
		// 	!isValidMonthAndDay(assignment.late))
	);

	// #region Life cycles -------------------------------------------
	onMount(async () => {
		const today = new Date();
		const dueDate = `${today.getMonth() + 1}/${today.getDate()}`;
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const lateDate = `${sevenDaysLater.getMonth() + 1}/${sevenDaysLater.getDate()}`;
		UI_Dates.due = dueDate; // Directly set due date to today
		UI_Dates.late = lateDate; // Directly set late due date to 7 days later

		if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
			const img = new Image();
			img.onload = () => {
				// Image exists and is loaded, update signatureImage to its path
				signatureImage = 'sig.png';
			};
			img.onerror = (e) => {
				// Image doesn't exist, do nothing or log an error if needed
			};
			img.src = 'sig.png'; // Adjust the path as necessary
		}
	});

	onDestroy(() => {
		// If the image URL is still set, revoke it before the component is destroyed
		const currentFileURL = signatureImage;
		if (currentFileURL) {
			URL.revokeObjectURL(currentFileURL);
		}
	});
</script>

<!-- MARK: **** HTML **** -->
<!-- svg icons -->
<section class="hidden">
	<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
		<g id="icon-student">
			<path
				class="st0"
				d="M116.738,231.551c0,23.245,14.15,43.315,34.513,49.107c15.262,42.368,55.574,70.776,100.582,70.776 s85.32-28.408,100.58-70.776c20.365-5.792,34.515-25.854,34.515-49.107c0-15.691-6.734-30.652-18.061-40.248l1.661-8.921 c0-3.323-0.229-6.568-0.491-9.821l-0.212-2.593l-2.213,1.374c-30.871,19.146-80.885,27.71-116.754,27.71 c-34.85,0-83.895-8.214-114.902-26.568l-2.259-0.59l-0.188,2.554c-0.192,2.632-0.384,5.256-0.357,8.23l1.632,8.649 C123.466,200.923,116.738,215.876,116.738,231.551z"
			>
			</path>
			<path
				class="st0"
				d="M356.151,381.077c-9.635-5.97-18.734-11.607-26.102-17.43l-0.937-0.738l-0.972,0.691 c-6.887,4.914-31.204,30.17-51.023,51.172l-10.945-21.273l5.697-4.076v-20.854h-40.07v20.854l5.697,4.076l-10.949,21.281 c-19.825-21.009-44.154-46.265-51.034-51.18l-0.973-0.691l-0.937,0.738c-7.368,5.823-16.469,11.46-26.102,17.43 c-30.029,18.61-64.062,39.697-64.062,77.344c0,22.244,52.241,53.579,168.388,53.579c116.146,0,168.388-31.335,168.388-53.579 C420.213,420.774,386.178,399.687,356.151,381.077z"
			>
			</path>
			<path
				class="st0"
				d="M131.67,131.824c0,18.649,56.118,42.306,119.188,42.306s119.188-23.656,119.188-42.306v-25.706l43.503-17.702 v55.962c-5.068,0.792-8.964,5.186-8.964,10.45c0,4.503,2.966,8.432,7.242,9.852l-8.653,57.111h40.704l-8.651-57.111 c4.27-1.421,7.232-5.35,7.232-9.852c0-5.295-3.919-9.697-9.014-10.466l-0.21-67.197c0.357-0.621,0.357-1.266,0.357-1.607 c0-0.342,0-0.978-0.149-0.978h-0.002c-0.262-2.446-2.011-4.612-4.56-5.652l-11.526-4.72L267.551,3.238 C262.361,1.118,256.59,0,250.858,0s-11.502,1.118-16.69,3.238L72.834,68.936c-2.863,1.172-4.713,3.773-4.713,6.622 c0,2.842,1.848,5.443,4.716,6.63l58.833,23.928V131.824z"
			>
			</path>
		</g>
		<g id="icon-blackboard">
			<path
				d="M46,330.4332v26.219a13.1555,13.1555,0,0,0,13.157,13.156h66.2894l-24.3445,66.8875c-9.1794,27.3587,30.5631,41.822,41.1118,14.9632l7.4982-20.5986H362.29l7.496,20.5986c10.553,26.8631,50.3,12.388,41.1118-14.9632l-24.3445-66.8865-46.5592-.001,12.74,35.0021h-193.47l12.74-35.0021h280.84A13.1551,13.1551,0,0,0,466,356.6522v-26.219Z"
			/>
			<path
				d="M247.2521,247.3477a13.1631,13.1631,0,0,1,13.1635-13.1624H391.5887a13.163,13.163,0,0,1,13.1634,13.1624v56.8355H439.75V59.1917a13.1341,13.1341,0,0,0-13.1335-13.1335H85.3835A13.1341,13.1341,0,0,0,72.25,59.1917V304.1832H247.2521Z"
			/>
			<rect height="43.75" width="105" x="273.5" y="260.4332" />
		</g>
		<g id="icon-inkWell">
			<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
				<g id="des-ink-well" fill="currentColor">
					<path
						d="M34.8606,40.8496 L32.9706,41.9836 C32.3726,42.3426 32.0006,42.9996 32.0006,43.6986 L32.0006,52.9996 C32.0006,53.5526 31.5526,53.9996 31.0006,53.9996 C30.4476,53.9996 30.0006,53.5526 30.0006,52.9996 L30.0006,43.6986 C30.0006,42.3006 30.7446,40.9876 31.9416,40.2686 L33.8316,39.1346 C34.3056,38.8506 34.9196,39.0046 35.2036,39.4776 C35.4876,39.9516 35.3346,40.5656 34.8606,40.8496 M54.1306,36.4476 L51.1056,34.9346 C50.4236,34.5936 50.0006,33.9086 50.0006,33.1456 L50.0006,27.9996 L51.0006,27.9996 C51.5526,27.9996 52.0006,27.5526 52.0006,26.9996 C52.0006,26.4476 51.5526,25.9996 51.0006,25.9996 L33.0006,25.9996 C32.4476,25.9996 32.0006,26.4476 32.0006,26.9996 C32.0006,27.5526 32.4476,27.9996 33.0006,27.9996 L34.0006,27.9996 L34.0006,33.1456 C34.0006,33.9086 33.5766,34.5936 32.8946,34.9346 L29.8696,36.4476 C27.4826,37.6416 26.0006,40.0396 26.0006,42.7076 L26.0006,55.9996 C26.0006,58.2056 27.7946,59.9996 30.0006,59.9996 L54.0006,59.9996 C56.2066,59.9996 58.0006,58.2056 58.0006,55.9996 L58.0006,42.7076 C58.0006,40.0396 56.5176,37.6416 54.1306,36.4476"
						id="Fill-328"
					>
					</path>
					<path
						d="M19.1955,35.9805 C19.1305,35.9945 19.0635,36.0005 18.9995,36.0005 C18.5325,36.0005 18.1145,35.6705 18.0195,35.1955 C17.9115,34.6555 18.2615,34.1285 18.8025,34.0195 C19.0505,33.9675 24.5935,32.7385 27.0605,25.9475 C27.1055,25.8245 27.1745,25.7175 27.2565,25.6265 C29.4355,18.5125 29.1555,12.8715 28.6365,9.6465 C26.3005,12.2625 16.0385,24.8275 12.9145,46.3125 C15.6775,44.3165 20.2445,40.3105 23.8655,33.7015 C21.5025,35.4935 19.3525,35.9495 19.1955,35.9805"
						id="Fill-329"
					>
					</path>
					<path
						d="M27.9755,6.8794 C27.9705,6.8374 27.9805,6.7984 27.9695,6.7564 C27.9645,6.7344 27.9485,6.7184 27.9415,6.6964 C27.9215,6.6344 27.8895,6.5794 27.8575,6.5214 C27.8235,6.4604 27.7905,6.4024 27.7455,6.3514 C27.7315,6.3344 27.7265,6.3134 27.7115,6.2984 C27.6825,6.2684 27.6445,6.2564 27.6125,6.2314 C27.5585,6.1884 27.5045,6.1474 27.4425,6.1164 C27.3845,6.0874 27.3255,6.0684 27.2635,6.0514 C27.2035,6.0354 27.1455,6.0204 27.0815,6.0154 C27.0115,6.0094 26.9435,6.0154 26.8735,6.0254 C26.8345,6.0294 26.7965,6.0204 26.7585,6.0304 C26.6175,6.0654 17.9655,8.3184 11.3715,14.5264 C9.5745,17.2034 10.9385,21.6504 10.9545,21.6994 C11.1205,22.2254 10.8275,22.7874 10.3015,22.9544 C10.2015,22.9854 10.0995,23.0004 10.0005,23.0004 C9.5755,23.0004 9.1805,22.7274 9.0465,22.3004 C8.9995,22.1534 8.3735,20.1124 8.4535,17.7554 C5.8325,21.2144 4.0005,25.5694 4.0005,31.0004 C4.0005,39.4314 7.5025,45.2004 8.7715,47.0154 C8.2875,50.7494 8.0005,54.7414 8.0005,59.0004 C8.0005,59.5524 8.4475,60.0004 9.0005,60.0004 C9.5525,60.0004 10.0005,59.5524 10.0005,59.0004 C10.0005,55.0034 10.2565,51.2374 10.6995,47.6924 L10.8555,46.5204 C14.3625,21.2134 27.5495,7.8634 27.7035,7.7124 C27.7345,7.6814 27.7465,7.6414 27.7725,7.6084 C27.8145,7.5554 27.8525,7.5044 27.8825,7.4444 C27.9125,7.3854 27.9305,7.3264 27.9475,7.2644 C27.9655,7.2034 27.9795,7.1444 27.9845,7.0804 C27.9905,7.0114 27.9835,6.9474 27.9755,6.8794"
						id="Fill-330"
					>
					</path>
				</g>
			</g>
		</g>
		<g id="icon-calendar">
			<path
				d="M499.641,320.573c-12.207-3.251-25.021-5.011-38.25-5.011c-1.602,0-3.189,0.071-4.781,0.119 c-78.843,2.506-142.118,66.556-143.375,145.709c-0.015,0.799-0.062,1.587-0.062,2.391c0,15.85,2.515,31.102,7.119,45.422 C339.474,568.835,395.381,612,461.391,612c81.859,0,148.219-66.359,148.219-148.219 C609.609,395.151,562.954,337.441,499.641,320.573z M461.391,561.797c-54.133,0-98.016-43.883-98.016-98.016 s43.883-98.016,98.016-98.016s98.016,43.883,98.016,98.016S515.523,561.797,461.391,561.797z"
			>
			</path>
			<polygon
				points="475.734,396.844 442.266,396.844 442.266,449.438 389.672,449.438 389.672,482.906 442.266,482.906 442.266,535.5 475.734,535.5 475.734,482.906 528.328,482.906 528.328,449.438 475.734,449.438 "
			>
			</polygon>
			<path
				d="M126.703,112.359c9.228,0,16.734-7.507,16.734-16.734V54.984v-38.25C143.438,7.507,135.931,0,126.703,0h-14.344 c-9.228,0-16.734,7.507-16.734,16.734v38.25v40.641c0,9.228,7.506,16.734,16.734,16.734H126.703z"
			>
			</path>
			<path
				d="M389.672,112.359c9.228,0,16.734-7.507,16.734-16.734V54.984v-38.25C406.406,7.507,398.899,0,389.672,0h-14.344 c-9.228,0-16.734,7.507-16.734,16.734v38.25v40.641c0,9.228,7.507,16.734,16.734,16.734H389.672z"
			>
			</path>
			<path
				d="M274.922,494.859c-2.333-11.6-3.572-23.586-3.572-35.859c0-4.021,0.177-7.999,0.435-11.953H74.109 c-15.845,0-28.688-12.843-28.688-28.688v-229.5h411.188v88.707c3.165-0.163,6.354-0.253,9.562-0.253 c11.437,0,22.61,1.109,33.469,3.141V93.234c0-21.124-17.126-38.25-38.25-38.25h-31.078v40.641c0,22.41-18.23,40.641-40.641,40.641 h-14.344c-22.41,0-40.641-18.231-40.641-40.641V54.984H167.344v40.641c0,22.41-18.231,40.641-40.641,40.641h-14.344 c-22.41,0-40.641-18.231-40.641-40.641V54.984H40.641c-21.124,0-38.25,17.126-38.25,38.25v363.375 c0,21.124,17.126,38.25,38.25,38.25H274.922z"
			>
			</path> <circle cx="137.165" cy="260.578" r="37.954"></circle>
			<circle cx="251.016" cy="260.578" r="37.954"></circle>
			<circle cx="364.867" cy="260.578" r="37.954"></circle>
			<circle cx="251.016" cy="375.328" r="37.953"></circle>
			<circle cx="137.165" cy="375.328" r="37.953"></circle>
		</g>
		<g id="icon-spin">
			<path
				opacity="0.2"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
				fill="currentColor"
			/>
			<path
				class=" animate-[spin_3s_linear_infinite] origin-center"
				d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
				fill="currentColor"
			/>
		</g>
		<g id="icon-trash">
			<path
				fill="currentColor"
				d="M15 4c-.522 0-1.06.185-1.438.563C13.185 4.94 13 5.478 13 6v1H7v2h1v16c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V9h1V7h-6V6c0-.522-.185-1.06-.563-1.438C20.06 4.186 19.523 4 19 4zm0 2h4v1h-4zm-5 3h14v16c0 .555-.445 1-1 1H11c-.555 0-1-.445-1-1zm2 3v11h2V12zm4 0v11h2V12zm4 0v11h2V12z"
			/>
		</g>
		<g id="icon-image">
			<path d="M0 0h24v24H0V0z" fill="none" /><path
				d="M18 20H4V6h9V4H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9h-2v9zm-7.79-3.17l-1.96-2.36L5.5 18h11l-3.54-4.71zM20 4V1h-2v3h-3c.01.01 0 2 0 2h3v2.99c.01.01 2 0 2 0V6h3V4h-3z"
			/>
		</g>
	</svg>
</section>

<TabBar />
<main
	class="print:hidden w-[43em] flex justify-start items-center flex-wrap m-auto mb-4 p-2 border-dotted border-2 font-sans rounded-lg"
>
	<!-- MARK: students -->
	<fieldset class="w-full">
		<!-- student icon -->
		<svg class="inline-block w-6 h-6 ml-4 my-2 text-slate-500 fill-slate-500" viewBox="0 0 512 512">
			<use href="#icon-student" />
		</svg>
		<h2 class="inline-block text-slate-500 mx-4 mb-1">
			<span class="font-semibold text-base">Students</span>
		</h2>
		<textarea
			name=""
			class="h-11 p-2 rounded-md focus:border-blue-800 focus:outline-none
			{shouldHideTextarea
				? 'hidden'
				: ''} placeholder:text-sm min-w-full h-6 border invalid:border-red-400 invalid:border-2"
			bind:value={studentsText}
			placeholder="Paste Excel students with fields in any order: [ID, Chinese Name, English Name, Chinese Class]"
			required
		></textarea>
	</fieldset>
	<!-- MARK: student table -->
	{#if studentsRaw.length > 0}
		<table class="table-auto w-full text-sm mx-6 mb-4 border-collapse">
			<thead class="text-xs font-semibold bg-slate-100">
				<tr>
					<th class="border-solid border border-slate-300">
						<!-- master checkbox for all students -->
						<input
							type="checkbox"
							class="h-4 w-4 m-1"
							bind:checked={isAllChecked.checked}
							indeterminate={isAllChecked.indeterminate}
							onchange={handleToggleAll}
						/>
					</th>
					{#each ['ID', 'C. Name', 'English Name', 'C. Class', 'Status'] as header}
						<th class="border-solid border border-slate-300">{header}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each studentsRaw as student}
					<tr class="student *:border *: border-slate-200 *:p-[4px]">
						<!-- student checkbox -->
						<td>
							<input type="checkbox" class="h-4 w-4 m-1" bind:checked={student.selected} />
						</td>
						<td class="w-16">
							<input class="text-center" type="text" bind:value={student.id} />
						</td>
						<td class="w-20">
							<input class="text-center" type="text" bind:value={student.name.chinese} />
						</td>
						<td class="w-auto">
							<input type="text-center" bind:value={student.name.english} />
						</td>
						<td class="w-14">
							<input class="text-center" type="text" bind:value={student.cClass} />
						</td>
						<td class="w-auto text-center">
							<select bind:value={student.status}>
								<option value={StatusTypeCode.NOT_SUBMITTED}>
									{STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED].text.english}
								</option>
								<option value={StatusTypeCode.NOT_COMPLETED}>
									{STATUS_TYPE[StatusTypeCode.NOT_COMPLETED].text.english}
								</option>
							</select>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<!-- MARK: class-info -->
	<fieldset class="w-full flex flex-row justify-start items-center mb-2 pr-2 class-info">
		<!-- blackboard icon -->
		<svg class="w-6 h-6 mx-4 my-1 fill-slate-500" viewBox="0 0 512 512">
			<use href="#icon-blackboard" />
		</svg>
		<div class="px-3">
			<p
				class="rounded-full px-2 {grade === 'Unknown'
					? 'text-red-500'
					: 'text-white bg-gradient-to-b from-slate-700 to-slate-500 shadow-sm shadow-blue-800'}"
			>
				{#if grade !== 'Unknown'}
					{grade}
				{:else}
					<!-- spin circle -->
					<svg class="w-6 h-6 animate-[spin_3s_linear_infinite] origin-center" viewBox="0 0 24 24">
						<use href="#icon-spin" />
					</svg>
				{/if}
			</p>
		</div>

		<!-- MARK: ESL-level -->
		<div class="flex flex-row justify-start items-center rounded-full bg-slate-200 p-1 mx-1">
			{#each LEVEL_TYPE as { id, label, value }}
				<label
					class="rounded-full px-2 text-slate-400 cursor-pointer transition duration-500 ease-in
						hover:text-slate-100 hover:bg-blue-400 hover:shadow-green-300 hover:animate-pulse
						has-[:checked]:text-white has-[:checked]:bg-gradient-to-b has-[:checked]:from-slate-700 has-[:checked]:to-slate-500 has-[:checked]:shadow-sm has-[:checked]:shadow-blue-800 has-[:checked]:animate-none has-[:checked]:cursor-default"
					for={id}
				>
					<input class="appearance-none" type="radio" {id} bind:group={UI_Level} {value} />
					{label}
				</label>
			{/each}
		</div>

		<!-- MARK: ESL-type -->
		<div class="flex flex-row justify-start items-center rounded-full bg-slate-200 p-1 mx-1">
			{#each Object.entries(ClassType) as [type, value]}
				<!-- only render out CLIL if class is not G9 -->
				{#if value !== ClassType.CLIL || UI_Grade !== 'G9'}
					<label
						class="rounded-full px-2 text-slate-400 cursor-pointer transition duration-500 ease-in
							hover:text-slate-100 hover:bg-blue-400 hover:shadow-green-300 hover:animate-pulse
							has-[:checked]:text-white has-[:checked]:bg-gradient-to-b has-[:checked]:from-slate-700 has-[:checked]:to-slate-500 has-[:checked]:shadow-sm has-[:checked]:shadow-blue-800 has-[:checked]:animate-none has-[:checked]:cursor-default"
						for={type}
					>
						<input
							class="appearance-none"
							type="radio"
							id={type}
							bind:group={UI_ClassType}
							{value}
							aria-label={value}
						/>
						{value}
					</label>
				{/if}
			{/each}
		</div>

		<!-- MARK: class-number -->
		<div>
			<input
				type="number"
				class={`h-6 w-8 appearance:textfield text-center text-white rounded-full focus:border-blue-800 focus:outline-none
					bg-gradient-to-b from-slate-700 to-slate-500 shadow-sm shadow-blue-800
					[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none 
					transition duration-400 ease-in
					invalid:text-red-400 invalid:bg-none invalid:rounded invalid:border-2 invalid:border-red-400 invalid:shadow-none`}
				bind:value={UI_ClassNum}
				placeholder="#?"
				max="9"
				min="1"
				required
			/>
		</div>
	</fieldset>

	<!-- MARK: assignment type -->
	<fieldset class="w-full flex flex-row justify-start items-center mb-2 mr-2">
		<!-- inkwell icon -->
		<svg class="w-6 h-6 mx-4 my-1 text-slate-500" viewBox="0 0 64 64">
			<use href="#icon-inkWell" />
		</svg>

		<div class="flex flex-row justify-start items-center rounded-full bg-slate-200 p-1 mx-1">
			{#each assignmentTypes as { code, english }}
				<label
					class="rounded-full px-2 text-slate-400 cursor-pointer transition duration-500 ease-in
						hover:text-slate-100 hover:bg-blue-400 hover:shadow-green-300 hover:animate-pulse
						has-[:checked]:text-white has-[:checked]:bg-gradient-to-b has-[:checked]:from-slate-700 has-[:checked]:to-slate-500 has-[:checked]:shadow-sm has-[:checked]:shadow-blue-800 has-[:checked]:animate-none has-[:checked]:cursor-default"
					for={code}
				>
					<input
						class="appearance-none"
						type="radio"
						id={code}
						bind:group={UI_Assignment}
						value={code}
					/>
					{english}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- MARK: dates -->
	<fieldset class="w-full flex flex-row justify-start items-start mb-2 pr-2 py-1">
		<svg class="w-6 h-6 ml-5 mr-4 my-1 fill-slate-500" viewBox="0 0 612 612">
			<use href="#icon-calendar" />
		</svg>
		{#each DATE_FIELDS as { key, label }}
			<label class="group px-2 text-sm text-slate-600" for={key}>
				{label}
				<input
					class={`mr-2 w-20 text-center rounded-md border border-slate-400 placeholder:text-sm
					focus:border-2 focus:border-blue-800 focus:outline-none
					invalid:border-red-400 group-first-of-type:invalid:border-orange-400 invalid:border-2 ${!UI_Dates[key as keyof typeof UI_Dates] || !isValidMonthAndDay(UI_Dates[key]) ? 'text-red-400 border-red-400 border-2' : ''}`}
					type="text"
					name={key}
					id={key}
					bind:value={UI_Dates[key as keyof typeof UI_Dates]}
					maxlength="5"
					placeholder={key === 'assigned' ? 'Optional' : 'Required'}
					required
				/>
			</label>
		{/each}
	</fieldset>

	<!-- MARK: signature-drop-zone -->
	<section class="w-full flex">
		<div
			id="signature-drop-zone"
			class={`w-4/6 py-2 px-8 ml-2  text-center text-slate-400 bg-slate-50 text-decoration-none 
			rounded-lg border-dashed border-2 cursor-pointer ${signatureImage ? 'grid grid-cols-[auto_2.75em] border-slate-300' : 'border-orange-400'}`}
			class:has-signature={signatureImage}
			ondragover={handleDragOver}
			ondrop={handleDrop}
			ondragleave={handleDragLeave}
			onclick={handleClick}
			onkeyup={handleKeyUp}
			aria-label="Drag & drop signature file"
			tabindex="0"
			role="button"
		>
			{#if signatureImage}
				<img
					class="h-[14mm] self-center justify-self-center signature-preview"
					src={signatureImage}
					alt="Signature Preview"
				/>

				<!-- remove signature button -->
				<button
					class="self-center justify-self-center block p-1.5 rounded-lg text-white bg-blue-400 hover:bg-blue-500 hover:pointer"
					onclick={(event) => removeSignature(event)}
					aria-label={'remove-signature'}
				>
					<svg class="w-8 h-8" viewBox="0 0 32 32">
						<use href="#icon-trash" />
					</svg>
				</button>
			{:else}
				<svg class="w-24 h-24 fill-slate-300 float-left" viewBox="0 0 24 24">
					<use href="#icon-image" />
				</svg>

				<p class="text-md text-orange-400">
					Drop signature image to upload <br /><span class="text-slate-400">or</span>
				</p>
				<button
					class="self-center justify-self-center block py-1 px-4 mt-2 rounded-lg border text-white bg-blue-400 hover:bg-blue-500 hover:pointer"
					>browse…
				</button>
				<p class="text-slate-400 text-sm">Max upload image size: {Limit.size}KB</p>
			{/if}
		</div>

		<input
			type="file"
			id="signature-upload"
			class="absolue overflow-hidden w-px h-px p-0 border-0 -m-px"
			accept="image/*"
			onchange={handleFileSelect}
		/>

		<!-- MARK: print-comment-->
		<div class="w-2/6 text-center h-full">
			<p
				class="w-full my-1 text-sm font-bold text-center
				{printInvalid ? 'text-red-400' : printCaution ? 'text-orange-400' : 'invisible'}"
			>
				Missing Info!
			</p>

			<button
				id="print"
				class="text-white bg-blue-500 mt-1 mb-2 py-1 px-4 rounded-lg animate-pulse
				 {printCaution ? 'bg-orange-500 hover:bg-orange-600' : ''}
				 {printInvalid ? 'bg-red-500 animate-none hover:bg-red-600 cursor-default' : ''}"
				onclick={() => window.print()}
				use:tooltip={() => ({ content: 'B5/JIS-B5, single-sided' })}
			>
				Print {students.length} Slips
			</button>
		</div>
	</section>
</main>

<!-- MARK: Slips -->
<div
	id="b5-print"
	class="flex flex-col flex-nowrap w-[182mm] my-0 mx-auto print:m-[4.23mm] b5-size"
>
	{#each students as student, i}
		<p class="print:hidden text-center text-slate-500">Slip #{i + 1}</p>
		<Slip {student} signatureSrc={signatureImage} {assignment} />
	{/each}
</div>

<style>
	/* region CSS  */
	/* prevents x axis shifting when the scrollbar appears */
	@media screen {
		:global(html),
		:global(body) {
			overflow-y: scroll; /* Apply only for screen viewing */
			scrollbar-width: thin; /* For Firefox */
		}
		:global(body) {
			overflow-y: overlay; /* For WebKit browsers */
		}

		/* #region .student */
		.student td {
			input {
				width: 100%;
				border: none;
				background-color: transparent;
				padding: 0;
				margin: 0;
				box-sizing: border-box; /* Include padding and border in the element's size */

				&:focus {
					outline: none;
					background-color: #eef; /* Optional: highlight on focus */
				}
			}
		}

		/* #region #signature-drop-zone  */
		#signature-drop-zone {
			&.drag-over {
				border-color: steelblue; /* Change border color when dragging over */
				background: #f0ffff;
			}
		}

		#signature-upload {
			clip: rect(0, 0, 0, 0);
		}
	}

	/* #region @media print */
	@media print {
		@page {
			size: JIS-B5;
			margin: 0;
		}

		/* .b5-size {
			height: 257mm;
			margin: 4.23mm;
		} */
	}

	@media print and (-webkit-min-device-pixel-ratio: 0) {
		@page {
			width: 182mm;
			height: 257mm;
		}
	}
</style>
