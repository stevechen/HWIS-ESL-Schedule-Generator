<script>
	import { assignment } from '$lib/stores/commslip';
	import { writable, derived, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import moment from 'moment';
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

	const STATUS = [
		{ code: 0, text: { english: "hasn't been submitted", chinese: '未繳交' } },
		{ code: 1, text: { english: "wasn't completed", chinese: '完成度不佳' } }
	];

	let showHints = true; // Hints are visible by default

	let grade = 'Unknown';

	let allSelected = false; // Tracks the master checkbox state

	// Reactive Statements and Stores------------------------------------------------------------
	let studentsData = writable([]);

	let assignedInput = writable('');
	let dueInput = writable('');
	let lateInput = writable('');

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
						status: STATUS[0].text,
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
		const className = `${$ESLClass.grade} ${$ESLClass.level} ${$ESLClass.num} ${$ESLClass.type}`;
		const assignedDateFormatted = processDate($assignedInput);
		const dueDateFormatted = processDate($dueInput);
		const lateDateFormatted = processDate($lateInput);
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
				students[index].status = STATUS.find((status) => status.code === Number(value)).text;
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
	/** @param {moment.MomentInput} input */
	function processDate(input) {
		const date = moment(input).format('MM/DD');
		return date === 'Invalid date' ? null : date;
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

	// Event Handlers------------------------------------------------------------
	/**
	 * @param {string} studentId
	 * @param {string} newStatusCode
	 */
	function handleStatusChange(studentId, newStatusCode) {
		$studentsData = $studentsData.map((student) => {
			if (student.id === studentId) {
				let status = STATUS.find((status) => status.code === Number(newStatusCode));
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

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Check if the file type is JPG or PNG and is under 100KB
		if (
			(!file.type.match('image/jpeg') && !file.type.match('image/png')) ||
			file.size > 100 * 1024
		) {
			alert('Only JPG and PNG file under 100KB is allowed.');
			return;
		}

		// Create a URL for the file
		const fileURL = URL.createObjectURL(file);

		// Use an Image object to load the file and check its height
		const img = new Image();

		img.onload = () => {
			// URL.revokeObjectURL(img.src); // Clean up the URL object

			// Check if the image height is greater than 165px
			if (img.height <= 160) {
				alert('Image height should be greater than 165px.');
				return;
			}

			// If all checks pass, set the image source
			signatureImage.set(fileURL);
		};
		img.onerror = () => {
			alert('There was an error loading the image.');
		};
		img.src = fileURL;
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
		if (file && file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				signatureImage.set(e.target.result); // Update the image source
			};
			reader.readAsDataURL(file);
		}
	}

	// Lifecycle Hooks------------------------------------------------------------
	onMount(async () => {
		const today = moment().format('MM/DD'); // Format today's date as needed
		dueInput.set(today);

		const img = new Image();

		img.onload = () => {
			// Image exists and is loaded, update signatureImage to its path
			signatureImage.set('sig.png');
		};
		img.onerror = (e) => {
			// Image doesn't exist, do nothing or log an error if needed
		};
		img.src = 'sig.png'; // Adjust the path as necessary
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
	<!-- <h1>Communication Slip Generator</h1> -->
	<fieldset class="students">
		<legend>
			<span class="title">Students:</span>
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
		></textarea>
	</fieldset>

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
				<tr>
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
							{#each STATUS as status}
								<option value={status.code} selected={status.code === student.status.code}>
									{status.text.english}
								</option>
							{/each}
						</select>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<fieldset class="class-info">
		<div class="legend">Class:</div>
		<div>{grade}</div>
		<div>
			<input type="radio" id="ele" bind:group={$ESLClass.level} value="Elementary" />
			<label for="ele">Ele</label>
			<input type="radio" id="bas" bind:group={$ESLClass.level} value="Basic" />
			<label for="bas">Basic</label>
			<input type="radio" id="int" bind:group={$ESLClass.level} value="Intermediate" />
			<label for="int">Int</label>
			<input type="radio" id="adv" bind:group={$ESLClass.level} value="Advanced" />
			<label for="adv">Adv</label>
		</div>
		<div>
			{#each CLASS_TYPE as type}
				{#if type !== CLIL || $ESLClass.grade !== 'G9'}
					<input type="radio" id={type} bind:group={$ESLClass.type} value={type} />
					<label for={type}>{type}</label>
				{/if}
			{/each}
		</div>
		<div>
			<input type="text" bind:value={$ESLClass.num} class={`${!$ESLClass.num ? 'warning' : ''}`} />
		</div>
	</fieldset>

	<fieldset class="assignment-type">
		<div class="legend">Type:</div>
		{#each ASSIGNMENTS_TYPES as type}
			{#if (($ESLClass.type === CLIL && type.code === WORKBOOK) || $ESLClass.type === COMM) && !($ESLClass.grade === 'G9' && type.code === WORKBOOK)}
				<input type="radio" id={type.code} bind:group={$assignmentRadio.code} value={type.code} />
				<label for={type.code}>{type.english}</label>
			{/if}
		{/each}
	</fieldset>

	<fieldset class="dates">
		<div class="legend">Dates:</div>
		<label for="assigned">Assigned: </label>
		<input
			type="text"
			name=""
			id="assigned"
			bind:value={$assignedInput}
			class={`${!$assignment.assigned ? 'warning' : ''}`}
		/>
		<label for="due">Due: </label>
		<input
			type="text"
			name=""
			id="due"
			bind:value={$dueInput}
			class={`${!$assignment.due ? 'warning' : ''}`}
		/>
		<label for="late">Late: </label>
		<input
			type="text"
			name=""
			id="late"
			bind:value={$lateInput}
			class={`${!$assignment.late ? 'warning' : ''}`}
		/>
	</fieldset>

	<div
		id="signature-drop-zone"
		on:dragover={handleDragOver}
		on:drop={handleDrop}
		on:dragleave={handleDragLeave}
		on:click={() => document.getElementById('signature-upload').click()}
	>
		{#if $signatureImage}
			<img class="signature-preview" src={$signatureImage} alt="Signature Preview" />
		{:else}
			<p>Drop signature image here or</p>
			<button id="browse" class="secondary action-button">browse</button>
		{/if}
	</div>
	<input type="file" id="signature-upload" accept="image/*" on:change={handleFileSelect} />
	<button id="print" on:click={() => window.print()} class="action-button">Print</button>
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
	}

	main {
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
		.control {
			display: none;
			visibility: hidden;
		}
	}

	fieldset {
		border: none;
		margin-bottom: 0.5em;
	}

	.student-table {
		margin-bottom: 0.5em;
	}

	.class-info {
		display: flex;
		flex-direction: row;
		justify-content: left;
	}

	.class-info > div:not(.legend) {
		border-right: 1px solid gray;
		padding: 0 0.5em;
	}

	.class-info .legend {
		font-weight: 600;
	}

	.class-info > div:last-of-type {
		border-right: none;
	}

	.class-info input[type='text'] {
		width: 2em;
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

	.dates > label {
		padding-left: 1em;
		padding-right: 0.5em;
	}
	.dates input {
		margin-right: 1em;
		width: 6em;
	}

	.students span.title {
		font-size: 1em;
		font-weight: 600;
	}
	.students span {
		font-size: 0.7em;
	}

	.students textarea {
		min-width: 45em;
		max-width: 90%;
		height: 1.5em;
	}

	.warning {
		color: red;
		border: 1px solid red;
	}

	.hints.hide {
		display: none;
	}

	fieldset.students {
		margin-bottom: 0;
	}

	table {
		border-collapse: collapse; /* Remove space between borders */
		margin-left: 1.5em;
	}

	th {
		font-size: 0.8em;
		font-weight: 300;
		background-color: lightgray;
		border: 1px solid lightgray;
	}

	td {
		border: 1px solid #ccc; /* Light grey border for a subtle grid */
		padding: 4px; /* Padding inside cells */
	}

	td.student-id {
		width: 3.5em;
	}

	td.chinese-name {
		width: 5.5em;
	}

	td.english-name {
		width: 10em;
	}

	td.chinese-class {
		width: 3.5em;
	}

	td input {
		width: 100%; /* Make input fill the cell */
		border: none;
		background-color: transparent;
		padding: 0;
		margin: 0;
		box-sizing: border-box; /* Include padding and border in the element's size */
	}

	td input:focus {
		outline: none; /* Remove focus outline */
		background-color: #eef; /* Optional: highlight on focus */
	}

	.action-button {
		background-color: #0ea5e9;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5em 1em;
		margin-left: 1em;
		font-weight: 600;
	}

	.action-button:hover {
		background-color: #0369a1;
		cursor: pointer;
	}

	#signature-drop-zone {
		display: inline-block;
		border: 2px dashed #ccc;
		border-radius: 10px;
		padding: 5px 20px;
		margin-left: 10px;
		text-align: center;
		cursor: pointer;
		width: 470px;
	}

	#signature-drop-zone p {
		color: darkgray;
	}

	#signature-upload {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.drag-over {
		border-color: #000; /* Change border color when dragging over */
	}

	.signature-preview {
		height: 14mm;
	}

	.secondary.action-button {
		color: #0ea5e9;
		background: white;
		border: 1px solid #0ea5e9;
	}

	.secondary.action-button:hover {
		color: #0369a1;
		background: white;
		border: 1px solid #0369a1;
		cursor: pointer;
	}
</style>
