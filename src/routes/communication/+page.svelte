<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';
	import {
		type Student,
		type DisplayStudent,
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

	const store = new CommunicationStore();

	let studentsText = $state(store.studentsText);
	// Parse students immediately
	let studentsParsed: Array<Student> = $derived.by(() => parseStudentsFromText(studentsText));
	let shouldHideTextarea = $derived(store.shouldHideTextarea);
	const ui = $state({
		grade: store.grade,
		level: store.level,
		classType: store.classType,
		classNum: store.classNum,
		assignment: store.assignment,
		dates: store.dates
	});
	const assignmentRaw = $state(store.assignmentRaw);
	let signatureImage = $state(store.signatureImage);

	// Development helper for playwright tests
	onMount(() => {
		if (browser && import.meta.env.DEV) {
			window.setStudentsText = (value: string) => {
				studentsText = value;
			};
		}
	});

	$effect(() => {
		shouldHideTextarea = studentsParsed.length > 0;
	});

	//#region Student table ---------------------------------------------------------------
	const students = $derived(
		studentsParsed
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

	//#region ESL class ---------------------------------------------------------------
	const grade = $derived(determineGradeFromText(studentsText));
	let className = $derived([ui.grade, ui.level, ui.classNum, ui.classType].join(' '));

	$effect(() => {
		ui.grade = grade || '';
		if (ui.classType === ClassType.CLIL) ui.assignment = AssignmentCode.workbook; //change default to Workbook if it's CLIL
		assignmentRaw.esl = className;
	});

	const G9_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.g9);
	const CLIL_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.clil);
	const COMM_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter((type) => type.comm);
	const assignmentTypes = $derived(
		ui.grade === 'G9'
			? [...G9_ASSIGNMENT_TYPES]
			: ui.classType === ClassType.CLIL
				? [...CLIL_ASSIGNMENT_TYPES]
				: [...COMM_ASSIGNMENT_TYPES]
	);

	let assignment = $derived(
		(() => {
			const assignmentTypeText = assignmentTypes.find((type) => type.code === ui.assignment);
			return {
				...assignmentRaw,
				type: {
					english: assignmentTypeText ? assignmentTypeText.english : 'Unknown',
					chinese: assignmentTypeText ? assignmentTypeText.chinese : '未知'
				}
			};
		})()
	);

	$effect(() => {
		assignmentRaw.assigned = ui.dates.assigned;
		assignmentRaw.due = ui.dates.due;
		assignmentRaw.late = ui.dates.late;
	});
	// #region Save Record -------------------------------------------
	const recordManager = new RecordManager();

	const currentRecord = $derived.by(
		(): CommunicationRecord => ({
			studentsText,
			grade: ui.grade,
			level: ui.level,
			classType: ui.classType,
			classNum: ui.classNum,
			assignment: ui.assignment,
			dates: ui.dates,
			studentsParsed
		})
	);

	// Update record manager state when current record changes
	$effect(() => {
		recordManager.updateState(currentRecord);
	});

	function loadRecordData(record: CommunicationRecord) {
		studentsText = record.studentsText;
		ui.grade = record.grade;
		ui.level = record.level as Level;
		ui.classType = record.classType;
		ui.classNum = record.classNum;
		ui.assignment = record.assignment as AssignmentCode;
		ui.dates = record.dates;
		studentsParsed = JSON.parse(JSON.stringify(record.studentsParsed));
	}

	function handleLoadRecord(record: CommunicationRecord) {
		loadRecordData(record);
	}

	function clearForm() {
		const newStore = new CommunicationStore();
		studentsText = newStore.studentsText;
		studentsParsed = newStore.studentsParsed;
		ui.grade = newStore.grade;
		ui.level = newStore.level as Level;
		ui.classType = newStore.classType;
		ui.classNum = newStore.classNum;
		ui.assignment = newStore.assignment as AssignmentCode;
		ui.dates = newStore.dates;
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
			bind:UI_Assignment={ui.assignment}
			bind:UI_Dates={ui.dates}
			{studentsParsed}
			{recordManager}
			{currentRecord}
			onClearForm={clearForm}
		/>
		<StudentTable
			bind:studentsText
			bind:studentsParsed
			{shouldHideTextarea}
			{grade}
			{students}
			UI_Grade={ui.grade}
			bind:UI_Level={ui.level}
			bind:UI_ClassType={ui.classType}
			bind:UI_ClassNum={ui.classNum}
		/>
		<div class="flex flex-wrap justify-start items-center mb-0 p-2">
			<div class="*:self-center grid grid-cols-12 mx-5 my-0 w-full">
				<SignatureUpload bind:signatureImage />

				<PrintButton
					classNum={ui.classNum}
					{studentsParsed}
					selectedStudentsCount={students.length}
					assignmentDates={{
						assigned: assignment.assigned,
						due: assignment.due,
						late: assignment.late
					}}
					{grade}
					{signatureImage}
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
				<Slip {student} signatureSrc={signatureImage} {assignment} />
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
