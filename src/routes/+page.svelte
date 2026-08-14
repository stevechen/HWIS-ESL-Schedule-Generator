<script lang="ts">
	import { onMount } from 'svelte';
	import Switches from '$lib/components/Switches.svelte';
	import { fade, draw } from 'svelte/transition';
	import { ClassTypeCode, classControl } from '$lib/config/classTypes';
	import type { ClassType } from '$lib/config/classTypes';
	import { getSchoolYearAndSemesterPrefix } from '$lib/utils/schoolYear';
	import {
		deriveSchedule,
		loadSchoolEventsText,
		scheduleError,
		buildScheduleName
	} from '$lib/schedule';

	interface Props {
		schoolEventsText?: string | null;
	}

	// Test-injection seam: page components normally only receive `data`/`errors`,
	// but the component tests pass the raw events text directly so they don't have
	// to mock the dynamic file import.
	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
	let { schoolEventsText = null }: Props = $props();

	let classType: ClassType = $state(ClassTypeCode.CLIL); //default

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	let checkedDaysState = $state([true, false, true, false, true]); //default

	// null eventsText = not yet loaded; a missing or failed data file flips loadError.
	let eventsText = $state<string | null>(null);
	let loadError = $state(false);
	const prefix = $state(getSchoolYearAndSemesterPrefix());

	const name = $derived(buildScheduleName(classType, prefix));

	const schedule = $derived(
		loadError
			? scheduleError(name)
			: deriveSchedule(eventsText, classType, checkedDaysState, prefix)
	);

	const eventsDisplay = $derived(
		loadError ? 'Failed to load data' : (eventsText ?? 'Loading data...')
	);

	onMount(() => {
		if (schoolEventsText) {
			eventsText = schoolEventsText;
			return;
		}

		loadSchoolEventsText(prefix)
			.then((loadedData) => {
				if (loadedData === null) {
					loadError = true;
					console.error('Failed to load any school events data');
				} else {
					eventsText = loadedData;
				}
			})
			.catch((err) => {
				loadError = true;
				console.error('Failed to load school events data:', err);
			});
	});

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
				await navigator.clipboard.writeText(schedule.output);
				toastMessage = 'Copied!';
				toastType = 'success';
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
		try {
			const csvContent = schedule.output.replace(/\t/g, ','); // Replace tabs with commas
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			if (link.download !== undefined) {
				// feature detection
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', `${schedule.name}.csv`);
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
</script>

<!-- MARK: HTML -->
<title>Schedule</title>
<main
	class="flex flex-row items-start gap-2 mx-auto pb-4 w-fit min-h-[calc(100vh-2.3em)] font-sans text-sm"
>
	<!-- MARK: **** Controls **** -->
	<section id="input" class="top-13 z-10 fixed flex flex-col mt-2">
		<h3 class="text-slate-700">Class</h3>
		<div
			id="options"
			class="flex flex-col bg-black px-2 py-1 pt-0 border border-gray-500 border-dotted rounded-lg"
		>
			<div id="types" class="radio-bg">
				<!-- MARK: ****  Type **** -->
				<h3 class="mr-2 px-2 font-sans text-white">Type</h3>
				{#each classControl as { code, key, label } (key)}
					<label class="radio-label" for={key}>
						<input type="radio" class="hidden" id={key} bind:group={classType} value={code} />
						{label}
					</label>
				{/each}
			</div>
			<!-- MARK: **** Days **** -->
			<Switches title="Days" days={WEEKDAYS} bind:checkedDays={checkedDaysState} />
		</div>
		<!-- MARK: **** Events **** -->
		<div id="schoolEvents">
			<h3 class="text-gray-300">Events</h3>
			<textarea
				rows="30"
				class="flex-1 grayscale-50 border border-gray-500 border-dotted min-w-[27.5em] h-full overflow-hidden font-mono text-gray-300 text-xs"
				value={eventsDisplay}
				readonly
			></textarea>
		</div>
	</section>
	<!-- MARK: **** Output **** -->
	<section id="output" class="flex flex-col ml-92">
		<div class="relative flex items-center gap-2">
			<h3 class="text-slate-700">{schedule.name}</h3>
			<div class="relative ml-auto">
				<button
					id="download_button"
					type="button"
					class="hover:bg-gray-200 p-1 rounded btn-focus download-btn"
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
					class="hover:bg-gray-200 p-1 rounded btn-focus copy-btn"
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
			<table
				id="output_table"
				class="w-full min-w-2xl text-left border-separate border-spacing-0 text-slate-700"
			>
				<thead>
					<tr class="bg-blue-700 text-white">
						{#each schedule.rows.header as header_item, i (i)}
							<th class="p-2 border-blue-600 border-t-gray-200 border-r border-l">{header_item}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each schedule.rows.rows as row, i (i)}
						{@const isOff = row[0].trim() === '' && row[2] === 'Off'}
						{@const isExam = row[2].trim() === 'Exam'}
						<tr class="border-gray-600 border-b">
							{#each row as cell, i (i)}
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
		<div id="csv-output" style="display:none;">{schedule.output}</div>
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
