import { downloadAnswerKeyPdf } from './pdf';
import type { AnswerSet } from './answers';

/**
 * Orchestrates an answer-key PDF download: busy state, error message, and the
 * render→PDF→save journey behind one small interface. The download function is
 * injectable so the busy/error lifecycle is testable at this seam (real PDF in
 * production, a fake in the browser-mode test).
 */
export class AnswerKeyPdfDownloader {
	busy = $state(false);
	error = $state('');

	private _download: (answers: AnswerSet) => Promise<void>;

	constructor(download: (answers: AnswerSet) => Promise<void> = downloadAnswerKeyPdf) {
		this._download = download;
	}

	async run(answers: AnswerSet) {
		if (this.busy) return;
		this.busy = true;
		this.error = '';
		try {
			await this._download(answers);
		} catch (downloadError) {
			console.error('PDF download failed:', downloadError);
			this.error = 'PDF download failed. Check the console for details.';
		} finally {
			this.busy = false;
		}
	}
}
