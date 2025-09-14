<script lang="ts">
	import { fade } from 'svelte/transition';
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
	import {
		type Student,
		type AssignmentType,
		AssignmentCode,
		LEVEL_TYPE,
		ClassType,
		DATE_FIELDS,
		Level
	} from '$lib/stores/communication';

	// Type for students with transformed status for display
	type DisplayStudent = Omit<Student, 'status'> & {
		status: { english: string; chinese: string };
	};

	// Props
	interface Props {
		assignmentTypes: AssignmentType[];
		UI_Assignment: AssignmentCode;
		UI_Dates: { [key: string]: string };
		grade: string | null;
		students: Array<DisplayStudent>;
		UI_Grade: string;
		UI_Level: Level;
		UI_ClassType: string;
		UI_ClassNum: string;
		studentsRaw: Array<Student>;
		isSaveable: boolean;
		isModified: boolean;
		onClearForm: () => void;
		onSaveRecord: () => void;
	}

	let {
		assignmentTypes,
		UI_Assignment = $bindable(),
		UI_Dates = $bindable(),
		grade,
		students,
		UI_Grade,
		UI_Level = $bindable(),
		UI_ClassType = $bindable(),
		UI_ClassNum = $bindable(),
		studentsRaw,
		isSaveable,
		isModified,
		onClearForm,
		onSaveRecord
	}: Props = $props();
</script>

<div id="assignment">
	<div class="flex justify-between items-center">
		<h3 class="mx-2 my-1 w-10/12">Assignment and class info</h3>
		{#if studentsRaw.length > 0}
			<button
				id="clear_button"
				class="bg-gray-500 hover:bg-gray-600 mx-1 px-2 py-1 rounded font-bold text-white text-xs"
				onclick={onClearForm}
			>
				Clear
			</button>
		{/if}
		{#if isSaveable && isModified}
			<button
				id="save_button"
				class="bg-blue-500 hover:bg-blue-600 mx-1 px-2 py-1 rounded font-bold text-white text-xs"
				onclick={onSaveRecord}
			>
				Save
			</button>
		{/if}
	</div>
	<div class="flex flex-wrap justify-start items-center bg-black mb-0 p-2 border-1 rounded-lg">
		<!-- MARK: assignment type -->
		<fieldset class="flex flex-row justify-start items-center mr-2 mb-1 w-full">
			<!-- inkwell icon -->
			<svg class="mx-4 my-1 size-4 text-white" viewBox="0 0 64 64">
				<use href="#icon-inkWell" />
			</svg>

			<div class="radio-bg">
				{#each assignmentTypes as { code, english }}
					<label class="radio-label" for={code}>
						<input
							id={code}
							class="appearance-none"
							type="radio"
							bind:group={UI_Assignment}
							value={code}
						/>{english}</label
					>
				{/each}
			</div>
		</fieldset>

		<!-- MARK: dates -->
		<fieldset
			class="flex flex-row justify-start items-start mb-1 py-1 pr-2 border-b border-b-gray-400 border-dotted w-full"
		>
			<svg class="fill-white my-1 mr-4 ml-5 size-4" viewBox="0 0 612 612">
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
							'mr-2 w-20 rounded-md border border-slate-400 text-center placeholder:text-sm invalid:border-2 invalid:border-red-400 invalid:group-first-of-type:border-orange-400 focus:border-2 focus:border-blue-800! focus:outline-hidden'
						]}
						type="text"
						name={key}
						id={key}
						bind:value={UI_Dates[key as keyof typeof UI_Dates]}
						maxlength="5"
						placeholder={'Required'}
						required
					/>
				</label>
			{/each}
		</fieldset>

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
						<input
							{id}
							class="appearance-none"
							type="radio"
							bind:group={UI_Level}
							{value}
						/>{label}
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
					class={`appearance:textfield mx-1 h-6 w-8 rounded-full bg-linear-to-b from-slate-700 to-slate-500 text-center text-white shadow-xs shadow-blue-800 transition duration-400 ease-in invalid:rounded-sm  invalid:border-2 invalid:border-red-400 invalid:bg-none invalid:text-red-400 invalid:shadow-none focus:border-blue-800 focus:outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
					bind:value={UI_ClassNum}
					placeholder="#?"
					max="9"
					min="1"
					required
				/>
			</div>
		</fieldset>
	</div>
</div>