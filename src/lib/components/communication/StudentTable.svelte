<script lang="ts">
	import { StatusTypeCode, STATUS_TYPE, type Student } from '$lib/stores/communicationStore.svelte';

	// Props
	interface Props {
		studentsText: string;
		studentsRaw: Student[];
		shouldHideTextarea: boolean;
		isAllChecked: { checked: boolean; indeterminate: boolean };
		onToggleAll: () => void;
	}

	let {
		studentsText = $bindable(),
		studentsRaw = $bindable(),
		shouldHideTextarea,
		isAllChecked,
		onToggleAll
	}: Props = $props();

	function handleStudentChange() {
		studentsRaw = [...studentsRaw];
	}
</script>

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
{#if studentsRaw.length > 0}
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
						onchange={onToggleAll}
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
						<select
							bind:value={student.status}
							onchange={handleStudentChange}
						>
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