import { describe, it, expect } from 'vitest';
import { PDF_SCALE, canvasSizeForPdf, filledBubblesInPixels } from '$lib/zipgrade/pdf';
import { createEmptyAnswers } from '$lib/zipgrade/answers';
import { BUBBLE_RADIUS, PAGE_SIZE, QUESTION_POSITIONS } from '$lib/zipgrade/layout';

describe('PDF_SCALE', () => {
	it('renders the sheet at 300 DPI from 72-pt coordinates', () => {
		expect(PDF_SCALE).toBeCloseTo(300 / 72, 6);
	});
});

describe('canvasSizeForPdf', () => {
	it('matches the full sheet at 300 DPI', () => {
		const { width, height } = canvasSizeForPdf();
		expect(width).toBeCloseTo(PAGE_SIZE.widthPt * PDF_SCALE, 6);
		expect(height).toBeCloseTo(PAGE_SIZE.heightPt * PDF_SCALE, 6);
	});

	it('scales with the provided scale factor', () => {
		expect(canvasSizeForPdf(1)).toEqual({ width: PAGE_SIZE.widthPt, height: PAGE_SIZE.heightPt });
	});
});

describe('filledBubblesInPixels', () => {
	it('returns nothing for an empty sheet', () => {
		expect(filledBubblesInPixels(createEmptyAnswers())).toEqual([]);
	});

	it('returns one bubble for a single answer', () => {
		const answers = createEmptyAnswers();
		answers[0] = ['A'];
		const bubbles = filledBubblesInPixels(answers);
		expect(bubbles).toHaveLength(1);
		const [cx, cy] = QUESTION_POSITIONS[0].A;
		expect(bubbles[0].cx).toBeCloseTo(cx * PDF_SCALE, 5);
		expect(bubbles[0].cy).toBeCloseTo(cy * PDF_SCALE, 5);
		expect(bubbles[0].r).toBeCloseTo(BUBBLE_RADIUS * PDF_SCALE, 5);
	});

	it('returns multiple bubbles for multi-letter answers', () => {
		const answers = createEmptyAnswers();
		answers[0] = ['A', 'C'];
		expect(filledBubblesInPixels(answers)).toHaveLength(2);
	});

	it('handles answers across multiple questions', () => {
		const answers = createEmptyAnswers();
		answers[0] = ['B'];
		answers[64] = ['E'];
		const bubbles = filledBubblesInPixels(answers);
		expect(bubbles).toHaveLength(2);
		const last = bubbles.find((b) => b.cx > 300 * PDF_SCALE);
		expect(last).toBeDefined();
	});
});
