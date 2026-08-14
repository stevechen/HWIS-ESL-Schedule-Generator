<script lang="ts">
	import { ZipGradeStore } from '$lib/zipgrade/store.svelte';
	import { PAGE_SIZE } from '$lib/zipgrade/layout';
	import SheetBubbles from '$lib/zipgrade/SheetBubbles.svelte';
	import { AnswerKeyPdfDownloader } from '$lib/zipgrade/downloadPdf.svelte';
	import { resolve } from '$app/paths';

	const zipgrade = new ZipGradeStore();
	const pdf = new AnswerKeyPdfDownloader();
	let ready = $state(false);
</script>

<div class="flex items-center gap-3 p-3 print:hidden">
	<a href={resolve('/zipgrade')} class="btn btn-secondary btn-sm no-underline">← Back to answers</a>
	<button
		type="button"
		class="btn btn-secondary btn-sm"
		onclick={() => pdf.run(zipgrade.answers)}
		disabled={pdf.busy}
	>
		{pdf.busy ? 'Generating…' : 'Download PDF'}
	</button>
	<button
		type="button"
		class="btn btn-primary btn-sm"
		onclick={() => window.print()}
		disabled={!ready}
	>
		Print
	</button>
	{#if pdf.error}
		<p class="text-xs text-red-600">{pdf.error}</p>
	{:else}
		<p class="text-xs text-slate-500">
			Sheet is {PAGE_SIZE.widthMm} × {PAGE_SIZE.heightMm} mm — load it in the manual / bypass tray.
		</p>
	{/if}
</div>

<div class="sheet">
	<SheetBubbles answers={zipgrade.answers} onload={() => (ready = true)} />
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
