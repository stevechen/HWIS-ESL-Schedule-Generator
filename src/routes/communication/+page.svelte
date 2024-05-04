<script lang="ts">
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
		Elementary = 'Elementary',
		Basic = 'Basic',
		Intermediate = 'Intermediate',
		Advanced = 'Advanced'
	}

	const LEVEL_TYPE = [
		{ id: 'ele', label: 'Ele', value: Level.Elementary },
		{ id: 'bas', label: 'Basic', value: Level.Basic },
		{ id: 'int', label: 'Int', value: Level.Intermediate },
		{ id: 'adv', label: 'Adv', value: Level.Advanced }
	];

	enum classType {
		COMM = 'Comm',
		CLIL = 'CLIL'
	}

	let UIStateESLGrade = $state('');
	let UIStateESLLevel = $state(LEVEL_TYPE[0].value);
	let UIStateESLType = $state(classType.COMM); //default to Comm if it's G9
	let UIStateESLNumber = $state('');
	let className = $derived(
		[UIStateESLGrade, UIStateESLLevel, UIStateESLType, UIStateESLNumber].join(' ')
	);

	$effect(() => {
		UIStateESLGrade = grade;
		if (UIStateESLType === classType.CLIL) UIStateAssignment = AssignmentCode.WORKBOOK; //change default to Workbook if it's CLIL
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
	enum AssignmentCode {
		WORKBOOK = 'workbook',
		PASSPORT = 'passport',
		RECORDING = 'recording',
		EXAM = 'exam',
		SPEECH = 'speech'
	}

	const COMM_ASSIGNMENT_TYPE = [
		{ code: AssignmentCode.PASSPORT, english: 'Passport', chinese: '英文護照' },
		{ code: AssignmentCode.RECORDING, english: 'Recording', chinese: '錄影(錄音)' },
		{ code: AssignmentCode.WORKBOOK, english: 'Workbook', chinese: '作業本' },
		{ code: AssignmentCode.EXAM, english: 'Oral Exam', chinese: '期中/末考口試' },
		{ code: AssignmentCode.SPEECH, english: 'Speech Practice', chinese: '演講練習' }
	];

	const COMM_G9_ASSIGNMENT_TYPE = COMM_ASSIGNMENT_TYPE.filter(
		(type) => type.code !== AssignmentCode.WORKBOOK
	);

	const CLIL_ASSIGNMENT_TYPE = COMM_ASSIGNMENT_TYPE.filter(
		(type) => type.code === AssignmentCode.WORKBOOK || type.code === AssignmentCode.SPEECH
	);

	const assignmentType = $derived.by(() => {
		return UIStateESLGrade === 'G9'
			? COMM_G9_ASSIGNMENT_TYPE
			: UIStateESLType === classType.COMM
				? COMM_ASSIGNMENT_TYPE
				: CLIL_ASSIGNMENT_TYPE;
	});

	enum StatusTypeCode {
		NOT_SUBMITTED = '0', //use string instead of number for html input
		NOT_COMPLETED = '1'
	}

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

	let UIStateAssignment = $state(AssignmentCode.PASSPORT); //default to passport

	let assignment = $derived.by(() => {
		const foundType = assignmentType.find((type) => type.code === UIStateAssignment);
		return {
			...assignmentRaw,
			type: {
				english: foundType ? foundType.english : 'Unknown',
				chinese: foundType ? foundType.chinese : '未知'
			}
		};
	});

	// #region Date fields -------------------------------------------
	const DATE_FIELDS = [
		{ label: 'Assigned:', key: 'assigned' },
		{ label: 'Due:', key: 'due' },
		{ label: 'Late:', key: 'late' }
	];

	let UIStateDates: { [key: string]: string } = $state({
		assigned: '',
		due: '',
		late: ''
	});

	$effect(() => {
		assignmentRaw.assigned = UIStateDates.assigned;
		assignmentRaw.due = UIStateDates.due;
		assignmentRaw.late = UIStateDates.late;
	});

	// #region Signature -------------------------------------------
	let signatureImage: string = $state('');

	function validateAndSetImage(file: File): boolean {
		// Check if the file type is JPEG or PNG
		if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
			alert('Only JPG and PNG formats are allowed.');
			return false;
		}

		// Check if the file size is less than 100KB
		if (file.size > 100 * 1024) {
			alert('File size must be under 100KB.');
			return false;
		}

		// Create a URL for the file
		const fileURL = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			// Check if the image height is greater than 160px
			if (img.height <= 160) {
				alert('Image height must be greater than 160px.');
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
		!UIStateESLNumber ||
			(!isAllChecked.indeterminate && !isAllChecked.checked) ||
			!studentsRaw.length ||
			grade === 'Unknown'
	);

	let printCaution = $derived(
		!printInvalid &&
			(!isValidMonthAndDay(assignment.assigned) ||
				!isValidMonthAndDay(assignment.due) ||
				!isValidMonthAndDay(assignment.late))
	);

	// #region Life cycles -------------------------------------------
	onMount(async () => {
		const today = new Date();
		const formattedDate = `${today.getMonth() + 1}/${today.getDate()}`; // JavaScript months are 0-indexed
		UIStateDates.due = formattedDate; // Directly updating assignment.due

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

<!-- MARK: HTML -->
<TabBar />
<main class="control">
	<fieldset class="students-input">
		<legend>
			<h2 class="legend">
				<span class="title">Students</span>
				<span class="hints {shouldHideTextarea ? 'hide' : ''}">
					{`Paste Excel student rows with fields: [ID, Chinese Name, English Name, Chinese Class]`}
				</span>
			</h2>
		</legend>
		<textarea
			name=""
			id="student-list-input"
			bind:value={studentsText}
			class={shouldHideTextarea ? 'hide' : ''}
			required
		></textarea>
	</fieldset>
	<!-- MARK: #student-table -->
	{#if studentsRaw.length > 0}
		<table class="student-table">
			<thead>
				<tr>
					<th>
						<input
							type="checkbox"
							id="master-checkbox"
							bind:checked={isAllChecked.checked}
							indeterminate={isAllChecked.indeterminate}
							onchange={handleToggleAll}
						/>
					</th>
					<th>ID</th>
					<th>C. Name</th>
					<th>English Name</th>
					<th>C. Class</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each studentsRaw as student}
					<tr class="student">
						<td class="student-checkbox">
							<input type="checkbox" bind:checked={student.selected} />
						</td>
						<td class="student-id"><input type="text" bind:value={student.id} /></td>
						<td class="chinese-name"><input type="text" bind:value={student.name.chinese} /></td>
						<td class="english-name"><input type="text" bind:value={student.name.english} /></td>
						<td class="chinese-class"><input type="text" bind:value={student.cClass} /></td>
						<td class="status">
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

	<!-- MARK: #class-info -->
	<fieldset class="class-info">
		<h2 class="legend">Class</h2>
		<div>
			<p class="grade {grade === 'Unknown' ? 'warning' : ''}">{grade}</p>
		</div>
		<div>
			{#each LEVEL_TYPE as { id, label, value }}
				<input type="radio" {id} bind:group={UIStateESLLevel} {value} />
				<label for={id}>{label}</label>
			{/each}
		</div>
		<div>
			<div>
				{#each Object.entries(classType) as [type, value]}
					<!-- only render CLIL if class is not G9 -->
					{#if value !== classType.CLIL || UIStateESLGrade !== 'G9'}
						<input type="radio" id={type} bind:group={UIStateESLType} {value} />
						<label for={type}>{value}</label>
					{/if}
				{/each}
			</div>
		</div>
		<div>
			<input
				type="number"
				id="class-number"
				bind:value={UIStateESLNumber}
				class={`${!UIStateESLNumber ? 'warning' : ''}`}
				max="9"
				min="1"
				required
			/>
		</div>
	</fieldset>

	<!-- MARK: #assignment-type -->
	<fieldset class="assignment-type">
		<h2 class="legend">Type</h2>
		{#each assignmentType as { code, english }}
			<input type="radio" id={code} bind:group={UIStateAssignment} value={code} />
			<label for={code}>{english}</label>
		{/each}
	</fieldset>

	<!-- MARK: #dates -->
	<fieldset class="dates">
		<h2 class="legend">Dates</h2>
		{#each DATE_FIELDS as { key, label }}
			<label for={key}>{label}</label>
			<input
				type="text"
				name=""
				id={key}
				bind:value={UIStateDates[key as keyof typeof UIStateDates]}
				class={`date ${!UIStateDates[key as keyof typeof UIStateDates] || !isValidMonthAndDay(UIStateDates[key]) ? 'warning' : ''}`}
				maxlength="5"
				required
			/>
		{/each}
	</fieldset>

	<!-- MARK: #signature-drop-zone -->
	<div
		id="signature-drop-zone"
		class:has-signature={signatureImage}
		ondragover={handleDragOver}
		ondrop={handleDrop}
		ondragleave={handleDragLeave}
		onclick={handleClick}
		onkeyup={handleKeyUp}
		aria-label="Drag & drop signature"
		tabindex="0"
		role="button"
	>
		{#if signatureImage}
			<img class="signature-preview" src={signatureImage} alt="Signature Preview" />
			<button
				id="remove-signature"
				onclick={(event) => removeSignature(event)}
				class="trash secondary action-button"
			>
				<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="currentColor"
						d="M15 4c-.522 0-1.06.185-1.438.563C13.185 4.94 13 5.478 13 6v1H7v2h1v16c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V9h1V7h-6V6c0-.522-.185-1.06-.563-1.438C20.06 4.186 19.523 4 19 4zm0 2h4v1h-4zm-5 3h14v16c0 .555-.445 1-1 1H11c-.555 0-1-.445-1-1zm2 3v11h2V12zm4 0v11h2V12zm4 0v11h2V12z"
					/>
				</svg>
			</button>
		{:else}
			<p>Drop signature image here or</p>
			<button id="browse" class="secondary action-button">browse</button>
		{/if}
	</div>
	<input type="file" id="signature-upload" accept="image/*" onchange={handleFileSelect} />
	<button
		id="print"
		onclick={() => window.print()}
		class="action-button"
		class:invalid={printInvalid}
		class:caution={printCaution}
	>
		Print
	</button>
</main>

<!-- MARK: Slip -->
<div id="b5-print" class="b5-size">
	{#each students as student}
		<Slip {student} signatureSrc={signatureImage} {assignment} />
	{/each}
</div>

<style>
	/* #region CSS  */
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

		:root {
			--main-color: #0ea5e9;
			--main-color-dark: #0369ae;
			--caution-color: orange;
			--caution-color-dark: #ff8500;
			--legend-font-weight: var(--legend-font-weight);
		}

		/* #region Main control */
		main.control {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			flex-wrap: wrap;
			font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode',
				Geneva, Verdana, sans-serif;
			/* width: 182mm; */
			width: 40.5em;
			margin: 0 auto;
			margin-bottom: 1em;
			padding: 0.5em;
			border: 1px dotted gray;
			border-radius: 1em;

			.legend {
				font-size: 1em;
				font-weight: var(--legend-font-weight);
				margin: 0;
			}
		}

		fieldset {
			border: none;
			margin-bottom: 0.5em;
			padding-right: 0.6em;
			width: 100%;
		}

		h2.legend {
			font-weight: var(--legend-font-weight);
			min-width: 3em;
		}

		/* #region .class-info */
		.class-info {
			display: flex;
			flex-direction: row;
			justify-content: left;

			div {
				&:not(.legend) {
					border-right: 1px solid gray;
					padding: 0 0.5em;
				}

				&:last-of-type {
					border-right: none;
				}
			}
			p {
				margin: 0 0.1em;
			}
		}

		/* remove spin buttons */
		#class-number {
			appearance: textfield;
			-moz-appearance: textfield;
			height: 1.2em;
			width: 1.5em;
			text-align: center;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none;
			}
		}

		/* #region assignment */
		.assignment-type,
		.dates {
			display: flex;
			flex-direction: row;
			justify-content: left;
			align-items: left;
		}

		.assignment-type > label {
			padding-right: 0.5em;
		}

		.dates {
			label {
				padding: 0 0.5em;
			}

			input.date {
				margin-right: 1em;
				width: 6em;
				text-align: center;
			}
		}

		.students-input {
			margin-bottom: 0;

			.title {
				font-size: 1em;
				font-weight: var(--legend-font-weight);
			}

			.hints {
				font-size: 0.7em;
			}

			#student-list-input {
				min-width: 100%;
				height: 1.5em;
			}
		}

		input {
			border-radius: 3px;
			border-width: 1px;

			&.caution:invalid {
				color: var(--caution-color-dark);
				border-color: var(--caution-color);
			}
		}

		textarea:invalid,
		input:invalid,
		input.warning {
			color: red;
			border: 1px solid red;
			/* box-shadow:
			0 2px 4px 0 rgba(255, 0, 0, 0.2),
			0 4px 10px 0 rgba(255, 0, 0, 0.19); */
		}

		p.warning {
			color: red;
		}

		.hide {
			display: none;
		}

		/* #region .student-table */
		.student-table {
			border-collapse: collapse; /* Remove space between borders */
			margin-left: 1.5em;
			margin-bottom: 0.5em;

			th {
				font-size: 0.8em;
				font-weight: 300;
				background-color: lightgray;
				border: 1px solid lightgray;
			}

			.student td {
				border: 1px solid #ccc; /* Light grey border for a subtle grid */
				padding: 4px; /* Padding inside cells */

				&.student-id {
					width: 3.3em;
				}

				&.chinese-name {
					width: 3.5em;
					text-align: center;

					input {
						text-align: center;
					}
				}

				&.english-name {
					width: 10em;
				}

				&.chinese-class {
					width: 3.5em;

					input {
						text-align: center;
					}
				}

				input {
					width: 100%; /* Make input fill the cell */
					border: none;
					background-color: transparent;
					padding: 0;
					margin: 0;
					box-sizing: border-box; /* Include padding and border in the element's size */

					&:focus {
						outline: none; /* Remove focus outline */
						background-color: #eef; /* Optional: highlight on focus */
					}
				}
			}
		}

		/* #region .action-button */
		.action-button {
			background-color: var(--main-color);
			color: white;
			border: none;
			border-radius: 4px;
			padding: 0.5em 1em;
			margin-left: 1em;
			font-weight: var(--legend-font-weight);

			&:hover {
				background-color: var(--main-color-dark);
				cursor: pointer;
			}

			&.caution {
				background-color: var(--caution-color);

				&:hover {
					background-color: var(--caution-color-dark);
				}
			}

			&.invalid {
				color: white;
				background-color: red;
				cursor: default;
			}
		}
		/* #region #signature-drop-zone  */
		#signature-drop-zone {
			display: inline;
			text-decoration: none;
			background: #fbfbfb;
			border: 2px dashed #ccc;
			border-radius: 10px;
			padding: 5px 20px;
			margin-left: 10px;
			text-align: center;
			cursor: pointer;
			width: 455px;

			p {
				color: darkgray;
			}

			&.has-signature {
				display: grid;
				grid-template-columns: auto 2.75em;
			}

			&.drag-over {
				border-color: steelblue; /* Change border color when dragging over */
				background: #f0ffff;
			}

			.trash svg {
				display: block;
			}
		}

		#signature-upload {
			/* intentionally hidden */
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			border: 0;
		}

		.signature-preview {
			align-self: center;
			justify-self: center;
			height: 14mm;
		}

		#remove-signature {
			align-self: center;
			justify-self: center;
			padding: 0.4em;
			background: #fafafa;

			&:hover {
				background-color: #fafafa; /*override .secondary.action-button:hover*/
			}
		}

		/* #region .secondary.action-button */
		.secondary.action-button {
			color: var(--main-color);
			background: transparent;
			border: 1px solid var(--main-color);

			&:hover {
				color: var(--main-color-dark);
				background: white;
				border-color: var(--main-color-dark);
				cursor: pointer;
			}
		}

		#print {
			display: inline-block;
		}
	}

	.b5-size {
		display: flex;
		flex-flow: column;
		/* JIS B5 */
		width: 182mm;
		/* height: 257mm; */
		margin: 0 auto;
	}

	/* #region @media print */
	@media print {
		.b5-size {
			/* height: 257mm; */
			margin: 4.23mm;
		}
		main.control {
			display: none;
			visibility: hidden;
			width: 0;
			height: 0;
		}
	}
</style>
