<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fade, slide } from 'svelte/transition';
	import { CommunicationStore } from '$lib/stores/communication';
	import type { CommunicationRecord } from '$lib/communication/recordManager.svelte';
	import { RecordManager, areRecordsEqual } from '$lib/communication/recordManager.svelte';

	import AssignmentForm from '$lib/components/communication/AssignmentForm.svelte';
	import SavedRecords from '$lib/components/communication/SavedRecords.svelte';
	import StudentTable from '$lib/components/communication/StudentTable.svelte';
	import SignatureUpload from '$lib/components/communication/SignatureUpload.svelte';
	import PrintButton from '$lib/components/communication/PrintButton.svelte';
	import Slip from '$lib/components/communication/Slip.svelte';
	import IconLib from '$lib/components/communication/IconLib.svelte';

	const state = new CommunicationStore();

	// Development helper for playwright tests
	onMount(() => {
		if (browser && import.meta.env.DEV) {
			window.setStudentsText = (value: string) => {
				state.handlePaste(value);
			};
		}
	});

	//#region Record Management -------------------------------------------
	const recordManager = new RecordManager();

	const currentRecord: CommunicationRecord = $derived({
		grade: state.grade,
		level: state.level,
		classType: state.classType,
		classNum: state.classNum,
		assignment: state.assignment,
		dates: state.dates,
		studentsParsed: state.studentsParsed
	});

	$effect(() => {
		if (state._isLoadingRecord) return;

		// Sync isSaveable
		recordManager.isSaveable =
			!!currentRecord.classNum && currentRecord.studentsParsed.filter((s) => s.selected).length > 0;

		// Sync isModified
		if (!recordManager.lastLoadedRecord) {
			recordManager.isModified = true;
		} else {
			recordManager.isModified = !areRecordsEqual(currentRecord, recordManager.lastLoadedRecord);
		}
	});

	function handleLoadRecord(record: CommunicationRecord) {
		state.loadRecordData(record);
	}

	function clearForm() {
		state.reset();
		recordManager.clearLoadedRecord();
	}
</script>

<!-- MARK: *HTML* -->
<title>White slips</title>
<main class="flex flex-row items-start gap-2 mx-auto w-fit">
	<section
		id="controls"
		class="print:hidden top-13.5 z-10 fixed self-start bg-black pt-2 rounded-lg w-[41em] max-h-[calc(100dvh-2.5rem)] overflow-y-auto font-sans"
	>
		<AssignmentForm store={state} {recordManager} {currentRecord} onClearForm={clearForm} />
		<StudentTable store={state} />
		<div class="flex flex-wrap justify-start items-center mb-0 p-2">
			<div class="*:self-center grid grid-cols-12 mx-5 my-0 w-full">
				{#if state.isSignatureInitialized}
					<SignatureUpload store={state} />
				{:else}
					<!-- spin circle -->
					<svg
						class="inline-block size-12 text-red-500 origin-center animate-[spin_3s_linear_infinite]"
						viewBox="0 0 24 24"
					>
						<use href="#icon-spin" />
					</svg>
				{/if}

				<PrintButton store={state} onPrint={() => window.print()} />
			</div>
		</div>
	</section>

	<section id="slips" class="box-border flex flex-col print:m-0 ml-[42em] print:p-0 py-2">
		<SavedRecords {recordManager} onLoadRecord={handleLoadRecord} />
		<!-- MARK: slip preview -->
		<h3 class="print:hidden mx-2 my-0.5">
			Preview {state.students.length} selected communication slip{state.students.length == 1
				? ''
				: 's'}
		</h3>
		<div class="bg-blue-100 print:p-0 px-2 py-1 rounded-lg w-[182mm] min-h-[calc(100dvh-6.5rem)]">
			{#each state.students as student, i (student.id)}
				<div transition:fade|local>
					<div transition:slide|local>
						<p class="print:hidden block mx-4 mt-2 text-slate-500">Slip #{i + 1}</p>
						<Slip
							{student}
							signatureSrc={state.signatureImage}
							assignment={state.assignmentDetails}
						/>
					</div>
				</div>
			{/each}
		</div>
	</section>
</main>

<IconLib />

<style>
	/* Global styles that can't be converted to Tailwind */
	@media screen {
		:global(html),
		:global(body) {
			overflow-y: scroll;
			scrollbar-width: thin;
		}
		:global(body) {
			overflow-y: overlay;
		}
	}

	@media print {
		@page {
			margin: 0;
			padding: 0;
		}

		/* Mozilla print fix for Slip layout, this breaks Chrome…… */
		@-moz-document url-prefix() {
			main {
				display: block;
			}
		}

		/* Safari print bug fix (not respecting hidden in print). Safari in Tahoe has it fixed.*/
		.print\:m-0 {
			margin: 0;
		}
		.print\:p-0 {
			padding: 0;
		}
		/* Safari print fox for Slip layout. . Safari in Tahoe has it fixed. This breaks Chrome…*/
		@supports (hanging-punctuation: first) and (font: -apple-system-body) and
			(-webkit-appearance: none) {
			main {
				display: block;
			}
		}
	}
</style>
