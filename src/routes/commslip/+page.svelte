<script>
	import { assignment, isValidDate } from '$lib/stores/commslip';
	import { writable, derived, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';

	import { format, parse } from 'date-fns';
	import TabBar from '$lib/components/TabBar.svelte';
	import SlipTemplate from '$lib/components/SlipTemplate.svelte';

	// Constants and Enums------------------------------------------------------------
	const CLIL = 'CLIL';
	const COMM = 'Comm';
	const WORKBOOK = 'workbook';
	const PASSPORT = 'passport';
	const RECORDING = 'recording';
	const EXAM = 'exam';
	const CLASS_TYPE = [COMM, CLIL];
	const ASSIGNMENTS_TYPES = [
		{ code: PASSPORT, english: 'Passport', chinese: '英文護照' },
		{ code: RECORDING, english: 'Recording', chinese: '錄影(錄音)' },
		{ code: WORKBOOK, english: 'Workbook', chinese: '作業本' },
		{ code: EXAM, english: 'Oral Exam', chinese: '期末考口試' }
	];

	const STATUS_TYPES = [
		{ code: 0, text: { english: "hasn't been submitted", chinese: '未繳交' } },
		{ code: 1, text: { english: "wasn't completed", chinese: '完成度不佳' } }
	];

	let showHints = true; // Hints are visible by default

	let grade = 'Unknown';

	let allSelected = false; // Tracks the master checkbox state

	let levelType = [
		{ id: 'ele', label: 'Ele', value: 'Elementary' },
		{ id: 'bas', label: 'Basic', value: 'Basic' },
		{ id: 'int', label: 'Int', value: 'Intermediate' },
		{ id: 'adv', label: 'Adv', value: 'Advanced' }
	];

	let dateFields = [
		{ label: 'Assigned:', key: 'assigned' },
		{ label: 'Due:', key: 'due' },
		{ label: 'Late:', key: 'late' }
	];

	let printInvalid = false;
	let printCaution = false;

	// Reactive Statements and Stores------------------------------------------------------------
	let studentsData = writable([]);

	let studentsInput = writable('');

	let ESLClass = writable({
		//with defaults
		grade: '',
		level: 'Elementary',
		type: COMM,
		num: ''
	});

	let students = derived(studentsInput, ($studentsInput) => {
		// First, split the input into lines and filter out empty lines
		let lines = $studentsInput.split('\n').filter((line) => line.trim() !== '');

		// If after filtering there are no lines, return an empty array
		if (lines.length === 0) {
			return [];
		}

		// Process each line to create student objects
		return (
			lines
				.map((row) => {
					let studentDataFields = row.split('\t');

					let student = {
						id: '',
						name: { english: '', chinese: '' },
						cClass: '',
						status: STATUS_TYPES[0].text,
						selected: true
					};

					studentDataFields.forEach((field) => {
						if (/^\d{7}$/.test(field)) {
							student.id = field;
						} else if (/^[JH]\d{3}$/.test(field)) {
							student.cClass = field;
						} else if (/[\u4e00-\u9fa5]/.test(field)) {
							student.name.chinese = field;
						} else if (/^[a-zA-Z]+(\s[a-zA-Z]+){1,2}$/.test(field)) {
							student.name.english = field;
						}
					});
					return student;
				})
				// Ensure no null students are included and sort by English name
				.filter((student) => student !== null)
				.sort((a, b) => a.name.english.localeCompare(b.name.english))
		);
	});

	$: studentsData.set($students);

	let assignmentRadio = writable(ASSIGNMENTS_TYPES.find((type) => type.code === PASSPORT)); //default to passport

	let signatureImage = writable(''); // Use this to bind the image source in SlipTemplate

	$: {
		// automatically switch to Comm if G9 is chosen
		if ($ESLClass.grade === 'G9') {
			ESLClass.update((value) => ({ ...value, type: COMM }));
		}
	}

	$: {
		const className = `${$ESLClass.grade} ${$ESLClass.level} ${$ESLClass.num ? $ESLClass.num : '?'} ${$ESLClass.type}`;
		const assignedDateFormatted = processDate($assignment.assigned);
		const dueDateFormatted = processDate($assignment.due);
		const lateDateFormatted = processDate($assignment.late);
		const selectedTypeDetails = ASSIGNMENTS_TYPES.find(
			(type) => type.code === $assignmentRadio.code
		);

		assignment.set({
			...$assignment,
			esl: className,
			type: selectedTypeDetails,
			assigned: assignedDateFormatted,
			due: dueDateFormatted,
			late: lateDateFormatted
		});
	}

	$: {
		const newType = $ESLClass.type === CLIL ? WORKBOOK : PASSPORT;
		const assignmentTypeDetails = ASSIGNMENTS_TYPES.find((type) => type.code === newType);

		if (assignmentTypeDetails) {
			assignment.update((currentAssignment) => ({
				...currentAssignment,
				type: assignmentTypeDetails
			}));

			assignmentRadio.set({
				code: assignmentTypeDetails.code,
				english: assignmentTypeDetails.english,
				chinese: assignmentTypeDetails.chinese
			});
		}
	}

	// Ensure this reactive statement runs whenever $studentsData changes
	$: allSelected = $allStudentsSelected.checked
		? true
		: $allStudentsSelected.indeterminate
			? 'indeterminate'
			: false;

	// indeterminate state relies on allStudentsSelected
	$: if (typeof window !== 'undefined') {
		//only attempts to manipulate the DOM when it is available
		const checkbox = document.querySelector('thead input[type="checkbox"]');
		if (checkbox) {
			checkbox.indeterminate = allSelected === 'indeterminate';
		}
	}

	$: printInvalid =
		!$ESLClass.num ||
		(!$allStudentsSelected.indeterminate && !$allStudentsSelected.checked) ||
		!$students.length;

	$: printCaution =
		!printInvalid &&
		(!isValidDate($assignment.assigned) ||
			!isValidDate($assignment.due) ||
			!isValidDate($assignment.late));

	// Derived store to manage the master checkbox state
	const allStudentsSelected = derived(studentsData, ($studentsData) => {
		const allChecked = $studentsData.every((student) => student.selected);
		const anyChecked = $studentsData.some((student) => student.selected);
		// Return an object with both states
		return {
			checked: allChecked,
			indeterminate: !allChecked && anyChecked
		};
	});

	// Component Logic------------------------------------------------------------
	function updateStudentsData(index, key, value) {
		studentsData.update((students) => {
			if (key === 'status.code') {
				students[index].status = STATUS_TYPES.find((status) => status.code === Number(value)).text;
			} else if (key.includes('.')) {
				const keys = key.split('.');
				students[index][keys[0]][keys[1]] = value;
			} else {
				students[index][key] = value;
			}
			return students;
		});
	}

	//indeterminate can't be set through Svelte binding. So going manual here
	function toggleAllStudents() {
		const currentState = get(allStudentsSelected); // Use Svelte's get to unwrap the store value
		const newState = !currentState.checked || currentState.indeterminate;
		studentsData.update((students) => {
			students.forEach((student) => (student.selected = newState));
			return students;
		});
	}

	// Utility Functions------------------------------------------------------------
	/** @param {string} input */
	function processDate(input) {
		// Assuming the input format is 'MM/DD'
		const currentYear = new Date().getFullYear();
		const date = parse(`${currentYear}/${input}`, 'yyyy/MM/dd', new Date());

		// Check if the date is valid, if not return null
		if (isNaN(date)) return input;

		return format(date, 'M/d');
	}

	/** @param {string} pastedText*/
	function determineGradeFromText(pastedText) {
		const gradeMatch = pastedText.match(/J1\d{2}|J2\d{2}|J3\d{2}/);
		if (gradeMatch) {
			const matchCode = Number(gradeMatch[0].charAt(1));
			if (matchCode >= 1 && matchCode <= 3) {
				return `G${matchCode + 6}`;
			}
		}
		return 'Unknown Grade'; // Return a default value or handle the case differently
	}
	/** @param {File} file*/
	function validateAndSetImage(file) {
		if (
			(!file.type.match('image/jpeg') && !file.type.match('image/png')) ||
			file.size > 100 * 1024
		) {
			alert('Only JPG and PNG under 100KB is allowed.');
			return false;
		}

		const fileURL = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			if (img.height <= 160) {
				alert('Image height must be greater than 160px.');
				URL.revokeObjectURL(img.src); // Clean up the URL object
				return;
			}
			signatureImage.set(fileURL);
		};
		img.onerror = () => {
			alert('Unknown error at loading the image.');
			URL.revokeObjectURL(img.src); // Clean up the URL object
		};
		img.src = fileURL;
		return true;
	}

	// Event Handlers------------------------------------------------------------
	/**
	 * @param {string} studentId
	 * @param {string} newStatusCode
	 */
	function handleStatusChange(studentId, newStatusCode) {
		$studentsData = $studentsData.map((student) => {
			if (student.id === studentId) {
				let status = STATUS_TYPES.find((status) => status.code === Number(newStatusCode));
				return { ...student, status: status ? status.text : student.status };
			}
			return student;
		});
	}

	/** @param {ClipboardEvent} e - The paste event object. */
	function handlePaste(e) {
		e.preventDefault(); // Prevent the default paste action

		// Ensure e.target is an HTMLElement using type assertion with JSDoc
		if (!(e.target instanceof HTMLElement)) return; // Exit the function if e.target is not an HTMLElement

		// Get the pasted text from the clipboard
		const pastedText = (e.clipboardData || window.clipboardData).getData('text');

		// Strip blank lines from the pasted text
		const modifiedText = pastedText
			.split('\n')
			.filter(
				/** @param {string} line */
				(line) => line.trim() !== ''
			) // Filter out empty lines
			.join('\n'); // Join the lines back together without appending default status code

		// Update the studentsInput store with the modified text
		studentsInput.set(modifiedText);

		// Hide the textarea & hints after pasting
		e.target.style.display = 'none';
		showHints = false;

		grade = determineGradeFromText(pastedText);
		ESLClass.update((current) => ({ ...current, grade }));
	}

	function handleDateInput(event, assignmentKey) {
		const inputField = event.target;
		const isValid = isValidDate(inputField.value);

		if (!isValid) {
			inputField.setCustomValidity('Please enter a valid date in MM/DD format.');
		} else {
			inputField.setCustomValidity(''); // Clear custom validity message
		}

		// Update the assignment store
		assignment.update((n) => ({ ...n, [assignmentKey]: inputField.value }));
	}

	function handleFileSelect(event) {
		const file = event.target.files[0];
		validateAndSetImage(file);
	}

	function handleDragOver(event) {
		event.preventDefault(); // Prevent default behavior (Prevent file from being opened)
		event.target.classList.add('drag-over'); // Optional: Add a class for styling
	}

	function handleDragLeave(event) {
		event.target.classList.remove('drag-over'); // Optional: Remove the class when dragging leaves
	}

	function handleDrop(event) {
		event.preventDefault();
		event.target.classList.remove('drag-over'); // Remove styling class

		const file = event.dataTransfer.files[0]; // Get the dropped file
		if (file) validateAndSetImage(file);
		if (!file) return;
	}

	function removeSignature(event) {
		event.stopPropagation(); // This stops the click event from bubbling up to parent elements
		signatureImage.set(''); // Clear the signature image
	}
	// Lifecycle Hooks------------------------------------------------------------
	onMount(async () => {
		const today = format(new Date(), 'MM/dd'); // Format today's date as 'MM/DD'
		$assignment.due = today;

		if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
			const img = new Image();
			img.onload = () => {
				// Image exists and is loaded, update signatureImage to its path
				signatureImage.set('sig.png');
			};
			img.onerror = (e) => {
				// Image doesn't exist, do nothing or log an error if needed
			};
			img.src = 'sig.png'; // Adjust the path as necessary
		}
	});

	onDestroy(() => {
		// If the image URL is still set, revoke it before the component is destroyed
		const currentFileURL = get(signatureImage);
		if (currentFileURL) {
			URL.revokeObjectURL(currentFileURL);
		}
	});
