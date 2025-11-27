<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';
	import {
		type Student,
		AssignmentCode,
		STATUS_TYPE,
		ASSIGNMENT_TYPES,
		ClassType,
		Level,
		CommunicationStore
	} from '$lib/stores/communication';
	import { parseStudentsFromText, determineGradeFromText } from '$lib/communication/studentParser';

	import { RecordManager, type CommunicationRecord } from '$lib/communication/recordManager.svelte';
	import AssignmentForm from '$lib/components/communication/AssignmentForm.svelte';
	import SavedRecords from '$lib/components/communication/SavedRecords.svelte';
	import StudentTable from '$lib/components/communication/StudentTable.svelte';
	import SignatureUpload from '$lib/components/communication/SignatureUpload.svelte';
	import PrintButton from '$lib/components/communication/PrintButton.svelte';
	import Slip from '$lib/components/communication/Slip.svelte';
	import IconLib from '$lib/components/communication/IconLib.svelte';

	const G9_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.g9);
	const CLIL_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.clil);
	const COMM_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.comm);

	const store = new CommunicationStore();
	let _isLoadingRecord = false;

	const state = $state({
		studentsText: store.studentsText,
		studentsParsed: [] as Student[],
		grade: store.grade,
		level: store.level,
		classType: store.classType,
		classNum: store.classNum,
		assignment: store.assignment,
		dates: store.dates,
		assignmentRaw: store.assignmentRaw,
		signatureImage: store.signatureImage
	});

	// Initialize studentsParsed and keep it in sync with studentsText
	$effect(() => {
		if (_isLoadingRecord) return;
		state.studentsParsed = parseStudentsFromText(state.studentsText);
	});

	const shouldHideTextarea = $derived(state.studentsParsed.length > 0);

	// Development helper for playwright tests
	onMount(() => {
		if (browser && import.meta.env.DEV) {
			window.setStudentsText = (value: string) => {
				state.studentsText = value;
			};
		}
	});

	//#region Derived State ---------------------------------------------------------------
	const students = $derived(
		state.studentsParsed
			.filter((student) => student.selected) // filter out unselected
			.map(({ status, ...rest }) => {
				// Lookup the status in STATUS_TYPE to find the corresponding {english, chinese} object to pass to Slip
				const studentStatus = STATUS_TYPE[status as keyof typeof STATUS_TYPE];
				return {
					...rest,
					status: studentStatus
						? { english: studentStatus.text.english, chinese: studentStatus.text.chinese }
						: { english: 'Unknown', chinese: '未知' }
				};
			})
	);

	const grade = $derived(determineGradeFromText(state.studentsText));
	const className = $derived([state.grade, state.level, state.classNum, state.classType].join(' '));

	$effect(() => {
		state.grade = grade || '';
		if (state.classType === ClassType.CLIL) state.assignment = AssignmentCode.workbook; //change default to Workbook if it's CLIL
		state.assignmentRaw.esl = className;
	});

	const assignmentTypes = $derived(
		state.grade === 'G9'
			? G9_ASSIGNMENT_TYPES
			: state.classType === ClassType.CLIL
				? CLIL_ASSIGNMENT_TYPES
				: COMM_ASSIGNMENT_TYPES
	);

	const assignment = $derived(
		(() => {
			const assignmentTypeText = assignmentTypes.find((type) => type.code === state.assignment);
			return {
				...state.assignmentRaw,
				assigned: state.dates.assigned,
				due: state.dates.due,
				late: state.dates.late,
				type: {
					english: assignmentTypeText ? assignmentTypeText.english : 'Unknown',
					chinese: assignmentTypeText ? assignmentTypeText.chinese : '未知'
				}
			};
		})()
	);

	//#region Record Management -------------------------------------------
	const recordManager = new RecordManager();

	const currentRecord: CommunicationRecord = $derived({
		studentsText: state.studentsText,
		grade: state.grade,
		level: state.level,
		classType: state.classType,
		classNum: state.classNum,
		assignment: state.assignment,
		dates: state.dates,
		studentsParsed: state.studentsParsed
	});

	$effect(() => {
		recordManager.updateState(currentRecord);
	});

	function loadRecordData(record: CommunicationRecord) {
		_isLoadingRecord = true;
		state.studentsText = record.studentsText;
		state.grade = record.grade;
		state.level = record.level as Level;
		state.classType = record.classType;
		state.classNum = record.classNum;
		state.assignment = record.assignment as AssignmentCode;
		state.dates = record.dates;
		state.studentsParsed = JSON.parse(JSON.stringify(record.studentsParsed));

		// Defer setting the flag back to false to prevent the effect from re-parsing immediately
		setTimeout(() => {
			_isLoadingRecord = false;
		}, 0);
	}

	function handleLoadRecord(record: CommunicationRecord) {
		loadRecordData(record);
	}

	function clearForm() {
		const newStore = new CommunicationStore();
		state.studentsText = newStore.studentsText;
		// studentsParsed will be updated by the $effect
		state.grade = newStore.grade;
		state.level = newStore.level as Level;
		state.classType = newStore.classType;
		state.classNum = newStore.classNum;
		state.assignment = newStore.assignment as AssignmentCode;
		state.dates = newStore.dates;
		recordManager.clearLoadedRecord();
	}
</script>

<!-- MARK: **** HTML **** -->
<title>White slips</title>
<main class="flex flex-row items-start gap-2 mx-auto w-fit">
	<section
		id="controls"
		class="print:hidden top-13.5 z-10 fixed self-start bg-black pt-2 rounded-lg w-[41em] max-h-[calc(100dvh-2.5rem)] overflow-y-auto font-sans"
	>
		<AssignmentForm
			{assignmentTypes}
			bind:UI_Assignment={state.assignment}
			bind:UI_Dates={state.dates}
			studentsParsed={state.studentsParsed}
			{recordManager}
			{currentRecord}
			onClearForm={clearForm}
		/>
		<StudentTable
			bind:studentsText={state.studentsText}
			bind:studentsParsed={state.studentsParsed}
			{shouldHideTextarea}
			{grade}
			{students}
			UI_Grade={state.grade}
			bind:UI_Level={state.level}
			bind:UI_ClassType={state.classType}
			bind:UI_ClassNum={state.classNum}
		/>
		<div class="flex flex-wrap justify-start items-center mb-0 p-2">
			<div class="*:self-center grid grid-cols-12 mx-5 my-0 w-full">
				<SignatureUpload bind:signatureImage={state.signatureImage} />

				<PrintButton
					classNum={state.classNum}
					studentsParsed={state.studentsParsed}
					selectedStudentsCount={students.length}
					assignmentDates={{
						assigned: assignment.assigned,
						due: assignment.due,
						late: assignment.late
					}}
					{grade}
					signatureImage={state.signatureImage}
					onPrint={() => window.print()}
				/>
			</div>
		</div>
	</section>

	<section id="slips" class="box-border flex flex-col print:m-0 ml-[42em] print:p-0 py-2">
		<SavedRecords {recordManager} onLoadRecord={handleLoadRecord} />
		<!-- MARK: slip preview -->
		<h3 class="print:hidden mx-2 my-0.5">
			Preview {students.length} communication slip{students.length == 1 ? '' : 's'}
		</h3>
		<div class="bg-blue-100 print:p-0 px-2 py-1 rounded-lg w-[182mm] min-h-[calc(100dvh-6.5rem)]">
			{#each students as student, i (student.id)}
				<p class="print:hidden block mx-4 mt-2 text-slate-500" transition:slide>
					Slip #{i + 1}
				</p>
				<Slip {student} signatureSrc={state.signatureImage} {assignment} />
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
