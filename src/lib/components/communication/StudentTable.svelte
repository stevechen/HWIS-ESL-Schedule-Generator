<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		StatusTypeCode,
		STATUS_TYPE,
		type Student,
		type DisplayStudent,
		LEVEL_TYPE,
		ClassType,
		Level
	} from '$lib/stores/communication';

	// Props
	interface Props {
		studentsText: string;
		studentsParsed: Student[];
		shouldHideTextarea: boolean;
		grade: string | null;
		students: Array<DisplayStudent>;
		UI_Grade: string;
		UI_Level: Level;
		UI_ClassType: string;
		UI_ClassNum: string;
	}

	let {
		studentsText = $bindable(),
		studentsParsed = $bindable(),
		shouldHideTextarea,
		grade,
		students,
		UI_Grade,
		UI_Level = $bindable(),
		UI_ClassType = $bindable(),
		UI_ClassNum = $bindable()
	}: Props = $props();

	// Master checkbox logic - moved from main component
	let isAllChecked = $derived(
		(() => {
			let allChecked = studentsParsed.every((student) => student.selected);
			let anyChecked = studentsParsed.some((student) => student.selected);
			return {
				checked: allChecked,
				indeterminate: !allChecked && anyChecked
			};
		})()
	);

	function handleToggleAll() {
		const isAllChecked = studentsParsed.every((student) => student.selected);
		const newCheckedState = !isAllChecked;

		studentsParsed = studentsParsed.map((student) => ({
			...student,
			selected: newCheckedState
		}));
	}

	function handleStudentChange() {
		studentsParsed = [...studentsParsed];
	}
</script>

<div
	class="flex flex-wrap justify-start items-center mb-0 p-2 border-gray-600 border-y-1 border-dashed"
>
	<!-- MARK: class-info -->
	<fieldset class="flex flex-row justify-start items-center mb-2 pr-2 w-full class-info">
		<!-- student icon -->
		<svg class="fill-white mx-4 my-1 size-5" viewBox="0 0 512 512">
			<use href="#icon-student" />
		</svg>
		{#if grade}
			<span class={[!students.length && 'text-red-500', 'text-white']}
				>{students.length} selected</span
			>
		{:else}
			<span class="mr-2 ml-1 text-red-500">0 students</span>
			<!-- spin circle -->
			<svg
				class="inline-block size-4 text-red-500 origin-center animate-[spin_3s_linear_infinite]"
				viewBox="0 0 24 24"
			>
				<use href="#icon-spin" />
			</svg>
		{/if}
		<div class={[!grade && 'hidden', 'px-2']}>
			<p
				id="grade"
				class={[
					grade &&
						'bg-linear-to-b from-slate-700 to-slate-500 text-white shadow-xs shadow-blue-800',
					'rounded-full px-2'
				]}
				transition:fade
			>
				{grade}
			</p>
		</div>

		<!-- MARK: ESL-level -->
		<div class="radio-bg">
			{#each LEVEL_TYPE as { id, label, value }}
				<label class="radio-label" for={id}>
					<input {id} class="appearance-none" type="radio" bind:group={UI_Level} {value} />{label}
				</label>
			{/each}
		</div>

		<!-- MARK: ESL-type -->
		<div class="radio-bg">
			{#each Object.entries(ClassType) as [type, value]}
				<!-- only render out CLIL if class is not G9 -->
				{#if value !== ClassType.CLIL || UI_Grade !== 'G9'}
					<label class="radio-label" for={type}
						><input
							id={type}
							class="appearance-none"
							type="radio"
							bind:group={UI_ClassType}
							{value}
							aria-label={value}
						/>{value}</label
					>
				{/if}
			{/each}
		</div>

		<!-- MARK: class-number -->
		<div>
			<input
				type="number"
				class="bg-linear-to-b from-slate-700 to-slate-500 invalid:bg-none shadow-blue-800 shadow-xs invalid:shadow-none mx-1 focus:border-blue-800 invalid:border-2 invalid:border-red-400 rounded-full invalid:rounded-sm focus:outline-hidden w-8 h-6 text-white invalid:text-red-400 text-center transition duration-400 ease-in"
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
				'mx-5 h-12 min-w-15/16 overflow-hidden rounded-md border bg-white px-2 py-0.5 placeholder:text-sm  invalid:border-2 invalid:border-red-400 focus:border-blue-800 focus:outline-hidden'
			]}
			bind:value={studentsText}
			placeholder="Paste students from spreadsheet with fields (order agnostic):
[ID, Chinese Name, English Name, Chinese Class]"
			required
		>
		</textarea>
	</fieldset>

	<!-- MARK: student table -->
	{#if studentsParsed.length > 0}
		<table class="bg-white mx-6 mb-2 w-full text-sm border-collapse table-auto">
			<thead class="bg-slate-100 font-semibold text-xs">
				<tr>
					<th class="border border-slate-300 border-solid">
						<input
							id="master-checkbox"
							type="checkbox"
							class="m-1 size-4"
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
				{#each studentsParsed as student}
					<tr
						class="[&>td>input]:box-border [&>td>input:focus]:bg-blue-50 [&>td>input]:bg-transparent [&>td]:p-1 [&>td]:border border-slate-200 [&>td]:border-gray-500 [&>td>input]:border-none [&>td>input]:size-full [&>td]:text-center [&>td]:border-collapse"
					>
						<td class="table-cell text-align-center align-middle student-checkbox">
							<div class="flex justify-center items-center">
								<label for="checkbox-{student.id}">
									<input
										type="checkbox"
										id="checkbox-{student.id}"
										class="min-w-4 min-h-4"
										bind:checked={student.selected}
										onchange={handleStudentChange}
									/>
								</label>
							</div>
						</td>
						<td class="w-[4.5rem] student-id">
							<input
								class="text-center"
								type="text"
								bind:value={student.id}
								oninput={handleStudentChange}
							/>
						</td>
						<td class="w-auto english-name">
							<input
								type="text-center"
								bind:value={student.name.english}
								oninput={handleStudentChange}
							/>
						</td>
						<td class="w-20 chinese-name">
							<input
								class="text-center"
								type="text"
								bind:value={student.name.chinese}
								oninput={handleStudentChange}
							/>
						</td>

						<td class="w-14 chinese-class">
							<input
								class="text-center"
								type="text"
								bind:value={student.cClass}
								oninput={handleStudentChange}
							/>
						</td>
						<td class="w-auto text-center">
							<select bind:value={student.status} onchange={handleStudentChange}>
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
</div>
