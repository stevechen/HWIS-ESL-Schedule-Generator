<script lang="ts">
	import { onMount } from 'svelte';
	import { getDates } from '$lib/getAllClassDays.svelte';
	import { getClassDaysByType } from '$lib/getClassDaysByType.svelte';
	import Switches from '$lib/components/Switches.svelte';
	import { fade } from 'svelte/transition';
	import { ClassTypeCode, classControl, getGradeForClassType } from '$lib/config/classTypes';
	import type { ClassType } from '$lib/config/classTypes';
	import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';

	let classType: ClassType = $state(ClassTypeCode.CLIL); //default

	const grade = $derived(getGradeForClassType(classType));

	const schoolYearAndSemesterPrefix = $derived(getSchoolYearAndSemesterPrefix());

	const scheduleName = $derived((() => {
		const [year1, year2, semester] = schoolYearAndSemesterPrefix.split('-');
		const shortYear = `${year1.slice(-2)}-${year2.slice(-2)}`;
		const semesterText = `S${semester}`;

		let gradeText;
		if (grade === 'G7/8') {
			gradeText = `Junior ${classType}`;
		} else {
			gradeText = grade;
		}

		return `${shortYear} ${semesterText} ${gradeText} schedule`;
	})());

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	let checkedDaysState = $state([true, false, true, false, true]); //default

	let eventsText = $state('Loading...');

	let checkedDays = $derived(
		checkedDaysState
			.map((isChecked, index) => (isChecked ? index + 1 : null)) //return day number if the checkbox is checked
			.filter((index): index is number => index !== null) // filter out null values created by unchecked checkboxes)
	);

	let output = $derived.by(() => {
		if (!eventsText || eventsText === 'Loading...') {
			return 'Loading data...';
		}
		try {
			const allClassDays = getDates(eventsText);
			const classDays = getClassDaysByType(allClassDays, checkedDays, classType, grade);
			return ['#\tDate\tDescription\tNote']
				.concat(classDays.map((r) => [r.countdown, r.date, r.description, r.note].join('\t')))
				.join('\n');
		} catch (error) {
			console.error('Error processing data:', error);
			return 'Error processing data. Check console for details.';
		}
	});

	let outputTable = $derived.by(() => {
		if (!output || typeof output !== 'string' || output === 'Loading data...') {
			return { header: [], rows: [] };
		}
		const lines = output.split('\n');
		const header = lines[0].split('\t');
		const rows = lines.slice(1).map((line) => line.split('\t'));
		return { header, rows };
	});

	onMount(async () => {
		const yearAndSemester = getSchoolYearAndSemesterPrefix();

		let loadedData = await loadSchoolEvents(yearAndSemester);

		if (loadedData) {
			eventsText = loadedData;
		} else {
			eventsText = 'Failed to load data';
			console.error('Failed to load any school events data');
		}
	});

	//#region Load data
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

	// #region copy-to-clipboard
	let toastMessage = $state('');
	let showToast = $state(false);
	let toastType = $state('success'); // 'success' or 'error'

	async function copyOutputToClipboard() {
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

	//#region download-csv
	function downloadCsv() {
		if (typeof output === 'string') {
			const csvContent = output.replace(/\t/g, ','); // Replace tabs with commas
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			if (link.download !== undefined) {
				// feature detection
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', `${scheduleName}.csv`);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	}
</script>

<!-- MARK: HTML -->
<title>HWIS ESL Tools</title>
<main
	class="flex justify-center items-stretch gap-4 pb-4 min-h-[calc(100vh-2.3em)] font-sans text-sm"
>
	<!-- MARK: **** Controls **** -->
	<section id="input" class="flex flex-col mt-2">
		<h3>Class</h3>
		<div
			id="options"
			class="flex flex-col bg-black p-2 pt-0 border border-gray-500 border-dotted rounded-lg"
		>
			<div
				id="types"
				class="flex items-center bg-slate-800 bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_1)] my-2 p-1 rounded-full w-max"
			>
				<!-- MARK: ****  Type **** -->
				<h3 class="mr-2 px-2 font-sans text-white text-sm">Type</h3>
				{#each classControl as { code, key, label }}
					<label
						class="hover:bg-blue-400 has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:shadow-blue-800 has-checked:shadow-xs hover:shadow-green-300 px-2 py-1 rounded-full text-gray-500 has-checked:text-white hover:text-slate-100 transition has-checked:animate-pulse duration-500 ease-in cursor-pointer has-checked:cursor-default"
						for={key}
					>
						<input type="radio" class="hidden" id={key} bind:group={classType} value={code} />
						{label}
					</label>
				{/each}
			</div>
			<!-- MARK: **** Days **** -->
			<Switches title="Days" days={WEEKDAYS} checkedDays={checkedDaysState} />
		</div>
		<!-- MARK: **** Events **** -->
		<div id="schoolEvents">
			<h3 class="text-gray-300">Events</h3>
			<textarea
				rows="30"
				class="flex-1 grayscale-50 border border-gray-500 border-dotted min-w-[27.5em] h-full overflow-hidden font-mono text-gray-300 text-xs"
				bind:value={eventsText}
				readonly
			></textarea>
		</div>
	</section>
	<!-- MARK: **** Output **** -->
	<section id="output" class="flex flex-col">
		<div class="relative flex items-center gap-2">
			<h3>{scheduleName}</h3>
			<div class="relative ml-auto">
				<button
					id="download_button"
					type="button"
					class="hover:bg-gray-200 p-1 rounded focus:outline-none download-btn"
					title="Download as CSV"
					onclick={() => downloadCsv()}
				>
					<!-- Download SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
				</button>
				<!-- Copy to clipboard icon/button -->
				<button
					id="copy_button"
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
						class="toast-message absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 z-10 rounded shadow-lg text-white text-sm whitespace-nowrap
							{toastType === 'success' ? 'bg-blue-600' : 'bg-red-500'}"
						transition:fade
					>
						{toastMessage}
					</div>
				{/if}
			</div>
		</div>
		<!-- MARK: * Output table * 	 -->
		<div class="flex-1 border border-gray-400 min-w-96 overflow-auto font-mono text-xs">
			<table id="output_table" class="w-full text-left border-separate border-spacing-0">
				<thead class="top-0 sticky">
					<tr class="bg-blue-700 text-white">
						{#each outputTable.header as header_item}
							<th class="p-2 border-t-gray-200 border-r border-blue-600 border-l">{header_item}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each outputTable.rows as row}
						<tr class="border-gray-600 border-b">
							{#each row as cell}
								<td class="p-2 border-1 border-gray-200">{cell}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div id="csv-output" style="display:none;">{output}</div>
	</section>
</main>
