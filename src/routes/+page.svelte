<script lang="ts">
	import { onMount } from 'svelte';
	import { getDates } from '$lib/getAllClassDays.svelte';
	import { getClassDaysByType } from '$lib/getClassDaysByType.svelte';
	import Switches from '$lib/components/Switches.svelte';
	import { fade } from 'svelte/transition';

	const ClassTypeCode = {
		Comm: 'Comm',
		CLIL: 'CLIL',
		G9: 'G9',
		H: 'H'
	} as const;

	type ClassType = (typeof ClassTypeCode)[keyof typeof ClassTypeCode];

	const classControl: { code: ClassType; key: string; label: string }[] = [
		{ code: ClassTypeCode.CLIL, key: 'CLIL', label: 'G7/8 CLIL' },
		{ code: ClassTypeCode.Comm, key: 'Comm', label: 'G7/8 Comm' },
		{ code: ClassTypeCode.G9, key: 'G9', label: 'G9' },
		{ code: ClassTypeCode.H, key: 'H', label: 'H10' }
	];

	let UIStateClassType: ClassType = $state(ClassTypeCode.CLIL); //default

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

	let UIStateEventsText = $state('Loading...');

	let checkedDays = $derived(
		UIStateCheckedDays.map((isChecked, index) => (isChecked ? index + 1 : null)) //return day number if the checkbox is checked
			.filter((index): index is number => index !== null) // filter out null values created by unchecked checkboxes)
	);

	let UIStateOutput = $derived.by(() => {
		if (!UIStateEventsText || UIStateEventsText === 'Loading...') {
			return 'Loading data...';
		}
		try {
			const allClassDays = getDates(UIStateEventsText);
			const classDays = getClassDaysByType(allClassDays, checkedDays, UIStateClassType, grade);
			return ['#\tDate\tDescription\tNote']
				.concat(classDays.map((r) => [r.countdown, r.date, r.description, r.note].join('\t')))
				.join('\n');
		} catch (error) {
			console.error('Error processing data:', error);
			return 'Error processing data. Check console for details.';
		}
	});

	onMount(async () => {
		const CUT_OFF_MONTH = 6;
		// if we are close to semester 2, load the semester 2 events data
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		const yearAndSemester =
			currentMonth < CUT_OFF_MONTH - 1
				? `${currentYear - 1}-${currentYear}-2`
				: `${currentYear}-${currentYear + 1}-1`;

		let loadedData = await loadSchoolEvents(yearAndSemester);

		if (loadedData) {
			UIStateEventsText = loadedData;
		} else {
			UIStateEventsText = 'Failed to load data';
			console.error('Failed to load any school events data');
		}
	});

	async function loadSchoolEvents(fileNamePrefix: string) {
		try {
			const module = await import(`$lib/data/${fileNamePrefix}-schoolEvents.js`);
			const data = module.schoolEvents
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.join('\n');
			return data;
		} catch (error) {
			console.error(`Failed to load ${fileNamePrefix}-schoolEvents.js`, error);
			return null;
		}
	}

	let toastMessage = $state('');
	let showToast = $state(false);
	let toastType = $state('success'); // 'success' or 'error'

	async function copyOutputToClipboard() {
		const output = UIStateOutput;
		if (typeof output === 'string') {
			try {
				await navigator.clipboard.writeText(output);
				toastMessage = 'Copied!';
				toastType = 'success';
			} catch (err) {
				console.error('Failed to copy:', err);
				toastMessage = 'Failed!';
				toastType = 'error';
			} finally {
				showToast = true;
				setTimeout(() => {
					showToast = false;
					toastMessage = '';
				}, 1000);
			}
		}
	}
</script>

<title>HWIS ESL Tools</title>
<main
	class="flex justify-center items-stretch gap-4 pb-4 min-h-[calc(100vh-2.3em)] font-sans text-sm"
>
	<section id="input" class="flex flex-col">
		<h3>Class</h3>
		<div
			id="options"
			class="flex flex-col bg-black p-2 pt-0 border border-gray-500 border-dotted rounded-lg"
		>
			<div
				id="types"
				class="flex items-center bg-slate-800 bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_1)] my-2 p-1 rounded-full w-max"
			>
				<h3 class="mr-2 px-2 font-sans text-white text-sm">Type</h3>
				{#each classControl as { code, key, label }}
					<label
						class="hover:bg-blue-400 has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:shadow-blue-800 has-checked:shadow-xs hover:shadow-green-300 px-2 py-1 rounded-full text-gray-500 has-checked:text-white hover:text-slate-100 transition has-checked:animate-pulse duration-500 ease-in cursor-pointer has-checked:cursor-default"
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
			<Switches title="Days" days={WEEKDAYS} checkedDays={UIStateCheckedDays} />
		</div>
		<div id="schoolEvents">
			<h3 class="text-gray-300">Events</h3>
			<textarea
				rows="30"
				class="flex-1 grayscale-50 border border-gray-500 border-dotted min-w-[27.5em] h-full overflow-hidden font-mono text-gray-300 text-xs"
				bind:value={UIStateEventsText}
				readonly
			></textarea>
		</div>
	</section>
	<section id="output" class="flex flex-col">
		<div class="relative flex items-center gap-2">
			<h3>Copy & paste to spreadsheet like Excel, Sheets, Numbers</h3>
			<!-- Copy to clipboard icon/button -->
			<div class="relative">
				<button
					type="button"
					class="hover:bg-gray-200 p-1 rounded focus:outline-none copy-btn"
					title="Copy to clipboard (for spreadsheet programs)"
					onclick={() => copyOutputToClipboard()}
				>
					<!-- Simple clipboard SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<rect
							x="6"
							y="6"
							width="13"
							height="13"
							rx="2"
							fill="#fff"
							stroke="#888"
							stroke-width="2"
						/>
						<rect
							x="3"
							y="3"
							width="13"
							height="13"
							rx="2"
							fill="#fff"
							stroke="#888"
							stroke-width="2"
						/>
					</svg>
				</button>
				{#if showToast}
					<div
						class="toast-message absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded shadow-lg text-white text-sm whitespace-nowrap
							{toastType === 'success' ? 'bg-blue-600' : 'bg-red-500'}"
						transition:fade
					>
						{toastMessage}
					</div>
				{/if}
			</div>
		</div>
		<textarea
			class="flex-1 border border-gray-500 border-dotted min-w-96 font-mono text-xs"
			rows="30"
			value={UIStateOutput}
			readonly
		></textarea>
	</section>
</main>
