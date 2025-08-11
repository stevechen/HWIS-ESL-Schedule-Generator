<script lang="ts">
	import { onDestroy, onMount } from 'svelte'; // Add onMount
	import { browser } from '$app/environment';
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
	import Slip from '$lib/components/Slip.svelte';
	import { fade, slide } from 'svelte/transition';
	import {
		type Student,
		AssignmentCode,
		StatusTypeCode,
		STATUS_TYPE,
		COMM_ASSIGNMENT_TYPES,
		LEVEL_TYPE,
		ClassType,
		DATE_FIELDS,
		Limit,
		CommunicationStore
	} from '$lib/stores/communicationStore.svelte';

	const store = new CommunicationStore();

	let studentsText = $state(store.studentsText);
	let studentsRaw = $state(store.studentsRaw);
	let shouldHideTextarea = $state(store.shouldHideTextarea);
	let UI_Grade = $state(store.UI_Grade);
	let UI_Level = $state(store.UI_Level);
	let UI_ClassType = $state(store.UI_ClassType);
	let UI_ClassNum = $state(store.UI_ClassNum);
	const assignmentRaw = $state(store.assignmentRaw);
	let UI_Assignment = $state(store.UI_Assignment);
	const UI_Dates = $state(store.UI_Dates);
	let signatureImage = $state(store.signatureImage);

	// New onMount block to load from local storage - PLACED HERE
	onMount(() => {
		if (browser) {
			const savedSignature = localStorage.getItem('signatureImage');
			if (savedSignature) {
				signatureImage = savedSignature;
			}
		}
	});

	$effect(() => {
		shouldHideTextarea = studentsRaw.length > 0;
	});

	//#region Student table ---------------------------------------------------------------
	$effect(() => {
		studentsRaw = generateStudents(studentsText);
	});

	function generateStudents(data: string) {
		const ID_REGEX = /^\d{7}$/;
		const CLASS_REGEX = /^[JH]\d{3}$/;
		const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
		const ENGLISH_REGEX = /^[a-zA-Z]{2,}(\s[a-zA-Z]+){1,5}$/; //allow 5 groups of two or more alphabetical characters
		const LINES = data
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line !== '');

		if (LINES.length === 0) return [];

		return LINES.map((row) => {
			const student = {
				id: '',
				name: { english: '', chinese: '' },
				cClass: '',
				status: StatusTypeCode.NOT_SUBMITTED,
				selected: true
			};

			const FIELDS = row.split('\t');

			for (const FIELD of FIELDS) {
				if (ID_REGEX.test(FIELD)) {
					student.id = FIELD;
				} else if (CLASS_REGEX.test(FIELD)) {
					student.cClass = FIELD;
				} else if (CHINESE_REGEX.test(FIELD)) {
					student.name.chinese = FIELD;
				} else if (ENGLISH_REGEX.test(FIELD)) {
					student.name.english = FIELD;
				}
			}
			return student;
		}).sort((a, b) => a.name.english.localeCompare(b.name.english));
	}

	const students = $derived.by(() => {
		const studentsSelected = studentsRaw
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
	});

	//#region Master checkbox -----------------------------------------------------------
	let isAllChecked = $derived.by(() => {
		let allChecked = studentsRaw.every((student) => student.selected);
		let anyChecked = studentsRaw.some((student) => student.selected);
		return {
			checked: allChecked,
			indeterminate: !allChecked && anyChecked
		};
	});

	function handleToggleAll() {
		const isAllChecked = studentsRaw.every((student) => student.selected);
		const newCheckedState = !isAllChecked;

		studentsRaw = studentsRaw.map((student) => ({
			...student,
			selected: newCheckedState
		}));
	}

	//#region ESL class ---------------------------------------------------------------
	const grade = $derived.by(() => determineGradeFromText(studentsText));
	let className = $derived([UI_Grade, UI_Level, UI_ClassNum, UI_ClassType].join(' '));

	$effect(() => {
		UI_Grade = grade || '';
		if (UI_ClassType === ClassType.CLIL) UI_Assignment = AssignmentCode.workbook; //change default to Workbook if it's CLIL
		assignmentRaw.esl = className;
	});

	//determine grade from the pasted text. Uses Chinese class number
	function determineGradeFromText(pastedText: string) {
		const gradeMatch = pastedText.match(/J1\d{2}|J2\d{2}|J3\d{2}/);
		if (gradeMatch) {
			//only matches the first record since the reset should be in the same grade
			const matchCode = Number(gradeMatch[0].charAt(1));
			//should be J1xx to J3xx
			if (matchCode >= 1 && matchCode <= 3) {
				return `G${matchCode + 6}`;
			}
		}
		return null; //out or range
	}

	const G9_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isG9);

	const CLIL_ASSIGNMENT_TYPES = COMM_ASSIGNMENT_TYPES.filter((type) => type.isCLIL);

	const assignmentTypes = $derived.by(() => {
		return UI_Grade === 'G9'
			? G9_ASSIGNMENT_TYPES
			: UI_ClassType === ClassType.CLIL
				? CLIL_ASSIGNMENT_TYPES
				: COMM_ASSIGNMENT_TYPES;
	});

	let assignment = $derived.by(() => {
		const assignmentTypeText = assignmentTypes.find((type) => type.code === UI_Assignment);
		return {
			...assignmentRaw,
			type: {
				english: assignmentTypeText ? assignmentTypeText.english : 'Unknown',
				chinese: assignmentTypeText ? assignmentTypeText.chinese : '未知'
			}
		};
	});

	$effect(() => {
		assignmentRaw.assigned = UI_Dates.assigned;
		assignmentRaw.due = UI_Dates.due;
		assignmentRaw.late = UI_Dates.late;
	});

	// #region Signature -------------------------------------------
	let dragCounter = $state(0);
	const isDraggingOver = $derived(dragCounter > 0);

	function validateAndSetImage(file: File): boolean {
		// Check if the file type is JPEG or PNG
		if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
			alert('Only JPG and PNG formats are allowed.');
			return false;
		}

		// Check if the file size is less than 200KB
		if (file.size > Limit.size * 1024) {
			alert(`File size must be under ${Limit.size}KB.`);
			return false;
		}

		const fileURL = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			// Check if the image height is greater than 160px
			if (img.height <= Limit.height) {
				alert(`Image height must be greater than ${Limit.height}px.`);
				return;
			}
			// Set the image URL if all checks pass
			const reader = new FileReader();
			reader.onloadend = () => {
				if (reader.result) {
					signatureImage = reader.result as string;
					localStorage.setItem('signatureImage', reader.result as string);
				}
			};
			reader.readAsDataURL(file);
		};

		img.onerror = () => {
			alert('Failed to load the image.');
		};

		img.src = fileURL;
		return true;
	}

	function handleFileSelect(event: Event) {
		const inputField = event.target as HTMLInputElement | null;
		if (!inputField) return; // Null check

		const file = inputField.files?.[0];
		if (file) validateAndSetImage(file);
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		dragCounter++;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault(); // This is necessary to allow a drop.
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragCounter--;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragCounter = 0;
		const dataTransfer = event.dataTransfer;
		if (dataTransfer) {
			const file = dataTransfer.files[0]; // Get the dropped file
			validateAndSetImage(file); // Call the function to validate and set the image
		}
	}

	function removeSignature(event: MouseEvent) {
		event.stopPropagation(); // This stops the click event from bubbling up to parent elements
		signatureImage = ''; // Clear the signature image
		localStorage.removeItem('signatureImage'); // Remove from local storage
		// Reset the file input value so the same file can be uploaded again
		const input = document.getElementById('signature-upload') as HTMLInputElement | null;
		if (input) input.value = '';
	}

	// A11y functions
	function handleClick() {
		const element = document.getElementById('signature-upload');
		if (element) {
			element.click();
		}
	}

	let student;

	function handleKeyUp(event: KeyboardEvent) {
		// Trigger click on 'Enter' or 'Space' keyup
		if (event.key === 'Enter' || event.key === ' ') {
			handleClick();
		}
	}

	//#region Print button -------------------------------------------
	let printInvalid = $derived(
		!UI_ClassNum ||
			(!isAllChecked.indeterminate && !isAllChecked.checked) ||
			!studentsRaw.length ||
			!isValidMonthAndDay(assignment.due) ||
			!isValidMonthAndDay(assignment.late) ||
			!grade
	);

	let printCaution = $derived(
		!printInvalid && (!isValidMonthAndDay(assignment.assigned) || !signatureImage)
	);

	onDestroy(() => {
		// If the image URL is still set, revoke it before the component is destroyed
		const currentFileURL = signatureImage;
		if (currentFileURL && currentFileURL.startsWith('blob:')) {
			URL.revokeObjectURL(currentFileURL);
		}
	});
