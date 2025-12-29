<script lang="ts">
	import { isValidMonthAndDay, compareDates } from '$lib/utils/dateValidation';
	import { DATES, CommunicationStore } from '$lib/stores/communication';
	import { RecordManager, type CommunicationRecord } from '$lib/communication/recordManager.svelte';

	// Props
	interface Props {
		store: CommunicationStore;
		recordManager: RecordManager;
		currentRecord: CommunicationRecord;
		onClearForm: () => void;
	}

	let { store, recordManager, currentRecord, onClearForm }: Props = $props();

	function handleSaveRecord() {
		const result = recordManager.save(currentRecord);
		if (!result.success) {
			alert(result.error || 'Failed to save record. Please try again.');
		}
	}
</script>

<div id="assignment">
	<div class="flex flex-wrap justify-start items-center bg-black mb-0 px-2 pb-0 rounded-t-lg">
		<div class="flex items-center border-gray-500 border-b w-full">
			<h3 class="mx-2 my-0.5 pr-10 text-white">Assignment</h3>
			<div class="ml-auto">
				{#if store.studentsParsed.length > 0}
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
		<fieldset class="flex flex-row justify-start items-center mt-0.5 mr-2 w-full">
			<!-- inkwell icon -->
			<svg class="mx-4 my-1 size-4 text-white" viewBox="0 0 64 64">
				<use href="#icon-inkWell" />
			</svg>

			<div class="radio-bg">
				{#each store.assignmentTypes as { code, english }}
					<label class="radio-label" for={code}>
						<input
							id={code}
							class="appearance-none"
							type="radio"
							bind:group={store.assignment}
							value={code}
						/>{english}</label
					>
				{/each}
			</div>
		</fieldset>

		<!-- MARK: dates -->
		<fieldset class="flex flex-row justify-start items-start my-0.5 py-0.5 pr-2 w-full">
			<svg class="fill-white my-1 mr-4 ml-5 size-4" viewBox="0 0 612 612">
				<use href="#icon-calendar" />
			</svg>
			{#each DATES as { key, label }}
				{@const assignedVal = store.dates.assigned}
				{@const dueVal = store.dates.due}
				{@const lateVal = store.dates.late}
				{@const isAssignedValid = isValidMonthAndDay(assignedVal)}
				{@const isDueValid = isValidMonthAndDay(dueVal)}
				{@const isLateValid = isValidMonthAndDay(lateVal)}
				{@const assignedEarlierThanDue =
					!isAssignedValid || !isDueValid || compareDates(assignedVal, dueVal) < 0}
				{@const lateLaterThanDue = !isLateValid || !isDueValid || compareDates(lateVal, dueVal) > 0}
				{@const invalid =
					(key === 'assigned' && (!isAssignedValid || !assignedEarlierThanDue)) ||
					(key === 'due' && (!isDueValid || !assignedEarlierThanDue || !lateLaterThanDue)) ||
					(key === 'late' && (!isLateValid || !lateLaterThanDue))}
				<label class={['group px-2 text-sm', invalid ? 'text-red-400' : 'text-white']} for={key}>
					{label}
					<input
						class={[
							'mr-2 w-20 rounded-md border text-center placeholder:text-sm focus:border-2 focus:border-blue-800! focus:outline-hidden',
							invalid ? 'border-2 border-red-400 text-red-400' : 'border-white text-white'
						]}
						type="text"
						name={key}
						id={key}
						bind:value={store.dates[key as keyof typeof store.dates]}
						maxlength="5"
						placeholder={'Required'}
						required
					/>
				</label>
			{/each}
		</fieldset>
	</div>
</div>