</script>

<TabBar />
<main class="control">
	<fieldset class="students-input">
		<legend>
			<span class="title">Students</span>
			<span class="hints {showHints ? '' : 'hide'}">
				{`Paste Excel student rows with fields: [ID, Chinese Name, English Name, Chinese Class]`}
			</span>
		</legend>
		<textarea
			id="sList"
			cols="30"
			rows="10"
			bind:value={$studentsInput}
			on:paste={(e) => handlePaste(e)}
			class={`${$studentsData.length === 0 || allSelected === false ? 'warning' : ''}`}
			required
		></textarea>
	</fieldset>

	{#if $studentsData.length > 0}
		<table class="student-table">
			{#if $studentsData.length}
				<thead>
					<tr>
						<th>
							<input
								id="master-checkbox"
								type="checkbox"
								bind:checked={allSelected}
								on:change={toggleAllStudents}
							/>
						</th>
						<th>ID</th>
						<th>C. Name</th>
						<th>English Name</th>
						<th>C. Class</th>
						<th>Status</th>
					</tr>
				</thead>
			{/if}
			<tbody>
				{#each $studentsData as student, i (student.id)}
					<!-- student row -->
					<tr class="student">
						<td class="student-checkbox">
							<input type="checkbox" bind:checked={student.selected} />
						</td>
						<td class="student-id">
							<input
								bind:value={student.id}
								on:input={(e) => updateStudentsData(i, 'id', e.target.value)}
							/>
						</td>
						<td class="chinese-name">
							<input
								bind:value={student.name.chinese}
								on:input={(e) => updateStudentsData(i, 'name.chinese', e.target.value)}
							/>
						</td>
						<td class="english-name">
							<input
								bind:value={student.name.english}
								on:input={(e) => updateStudentsData(i, 'name.english', e.target.value)}
							/>
						</td>
						<td class="chinese-class">
							<input
								bind:value={student.cClass}
								on:input={(e) => updateStudentsData(i, 'cClass', e.target.value)}
							/>
						</td>
						<td class="status">
							<select on:change={(e) => handleStatusChange(student.id, e.target.value)}>
								{#each STATUS_TYPES as status}
									<option value={status.code}>
										{status.text.english}
									</option>
								{/each}
							</select>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<fieldset class="class-info">
		<div class="legend">Class</div>
		<div>{grade}</div>
		<!-- level -->
		<div>
			{#each levelType as { id, label, value }}
				<input type="radio" {id} bind:group={$ESLClass.level} {value} />
				<label for={id}>{label}</label>
			{/each}
		</div>
		<!-- class type -->
		<div>
			{#each CLASS_TYPE as type}
				{#if type !== CLIL || $ESLClass.grade !== 'G9'}
					<input type="radio" id={type} bind:group={$ESLClass.type} value={type} />
					<label for={type}>{type}</label>
				{/if}
			{/each}
		</div>
		<!-- class number -->
		<div>
			<input
				type="number"
				id="class-number"
				bind:value={$ESLClass.num}
				class={`${!$ESLClass.num ? 'warning' : ''}`}
				max="9"
				min="1"
				required
			/>
		</div>
	</fieldset>

	<fieldset class="assignment-type">
		<div class="legend">Type</div>
		{#each ASSIGNMENTS_TYPES as { code, english, chinese }}
			{#if (($ESLClass.type === CLIL && code === WORKBOOK) || $ESLClass.type === COMM) && !($ESLClass.grade === 'G9' && code === WORKBOOK)}
				<input type="radio" id={code} bind:group={$assignmentRadio.code} value={code} />
				<label for={code}>{english}</label>
			{/if}
		{/each}
	</fieldset>

	<fieldset class="dates">
		<div class="legend">Dates</div>
		{#each dateFields as field}
			<label for={field.key}>{field.label}</label>
			<input
				type="text"
				name=""
				id={field.key}
				bind:value={$assignment[field.key]}
				class={`date ${!$assignment[field.key] || !isValidDate($assignment[field.key]) ? 'caution' : ''}`}
				on:input={(e) => handleDateInput(e, field.key)}
				required
			/>
		{/each}
	</fieldset>

	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		id="signature-drop-zone"
		class:has-signature={$signatureImage}
		on:dragover={handleDragOver}
		on:drop={handleDrop}
		on:dragleave={handleDragLeave}
		on:click={() => document.getElementById('signature-upload').click()}
		aria-label="Drag & drop signature"
		tabindex="0"
		role="button"
	>
		{#if $signatureImage}
			<img class="signature-preview" src={$signatureImage} alt="Signature Preview" />
			<button
				id="remove-signature"
				on:click={(event) => removeSignature(event)}
				class="trash secondary action-button"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3zM7 6h10v13H7zm2 2v9h2V8zm4 0v9h2V8z"
					/>
				</svg>
			</button>
		{:else}
			<p>Drop signature image here or</p>
			<button id="browse" class="secondary action-button">browse</button>
		{/if}
	</div>
	<input type="file" id="signature-upload" accept="image/*" on:change={handleFileSelect} />
	<button
		id="print"
		on:click={() => window.print()}
		class="action-button"
		class:invalid={printInvalid}
		class:caution={printCaution}
	>
		Print
	</button>
</main>

<div id="b5-print" class="b5-size">
	{#each $studentsData.filter((student) => student.selected) as student, i}
		<SlipTemplate {student} signatureSrc={$signatureImage} />
	{/each}
</div>

<style>
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
		}

		main.control {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			flex-wrap: wrap;
			font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode',
				Geneva, Verdana, sans-serif;
			/* width: 182mm; */
			width: 172mm;
			margin: 0 auto;
			margin-bottom: 1em;
			padding: 0.5em;
			border: 1px dotted gray;
			border-radius: 1em;
		}

		svg {
			display: block;
		}

		fieldset {
			border: none;
			margin-bottom: 0.5em;
		}

		.class-info {
			display: flex;
			flex-direction: row;
			justify-content: left;

			.legend {
				font-weight: 600;
			}
			div:not(.legend) {
				border-right: 1px solid gray;
				padding: 0 0.5em;
			}

			div:last-of-type {
				border-right: none;
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

		.assignment-type,
		.dates {
			display: flex;
			flex-direction: row;
			justify-content: left;
			align-items: left;
		}

		.assignment-type .legend,
		.dates .legend {
			font-weight: 600;
		}

		.assignment-type > label {
			padding-right: 0.5em;
		}

		.dates {
			label {
				padding: 0 0.5em;
			}

			input {
				margin-right: 1em;
				width: 6em;
			}

			input.date {
				text-align: center;
			}
		}

		.students-input {
			margin-bottom: 0;

			span.title {
				font-size: 1em;
				font-weight: 600;
			}

			span {
				font-size: 0.7em;
			}

			textarea {
				min-width: 45em;
				max-width: 90%;
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
		.warning {
			color: red;
			border: 1px solid red;
			/* box-shadow:
			0 2px 4px 0 rgba(255, 0, 0, 0.2),
			0 4px 10px 0 rgba(255, 0, 0, 0.19); */
		}

		.hints.hide {
			display: none;
		}

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
					width: 3.5em;
				}

				&.chinese-name {
					width: 5.5em;
				}

				&.english-name {
					width: 10em;
				}

				&.chinese-class {
					width: 3.5em;
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

		.action-button {
			background-color: var(--main-color);
			color: white;
			border: none;
			border-radius: 4px;
			padding: 0.5em 1em;
			margin-left: 1em;
			font-weight: 600;

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
			width: 500px;

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
				background: #fafafa; /*override .secondary.action-button:hover*/
			}
		}

		.secondary.action-button {
			color: var(--main-color);
			background: transparent;
			border: 1px solid var(--main-color);

			&:hover {
				color: var(--main-color-dark);
				background: white;
				border: 1px solid var(--main-color-dark);
				cursor: pointer;
			}
		}

		#print {
			display: inline-block;
		}
	}

	.b5-size {
		/* JIS B5 */
		width: 182mm;
		/* height: 257mm; */
		margin: 0 auto;
	}

	@media print {
		.b5-size {
			/* JIS B5 */
			width: 182mm;
			/* height: 257mm; */
			margin: 4.23mm;
			display: flex;
			flex-flow: column;
		}
		main.control {
			display: none;
			visibility: hidden;
			width: 0;
			height: 0;
		}
	}
</style>
