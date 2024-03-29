<script>
	import { writable, derived } from 'svelte/store';
	import TabBar from '$lib/components/TabBar.svelte';
	// import Table from 'svelte-table';
	import moment from 'moment';
	import SlipTemplate from '$lib/components/SlipTemplate.svelte';
	import { assignment } from '$lib/stores/commslip';

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

	const GRADES = ['G7', 'G8', 'G9'];
	const CLASS_TYPE = ['Comm', 'CLIL'];

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
			assignmentInput.set({
				type: assignmentType.type,
				english: assignmentType.english,
				chinese: assignmentType.chinese
			});
		}
	}

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
	let assignmentInput = writable(ASSIGNMENTS_TYPES.find((type) => type.type === 'passport'));
	$: selectedTypeDetails = ASSIGNMENTS_TYPES.find((type) => type.type === $assignmentInput.type);
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

	let assignedInput = writable('');

	/**
	 * @type {string | null}
	 */
	let assignedDateFormatted;
	let dueInput = writable('');
	/**
	 * @type {string | null}
	 */
	let dueDateFormatted;
	let lateInput = writable('');
	/**
	 * @type {string | null}
	 */
	let lateDateFormatted;

	/**
	 * @param {moment.MomentInput} input
	 */
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
					status: STATUS[0].text
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

				// if (!student.id || !student.name.english || !student.cClass) {
				// 	let isValid = false;
				// 	let errorMessage = 'Invalid data format';
				// }
				return student;
			})
			.filter((student) => student !== null);
	});

	/**
	 *
	 * @param {Number} index
	 * @param {String} key
	 * @param {Number} value
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

	let tableData = writable($students); // create a new store for the table data
	$: $tableData = $students; // update tableData whenever students changes

	/**
	 *
	 * @param {string} studentId
	 * @param {string} newStatusCode
	 */
	function handleStatusChange(studentId, newStatusCode) {
		$tableData = $tableData.map((student) => {
			if (student.id === studentId) {
				const status = STATUS.find((status) => status.code === Number(newStatusCode));
				return { ...student, status: status ? status.text : student.status };
			}
			return student;
		});
	}

	//enable tab keys insertion to create a new field
	function handleKeyDown(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const start = e.target.selectionStart;
			const end = e.target.selectionEnd;

			// set textarea value to: text before caret + tab + text after caret
			e.target.value = e.target.value.substring(0, start) + '\t' + e.target.value.substring(end);

			// put caret at right position again
			e.target.selectionStart = e.target.selectionEnd = start + 1;
		}
	}

	/**
	 * Handles the paste event and processes the pasted text.
	 * @param {ClipboardEvent} e - The paste event object.
	 */
	function handlePaste(e) {
		e.preventDefault(); // Prevent the default paste action

		// Ensure e.target is an HTMLElement using type assertion with JSDoc
		if (!(e.target instanceof HTMLElement)) {
			return; // Exit the function if e.target is not an HTMLElement
		}

		// Get the pasted text from the clipboard
		const pastedText = (e.clipboardData || window.clipboardData).getData('text');

		// Strip blank lines from the pasted text

		const modifiedText = pastedText
			.split('\n') // Split the text into lines
			.filter(
				/**
				 * @param {string} line
				 */
				(line) => line.trim() !== ''
			) // Filter out empty lines
			.join('\n'); // Join the lines back together without appending default status code

		// Update the studentsInput store with the modified text
		studentsInput.set(modifiedText);

		// Auto-load today's date into the "due" input
		const today = moment().format('MM/DD'); // Format today's date as needed
		dueInput.set(today); // Set the dueInput store with today's date

		// Hide the textarea after pasting

		e.target.style.display = 'none';

		// Hide the hints
		showHints = false;
	}
</script>

