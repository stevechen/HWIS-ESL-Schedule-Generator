import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from '../../../src/routes/zipgrade/+page.svelte';

vi.mock('$lib/zipgrade/pdf', () => ({
	downloadAnswerKeyPdf: vi.fn()
}));

describe('zipgrade page — answer toggling', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('fills a bubble when it is clicked (regression: unbound store method)', async () => {
		render(Page);
		const bubble = page.getByRole('button', { name: 'Question 1, answer A' });
		await bubble.click();
		await expect.element(bubble).toHaveAttribute('aria-pressed', 'true');
	});

	it('removes a bubble when the filled bubble is clicked again', async () => {
		render(Page);
		const bubble = page.getByRole('button', { name: 'Question 1, answer A' });
		await bubble.click();
		await bubble.click();
		await expect.element(bubble).toHaveAttribute('aria-pressed', 'false');
	});

	it('supports multiple letters per question by clicking different bubbles', async () => {
		render(Page);
		const a = page.getByRole('button', { name: 'Question 1, answer A' });
		const c = page.getByRole('button', { name: 'Question 1, answer C' });
		await a.click();
		await c.click();
		await expect.element(a).toHaveAttribute('aria-pressed', 'true');
		await expect.element(c).toHaveAttribute('aria-pressed', 'true');
	});
});

describe('zipgrade page — download PDF', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('downloads the current answers as a PDF', async () => {
		const { downloadAnswerKeyPdf } = await import('$lib/zipgrade/pdf');
		render(Page);
		const bubble = page.getByRole('button', { name: 'Question 1, answer A' });
		await bubble.click();

		const button = page.getByRole('button', { name: 'Download PDF' });
		await button.click();

		expect(downloadAnswerKeyPdf).toHaveBeenCalledTimes(1);
		const answers = vi.mocked(downloadAnswerKeyPdf).mock.calls[0][0];
		expect(answers[0]).toEqual(['A']);
	});

	it('shows a failure message when the PDF download throws', async () => {
		const { downloadAnswerKeyPdf } = await import('$lib/zipgrade/pdf');
		vi.mocked(downloadAnswerKeyPdf).mockRejectedValueOnce(new Error('boom'));
		render(Page);

		const button = page.getByRole('button', { name: 'Download PDF' });
		await button.click();

		await expect
			.element(page.getByText('PDF download failed. Check the console for details.'))
			.toBeInTheDocument();
	});
});
