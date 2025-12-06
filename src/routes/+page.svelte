<script lang="ts">
	import { onMount } from 'svelte';
	import { getDates } from '$lib/utils/getAllClassDays';
	import { getClassDaysByType } from '$lib/utils/getClassDaysByType';
	import Switches from '$lib/components/Switches.svelte';
	import { fade, draw } from 'svelte/transition';
	import { ClassTypeCode, classControl, getGradeForClassType } from '$lib/config/classTypes';
	import type { ClassType } from '$lib/config/classTypes';
	import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';

	let classType: ClassType = $state(ClassTypeCode.CLIL); //default

	const grade = $derived(getGradeForClassType(classType));

	const schoolYearAndSemesterPrefix = $derived(getSchoolYearAndSemesterPrefix());

	const scheduleName = $derived.by(() => {
		const [year1, year2, semester] = schoolYearAndSemesterPrefix.split('-');
		const shortYear = `${year1.slice(-2)}-${year2.slice(-2)}`;
		const semesterText = `S${semester}`;
		const gradeText = grade === 'G7/8' ? `Junior ${classType}` : grade;
		return `${shortYear} ${semesterText} ${gradeText} schedule`;
	});

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

	async function copyOutputToClipboard(event: MouseEvent) {
		const isAltKey = event.altKey;

		try {
			if (isAltKey) {
				const tableElement = document.getElementById('output_table');
				if (tableElement) {
					const range = document.createRange();
					range.selectNode(tableElement);
					window.getSelection()?.removeAllRanges(); // Clear previous selection
					window.getSelection()?.addRange(range); // Select the table
					document.execCommand('copy'); // Copy the selection
					window.getSelection()?.removeAllRanges(); // Deselect

					toastMessage = 'Copied with formatting!';
					toastType = 'success';
				} else {
					throw new Error('Output table not found');
				}
			} else {
				if (typeof output === 'string') {
					await navigator.clipboard.writeText(output);
					toastMessage = 'Copied!';
					toastType = 'success';
				} else {
					throw new Error('Output is not a string');
				}
			}
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
	class="flex flex-row items-start gap-2 mx-auto pb-4 w-fit min-h-[calc(100vh-2.3em)] font-sans text-sm"
>
	<!-- MARK: **** Controls **** -->
	<section id="input" class="top-13 z-10 fixed flex flex-col mt-2">
		<h3>Class</h3>
		<div
			id="options"
			class="flex flex-col bg-black px-2 py-1 pt-0 border border-gray-500 border-dotted rounded-lg"
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
				class="flex-1 grayscale-50 border border-gray-500 border-dotted min-w-[27.5em] h-full overflow-hidden font-mono text-gray-300 text-xs"
				bind:value={eventsText}
				readonly
			></textarea>
		</div>
	</section>
	<!-- MARK: **** Output **** -->
	<section id="output" class="flex flex-col ml-92">
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
						class="fill-none stroke-current size-5"
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
					class="hover:bg-gray-200 p-1 rounded focus:outline-none copy-btn"
					title="Copy to clipboard (for spreadsheet programs)"
					onclick={copyOutputToClipboard}
				>
					<!-- Simple clipboard SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="fill-none stroke-current size-5"
						viewBox="0 0 24 24"
					>
						<rect class="fill-white stroke-2 stroke-gray-800 size-4" x="6" y="6" rx="2" />
						<rect class="fill-white stroke-2 stroke-gray-800 size-4" x="3" y="3" rx="2" />
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
								class="block stroke-2 stroke-white m-auto size-5 origin-center checkmark"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 52 52"
							>
								<path
									class="fill-none checkmark__check"
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
		<div class="flex-1 border border-gray-400 min-w-96 overflow-auto font-mono text-xs">
			<table id="output_table" class="w-full min-w-2xl text-left border-separate border-spacing-0">
				<thead>
					<tr class="bg-blue-700 text-white">
						{#each outputTable.header as header_item}
							<th class="p-2 border-blue-600 border-t-gray-200 border-r border-l">{header_item}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each outputTable.rows as row}
						{@const isOff = row[0].trim() === '' && row[2] === 'Off'}
						{@const isExam = row[2].trim() === 'Exam'}
						<tr class="border-gray-600 border-b">
							{#each row as cell, i}
								<td
									class={[
										isOff && i !== 3 && 'text-gray-400',
										isExam && 'text-red-500',
										'border border-gray-200 p-2 whitespace-nowrap nth-of-type-3:w-full nth-of-type-4:w-full'
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
