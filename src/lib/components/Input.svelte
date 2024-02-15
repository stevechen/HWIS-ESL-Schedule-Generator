<script>
	import { getDates } from '$lib/getAllClassDays.js';
	import { getClassDaysByType } from '$lib/getClassDaysByType';
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	let targetType = 'CLIL'; //default

	/** @type {Array <String>} - array of weekdays for checkbox labels */
	let weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	// let checkedDays = writable([true, false, true, false, true]);
	let checkedDays = writable([true, false, true, false, true]);
	/**@type {Array <Number>} - days that are checked */
	let checkedDaysArray;
	// returns the incremented indecies of checked checkboxes
	// so that Monday is 1, Tuesday is 2, etc
	$: {
		checkedDaysArray = $checkedDays
			.map((isChecked, index) => (isChecked ? index + 1 : null)) //return index + 1 if the checkbox is checked
			.filter((index) => index !== null); // filter out null valuse created by unchecked checkboxes
	}

	/**@type {String | null}*/
	let schoolEvents = '';

	/**
	 * Load school events from a specific file.
	 * @param {String} file - The name of the file to load.
	 * @returns {Promise <String | null>} - The school events as a string, or null if an error occurred.
	 * The returned string is processed by splitting it into lines (each line is a String),
	 * filtering out empty lines, and then joining the lines back together.
	 */
	async function loadSchoolEvents(file) {
		try {
			const module = await import(`$lib/data/${file}-schoolEvents.js`);
			return module.schoolEvents
				.split('\n')
				.filter((/** @type {string} */ line) => line.trim() !== '')
				.join('\n');
		} catch (error) {
			console.error(`Failed to load ${file}-schoolEvents.js`, error);
			return null;
		}
	}

	onMount(async () => {
		const monthOfMay = 5;
		const prefix =
			new Date().getMonth() < monthOfMay
				? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}-2`
				: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}-1`;
		schoolEvents = (await loadSchoolEvents(prefix)) || (await loadSchoolEvents('2023-2024-1'));
	});

	let touched = false;

	// Update touched to true whenever an input changes
	$: touched = Boolean(targetType) || Boolean($checkedDays.length) || Boolean(schoolEvents);

	// Only call generateDates() if the inputs have been touched
	$: if (touched) {
		generateDates();
		touched = false;
	}

	function generateDates() {
		const ALL_CLASS_DAYS = getDates(schoolEvents);
		const CLASS_DATES = getClassDaysByType(ALL_CLASS_DAYS, checkedDaysArray, targetType);
		let generatedDatesOutput = ['#\tDate\tDescription\tNote']
			.concat(
				CLASS_DATES.map((row) => [row.countdown, row.date, row.description, row.note].join('\t'))
			)
			.join('\n');
		// Dispatch the event with the data to the parent
		dispatch('generate', { generatedDatesOutput });
	}
</script>

<h3>Controls</h3>
<div id="options">
	<div id="weekdays">
		<div id="types">
			<h3>Type</h3>
			<input type="radio" id="clil" bind:group={targetType} value="CLIL" />
			<label for="clil">G7/8 CLIL</label>
			<input type="radio" id="comm" bind:group={targetType} value="Comm" />
			<label for="comm">G7/8 Comm</label>
			<input type="radio" id="g9" bind:group={targetType} value="G9" />
			<label for="g9">G9</label>
			<input type="radio" id="h" bind:group={targetType} value="H" />
			<label for="h">H10/H11</label>
		</div>
		<h3>Days</h3>
		{#if checkedDaysArray.length === 0}
			<p class="warning">Select at least one day!</p>
		{/if}
		{#each $checkedDays as isChecked, index (index)}
			<input type="checkbox" id={weekdays[index]} bind:checked={$checkedDays[index]} />
			<label for={weekdays[index]}>{weekdays[index]}</label>
		{/each}
	</div>
</div>

<div id="schoolEvents">
	<h3>
		Events
		<button class="info">
			ℹ️
			<span class="info_note">
				Copy a table from spreadsheet with 4 fields: date, description, note, type
			</span>
		</button>
	</h3>
	<textarea id="events" rows="15" bind:value={schoolEvents} on:blur={generateDates} />
</div>

<style>
	h3 {
		font-size: 0.9em;
		margin-bottom: 0.3em;
	}

	#options {
		display: flex;
		flex-direction: column;
		border: 1px solid gray;
		padding: 0 0.5em 0.5em 0.5em;
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
		font-size: 0.8em;
	}

	#schoolEvents {
		flex: 1;
		display: flex;
		flex-direction: column;
		row-gap: 5px;
	}

	#events {
		min-width: 50em;
		flex: 1;
		font-size: 0.8em;
	}

	.warning {
		color: red;
	}
</style>
