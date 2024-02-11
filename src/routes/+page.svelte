<script>
	import { writable } from 'svelte/store';
	import { getDates } from '$lib/getAllClassDays.js';
	import { getClassDaysByType } from '$lib/getClassDaysByType';
	/**
	 * An object that maps weekday names to their corresponding indices.
	 * @type {Object.<string, number>}
	 * @property {number} Sun - Sunday, represented as 0.
	 * @property {number} Mon - Monday, represented as 1.
	 * @property {number} Tue - Tuesday, represented as 2.
	 * @property {number} Wed - Wednesday, represented as 3.
	 * @property {number} Thu - Thursday, represented as 4.
	 * @property {number} Fri - Friday, represented as 5.
	 * @property {number} Sat - Saturday, represented as 6.
	 */
	let weekdayIndices = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};

	let checkedWeekdays = writable(['Tue', 'Fri']); // Set default weekdays

	let targetType = 'G9'; //default

	let specialDays = `2024-06-28	Exam		
2024-06-27	Exam		
2024-06-26	Exam		
2024-06-19	G8 Speech Contest		Comm
2024-06-14		WB check	CLIL
2024-06-13		WB check	CLIL
2024-06-12		WB check	CLIL
2024-06-11		WB check	CLIL
2024-06-10	Off	Dragon Boat Festival	
2024-06-07		Passport check	Comm
2024-06-06		Passport check	Comm
2024-06-05	G7 Speech Contest	Passport check	Comm
2024-06-04		Passport check	Comm
2024-06-03	Graduation Ceremony	Passport check	Comm
2024-05-19	Senior High School Entrance Exam		G9
2024-05-18	Senior High School Entrance Exam		G9
2024-05-17	Half day off (Students only)		
2024-05-15	Exam		
2024-05-14	Exam		
2024-04-29	Off	Make-up holiday for School day	
2024-04-27	School Anniversary		
2024-04-17	Off	G9 Mock Exam	G9
2024-04-16	Off	G9 Mock Exam	G9
2024-04-05	Off	Spring Break	
2024-04-04	Off	Spring Break	
2024-03-29	Exam		
2024-03-28	Exam		
2024-02-28	Off	Peace Memorial Day	
2024-02-22	Off	G9 Mock Exam	G9
2024-02-21	Off	G9 Mock Exam	G9
2024-02-17	School day (Make up)	for 2024/02/08 Chinese New Year	
2024-02-16	Class starts at the 3rd period   		`;

	let generatedDatesOutput = '';

	/** @type {Number[]}*/
	let weekdaysArray;
	$: {
		weekdaysArray = $checkedWeekdays.map((day) => weekdayIndices[day]);
	}

	function generateDates() {
		const specialDaysArray = getDates(specialDays);
		const classDates = getClassDaysByType(specialDaysArray, weekdaysArray, targetType);
		generatedDatesOutput = ['#\tDate\tDescription\tNote']
			.concat(
				classDates.map((row) => [row.countdown, row.date, row.description, row.note].join('\t'))
			)
			.join('\n');
	}
</script>

<title>HWIS Schedule Generator</title>
<main>
	<!-- <h1>Date Generator</h1> -->
	<section id="input">
		<h3>Controls</h3>
		<div id="options">
			<div id="weekdays">
				<h3>Days</h3>
				{#if $checkedWeekdays.length === 0}
					<p class="warning">Please select at least one weekday!</p>
				{/if}
				{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as day}
					<input type="checkbox" id={day.toLowerCase()} bind:group={$checkedWeekdays} value={day} />
					<label for={day.toLowerCase()}>{day}</label>
				{/each}
			</div>
			<div id="types">
				<h3>Type</h3>
				<input type="radio" id="clil" bind:group={targetType} value="CLIL" />
				<label for="clil">CLIL</label>
				<input type="radio" id="comm" bind:group={targetType} value="Comm" />
				<label for="comm">Comm</label>
				<input type="radio" id="g9" bind:group={targetType} value="G9" />
				<label for="g9">G9</label>
				<input type="radio" id="h" bind:group={targetType} value="H" />
				<label for="h">H</label>
			</div>
		</div>

		<div id="specialDays">
			<h3>
				Special Days
				<button class="info">
					ℹ️
					<span class="info_note">
						Copy a table from Excel with 4 fields: date, description, note, type
					</span>
				</button>
			</h3>
			<textarea rows="15" bind:value={specialDays} />
			<button id="generate" on:click={generateDates}>Generate</button>
		</div>
	</section>

	<section id="output">
		<h3>Generated Dates (Copy to Excel)</h3>
		<textarea rows="30" bind:value={generatedDatesOutput} readonly />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		justify-content: center;
		column-gap: 15px;
		font-size: 0.8em;
		font-family: Verdana, Geneva, Tahoma, sans-serif;
		min-height: calc(100vh - 2.3em);
		background: lightblue;
		padding-bottom: 1em;
	}
	#input,
	#output {
		display: flex;
		flex-direction: column;
	}
	#options {
		display: flex;
		flex-direction: column;
	}
	#options h3 {
		font-size: 0.9em;
	}
	#range,
	#weekdays,
	#types {
		border: 1px solid gray;
		padding: 0.5em;
	}

	#generate {
		display: block;
		margin: 0 auto;
	}
	textarea {
		min-width: 50em;
		flex: 1;
		font-size: 0.8em;
	}
	button.info {
		border: none;
		background: none;
	}
	.info_note {
		display: none;
	}
	button.info:hover .info_note {
		display: inline;
	}

	#specialDays {
		flex: 1;
		display: flex;
		flex-direction: column;
		row-gap: 5px;
	}

	.warning {
		color: red;
	}
</style>
