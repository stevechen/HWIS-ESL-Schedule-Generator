<script lang="ts">
	import { ScantronStore } from '$lib/scantron/store.svelte';
	import { PAGE_SIZE } from '$lib/scantron/layout';
	import SheetBubbles from '$lib/scantron/SheetBubbles.svelte';

	const scantron = new ScantronStore();
	let ready = $state(false);
</script>

<div class="flex items-center gap-3 p-3 print:hidden">
	<a href="/scantron" class="btn btn-secondary btn-sm no-underline">← Back to answers</a>
	<button
		type="button"
		class="btn btn-primary btn-sm"
		onclick={() => window.print()}
		disabled={!ready}
	>
		Print
	</button>
	<p class="text-xs text-slate-500">
		Sheet is {PAGE_SIZE.widthMm} × {PAGE_SIZE.heightMm} mm — load it in the manual / bypass tray.
	</p>
</div>

<div class="sheet">
	<SheetBubbles answers={scantron.answers} onload={() => (ready = true)} />
</div>

<style>
	.sheet {
		position: relative;
		width: 176.02mm;
		height: 250.02mm;
		margin: 0 auto;
		box-shadow: 0 0 12px rgb(0 0 0 / 0.25);
	}

	@media print {
		@page {
			size: 176mm 250mm;
			margin: 0;
		}

		:global(html),
		:global(body) {
			margin: 0 !important;
			padding: 0 !important;
		}

		.sheet {
			margin: 0;
			box-shadow: none;
		}
	}
</style>
