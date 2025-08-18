<script lang="ts">
	import { onMount } from 'svelte';
	import { getDates } from '$lib/getAllClassDays.svelte';
	import { getClassDaysByType } from '$lib/getClassDaysByType.svelte';
	import Switches from '$lib/components/Switches.svelte';
	import { fade, draw } from 'svelte/transition';
	import { ClassTypeCode, classControl, getGradeForClassType } from '$lib/config/classTypes';
	import type { ClassType } from '$lib/config/classTypes';
	import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';

	let classType: ClassType = $state(ClassTypeCode.CLIL); //default

	const grade = $derived(getGradeForClassType(classType));

	const schoolYearAndSemesterPrefix = $derived(getSchoolYearAndSemesterPrefix());

	const scheduleName = $derived(
		(() => {
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
		})()
	);

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
			try {
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
					toastMessage = 'Downloaded!';
					toastType = 'success';
				}
			} catch (err) {
				console.error('Failed to download:', err);
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

<!-- MARK: HTML -->
<title>Schedule</title>
<main
	class="mx-auto flex min-h-[calc(100vh-2.3em)] w-fit flex-row items-start gap-2 pb-4 font-sans text-sm"
>
	<!-- MARK: **** Controls **** -->
	<section id="input" class="fixed top-13 z-10 mt-2 flex flex-col">
		<h3>Class</h3>
		<div
			id="options"
			class="flex flex-col rounded-lg border border-dotted border-gray-500 bg-black px-2 py-1 pt-0"
		>
			<div id="types" class="radio-bg">
				<!-- MARK: ****  Type **** -->
				<h3 class="mr-2 px-2 font-sans text-white">Type</h3>
				{#each classControl as { code, key, label }}
					<label class="radio-label" for={key}>
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
				class="h-full min-w-[27.5em] flex-1 overflow-hidden border border-dotted border-gray-500 font-mono text-xs text-gray-300 grayscale-50"
				bind:value={eventsText}
				readonly
			></textarea>
		</div>
	</section>
	<!-- MARK: **** Output **** -->
	<section id="output" class="ml-87 flex flex-col">
		<div class="relative flex items-center gap-2">
			<h3>{scheduleName}</h3>
			<div class="relative ml-auto">
				<button
					id="download_button"
					type="button"
					class="download-btn rounded p-1 hover:bg-gray-200 focus:outline-none"
					title="Download as CSV"
					onclick={() => downloadCsv()}
				>
					<!-- Download SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-5 fill-none stroke-current"
						viewBox="0 0 24 24"
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
					class="copy-btn rounded p-1 hover:bg-gray-200 focus:outline-none"
					title="Copy to clipboard (for spreadsheet programs)"
					onclick={() => copyOutputToClipboard()}
				>
					<!-- Simple clipboard SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-5 fill-none stroke-current"
						viewBox="0 0 24 24"
					>
						<rect class="size-4 fill-white stroke-gray-800 stroke-2" x="6" y="6" rx="2" />
						<rect class="size-4 fill-white stroke-gray-800 stroke-2" x="3" y="3" rx="2" />
					</svg>
				</button>
				{#if showToast}
					<div
						class="toast-message absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded px-3 py-1 text-sm whitespace-nowrap text-white shadow-lg
							{toastType === 'success' ? 'bg-blue-600' : 'bg-red-500'} flex items-center gap-2"
						transition:fade
					>
						{#if toastType === 'success'}
							<svg
								class="checkmark m-auto block size-5 origin-center stroke-white stroke-2"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 52 52"
							>
								<path
									class="checkmark__check fill-none"
									d="M14.1 27.2l7.1 7.2 16.7-16.8"
									stroke-dasharray="48"
									stroke-dashoffset="48"
									in:draw={{ duration: 400, delay: 400 }}
								/>
							</svg>
						{/if}
						{toastMessage}
					</div>
				{/if}
			</div>
		</div>
		<!-- MARK: * Output table * 	 -->
		<div class="min-w-96 flex-1 overflow-auto border border-gray-400 font-mono text-xs">
			<table id="output_table" class="w-full min-w-2xl border-separate border-spacing-0 text-left">
				<thead>
					<tr class="bg-blue-700 text-white">
						{#each outputTable.header as header_item}
							<th class="border-r border-l border-blue-600 border-t-gray-200 p-2">{header_item}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each outputTable.rows as row}
						{@const isOff = row[0].trim() === ''}
						{@const isExam = row[2].trim() === 'Exam'}
						<tr class="border-b border-gray-600">
							{#each row as cell, i}
								<td
									class={[
										isOff && i !== 3 && 'text-gray-400',
										isExam && 'text-red-500',
										'border-1 border-gray-200 p-2 whitespace-nowrap nth-of-type-3:w-full nth-of-type-4:w-full'
									]}>{cell}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div id="csv-output" style="display:none;">{output}</div>
	</section>
</main>

<style>
	.checkmark__check {
		animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
	}

	@keyframes stroke {
		100% {
			stroke-dashoffset: 0;
		}
	}
</style>
