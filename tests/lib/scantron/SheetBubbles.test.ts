import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SheetBubbles from '$lib/scantron/SheetBubbles.svelte';
import { QUESTION_COUNT, type AnswerChoice } from '$lib/scantron/layout';

const emptyAnswers = () => Array.from({ length: QUESTION_COUNT }, () => [] as AnswerChoice[]);

describe('SheetBubbles (interactive)', () => {
	it('renders a button-like bubble for every letter of every question', async () => {
		render(SheetBubbles, { answers: emptyAnswers(), interactive: true, onToggle: vi.fn() });
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer A' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Question 65, answer E' }))
			.toBeInTheDocument();
	});

	it('fires onToggle with the question number and letter when a bubble is clicked', async () => {
		const onToggle = vi.fn();
		render(SheetBubbles, { answers: emptyAnswers(), interactive: true, onToggle });
		await page.getByRole('button', { name: 'Question 1, answer A' }).click();
		expect(onToggle).toHaveBeenCalledWith(1, 'A');
	});

	it('reflects answered letters via aria-pressed', async () => {
		const answers = emptyAnswers();
		answers[0] = ['A'];
		answers[64] = ['E'];
		render(SheetBubbles, { answers, interactive: true, onToggle: vi.fn() });
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer A' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer C' }))
			.toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(page.getByRole('button', { name: 'Question 65, answer E' }))
			.toHaveAttribute('aria-pressed', 'true');
	});
});

describe('SheetBubbles (static)', () => {
	it('renders no interactive bubble buttons', async () => {
		const answers = emptyAnswers();
		answers[0] = ['A'];
		render(SheetBubbles, { answers, interactive: false });
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer A' }))
			.not.toBeInTheDocument();
	});
});
