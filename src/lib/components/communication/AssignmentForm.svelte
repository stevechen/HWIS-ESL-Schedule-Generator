<script lang="ts">
	import { isValidMonthAndDay } from '$lib/utils.ts.svelte';
	import {
		type Student,
		type AssignmentType,
		AssignmentCode,
		DATE_FIELDS
	} from '$lib/stores/communication';
	import { RecordManager, type CommunicationRecord } from '$lib/communication/recordManager.svelte';

	// Props
	interface Props {
		assignmentTypes: AssignmentType[];
		UI_Assignment: AssignmentCode;
		UI_Dates: { [key: string]: string };
		studentsRaw: Array<Student>;
		recordManager: RecordManager;
		currentRecord: CommunicationRecord;
		onClearForm: () => void;
	}

	let {
		assignmentTypes,
		UI_Assignment = $bindable(),
		UI_Dates = $bindable(),
		studentsRaw,
		recordManager,
		currentRecord,
		onClearForm
	}: Props = $props();

	function handleSaveRecord() {
		const result = recordManager.save(currentRecord);
		if (!result.success) {
			alert(result.error || 'Failed to save record. Please try again.');
		}
	}
</script>

<div id="assignment">
	<div class="flex flex-wrap justify-start items-center bg-black mb-0 p-2 pb-0 rounded-t-lg">
		<div class="flex items-center border-gray-500 border-b-1 w-full">
			<h3 class="mx-2 my-1 pr-10 text-white">Assignment</h3>
			<div class="ml-auto">
				{#if studentsRaw.length > 0}
					<button
						id="clear_button"
						class="bg-gray-500 hover:bg-gray-600 mx-1 px-2 py-1 rounded font-bold text-white text-xs"
						onclick={onClearForm}
					>
						Clear
					</button>
				{/if}
				{#if recordManager.isSaveable && recordManager.isModified}
					<button
						id="save_button"
						class="bg-blue-500 hover:bg-blue-600 mx-1 px-2 py-1 rounded font-bold text-white text-xs"
						onclick={handleSaveRecord}
					>
						Save
					</button>
				{/if}
			</div>
		</div>
		<!-- MARK: assignment type -->
		<fieldset class="flex flex-row justify-start items-center mt-1 mr-2 w-full">
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
		<fieldset class="flex flex-row justify-start items-start my-1 py-1 pr-2 w-full">
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
	</div>
</div>
