<script lang="ts">
	import {
		getPrintButtonStyle,
		getPrintStatusMessage,
		getPrintButtonText
	} from '$lib/communication/printValidator';
	import { CommunicationStore } from '$lib/stores/communication';

	// Props
	interface Props {
		store: CommunicationStore;
		onPrint: () => void;
	}

	let { store, onPrint }: Props = $props();

	const printButtonStyle = $derived(getPrintButtonStyle(store.printValidation));
	const printStatusMessage = $derived(
		getPrintStatusMessage(store.printValidation, store.students.length)
	);
	const printButtonText = $derived(getPrintButtonText(store.students.length));

	function handlePrintClick() {
		if (store.printValidation.isInvalid) return;

		if (!store.printValidation.hasCaution) {
			onPrint();
		}
	}

	function printAnyway() {
		onPrint();
	}
</script>

<!-- Print button -->
<div class="justify-self-end col-start-9 col-end-13 my-0 text-center">
	<p
		class={[
			store.printValidation.isInvalid && 'text-red-400',
			store.printValidation.hasCaution && 'text-orange-400',
			'text-center text-sm text-blue-400'
		]}
	>
		{printStatusMessage}
	</p>
	<button
		class={printButtonStyle.className}
		title={printButtonStyle.title}
		onclick={handlePrintClick}
		popovertarget={store.printValidation.hasCaution ? 'print-warning-popover' : undefined}
	>
		{printButtonText}
	</button>
</div>

<!-- Warning Popover -->
<div
	id="print-warning-popover"
	popover="auto"
	class="m-auto p-6 rounded-xl shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-slate-900 text-white border border-slate-700 max-w-md w-full animate-[zoom_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
>
	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-3 text-orange-400">
			<svg class="size-6">
				<use href="#icon-warning" />
			</svg>
			<h3 class="text-xl font-bold">Missing Information</h3>
		</div>

		<p class="text-slate-300">
			Info missing or possibly incorrect. Still printable, but the slips may be incomplete:
		</p>

		<ul class="list-disc list-inside space-y-1 text-slate-200 bg-slate-800/50 p-3 rounded-lg">
			{#each store.printValidation.missingItems as item}
				<li>{item}</li>
			{/each}
		</ul>

		<div class="flex justify-end gap-3 mt-4">
			<button
				popovertarget="print-warning-popover"
				popovertargetaction="hide"
				class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm font-medium btn-focus"
			>
				Cancel
			</button>
			<button
				onclick={printAnyway}
				popovertarget="print-warning-popover"
				class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors text-sm font-medium shadow-lg shadow-orange-900/20 btn-focus"
			>
				Print Anyway
			</button>
		</div>
	</div>
</div>
