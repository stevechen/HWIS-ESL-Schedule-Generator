<script lang="ts">
	import { onMount } from 'svelte';
	import { getDates } from '$lib/getAllClassDays.ts.svelte';
	import { getClassDaysByType } from '$lib/getClassDaysByType.ts.svelte';
	import Switches from '$lib/components/Switches.svelte';

	enum ClassTypeCode {
		Comm = 'Comm',
		CLIL = 'CLIL',
		G9 = 'G9',
		H = 'H'
	}

	const classControl = [
		{ code: ClassTypeCode.CLIL, key: 'CLIL', label: 'G7/8 CLIL' },
		{ code: ClassTypeCode.Comm, key: 'Comm', label: 'G7/8 Comm' },
		{ code: ClassTypeCode.G9, key: 'G9', label: 'G9' },
		{ code: ClassTypeCode.H, key: 'H', label: 'H10' }
	];

	let UIStateClassType = $state(ClassTypeCode.CLIL); //default

	const grade = $derived.by(() => {
		if (UIStateClassType === ClassTypeCode.CLIL) {
			return 'G7/8';
		} else if (UIStateClassType === ClassTypeCode.Comm) {
			return 'G7/8';
		} else if (UIStateClassType === ClassTypeCode.G9) {
			return 'G9';
		} else if (UIStateClassType === ClassTypeCode.H) {
			return 'H';
		}
	});

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	let UIStateCheckedDays = $state([true, false, true, false, true]); //default

	let UIStateEventsText = $state('');

	let checkedDays = $derived(
		UIStateCheckedDays.map((isChecked, index) => (isChecked ? index + 1 : null)) //return day number if the checkbox is checked
			.filter((index): index is number => index !== null) // filter out null values created by unchecked checkboxes)
	);

	let UIStateOutput = $derived.by(() => {
		const allClassDays = getDates(UIStateEventsText);
		const classDays = getClassDaysByType(allClassDays, checkedDays, UIStateClassType, grade);
		return ['#\tDate\tDescription\tNote']
			.concat(classDays.map((r) => [r.countdown, r.date, r.description, r.note].join('\t')))
			.join('\n');
	});

	onMount(async () => {
		const CUT_OFF_MONTH = 6;
		// if we are close to semester 2, load the semester 2 events data
		const yearAndSemester =
			new Date().getMonth() < CUT_OFF_MONTH - 1
				? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}-2`
				: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}-1`;
		UIStateEventsText =
			(await loadSchoolEvents(yearAndSemester)) || (await loadSchoolEvents('2023-2024-1'));
	});

	async function loadSchoolEvents(fileNamePrefix: string) {
		try {
			const module = await import(`$lib/data/${fileNamePrefix}-schoolEvents.js`);
			return module.schoolEvents
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.join('\n');
		} catch (error) {
			console.error(`Failed to load ${fileNamePrefix}-schoolEvents.js`, error);
			return null;
		}
	}
</script>

<title>HWIS ESL Tools</title>
<main
	class="flex min-h-[calc(100vh-2.3em)] items-stretch justify-center gap-4 pb-4 font-sans text-sm"
>
	<section id="input" class="flex flex-col">
		<h3>Class</h3>
		<div
			id="options"
			class="flex flex-col border rounded-lg border-dotted border-gray-500 p-2 pt-0"
		>
			<div
				id="types"
				class="my-2 w-max flex items-center rounded-full bg-slate-800 p-1 bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_0.4)]"
			>
				<h3 class="mr-2 px-2 font-sans text-white text-sm">Type</h3>
				{#each classControl as { code, key, label }}
					<label
						class="cursor-pointer rounded-full px-2 py-1 text-gray-500 transition duration-500 ease-in hover:animate-pulse hover:bg-blue-400 hover:text-slate-100 hover:shadow-green-300 has-checked:animate-none has-checked:cursor-default has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:text-white has-checked:shadow-xs has-checked:shadow-blue-800"
						for={key}
					>
						<input
							type="radio"
							class="hidden"
							id={key}
							bind:group={UIStateClassType}
							value={code}
						/>
						{label}
					</label>
				{/each}
			</div>
			{UIStateClassType}
			<Switches title="Days" days={WEEKDAYS} checkedDays={UIStateCheckedDays} />
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
			<textarea
				rows="30"
				class="font-mono min-w-[36em] flex-1 text-xs border border-dotted border-gray-500 m-w-80"
				bind:value={UIStateEventsText}
				readonly
			></textarea>
		</div>
	</section>
	<section id="output" class="flex flex-col">
		<h3>Generated Dates (Paste to Excel)</h3>
		<textarea
			class="font-mono flex-1 text-xs border border-dotted border-gray-500 min-w-96"
			rows="30"
			value={UIStateOutput}
			readonly
		></textarea>
	</section>
</main>

<style>
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
</style>
