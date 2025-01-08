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

	let UIStateESLGrade = $state('');
	let UIStateESLLevel = $state(LEVEL_TYPE[2].value);
	let UIStateESLType = $state(ClassType.COMM); //default to Comm if it's G9
	let UIStateESLNumber = $state('');
	let className = $derived(
		[UIStateESLGrade, UIStateESLLevel, UIStateESLNumber, UIStateESLType].join(' ')
	);

	$effect(() => {
		UIStateESLGrade = grade;
		if (UIStateESLType === ClassType.CLIL) UIStateAssignment = AssignmentCode.workbook; //change default to Workbook if it's CLIL
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
		workbook = 'workbook',
		passport = 'passport',
		recording = 'recording',
		exam = 'exam',
		speech = 'speech'
	}

	const COMM_ASSIGNMENT_TYPES = [
		{ code: AssignmentCode.passport, english: 'Passport', chinese: '英文護照', isG9: true },
		{ code: AssignmentCode.recording, english: 'Recording', chinese: '錄影(錄音)', isG9: true },
		{ code: AssignmentCode.workbook, english: 'Workbook', chinese: '作業本', isCLIL: true },
		{ code: AssignmentCode.exam, english: 'Oral Exam', chinese: '期中/末考口試', isG9: true },
		{ code: AssignmentCode.speech, english: 'Speech Practice', chinese: '演講練習', isCLIL: true }
	];

	const G9_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isG9);

	const CLIL_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isCLIL);

	const assignmentTypes = $derived.by(() => {
		return UIStateESLGrade === 'G9'
			? G9_ASSIGNMENT_TYPES
			: UIStateESLType === ClassType.CLIL
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

	let UIStateAssignment = $state(AssignmentCode.passport); //default to passport

	let assignment = $derived.by(() => {
		const assignmentTypeText = assignmentTypes.find((type) => type.code === UIStateAssignment);
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

		// Check if the file size is less than 100KB
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
<main
	class="print:hidden w-[43em] flex justify-start items-center flex-wrap m-auto mb-4 p-2 border-dotted border-2 font-sans rounded-lg"
>
	<!-- MARK: #students -->
	<fieldset class="w-full mb-0 pr-2 students-input">
		<legend>
			<h2 class="text-slate-500">
				<span class="w-12 font-semibold text-base">Students</span>
				<span class="hint text-xs {shouldHideTextarea ? 'hidden' : ''}">
					{`Paste Excel student rows with fields: [ID, Chinese Name, English Name, Chinese Class]`}
				</span>
			</h2>
		</legend>
		<textarea
			name=""
			id="student-list-input"
			class="{shouldHideTextarea
				? 'hidden'
				: ''} min-w-full h-6 border invalid:border-red-400 invalid:border-2"
			bind:value={studentsText}
			required
		></textarea>
	</fieldset>
	<!-- MARK: #student-table -->
	{#if studentsRaw.length > 0}
		<table class="ml-6 mb-4 border-collapse student-table">
			<thead class="text-xs font-semibold bg-slate-100">
				<tr>
					<th class="border-solid border border-slate-300">
						<input
							type="checkbox"
							id="master-checkbox"
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
					<tr class="student">
						<td class="student-checkbox">
							<input type="checkbox" bind:checked={student.selected} />
						</td>
						<td class="w-20 student-id">
							<input class="text-center" type="text" bind:value={student.id} />
						</td>
						<td class="w-14 chinese-name">
							<input class="text-center" type="text" bind:value={student.name.chinese} />
						</td>
						<td class="w-40 english-name">
							<input type="text" bind:value={student.name.english} />
						</td>
						<td class="w-14 chinese-class">
							<input class="text-center" type="text" bind:value={student.cClass} />
						</td>
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
	<fieldset class="flex flex-row justify-start items-center mb-2 pr-2 class-info">
		<h2 class="w-12 font-semibold text-slate-500">Class</h2>
		<div class="px-3 class-grade">
			<p class="grade {grade === 'Unknown' ? 'text-red-600' : ''}">{grade}</p>
		</div>

		<!-- ESL-level -->
		<div class="flex flex-row justify-start items-center rounded-full bg-blue-100 p-1 mx-1">
			{#each LEVEL_TYPE as { id, label, value }}
				<label
					class="rounded-full px-2 text-slate-500 hover:text-slate-900 has-[:checked]:bg-blue-500 has-[:checked]:text-white cursor-pointer"
					for={id}
				>
					<input class="appearance-none" type="radio" {id} bind:group={UIStateESLLevel} {value} />
					{label}
				</label>
			{/each}
		</div>

		<!-- ESL-type -->
		<div class="flex flex-row justify-start items-center rounded-full bg-blue-100 p-1 mx-1">
			{#each Object.entries(ClassType) as [type, value]}
				<!-- only render CLIL if class is not G9 -->
				{#if value !== ClassType.CLIL || UIStateESLGrade !== 'G9'}
					<label
						class="rounded-full px-2 text-slate-500 hover:text-slate-900 has-[:checked]:bg-blue-500 has-[:checked]:text-white cursor-pointer"
						for={type}
					>
						<input
							class="appearance-none"
							type="radio"
							id={type}
							bind:group={UIStateESLType}
							{value}
							aria-label={value}
						/>
						{value}
					</label>
				{/if}
			{/each}
		</div>

		<!-- ESL-class-number -->
		<div class="class-number">
			<input
				type="number"
				class={`h-5 w-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center rounded border invalid:border-2 invalid:border-red-400 ${!UIStateESLNumber ? 'text-red-400' : ''}`}
				bind:value={UIStateESLNumber}
				placeholder="#"
				max="9"
				min="1"
				required
			/>
		</div>
	</fieldset>

	<!-- MARK: #assignment-type -->
	<fieldset class="flex flex-row justify-start items-center mb-2 mr-2">
		<h2 class="w-12 font-semibold text-slate-500">Type</h2>
		<div class="flex flex-row justify-start items-center rounded-full bg-blue-100 p-1 mx-1">
			{#each assignmentTypes as { code, english }}
				<label
					class="rounded-full px-2 text-slate-500 hover:text-slate-900 has-[:checked]:bg-blue-500 has-[:checked]:text-white cursor-pointer"
					for={code}
				>
					<input
						class="appearance-none"
						type="radio"
						id={code}
						bind:group={UIStateAssignment}
						value={code}
					/>
					{english}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- MARK: #dates -->
	<fieldset class="flex flex-row justify-start items-start mb-2 pr-2 dates">
		<h2 class="w-12 font-semibold text-slate-500">Dates</h2>
		{#each DATE_FIELDS as { key, label }}
			<label class="px-2" for={key}>{label}</label>
			<input
				class={`border first-of-type:invalid:border-orange-400 invalid:border-red-400 invalid:border-2  rounded-md mr-2 w-20 text-center  ${!UIStateDates[key as keyof typeof UIStateDates] || !isValidMonthAndDay(UIStateDates[key]) ? 'text-red-400 border-red-400 border-2' : 'border-neutral-500'}`}
				type="text"
				name={key}
				id={key}
				bind:value={UIStateDates[key as keyof typeof UIStateDates]}
				maxlength="5"
				required
			/>
		{/each}
	</fieldset>

	<!-- MARK: #signature-drop-zone -->
	<div
		class={`inline w-5/6 text-slate-400 text-center text-decoration-none bg-slate-50 rounded-lg border-dashed border-2 py-2 px-8 ml-2 cursor-pointer ${signatureImage ? 'grid grid-cols-[auto_2.75em]' : ''}`}
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
			<img
				class="h-[14mm] self-center justify-self-center signature-preview"
				src={signatureImage}
				alt="Signature Preview"
			/>

			<!-- remove signature button -->
			<button
				class="self-center justify-self-center block py-2 px-2 rounded-lg border text-blue-400 hover:text-slate-50 bg-slate-50 hover:bg-blue-400 border-blue-400 hover:border-slate-50 hover:pointer"
				onclick={(event) => removeSignature(event)}
				aria-label={'remove-signature'}
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
			<button
				class="self-center justify-self-center block py-1 px-4 mt-2 rounded-lg border text-blue-400 hover:text-blue-50 border-blue-400 hover:border-blue-600 bg-slate-50 hover:bg-blue-500 hover:pointer"
				>browse…
			</button>
		{/if}
	</div>
	<input
		type="file"
		id="signature-upload"
		class="absolue overflow-hidden w-px h-px p-0 border-0 -m-px"
		accept="image/*"
		onchange={handleFileSelect}
	/>

	<!-- <p class="inline-block w-full pt-2 text-center text-blue-400">
		Print by pressing "ctrl + p" (Win) or "&#8984 + p" ( Apple)
	</p> -->
	<button
		id="print"
		class="	text-white ml-6 py-1 px-4 rounded-lg mt-2
		bg-blue-500
		{printInvalid ? 'bg-red-500' : ''} 
		{printCaution ? 'bg-orange-500' : ''}
	 hover:bg-blue-600
	 	{printInvalid ? 'hover:bg-red-600' : ''} 
		{printCaution ? 'hover:bg-orange-600' : ''}"
		onclick={() => window.print()}
		use:tooltip={() => ({ content: 'Print to JIS-B5 and single-sided' })}
	>
		Print
	</button>
</main>

<!-- MARK: Slips -->
<div
	id="b5-print"
	class="flex flex-col flex-nowrap w-[182mm] my-0 mx-auto print:m-[4.23mm] b5-size"
>
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

		/* #region .student-table */
		.student-table {
			.student td {
				border: 1px solid #ccc; /* Light grey border for a subtle grid */
				padding: 4px; /* Padding inside cells */

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
