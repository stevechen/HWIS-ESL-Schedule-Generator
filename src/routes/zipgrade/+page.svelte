<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { ZipGradeStore } from '$lib/zipgrade/store.svelte';
	import { PAGE_SIZE, QUESTION_COUNT } from '$lib/zipgrade/layout';
	import SheetBubbles from '$lib/zipgrade/SheetBubbles.svelte';
	import { AnswerKeyPdfDownloader } from '$lib/zipgrade/downloadPdf.svelte';
	import { resolve } from '$app/paths';
	import {
		canEditAt,
		DEFAULT_ZOOM,
		loadZoom,
		saveZoom,
		sheetWidthAt,
		stepZoom
	} from '$lib/zipgrade/zoom';
	import {
		parsePlainText,
		parseDelimited,
		parseRows,
		type ParseResult
	} from '$lib/zipgrade/parser';

	const zipgrade = new ZipGradeStore();
	const pdf = new AnswerKeyPdfDownloader();

	let pasteText = $state('');
	let status = $state('');
	let zoom = $state(DEFAULT_ZOOM);
	let zoomLoaded = $state(false);
	let isTouch = $state(false);

	const sheetWidth = $derived(sheetWidthAt(zoom));
	const editable = $derived(canEditAt(zoom, isTouch));
	const progressPercent = $derived((zipgrade.answeredCount / QUESTION_COUNT) * 100);

	function flash(message: string) {
		status = message;
		setTimeout(() => {
			if (status === message) status = '';
		}, 4000);
	}

	function applyParsed(result: ParseResult) {
		if (result.error) {
			flash(result.error);
			return;
		}
		const count = Object.values(result.answers).filter((set) => set.length > 0).length;
		zipgrade.apply(result.answers);
		flash(
			count === 0
				? 'No answers found in the file.'
				: `Imported ${count} answer${count === 1 ? '' : 's'}.`
		);
	}

	function handlePasteImport() {
		if (!pasteText.trim()) return;
		applyParsed(parsePlainText(pasteText));
		pasteText = '';
	}

	async function handleFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const name = file.name.toLowerCase();
			let parsed: ParseResult;
			if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
				const XLSX = await import('xlsx');
				const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
				const sheet = workbook.Sheets[workbook.SheetNames[0]];
				const rows = XLSX.utils.sheet_to_json(sheet, {
					header: 1,
					raw: false,
					defval: ''
				}) as unknown[][];
				parsed = parseRows(rows.map((row) => row.map((cell) => String(cell))));
			} else {
				const text = await file.text();
				parsed = name.endsWith('.tsv')
					? parseDelimited(text, '\t')
					: name.endsWith('.csv')
						? parseDelimited(text, ',')
						: parsePlainText(text);
			}
			applyParsed(parsed);
		} catch (error) {
			console.error('Import failed:', error);
			flash('Import failed. Check the console for details.');
		}
	}

	function handleClear() {
		zipgrade.clear();
		flash('Cleared all answers.');
	}

	onMount(() => {
		if (!browser) return;
		isTouch = window.matchMedia('(pointer: coarse)').matches;
		zoom = loadZoom(localStorage);
		zoomLoaded = true;
	});

	$effect(() => {
		if (!browser || !zoomLoaded) return;
		saveZoom(localStorage, zoom);
	});
</script>

<main class="mx-auto flex max-w-6xl flex-col gap-4 p-4 font-sans text-sm">
	<div class="flex items-baseline justify-between">
		<div>
			<h1 class="text-lg font-bold text-slate-800">ZipGrade Answer Key</h1>
			<p class="text-xs text-slate-500">
				Quickly build the answer key for ZipGrade to scan for grading your students.
			</p>
		</div>
		<div class="text-right">
			<p class="text-slate-700">
				<span class="font-bold">{zipgrade.answeredCount}</span> / {QUESTION_COUNT} answered
			</p>
			<div class="mt-1 h-2 w-40 overflow-hidden rounded-full bg-slate-200">
				<div class="h-full rounded-full bg-blue-600" style="width: {progressPercent}%"></div>
			</div>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2">
		<span class="pl-1 text-xs font-bold text-slate-500">Zoom</span>
		<button
			type="button"
			class="btn btn-secondary btn-sm"
			onclick={() => (zoom = stepZoom(zoom, -1))}
			disabled={zoom <= 100}
			aria-label="Zoom out"
		>
			−
		</button>
		<span
			class="w-14 text-center font-mono text-sm tabular-nums text-slate-700"
			title="On-screen scale"
		>
			{zoom}%
		</span>
		<button
			type="button"
			class="btn btn-secondary btn-sm"
			onclick={() => (zoom = stepZoom(zoom, 1))}
			disabled={zoom >= 300}
			aria-label="Zoom in"
		>
			+
		</button>
		{#if !editable}
			<span class="text-xs text-slate-500">Fit-width view — zoom in to edit answers.</span>
		{/if}
		<span class="ml-auto flex items-center gap-2">
			<button
				type="button"
				class="btn btn-secondary btn-sm"
				onclick={() => pdf.run(zipgrade.answers)}
				disabled={pdf.busy}
			>
				{pdf.busy ? 'Generating…' : 'Download PDF'}
			</button>
			<a href={resolve('/zipgrade/print')} class="btn btn-primary btn-sm text-center no-underline">
				Print answer sheet
			</a>
			<button type="button" class="btn btn-danger btn-sm" onclick={handleClear}>
				Clear all answers
			</button>
		</span>
		{#if pdf.error}
			<p class="text-xs text-red-600">{pdf.error}</p>
		{/if}
	</div>

	<!-- Import -->
	<div class="rounded-lg border border-slate-300 bg-white p-3">
		<h2 class="font-bold text-slate-700">Import answers</h2>
		<p class="mt-1 text-xs text-slate-500">
			Text (one answer per line, several letters allowed), CSV / TSV / Excel — with or without a
			question-number column. Example: <code class="text-slate-700">1,A,C</code> or a plain list of A–E.
		</p>
		<div class="mt-2 flex flex-col gap-2 sm:flex-row">
			<input
				id="answer-file"
				type="file"
				accept=".txt,.csv,.tsv,.xlsx,.xls"
				class="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:px-3 file:py-1 file:font-bold file:text-white hover:file:bg-blue-600"
				onchange={handleFile}
			/>
			<textarea
				bind:value={pasteText}
				rows="2"
				placeholder="…or paste here, e.g.&#10;A&#10;B&#10;C"
				class="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs focus:border-blue-600 focus:outline-hidden"
			></textarea>
			<button
				type="button"
				class="btn btn-primary btn-sm self-start"
				onclick={handlePasteImport}
				disabled={!pasteText.trim()}
			>
				Import pasted text
			</button>
		</div>
		{#if status}
			<p class="mt-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{status}</p>
		{/if}
	</div>

	<!-- Sheet -->
	<div class="rounded-lg border border-slate-300 bg-white p-3">
		<div class="overflow-auto">
			<div class="mx-auto max-w-full" style="width: {sheetWidth}px">
				<div style="aspect-ratio: {PAGE_SIZE.widthPt} / {PAGE_SIZE.heightPt}">
					<SheetBubbles
						answers={zipgrade.answers}
						interactive={editable}
						onToggle={(n, letter) => zipgrade.toggle(n, letter)}
					/>
				</div>
			</div>
		</div>
	</div>
</main>
