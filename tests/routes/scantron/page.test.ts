import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from '../../../src/routes/scantron/+page.svelte';

describe('scantron page — answer toggling', () => {
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
