import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import EditorPage from '../../../src/routes/zipgrade/+page.svelte';
import PrintPage from '../../../src/routes/zipgrade/print/+page.svelte';
import { QUESTION_COUNT, QUESTION_POSITIONS } from '$lib/zipgrade/layout';

// Registers page.getByCSS for id/class selectors.
import '../../components/communication/css-locator';

vi.mock('$lib/zipgrade/pdf', () => ({
	downloadAnswerKeyPdf: vi.fn()
}));

function bubble(n: number, letter: string) {
	return page.getByRole('button', { name: `Question ${n}, answer ${letter}` });
}

/** Legacy single-letter storage shape: one A..E string (or null) per question. */
function legacyStoredAnswers(): (string | null)[] {
	return Array.from({ length: QUESTION_COUNT }, () => null);
}

/** Set a legacy single-letter answer for question q (1-based), mirroring `bubble`. */
function setLegacy(answers: (string | null)[], q: number, letter: string) {
	answers[q - 1] = letter;
}

/** Center (cx, cy) of the bubble for question q, answer letter — as rendered on the print page. */
function bubbleCenter(q: number, letter: string): [number, number] {
	const position = QUESTION_POSITIONS.find((p) => p.n === q)!;
	return position[letter as keyof typeof position] as [number, number];
}

describe('zipgrade persistence — save-then-load round trip', () => {
	it('keeps a toggled bubble pressed after remounting the page', async () => {
		localStorage.clear();
		const first = render(EditorPage);
		await bubble(1, 'A').click();
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'true');
		await tick();

		await first.unmount();
		render(EditorPage);
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'true');
	});
});

describe('zipgrade persistence — corrupted storage', () => {
	it('starts empty instead of crashing when stored answers are garbage', async () => {
		localStorage.clear();
		localStorage.setItem('zipgradeAnswers', 'not json {');
		render(EditorPage);

		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'false');
		await expect.element(bubble(1, 'B')).toHaveAttribute('aria-pressed', 'false');
	});
});

describe('zipgrade persistence — legacy format loads', () => {
	it('restores legacy single-letter answers into pressed bubbles', async () => {
		localStorage.clear();
		const legacy = legacyStoredAnswers();
		setLegacy(legacy, 1, 'A');
		setLegacy(legacy, 3, 'B');
		localStorage.setItem('zipgradeAnswers', JSON.stringify(legacy));

		render(EditorPage);
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'true');
		await expect.element(bubble(3, 'B')).toHaveAttribute('aria-pressed', 'true');
		await expect.element(bubble(2, 'A')).toHaveAttribute('aria-pressed', 'false');
	});
});

describe('zipgrade persistence — editor to print contract', () => {
	it('renders on the print page the answers last saved by the editor', async () => {
		localStorage.clear();
		const editor = render(EditorPage);
		await bubble(1, 'A').click();
		await bubble(3, 'C').click();
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'true');
		await expect.element(bubble(3, 'C')).toHaveAttribute('aria-pressed', 'true');
		await tick();

		await editor.unmount();
		render(PrintPage);

		// The print page is non-interactive: each selected answer is a filled circle
		// at the bubble's sheet coordinates. Assert the exact answers survive, not just a count.
		const filled = page
			.getByCSS('circle[fill="#000"]')
			.elements()
			.map((circle) => [Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))]);
		expect(filled).toHaveLength(2);
		expect(filled).toContainEqual(bubbleCenter(1, 'A'));
		expect(filled).toContainEqual(bubbleCenter(3, 'C'));
	});
});

describe('zipgrade persistence — clearing clears', () => {
	it('stays empty after remount when a bubble is toggled off', async () => {
		localStorage.clear();
		const first = render(EditorPage);
		await bubble(1, 'A').click();
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'true');
		await tick();

		await bubble(1, 'A').click();
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'false');
		await tick();

		await first.unmount();
		render(EditorPage);
		await expect.element(bubble(1, 'A')).toHaveAttribute('aria-pressed', 'false');
	});
});