</script>

<!-- MARK: **** HTML **** -->
<main class="flex flex-row items-start gap-2 mx-auto w-fit">
	<section id="control" class="print:hidden py-2 w-[43em] font-sans">
		<h3 class="mx-2 my-1">Assignment and student info</h3>
		<div class="flex flex-wrap justify-start items-center bg-black mb-4 p-2 border-2 rounded-lg">
			<!-- MARK: assignment type -->
			<fieldset class="flex flex-row justify-start items-center mr-2 mb-2 w-full">
				<!-- inkwell icon -->
				<svg class="mx-4 my-1 w-6 h-6 text-white" viewBox="0 0 64 64">
					<use href="#icon-inkWell" />
				</svg>

				<div
					class="flex flex-row justify-start items-center bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_1)] my-2 p-1 rounded-full"
				>
					{#each assignmentTypes as { code, english }}
						<label
							class="hover:bg-blue-400 has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:shadow-blue-800 has-checked:shadow-xs hover:shadow-green-300 px-2 rounded-full text-slate-400 has-checked:text-white hover:text-slate-100 transition has-checked:animate-none hover:animate-pulse duration-500 ease-in cursor-pointer has-checked:cursor-default"
							for={code}
						>
							<input
								id={code}
								class="appearance-none"
								type="radio"
								bind:group={UI_Assignment}
								value={code}
							/>
							{english}
						</label>
					{/each}
				</div>
			</fieldset>

			<!-- MARK: dates -->
			<fieldset
				class="flex flex-row justify-start items-start mb-2 py-1 pr-2 border-b border-b-gray-400 border-dotted w-full"
			>
				<svg class="fill-white my-1 mr-4 ml-5 w-6 h-6" viewBox="0 0 612 612">
					<use href="#icon-calendar" />
				</svg>
				{#each DATE_FIELDS as { key, label }}
					{@const invalid =
						!UI_Dates[key as keyof typeof UI_Dates] || !isValidMonthAndDay(UI_Dates[key])}
					<label class="group px-2 text-white text-sm" for={key}>
						{label}
						<input
							class={[
								invalid && 'border-2 border-red-400 text-red-400',
								'mr-2 w-20 rounded-md border border-slate-400 text-center placeholder:text-sm invalid:border-2 invalid:border-red-400 focus:border-2 focus:border-blue-800! focus:outline-hidden invalid:group-first-of-type:border-orange-400'
							]}
							type="text"
							name={key}
							id={key}
							bind:value={UI_Dates[key as keyof typeof UI_Dates]}
							maxlength="5"
							placeholder={key === 'assigned' ? 'Optional' : 'Required'}
							required
						/>
					</label>
				{/each}
			</fieldset>

			<!-- MARK: class-info -->
			<fieldset class="flex flex-row justify-start items-center mb-2 pr-2 w-full class-info">
				<!-- student icon -->
				<svg class="fill-white mx-4 my-1 w-6 h-6" viewBox="0 0 512 512">
					<use href="#icon-student" />
				</svg>
				{#if grade}
					<span class={[!students.length && 'text-red-500', 'text-white']}
						>{students.length} selected</span
					>
				{:else}
					<!-- spin circle -->
					<svg
						class="inline-block w-6 h-6 text-red-500 origin-center animate-[spin_3s_linear_infinite]"
						viewBox="0 0 24 24"
					>
						<use href="#icon-spin" />
					</svg>
					<span class="mr-2 ml-1 text-red-500">0 students</span>
				{/if}
				<div class={[!grade && 'hidden', 'px-3']}>
					<p
						class={[
							grade &&
								'text-white bg-linear-to-b from-slate-700 to-slate-500 shadow-xs shadow-blue-800',
							'rounded-full px-2'
						]}
						transition:fade
					>
						{grade}
					</p>
				</div>

				<!-- MARK: ESL-level -->
				<div
					class="flex flex-row justify-start items-center bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_1)] mx-1 my-2 p-1 rounded-full"
				>
					{#each LEVEL_TYPE as { id, label, value }}
						<label
							class="hover:bg-blue-400 has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:shadow-blue-800 has-checked:shadow-xs hover:shadow-green-300 px-2 rounded-full text-slate-400 has-checked:text-white hover:text-slate-100 transition has-checked:animate-none hover:animate-pulse duration-500 ease-in cursor-pointer has-checked:cursor-default"
							for={id}
						>
							<input {id} class="appearance-none" type="radio" bind:group={UI_Level} {value} />
							{label}
						</label>
					{/each}
				</div>

				<!-- MARK: ESL-type -->
				<div
					class="flex flex-row justify-start items-center bg-linear-[270deg,#444,#222] shadow-[0px_0px_3px_1px_rgba(0,_0,_0,_1),inset_0_8px_3px_-8px_rgba(255,_255,_255,_1)] mx-1 my-2 p-1 rounded-full"
				>
					{#each Object.entries(ClassType) as [type, value]}
						<!-- only render out CLIL if class is not G9 -->
						{#if value !== ClassType.CLIL || UI_Grade !== 'G9'}
							<label
								class="hover:bg-blue-400 has-checked:bg-linear-to-b has-checked:from-slate-700 has-checked:to-slate-500 has-checked:shadow-blue-800 has-checked:shadow-xs hover:shadow-green-300 px-2 rounded-full text-slate-400 has-checked:text-white hover:text-slate-100 transition has-checked:animate-none hover:animate-pulse duration-500 ease-in cursor-pointer has-checked:cursor-default"
								for={type}
								>{value}
								<input
									id={type}
									class="appearance-none"
									type="radio"
									bind:group={UI_ClassType}
									{value}
									aria-label={value}
								/>
							</label>
						{/if}
					{/each}
				</div>

				<!-- MARK: class-number -->
				<div>
					<input
						type="number"
						class={`mx-1 appearance:textfield duration-400 h-6 w-8 rounded-full bg-linear-to-b from-slate-700 to-slate-500 text-center text-white shadow-xs shadow-blue-800 transition ease-in invalid:rounded-sm  invalid:border-2 invalid:border-red-400 invalid:bg-none invalid:text-red-400 invalid:shadow-none focus:border-blue-800 focus:outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
						bind:value={UI_ClassNum}
						placeholder="#?"
						max="9"
						min="1"
						required
					/>
				</div>
			</fieldset>
			<!-- MARK: students -->
			<fieldset class="w-full">
				<textarea
					id="student-list-input"
					class={[
						shouldHideTextarea && 'hidden',
						'bg-white h-10 overflow-hidden min-w-15/16 rounded-md border p-2 placeholder:text-sm invalid:border-2  mx-5 invalid:border-red-400 focus:border-blue-800 focus:outline-hidden'
					]}
					bind:value={studentsText}
					placeholder="Paste students from Excel with fields: [ID, Chinese Name, English Name, Chinese Class]"
					required
				>
				</textarea>
			</fieldset>
			<!-- MARK: student table -->
			{#if studentsRaw.length > 0}
				<table class="bg-white mx-6 mb-4 w-full text-sm border-collapse table-auto">
					<thead class="bg-slate-100 font-semibold text-xs">
						<tr>
							<th class="border border-slate-300 border-solid">
								<input
									id="master-checkbox"
									type="checkbox"
									class="m-1 w-4 h-4"
									bind:checked={isAllChecked.checked}
									indeterminate={isAllChecked.indeterminate}
									onchange={handleToggleAll}
								/>
							</th>
							{#each ['ID', 'English Name', 'C. Name', 'C. Class', 'Status'] as header}
								<th class="border border-slate-300 border-solid">{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each studentsRaw as student}
							<tr
								class="**:focus:bg-blue-50 *:p-1 *:border *:border-gray-500**:focus:border border-slate-200 **:focus:border-blue-500 **:focus:outline-none **:text-center *:border-collapse student *:"
							>
								<td class="table-cell text-align-center align-middle student-checkbox">
									<div class="flex justify-center items-center">
										<label for="checkbox-{student.id}">
											<input
												type="checkbox"
												id="checkbox-{student.id}"
												class="min-w-4 min-h-4"
												bind:checked={student.selected}
											/>
										</label>
									</div>
								</td>
								<td class="w-[4.5rem] student-id">
									<input class="text-center" type="text" bind:value={student.id} />
								</td>
								<td class="w-auto english-name">
									<input type="text-center" bind:value={student.name.english} />
								</td>
								<td class="w-20 chinese-name">
									<input class="text-center" type="text" bind:value={student.name.chinese} />
								</td>
								<td class="w-14 chinese-class">
									<input class="text-center" type="text" bind:value={student.cClass} />
								</td>
								<td class="w-auto text-center">
									<select bind:value={student.status}>
										<option value={StatusTypeCode.NOT_SUBMITTED}>
											{STATUS_TYPE[StatusTypeCode.NOT_SUBMITTED].text.english}
										</option>
										<option value={StatusTypeCode.NOT_COMPLETED}>
											{STATUS_TYPE[StatusTypeCode.NOT_COMPLETED].text.english}
										</option>
									</select>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}

			<!-- MARK: signature-drop-zone -->
			<section class="*:box-border grid grid-cols-12 w-full">
				<div
					class="flex flex-wrap col-start-1 col-end-9 ml-5 *:border-dashed *:rounded-lg cursor-default"
					ondragenter={handleDragEnter}
					ondragover={handleDragOver}
					ondrop={handleDrop}
					ondragleave={handleDragLeave}
					onkeyup={handleKeyUp}
					aria-label="Drag & drop signature file"
					tabindex="0"
					role="button"
				>
					<div
						id="signature-drop-zone"
						class={[
							signatureImage && '-z-10 mt-[-50%] scale-y-0 self-start opacity-0',
							!signatureImage && 'z-1 mt-0',
							'w-full border-2 bg-no-repeat text-center transition-all duration-450',
							isDraggingOver
								? 'border-orange-400 bg-orange-100'
								: "border-orange-300 bg-slate-50 bg-[url('/static/icon-image.svg')]"
						]}
					>
						<p class="mt-2 ml-24 text-orange-500 text-sm text-center whitespace-pre">
							{`Drop a jpg/png signature image to upload
	or`}
						</p>
						<button
							id="browse"
							class="bg-blue-400 hover:bg-blue-500 shadow-blue-800 shadow-xs my-2 ml-24 px-4 py-1 rounded-lg text-white animate-pulse hover:animate-none hover:pointer"
							onclick={handleClick}
							aria-label="browse image"
						>
							Browse…
						</button>
						<p class="mb-2 ml-24 text-slate-400 text-sm">Max upload image size: {Limit.size}KB</p>
					</div>

					<div
						class={[
							signatureImage && 'has-signature z-1 mt-0 border-2',
							!signatureImage && '-z-10 mt-[-50%] scale-y-0 self-start opacity-0',
							'flex w-full items-center border-slate-300 bg-slate-50 transition-all duration-450'
						]}
					>
						<img class="m-auto h-[14mm] signature-preview" src={signatureImage} alt="Signature" />
						<button
							id="remove-signature"
							class="bg-blue-400 hover:bg-blue-500 shadow-blue-800 shadow-xs m-4 p-1.5 rounded-lg w-12 h-12 hover:pointer"
							onclick={(event) => removeSignature(event)}
							aria-label="remove-signature"
						>
							<svg class="w-8 h-8 text-white" viewBox="0 0 32 32">
								<use href="#icon-trash" />
							</svg>
						</button>
					</div>

					<input
						id="signature-upload"
						class="-m-px p-0 border-0 w-px h-px overflow-hidden absolue"
						type="file"
						accept="image/*"
						onchange={handleFileSelect}
					/>
				</div>

				<div class="col-start-10 col-end-13 text-center">
					<p
						class={[
							printInvalid && 'text-red-400',
							printCaution && 'text-orange-400',
							'text-blue-400 py-2 text-center text-sm'
						]}
					>
						{printInvalid || printCaution ? 'Missing Critical Info!' : `Single Sided  B5/JIS-B5`}
					</p>
					<button
						class={[
							printCaution && 'bg-orange-500 shadow-orange-800 hover:bg-orange-600',
							printInvalid && 'animate-none! cursor-default bg-red-500 shadow-red-800',
							'print-slips animate-pulse rounded-lg bg-blue-500 px-4 py-1 text-white shadow-sm shadow-blue-800 hover:animate-none'
						]}
						title={printCaution || printInvalid ? 'Incomplete input' : ''}
						onclick={() => window.print()}
					>
						Print {students.length} Slip{students.length == 1 ? '' : 's'}
					</button>
				</div>
			</section>
		</div>
	</section>
	<!-- MARK: Slips -->
	<section id="slips" class="box-border flex flex-col print:m-0 print:p-0 py-2">
		<h3 class="print:hidden mx-2 my-1">
			Preview {students.length} communication slip{students.length == 1 ? '' : 's'}
		</h3>
		<div class="bg-blue-100 print:p-0 px-2 py-1 rounded-lg w-[182mm] min-h-dvh">
			{#each students as student, i}
				<p class="print:hidden block mx-4 mt-2 text-slate-500" transition:slide>
					Slip #{i + 1}
				</p>
				<Slip {student} signatureSrc={signatureImage} {assignment} />
			{/each}
		</div>
	</section>
</main>

<!-- svg icons -->
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
		<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
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
		</path> <circle cx="137.165" cy="260.578" r="37.954"></circle>
		<circle cx="251.016" cy="260.578" r="37.954"></circle>
		<circle cx="364.867" cy="260.578" r="37.954"></circle>
		<circle cx="251.016" cy="375.328" r="37.953"></circle>
		<circle cx="137.165" cy="375.328" r="37.953"></circle>
	</symbol>
	<symbol id="icon-spin">
		<path
			opacity="0.2"
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
			fill="currentColor"
		/>
		<path
			class="origin-center animate-[spin_3s_linear_infinite]"
			d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
			fill="currentColor"
		/>
	</symbol>
	<symbol id="icon-trash">
		<path
			fill="currentColor"
			d="M15 4c-.522 0-1.06.185-1.438.563C13.185 4.94 13 5.478 13 6v1H7v2h1v16c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V9h1V7h-6V6c0-.522-.185-1.06-.563-1.438C20.06 4.186 19.523 4 19 4zm0 2h4v1h-4zm-5 3h14v16c0 .555-.445 1-1 1H11c-.555 0-1-.445-1-1zm2 3v11h2V12zm4 0v11h2V12zm4 0v11h2V12z"
		/>
	</symbol>
</svg>

<style>
	@reference "../../app.css";
	/* region -------------- CSS -------------------- 
	/* prevents x axis shifting when the scrollbar appears */
	@media screen {
		:global(html),
		:global(body) {
			overflow-y: scroll; /* Apply only for screen viewing */
			scrollbar-width: thin; /* For Firefox */
		}

		:global(body) {
			/* For WebKit browsers */
			overflow-y: overlay;
		}

		/* region .student          */
		.student td input {
			@apply box-border bg-transparent m-0 p-0 border-none w-full h-full;
			&:focus {
				@apply bg-[#eef];
			}
		}

		#signature-upload {
			clip: rect(0, 0, 0, 0);
		}
	}

	/* #region @media print */
	@media print {
		@page {
			margin: 0;
			padding: 0;
		}
	}

	@media print {
		/* fix tailwindcss print: variant not working in dev mode on Safari problem */
		.print\:m-0 {
			margin: 0;
		}

		.print\:p-0 {
			padding: 0;
		}
	}
</style>
