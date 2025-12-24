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

	let dialog: HTMLDialogElement;

	function handlePrintClick() {
		if (store.printValidation.isInvalid) return;

		if (store.printValidation.hasCaution) {
			dialog.showModal();
		} else {
			onPrint();
		}
	}

	function closeDialog() {
		dialog.close();
	}

	function printAnyway() {
		dialog.close();
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
	>
		{printButtonText}
	</button>
</div>

<!-- Warning Dialog -->
<dialog
	bind:this={dialog}
	class="m-auto p-6 rounded-xl shadow-2xl backdrop:backdrop-blur-sm bg-slate-900 text-white border border-slate-700 max-w-md w-full"
>
	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-3 text-orange-400">
			<svg class="size-6">
				<use href="#icon-warning" />
			</svg>
			<h3 class="text-xl font-bold">Missing Information</h3>
		</div>

		<p class="text-slate-300">
			The following information is missing. You can still print, but the slips may be incomplete:
		</p>

		<ul class="list-disc list-inside space-y-1 text-slate-200 bg-slate-800/50 p-3 rounded-lg">
			{#each store.printValidation.missingItems as item}
				<li>{item}</li>
			{/each}
		</ul>

		<div class="flex justify-end gap-3 mt-4">
			<button
				onclick={closeDialog}
				class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm font-medium"
			>
				Cancel
			</button>
			<button
				onclick={printAnyway}
				class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors text-sm font-medium shadow-lg shadow-orange-900/20"
			>
				Print Anyway
			</button>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoom {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
