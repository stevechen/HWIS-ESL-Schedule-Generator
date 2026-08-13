import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SheetBubbles from '$lib/zipgrade/SheetBubbles.svelte';
import { QUESTION_COUNT, type AnswerChoice } from '$lib/zipgrade/layout';
import SizedSheet from './SheetBubbles.test.svelte';

const emptyAnswers = () => Array.from({ length: QUESTION_COUNT }, () => [] as AnswerChoice[]);

function renderSized(props: object) {
	return render(SheetBubbles, props, { wrapper: SizedSheet });
}

describe('SheetBubbles (interactive)', () => {
	it('renders a button-like bubble for every letter of every question', async () => {
		renderSized({ answers: emptyAnswers(), interactive: true, onToggle: vi.fn() });
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer A' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Question 65, answer E' }))
			.toBeInTheDocument();
	});

	it('fires onToggle with the question number and letter when a bubble is clicked', async () => {
		const onToggle = vi.fn();
		renderSized({ answers: emptyAnswers(), interactive: true, onToggle });
		await page.getByRole('button', { name: 'Question 1, answer A' }).click();
		expect(onToggle).toHaveBeenCalledWith(1, 'A');
	});

	it('reflects answered letters via aria-pressed', async () => {
		const answers = emptyAnswers();
		answers[0] = ['A'];
		answers[64] = ['E'];
		renderSized({ answers, interactive: true, onToggle: vi.fn() });
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
		renderSized({ answers, interactive: false });
		await expect
			.element(page.getByRole('button', { name: 'Question 1, answer A' }))
			.not.toBeInTheDocument();
	});
});
