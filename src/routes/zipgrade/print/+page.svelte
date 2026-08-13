<script lang="ts">
	import { ZipGradeStore } from '$lib/zipgrade/store.svelte';
	import { PAGE_SIZE } from '$lib/zipgrade/layout';
	import SheetBubbles from '$lib/zipgrade/SheetBubbles.svelte';
	import { downloadAnswerKeyPdf } from '$lib/zipgrade/pdf';

	const zipgrade = new ZipGradeStore();
	let ready = $state(false);
	let downloading = $state(false);
	let error = $state('');

	async function handleDownloadPdf() {
		if (downloading) return;
		downloading = true;
		error = '';
		try {
			await downloadAnswerKeyPdf(zipgrade.answers);
		} catch (downloadError) {
			console.error('PDF download failed:', downloadError);
			error = 'PDF download failed. Check the console for details.';
		} finally {
			downloading = false;
		}
	}
</script>

<div class="flex items-center gap-3 p-3 print:hidden">
	<a href="/zipgrade" class="btn btn-secondary btn-sm no-underline">← Back to answers</a>
	<button
		type="button"
		class="btn btn-secondary btn-sm"
		onclick={handleDownloadPdf}
		disabled={downloading}
	>
		{downloading ? 'Generating…' : 'Download PDF'}
	</button>
	<button
		type="button"
		class="btn btn-primary btn-sm"
		onclick={() => window.print()}
		disabled={!ready}
	>
		Print
	</button>
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
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