<TabBar />
<main class="control">
	<!-- <h1>Communication Slip Generator</h1> -->
	<fieldset class="classInfo">
		<legend>Grade:</legend>
		<div>
			{#each GRADES as grade}
				<input type="radio" id={grade} bind:group={$ESLClass.grade} value={grade} />
				<label for={grade}>{grade}</label>
			{/each}
		</div>
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

	<fieldset>
		<legend>Type:</legend>
		{#each ASSIGNMENTS_TYPES as type}
			{#if (($ESLClass.type === 'CLIL' && type.type === 'workbook') || $ESLClass.type === 'Comm') && !($ESLClass.grade === 'G9' && type.type === 'workbook')}
				<input type="radio" id={type.type} bind:group={$assignmentInput.type} value={type.type} />
				<label for={type.type}>{type.english}</label>
			{/if}
		{/each}
	</fieldset>

	<fieldset class="dates">
		<legend>Dates:</legend>
		<label class={`${!$assignment.assigned ? 'warning' : ''}`} for="assigned">Assigned: </label>
		<input type="text" name="" id="assigned" bind:value={$assignedInput} />
		<label class={`${!$assignment.due ? 'warning' : ''}`} for="due">Due: </label>
		<input type="text" name="" id="due" bind:value={$dueInput} />
		<label class={`${!$assignment.late ? 'warning' : ''}`} for="late">Late: </label>
		<input type="text" name="" id="late" bind:value={$lateInput} />
	</fieldset>

	<fieldset class="students">
		<legend>
			Students:
			<span class="hints {showHints ? '' : 'hide'}">
				{`Copy data from Excel: [ID, Chinese Name, English Name, Chinese Class] separate by a tab.`}
			</span>
		</legend>
		<textarea
			id="sList"
			cols="30"
			rows="10"
			bind:value={$studentsInput}
			on:keydown={(e) => handleKeyDown(e)}
			on:paste={(e) => handlePaste(e)}
		></textarea>
	</fieldset>

	<table>
		{#if $tableData.length}
			<thead>
				<tr>
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
					<td
						><input
							bind:value={student.id}
							on:input={(e) => updateTableData(i, 'id', e.target.value)}
						/></td
					>
					<td
						><input
							bind:value={student.name.chinese}
							on:input={(e) => updateTableData(i, 'name.chinese', e.target.value)}
						/></td
					>
					<td
						><input
							bind:value={student.name.english}
							on:input={(e) => updateTableData(i, 'name.english', e.target.value)}
						/></td
					>
					<td
						><input
							bind:value={student.cClass}
							on:input={(e) => updateTableData(i, 'cClass', e.target.value)}
						/></td
					>
					<td>
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

	<br />

	<button id="print" on:click={() => window.print()}>Print</button>
</main>

<div id="b5-print" class="b5-size">
	<!-- {#each $students as student, i} -->
	{#each $tableData as student, i}
		{#if student}
			<SlipTemplate {student} />
		{/if}
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
		/* ISO B5 */
		/* width: 176mm; */
		/* height: 250mm; */
		/* JIS B5 */
		width: 182mm;
		/* height: 257mm; */

		margin: 0 auto;
	}

	@media print {
		.b5-size {
			/* ISO B5 */
			/* width: 176mm; */
			/* height: 250mm; */
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

	h1 {
		font-size: 1.3em;
	}

	fieldset {
		border: none;
		margin-bottom: 1em;
	}

	.classInfo {
		display: table;
		border-collapse: collapse;
	}

	.classInfo > div {
		display: table-cell;
		/* border: 1px solid gray; */
		padding: 0 0.5em;
		border-right: 1px solid gray;
	}

	.classInfo > div:last-of-type {
		border-right: none;
	}

	.classInfo input[type='text'] {
		width: 2em;
	}

	.dates input {
		margin-right: 1em;
		width: 6em;
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
		/* width: 100%; Make the table fill the container */
		border-collapse: collapse; /* Remove space between borders */
		margin-left: 2.5em;
		/* margin: 0 auto; */
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

	td:nth-of-type(1) {
		width: 4em;
	}

	td:nth-of-type(2) {
		width: 5.5em;
	}

	td:nth-of-type(3) {
		width: 10em;
	}

	td:nth-of-type(4) {
		width: 3.5em;
	}

	td input {
		width: 100%; /* Make input fill the cell */
		border: none; /* Remove input border */
		background-color: transparent; /* Remove background */
		padding: 0; /* Remove padding */
		margin: 0; /* Remove margin */
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
