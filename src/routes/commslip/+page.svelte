<script>
	import { writable, derived, get } from 'svelte/store';
	import { assignment } from '$lib/stores/commslip';
	import moment from 'moment';
	import TabBar from '$lib/components/TabBar.svelte';
	import SlipTemplate from '$lib/components/SlipTemplate.svelte';

	let showHints = true; // Hints are visible by default
	//default
	/**
	 * @typedef {Object} ESLClass
	 * @property {string} grade
	 * @property {string} level
	 * @property {'CLIL'|'Comm'} type - This is either 'CLIL' or 'Comm'.
	 * @property {string} num
	 */

	/**
	 * @type {import('svelte/store').Writable<ESLClass>}
	 */
	let ESLClass = writable({
		grade: 'G7',
		level: 'Elementary',
		type: 'Comm',
		num: '2'
	});

	const CLASS_TYPE = ['Comm', 'CLIL'];

	/**
	 * @typedef {Object} AssignmentType
	 * @property {string} type - The type of the assignment.
	 * @property {string} english - The English description of the assignment.
	 * @property {string} chinese - The Chinese description of the assignment.
	 */

	/**
	 * @type {AssignmentType[]}
	 */
	const ASSIGNMENTS_TYPES = [
		{ type: 'passport', english: 'Passport', chinese: '英文護照' },
		{ type: 'recording', english: 'Recording', chinese: '錄影(錄音)' },
		{ type: 'workbook', english: 'Workbook', chinese: '作業本' },
		{ type: 'exam', english: 'Oral Exam', chinese: '期末考口試' }
	];

	/**
	 * @typedef {Object} Status
	 * @property {number} code - The status code.
	 * @property {{english: string, chinese: string}} text - The status text in different languages.
	 */

	/**
	 * @type {Status[]}
	 */
	const STATUS = [
		{ code: 0, text: { english: "hasn't been submitted", chinese: '未繳交' } },
		{ code: 1, text: { english: "wasn't completed", chinese: '完成度不佳' } }
	];

	/**
	 * @type {string}
	 */
	let className;

	//default to passport
	let assignmentRadio = writable(ASSIGNMENTS_TYPES.find((type) => type.type === 'passport'));
	$: selectedTypeDetails = ASSIGNMENTS_TYPES.find((type) => type.type === $assignmentRadio.type);
	$: (className = `${$ESLClass.grade} ${$ESLClass.level} ${$ESLClass.num} ${$ESLClass.type}`),
		(assignedDateFormatted = processDate($assignedInput)),
		(dueDateFormatted = processDate($dueInput)),
		(lateDateFormatted = processDate($lateInput)),
		assignment.update((value) => ({
			...value,
			esl: className,
			type: {
				english: selectedTypeDetails.english,
				chinese: selectedTypeDetails.chinese
			},
			assigned: assignedDateFormatted,
			due: dueDateFormatted,
			late: lateDateFormatted
		}));

	$: if ($ESLClass.type === 'CLIL' || $ESLClass.type === 'Comm') {
		const newType = $ESLClass.type === 'CLIL' ? 'workbook' : 'passport';
		const assignmentTypeDetails = ASSIGNMENTS_TYPES.find((type) => type.type === newType);

		assignment.update((currentAssignment) => ({
			...currentAssignment,
			type: assignmentTypeDetails
		}));
	}

	$: {
		// automatically switch to Comm if G9 is chosen
		if ($ESLClass.grade === 'G9') {
			ESLClass.update((value) => ({ ...value, type: 'Comm' }));
		}

		//auto default assignment type default selection based on class type
		const assignmentDefaultTypeMap = { CLIL: 'workbook', Comm: 'passport' };
		const ESLClassType = $ESLClass.type;

		const selectedType = assignmentDefaultTypeMap[ESLClassType];
		const assignmentType = ASSIGNMENTS_TYPES.find((type) => type.type === selectedType);

		if (assignmentType) {
			assignmentRadio.set({
				type: assignmentType.type,
				english: assignmentType.english,
				chinese: assignmentType.chinese
			});
		}
	}

	let assignedInput = writable('');

	/** @type {string | null} */
	let assignedDateFormatted;
	let dueInput = writable('');
	/** @type {string | null}*/
	let dueDateFormatted;
	let lateInput = writable('');
	/** @type {string | null}*/
	let lateDateFormatted;

	/** @param {moment.MomentInput} input */
	function processDate(input) {
		const date = moment(input).format('MM/DD');
		return date === 'Invalid date' ? null : date;
	}

	let studentsInput = writable('');
	let sanitizedStudentsInput = derived(
		studentsInput,
		($studentsInput) =>
			$studentsInput
				.split('\n') // split the string into lines
				.filter((line) => line.trim() !== '') // filter out empty lines
				.join('\n') // join the lines back together
	);

	let students = derived(sanitizedStudentsInput, ($sanitizedStudentsInput) => {
		if ($sanitizedStudentsInput.trim() === '') {
			return [];
		}

		return $sanitizedStudentsInput
			.split('\n')
			.map((row) => {
				let studentDataArray = row.split('\t');

				let student = {
					id: '',
					name: { english: '', chinese: '' },
					cClass: '',
					status: STATUS[0].text,
					selected: true
				};

				studentDataArray.forEach((data) => {
					if (/^\d{7}$/.test(data)) {
						student.id = data;
					} else if (/^[JH]\d{3}$/.test(data)) {
						student.cClass = data;
					} else if (/[\u4e00-\u9fa5]/.test(data)) {
						student.name.chinese = data;
					} else if (/^[a-zA-Z]+(\s[a-zA-Z]+){1,2}$/.test(data)) {
						student.name.english = data;
					}
				});
				return student;
			})
			.filter((student) => student !== null)
			.sort((a, b) => a.name.english.localeCompare(b.name.english)); // Sort students by their English name
	});

	/**
	 * Updates the table data with a new value for a given student and key.
	 * This function assumes the `students` array contains objects with a known structure.
	 * @param {number} index - The index of the student in the table data array.
	 * @param {string} key - The key representing the property to update, which can include dot notation for nested properties.
	 * @param {*} value - The new value to set for the specified key.
	 */
	function updateTableData(index, key, value) {
		tableData.update((students) => {
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

	let tableData = writable([]); // create a new store for the table data
	$: $tableData = $students; // update tableData whenever students changes

	/**
	 * @param {string} studentId
	 * @param {string} newStatusCode
	 */
	function handleStatusChange(studentId, newStatusCode) {
		$tableData = $tableData.map((student) => {
			if (student.id === studentId) {
				let status = STATUS.find((status) => status.code === Number(newStatusCode));
				return { ...student, status: status ? status.text : student.status };
			}
			return student;
		});
	}

	let grade = 'G7?';
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

		// Auto-load today's date into the "due" input
		const today = moment().format('MM/DD'); // Format today's date as needed
		dueInput.set(today); // Set the dueInput store with today's date

		// Hide the textarea & hints after pasting
		e.target.style.display = 'none';
		showHints = false;

		grade = determineGradeFromText(pastedText);
		ESLClass.update((current) => ({ ...current, grade }));
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

	let allSelected = false; // Tracks the master checkbox state

	// Derived store to manage the master checkbox state
	const allStudentsSelected = derived(tableData, ($tableData) => {
		const allChecked = $tableData.every((student) => student.selected);
		const anyChecked = $tableData.some((student) => student.selected);
		// Return an object with both states
		return {
			checked: allChecked,
			indeterminate: !allChecked && anyChecked
		};
	});

	// Function to toggle all student checkboxes
	function toggleAllStudents() {
		const currentState = get(allStudentsSelected); // Use Svelte's get to unwrap the store value
		const newState = !currentState.checked || currentState.indeterminate;
		tableData.update((students) => {
			students.forEach((student) => (student.selected = newState));
			return students;
		});
	}

	// Ensure this reactive statement runs whenever $tableData changes
	$: allSelected = $allStudentsSelected.checked
		? true
		: $allStudentsSelected.indeterminate
			? 'indeterminate'
			: false;

	// Reactive statement for indeterminate state now relies on allStudentsSelected
	$: if (typeof window !== 'undefined') {
		//only attempts to manipulate the DOM when it is available
		const checkbox = document.querySelector('thead input[type="checkbox"]');
		if (checkbox) {
			checkbox.indeterminate = allSelected === 'indeterminate';
		}
	}
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
		></textarea>
	</fieldset>

	<table class="student-table">
		{#if $tableData.length}
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
			{#each $tableData as student, i (student.id)}
				<tr>
					<td class="student-checkbox">
						<input type="checkbox" bind:checked={student.selected} />
					</td>
					<td class="student-id">
						<input
							bind:value={student.id}
							on:input={(e) => updateTableData(i, 'id', e.target.value)}
						/>
					</td>
					<td class="chinese-name">
						<input
							bind:value={student.name.chinese}
							on:input={(e) => updateTableData(i, 'name.chinese', e.target.value)}
						/>
					</td>
					<td class="english-name">
						<input
							bind:value={student.name.english}
							on:input={(e) => updateTableData(i, 'name.english', e.target.value)}
						/>
					</td>
					<td class="chinese-class">
						<input
							bind:value={student.cClass}
							on:input={(e) => updateTableData(i, 'cClass', e.target.value)}
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
				{#if type !== 'CLIL' || $ESLClass.grade !== 'G9'}
					<input type="radio" id={type} bind:group={$ESLClass.type} value={type} />
					<label for={type}>{type}</label>
				{/if}
			{/each}
		</div>
		<div>
			<input type="text" bind:value={$ESLClass.num} />
		</div>
	</fieldset>

	<fieldset class="assignment-type">
		<div class="legend">Type:</div>
		{#each ASSIGNMENTS_TYPES as type}
			{#if (($ESLClass.type === 'CLIL' && type.type === 'workbook') || $ESLClass.type === 'Comm') && !($ESLClass.grade === 'G9' && type.type === 'workbook')}
				<input type="radio" id={type.type} bind:group={$assignmentRadio.type} value={type.type} />
				<label for={type.type}>{type.english}</label>
			{/if}
		{/each}
	</fieldset>

	<fieldset class="dates">
		<div class="legend">Dates:</div>
		<label class={`${!$assignment.assigned ? 'warning' : ''}`} for="assigned">Assigned: </label>
		<input type="text" name="" id="assigned" bind:value={$assignedInput} />
		<label class={`${!$assignment.due ? 'warning' : ''}`} for="due">Due: </label>
		<input type="text" name="" id="due" bind:value={$dueInput} />
		<label class={`${!$assignment.late ? 'warning' : ''}`} for="late">Late: </label>
		<input type="text" name="" id="late" bind:value={$lateInput} />
	</fieldset>

	<button id="print" on:click={() => window.print()}>Print</button>
</main>

<div id="b5-print" class="b5-size">
	{#each $tableData.filter((student) => student.selected) as student, i}
		<SlipTemplate {student} />
	{/each}
</div>

<style>
	main {
		font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode',
			Geneva, Verdana, sans-serif;
		/* width: 182mm; */
		width: 172mm;
		margin: 0 auto;
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
		align-items: left;
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
	}

	.warning {
		color: red;
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

	#print {
		background-color: #0ea5e9;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5em 1em;
		margin-left: 1em;
		font-weight: 600;
	}

	#print:hover {
		background-color: #0369a1;
	}
</style>
