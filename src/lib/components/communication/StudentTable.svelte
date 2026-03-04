<script lang="ts">
	import {
		STATUS_CODE,
		STATUSES,
		LEVELS,
		ESL_TYPE,
		CommunicationStore
	} from '$lib/stores/communication';

	let { store }: { store: CommunicationStore } = $props();

	// iPad/iOS paste fix - DOM reference for contenteditable overlay (non-reactive, only used for bind:this)
	// svelte-ignore non_reactive_update
	let pasteArea: HTMLDivElement;

	function onGlobalPaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text');
		if (text && (text.includes('\t') || text.includes('\n'))) {
			e.preventDefault();
			store.handlePaste(text);
		}
	}

	// iPad/iOS paste fix - focuses table div when clicked/tapped so it becomes a valid paste target
	function focusTable(e: MouseEvent) {
		// Don't steal focus from interactive elements (inputs, selects, checkboxes)
		const target = e.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'SELECT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'BUTTON' ||
			target.tagName === 'LABEL'
		) {
			return;
		}
		(e.currentTarget as HTMLElement).focus();
	}

	// iPad/iOS paste fix - keyboard accessibility support for focus handler (Enter/Space keys)
	function focusTableKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			(e.currentTarget as HTMLElement).focus();
		}
	}

	// iPad/iOS paste fix - handle paste events from contenteditable overlay
	function handlePasteAreaPaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text');
		if (text && (text.includes('\t') || text.includes('\n'))) {
			store.handlePaste(text);
		}
	}
</script>

<div
	class="flex flex-wrap justify-start items-center mb-0 p-1 border-gray-600 border-y border-dashed"
	onpaste={onGlobalPaste}
