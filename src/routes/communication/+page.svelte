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

	const store = new CommunicationStore();

	let studentsText = $state(store.studentsText);
	// Parse students immediately
	let studentsRaw: Array<Student> = $derived.by(() => parseStudentsFromText(studentsText));
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
		shouldHideTextarea = studentsRaw.length > 0;
	});

	//#region Student table ---------------------------------------------------------------

	const students = $derived(
		(() => {
			const studentsSelected: DisplayStudent[] = studentsRaw
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
				});
			return studentsSelected;
		})()
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
			studentsRaw
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
		studentsRaw = JSON.parse(JSON.stringify(record.studentsRaw));
	}

	function handleLoadRecord(record: CommunicationRecord) {
		loadRecordData(record);
	}

	function clearForm() {
		const newStore = new CommunicationStore();
		studentsText = newStore.studentsText;
		studentsRaw = newStore.studentsRaw;
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
			{studentsRaw}
			{recordManager}
			{currentRecord}
			onClearForm={clearForm}
		/>
		<StudentTable
			bind:studentsText
			bind:studentsRaw
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
					{studentsRaw}
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

<!-- MARK: svg icons -->
<svg class="hidden" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
	<symbol id="icon-student">
		<path
			class="st0"
			d="M116.738,231.551c0,23.245,14.15,43.315,34.513,49.107c15.262,42.368,55.574,70.776,100.582,70.776 s85.32-28.408,100.58-70.776c20.365-5.792,34.515-25.854,34.515-49.107c0-15.691-6.734-30.652-18.061-40.248l1.661-8.921 c0-3.323-0.229-6.568-0.491-9.821l-0.212-2.593l-2.213,1.374c-30.871,19.146-80.885,27.71-116.754,27.71 c-34.85,0-83.895-8.214-114.902-26.568l-2.259-0.59l-0.188,2.554c-0.192,2.632-0.384,5.256-0.357,8.23l1.632,8.649 C123.466,200.923,116.738,215.876,116.738,231.551z"
		>
		</path>
		<path
			class="st0"
			d="M356.151,381.077c-9.635-5.97-18.734-11.607-26.102-17.43l-0.937-0.738l-0.972,0.691 c-6.887,4.914-31.204,30.17-51.023,51.172l-10.945-21.273l5.697-4.076v-20.854h-40.07v20.854l5.697,4.076l-10.949,21.281 c-19.825-21.009-44.154-46.265-51.034-51.18l-0.973-0.691l-0.937,0.738c-7.368,5.823-16.469,11.46-26.102,17.43 c-30.029,18.61-64.062,39.697-64.062,77.344c0,22.244,52.241,53.579,168.388,53.579c116.146,0,168.388-31.335,168.388-53.579 C420.213,420.774,386.178,399.687,356.151,381.077z"
		>
		</path>
		<path
			class="st0"
			d="M131.67,131.824c0,18.649,56.118,42.306,119.188,42.306s119.188-23.656,119.188-42.306v-25.706l43.503-17.702 v55.962c-5.068,0.792-8.964,5.186-8.964,10.45c0,4.503,2.966,8.432,7.242,9.852l-8.653,57.111h40.704l-8.651-57.111 c4.27-1.421,7.232-5.35,7.232-9.852c0-5.295-3.919-9.697-9.014-10.466l-0.21-67.197c0.357-0.621,0.357-1.266,0.357-1.607 c0-0.342,0-0.978-0.149-0.978h-0.002c-0.262-2.446-2.011-4.612-4.56-5.652l-11.526-4.72L267.551,3.238 C262.361,1.118,256.59,0,250.858,0s-11.502,1.118-16.69,3.238L72.834,68.936c-2.863,1.172-4.713,3.773-4.713,6.622 c0,2.842,1.848,5.443,4.716,6.63l58.833,23.928V131.824z"
		>
		</path>
	</symbol>
	<symbol id="icon-inkWell">
		<g class="fill-none stroke-1 stroke-none" fill-rule="evenodd">
			<g id="des-ink-well" fill="currentColor">
				<path
					d="M34.8606,40.8496 L32.9706,41.9836 C32.3726,42.3426 32.0006,42.9996 32.0006,43.6986 L32.0006,52.9996 C32.0006,53.5526 31.5526,53.9996 31.0006,53.9996 C30.4476,53.9996 30.0006,53.5526 30.0006,52.9996 L30.0006,43.6986 C30.0006,42.3006 30.7446,40.9876 31.9416,40.2686 L33.8316,39.1346 C34.3056,38.8506 34.9196,39.0046 35.2036,39.4776 C35.4876,39.9516 35.3346,40.5656 34.8606,40.8496 M54.1306,36.4476 L51.1056,34.9346 C50.4236,34.5936 50.0006,33.9086 50.0006,33.1456 L50.0006,27.9996 L51.0006,27.9996 C51.5526,27.9996 52.0006,27.5526 52.0006,26.9996 C52.0006,26.4476 51.5526,25.9996 51.0006,25.9996 L33.0006,25.9996 C32.4476,25.9996 32.0006,26.4476 32.0006,26.9996 C32.0006,27.5526 32.4476,27.9996 33.0006,27.9996 L34.0006,27.9996 L34.0006,33.1456 C34.0006,33.9086 33.5766,34.5936 32.8946,34.9346 L29.8696,36.4476 C27.4826,37.6416 26.0006,40.0396 26.0006,42.7076 L26.0006,55.9996 C26.0006,58.2056 27.7946,59.9996 30.0006,59.9996 L54.0006,59.9996 C56.2066,59.9996 58.0006,58.2056 58.0006,55.9996 L58.0006,42.7076 C58.0006,40.0396 56.5176,37.6416 54.1306,36.4476"
					id="Fill-328"
				>
				</path>
				<path
					d="M19.1955,35.9805 C19.1305,35.9945 19.0635,36.0005 18.9995,36.0005 C18.5325,36.0005 18.1145,35.6705 18.0195,35.1955 C17.9115,34.6555 18.2615,34.1285 18.8025,34.0195 C19.0505,33.9675 24.5935,32.7385 27.0605,25.9475 C27.1055,25.8245 27.1745,25.7175 27.2565,25.6265 C29.4355,18.5125 29.1555,12.8715 28.6365,9.6465 C26.3005,12.2625 16.0385,24.8275 12.9145,46.3125 C15.6775,44.3165 20.2445,40.3105 23.8655,33.7015 C21.5025,35.4935 19.3525,35.9495 19.1955,35.9805"
					id="Fill-329"
				>
				</path>
				<path
					d="M27.9755,6.8794 C27.9705,6.8374 27.9805,6.7984 27.9695,6.7564 C27.9645,6.7344 27.9485,6.7184 27.9415,6.6964 C27.9215,6.6344 27.8895,6.5794 27.8575,6.5214 C27.8235,6.4604 27.7905,6.4024 27.7455,6.3514 C27.7315,6.3344 27.7265,6.3134 27.7115,6.2984 C27.6825,6.2684 27.6445,6.2564 27.6125,6.2314 C27.5585,6.1884 27.5045,6.1474 27.4425,6.1164 C27.3845,6.0874 27.3255,6.0684 27.2635,6.0514 C27.2035,6.0354 27.1455,6.0204 27.0815,6.0154 C27.0115,6.0094 26.9435,6.0154 26.8735,6.0254 C26.8345,6.0294 26.7965,6.0204 26.7585,6.0304 C26.6175,6.0654 17.9655,8.3184 11.3715,14.5264 C9.5745,17.2034 10.9385,21.6504 10.9545,21.6994 C11.1205,22.2254 10.8275,22.7874 10.3015,22.9544 C10.2015,22.9854 10.0995,23.0004 10.0005,23.0004 C9.5755,23.0004 9.1805,22.7274 9.0465,22.3004 C8.9995,22.1534 8.3735,20.1124 8.4535,17.7554 C5.8325,21.2144 4.0005,25.5694 4.0005,31.0004 C4.0005,39.4314 7.5025,45.2004 8.7715,47.0154 C8.2875,50.7494 8.0005,54.7414 8.0005,59.0004 C8.0005,59.5524 8.4475,60.0004 9.0005,60.0004 C9.5525,60.0004 10.0005,59.5524 10.0005,59.0004 C10.0005,55.0034 10.2565,51.2374 10.6995,47.6924 L10.8555,46.5204 C14.3625,21.2134 27.5495,7.8634 27.7035,7.7124 C27.7345,7.6814 27.7465,7.6414 27.7725,7.6084 C27.8145,7.5554 27.8525,7.5044 27.8825,7.4444 C27.9125,7.3854 27.9305,7.3264 27.9475,7.2644 C27.9655,7.2034 27.9795,7.1444 27.9845,7.0804 C27.9905,7.0114 27.9835,6.9474 27.9755,6.8794"
					id="Fill-330"
				>
				</path>
			</g>
		</g>
	</symbol>
	<symbol id="icon-calendar">
		<path
			d="M499.641,320.573c-12.207-3.251-25.021-5.011-38.25-5.011c-1.602,0-3.189,0.071-4.781,0.119 c-78.843,2.506-142.118,66.556-143.375,145.709c-0.015,0.799-0.062,1.587-0.062,2.391c0,15.85,2.515,31.102,7.119,45.422 C339.474,568.835,395.381,612,461.391,612c81.859,0,148.219-66.359,148.219-148.219 C609.609,395.151,562.954,337.441,499.641,320.573z M461.391,561.797c-54.133,0-98.016-43.883-98.016-98.016 s43.883-98.016,98.016-98.016s98.016,43.883,98.016,98.016S515.523,561.797,461.391,561.797z"
		>
		</path>
		<polygon
			points="475.734,396.844 442.266,396.844 442.266,449.438 389.672,449.438 389.672,482.906 442.266,482.906 442.266,535.5 475.734,535.5 475.734,482.906 528.328,482.906 528.328,449.438 475.734,449.438 "
		>
		</polygon>
		<path
			d="M126.703,112.359c9.228,0,16.734-7.507,16.734-16.734V54.984v-38.25C143.438,7.507,135.931,0,126.703,0h-14.344 c-9.228,0-16.734,7.507-16.734,16.734v38.25v40.641c0,9.228,7.506,16.734,16.734,16.734H126.703z"
		>
		</path>
		<path
			d="M389.672,112.359c9.228,0,16.734-7.507,16.734-16.734V54.984v-38.25C406.406,7.507,398.899,0,389.672,0h-14.344 c-9.228,0-16.734,7.507-16.734,16.734v38.25v40.641c0,9.228,7.507,16.734,16.734,16.734H389.672z"
		>
		</path>
		<path
			d="M274.922,494.859c-2.333-11.6-3.572-23.586-3.572-35.859c0-4.021,0.177-7.999,0.435-11.953H74.109 c-15.845,0-28.688-12.843-28.688-28.688v-229.5h411.188v88.707c3.165-0.163,6.354-0.253,9.562-0.253 c11.437,0,22.61,1.109,33.469,3.141V93.234c0-21.124-17.126-38.25-38.25-38.25h-31.078v40.641c0,22.41-18.23,40.641-40.641,40.641 h-14.344c-22.41,0-40.641-18.231-40.641-40.641V54.984H167.344v40.641c0,22.41-18.231,40.641-40.641,40.641h-14.344 c-22.41,0-40.641-18.231-40.641-40.641V54.984H40.641c-21.124,0-38.25,17.126-38.25,38.25v363.375 c0,21.124,17.126,38.25,38.25,38.25H274.922z"
		>
		</path>
		<circle cx="137.165" cy="260.578" r="37.954"></circle>
		<circle cx="251.016" cy="260.578" r="37.954"></circle>
		<circle cx="364.867" cy="260.578" r="37.954"></circle>
		<circle cx="251.016" cy="375.328" r="37.953"></circle>
		<circle cx="137.165" cy="375.328" r="37.953"></circle>
	</symbol>
	<symbol id="icon-spin">
		<path
			class="opacity-20 fill-current"
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
		/>
		<path
			class="fill-current origin-center animate-[spin_3s_linear_infinite]"
			d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
		/>
	</symbol>
	<symbol id="icon-trash">
		<path
			class="fill-current"
			d="M15 4c-.522 0-1.06.185-1.438.563C13.185 4.94 13 5.478 13 6v1H7v2h1v16c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V9h1V7h-6V6c0-.522-.185-1.06-.563-1.438C20.06 4.186 19.523 4 19 4zm0 2h4v1h-4zm-5 3h14v16c0 .555-.445 1-1 1H11c-.555 0-1-.445-1-1zm2 3v11h2V12zm4 0v11h2V12zm4 0v11h2V12z"
		/>
	</symbol>
</svg>

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
