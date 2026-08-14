import { describe, it, expect } from 'vitest';
import { AnswerKeyPdfDownloader } from '$lib/zipgrade/downloadPdf.svelte';
import { createEmptyAnswers } from '$lib/zipgrade/answers';

describe('AnswerKeyPdfDownloader — busy/error lifecycle at the seam', () => {
	it('sets busy for the duration of the download, then clears it', async () => {
		let ranWhileBusy = false;
		const downloader = new AnswerKeyPdfDownloader(async () => {
			ranWhileBusy = downloader.busy;
		});

		expect(downloader.busy).toBe(false);
		await downloader.run(createEmptyAnswers());
		expect(ranWhileBusy).toBe(true);
		expect(downloader.busy).toBe(false);
		expect(downloader.error).toBe('');
	});

	it('surfaces an error message when the download throws', async () => {
		const downloader = new AnswerKeyPdfDownloader(async () => {
			throw new Error('boom');
		});

		await downloader.run(createEmptyAnswers());
		expect(downloader.busy).toBe(false);
		expect(downloader.error).toBe('PDF download failed. Check the console for details.');
	});

	it('ignores a second run while already busy', async () => {
		let calls = 0;
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const downloader = new AnswerKeyPdfDownloader(async () => {
			calls++;
			await gate;
		});

		const first = downloader.run(createEmptyAnswers());
		const second = downloader.run(createEmptyAnswers()); // ignored while busy
		expect(downloader.busy).toBe(true);

		release();
		await Promise.all([first, second]);
		expect(calls).toBe(1);
	});
});