>
	<!-- MARK: class-info -->
	<fieldset class="flex flex-row justify-start items-center mb-1 pr-2 w-full class-info">
		<!-- student icon -->
		<svg class="fill-white mx-4 my-1 size-5" viewBox="0 0 512 512">
			<use href="#icon-student" />
		</svg>
		{#if store.grade}
			<span class={[!store.students.length && 'text-red-500', 'text-white']}
				>{store.students.length} selected</span
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
		<div class={[!store.grade && 'hidden', 'px-2']}>
			<p
				id="grade"
				class={[
					store.grade &&
						'bg-linear-to-b from-slate-700 to-slate-500 text-white shadow-xs shadow-blue-800',
					'rounded-full px-2'
				]}
			>
				{store.grade}
			</p>
		</div>

		<!-- MARK: ESL-level -->
		<div class="radio-bg">
			{#each LEVELS as { id, label, value }}
				<label class="radio-label" for={id}>
					<input
						{id}
						class="appearance-none"
						type="radio"
						bind:group={store.level}
						{value}
					/>{label}
				</label>
			{/each}
		</div>

		<!-- MARK: ESL-type -->
		<div class="radio-bg">
			{#each Object.entries(ESL_TYPE) as [type, value]}
				<!-- only render out CLIL if class is not G9 -->
				{#if value !== ESL_TYPE.CLIL || store.grade !== 'G9'}
					<label class="radio-label" for={type}
						><input
							id={type}
							class="appearance-none"
							type="radio"
							bind:group={store.classType}
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
				id="class-number"
				type="number"
				name="class-number"
				class="bg-linear-to-b from-slate-700 to-slate-500 invalid:bg-none shadow-blue-800 shadow-xs invalid:shadow-none mx-1 invalid:border-2 invalid:border-red-400 rounded-full invalid:rounded-sm w-8 h-6 text-white invalid:text-red-400 text-center transition duration-400 ease-in input-focus"
				bind:value={store.classNum}
				placeholder="#?"
				max="9"
				min="1"
				required
			/>
		</div>
	</fieldset>

	<!-- MARK: student table -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="group relative focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] mx-6 mb-2 border-2 border-transparent focus:border-blue-500/80 rounded-lg outline-hidden focus:ring-4 focus:ring-blue-500/10 w-[calc(100%-3rem)] overflow-hidden transition-all duration-300"
		tabindex="0"
		role="region"
		aria-label="Student data table"
		onclick={focusTable}
		onkeydown={focusTableKey}
	>
		<!-- iPad/iOS paste fix: Contenteditable overlay enables paste on iOS Safari which only allows
			 paste events on form elements or contenteditable elements. The overlay only exists when
			 table is empty (no students) so it doesn't block interactions when students are present. -->
		{#if store.studentsParsed.length === 0}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={pasteArea}
				id="student-paste-area"
				contenteditable="true"
				class="z-20 absolute inset-0 outline-hidden"
				onpaste={handlePasteAreaPaste}
				oninput={(e) => {
					e.preventDefault();
					(e.target as HTMLElement).innerText = '';
				}}
			></div>
		{/if}
		<table class="bg-white w-full text-slate-700 text-sm border-collapse table-fixed">
			<colgroup>
				<col class="w-10" />
				<col class="w-17" />
				<col class="w-auto" />
				<col class="w-20" />
				<col class="w-12" />
				<col class="w-42" />
			</colgroup>
			<thead class="bg-slate-200 font-semibold text-xs">
				<tr class="[&>th]:border [&>th]:border-slate-300 h-6">
					<th>
						<input
							id="master-checkbox"
							type="checkbox"
							class="size-4 align-middle"
							checked={store.isAllChecked.checked}
							indeterminate={store.isAllChecked.indeterminate}
							onchange={store.toggleAll}
							disabled={store.studentsParsed.length === 0}
						/>
					</th>
					<th>ID</th>
					<th>English Name</th>
					<th>C. Name</th>
					<th>Class</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#if store.studentsParsed.length === 0}
					<!-- Placeholder rows to indicate where to paste -->
					{#each Array(5) as _, i}
						<tr
							class={[
								Math.floor(i / 3) % 2 === 1 && 'bg-blue-50',
								'h-6 opacity-40 [&>td]:border [&>td]:border-slate-300'
							]}
						>
							<td></td>
							<td></td>
							<td class="relative overflow-visible">
								{#if i === 2}
									<div
										class="right-[-300px] left-[-112px] absolute inset-y-0 flex justify-center items-center px-4 group-focus:font-medium text-slate-400 group-focus:text-blue-500 whitespace-nowrap transition-colors pointer-events-none"
									>
										Paste students from spreadsheet here (ID, English Name, Chinese Name, Class)
									</div>
								{/if}
							</td>
							<td></td>
							<td></td>
							<td></td>
						</tr>
					{/each}
				{:else}
					{#each store.studentsParsed as student, i}
						<tr
							class={[
								Math.floor(i / 3) % 2 === 1 && 'bg-orange-50/80',
								'h-6 [&>td]:border [&>td]:border-slate-300 [&>td]:p-0 student-row'
							]}
						>
							<td class="text-center align-middle student-checkbox">
								<input
									type="checkbox"
									id="checkbox-{student.id}"
									class="size-4 align-middle"
									bind:checked={store.studentsParsed[i].selected}
								/>
							</td>
							<td class="student-id">
								<input
									type="text"
									id="student-id-{student.id}"
									name="student-id-{student.id}"
									bind:value={store.studentsParsed[i].id}
								/>
							</td>
							<td class="english-name">
								<input
									type="text"
									id="student-name-en-{student.id}"
									name="student-name-en-{student.id}"
									bind:value={store.studentsParsed[i].name.english}
								/>
							</td>
							<td class="chinese-name">
								<input
									type="text"
									id="student-name-cn-{student.id}"
									name="student-name-cn-{student.id}"
									bind:value={store.studentsParsed[i].name.chinese}
								/>
							</td>
							<td class="chinese-class">
								<input
									type="text"
									id="student-class-{student.id}"
									name="student-class-{student.id}"
									bind:value={store.studentsParsed[i].cClass}
								/>
							</td>
							<td class="student-status">
								<select
									id="student-status-{student.id}"
									name="student-status-{student.id}"
									bind:value={store.studentsParsed[i].status}
								>
									<option value={STATUS_CODE.NOT_SUBMITTED}>
										{STATUSES[STATUS_CODE.NOT_SUBMITTED].text.english}
									</option>
									<option value={STATUS_CODE.NOT_COMPLETED}>
										{STATUSES[STATUS_CODE.NOT_COMPLETED].text.english}
									</option>
								</select>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
