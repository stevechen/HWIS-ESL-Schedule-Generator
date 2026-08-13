import { describe, it, expect } from 'vitest';
import { parsePlainText, parseDelimited, parseRows } from '$lib/zipgrade/parser';

describe('parsePlainText (token sequence)', () => {
	it('maps comma-separated tokens to consecutive questions', () => {
		expect(parsePlainText('A, B, C,A, AC,      D,e').answers).toEqual({
			1: ['A'],
			2: ['B'],
			3: ['C'],
			4: ['A'],
			5: ['A', 'C'],
			6: ['D'],
			7: ['E']
		});
	});

	it('maps newline-separated tokens and normalizes contiguous multi-letters', () => {
		expect(parsePlainText('A\nAB\nB\nE\nAe\nEA').answers).toEqual({
			1: ['A'],
			2: ['A', 'B'],
			3: ['B'],
			4: ['E'],
			5: ['A', 'E'],
			6: ['A', 'E']
		});
	});

	it('maps space-separated tokens, uppercasing and sorting letter sets', () => {
		expect(parsePlainText('B ba B C Cd').answers).toEqual({
			1: ['B'],
			2: ['A', 'B'],
			3: ['B'],
			4: ['C'],
			5: ['C', 'D']
		});
	});

	it('maps 65 bare letters to questions 1..65', () => {
		const letters = Array.from({ length: 65 }, (_, i) => ['A', 'B', 'C', 'D', 'E'][i % 5]);
		const result = parsePlainText(letters.join('\n')).answers;
		expect(Object.keys(result)).toHaveLength(65);
		for (let q = 1; q <= 65; q++) {
			expect(result[q]).toEqual([letters[q - 1]]);
		}
	});

	it('strips a UTF-8 BOM from the first token', () => {
		expect(parsePlainText('\uFEFFA\nB').answers).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('ignores surrounding whitespace and empty tokens', () => {
		expect(parsePlainText('   A   \n\n\t\nB\n').answers).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('allows a single trailing period after a token', () => {
		expect(parsePlainText('A.\nB.').answers).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('returns an error for an unrecognized token', () => {
		const result = parsePlainText('A\n??\nB');
		expect(result.error).toMatch(/Unrecognized answer "\?\?"/);
		expect(result.answers).toEqual({});
	});

	it('returns an error when a token contains non-A-E letters', () => {
		expect(parsePlainText('AF').error).toMatch(/Unrecognized answer "AF"/);
		expect(parsePlainText('A1').error).toMatch(/Unrecognized answer "A1"/);
	});

	it('returns an error when more than 65 tokens are provided', () => {
		const letters = Array.from({ length: 66 }, (_, i) => ['A', 'B', 'C', 'D', 'E'][i % 5]);
		const result = parsePlainText(letters.join('\n'));
		expect(result.error).toMatch(/more than 65/i);
	});

	it('returns no error for valid input', () => {
		expect(parsePlainText('A\nAC\nB').error).toBeUndefined();
	});
});

describe('parseDelimited', () => {
	const answers = (text: string, d: ',' | '\t') => parseDelimited(text, d).answers;

	it('maps a single answer column sequentially', () => {
		expect(answers('A\nB\nC\n', ',')).toEqual({ 1: ['A'], 2: ['B'], 3: ['C'] });
	});

	it('maps two-column CSV with a question,answer header', () => {
		expect(answers('Question,Answer\n1,A\n2,B\n', ',')).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('maps two-column CSV without a header row', () => {
		expect(answers('1,A\n2,B\n3,C\n', ',')).toEqual({ 1: ['A'], 2: ['B'], 3: ['C'] });
	});

	it('maps two-column TSV with a tab-separated header', () => {
		expect(answers('Question\tAnswer\n1\tA\n2\tB\n', '\t')).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('recognizes common header variants', () => {
		for (const header of ['Q', 'No', 'Number', 'Item', '#']) {
			expect(answers(`${header},Answer\n1,A\n`, ',')).toEqual({ 1: ['A'] });
		}
	});

	it('parses multi-letter answer cells as a set', () => {
		expect(answers('1,AC\n2,A,C\n3,"A,C"\n', ',')).toEqual({
			1: ['A', 'C'],
			2: ['A', 'C'],
			3: ['A', 'C']
		});
	});

	it('parses double-quoted CSV values', () => {
		expect(answers('"1","A"\n"2","B"\n', ',')).toEqual({ 1: ['A'], 2: ['B'] });
	});

	it('ignores question numbers outside the 1..65 range', () => {
		expect(answers('0,A\n66,B\n1,C\n', ',')).toEqual({ 1: ['C'] });
	});
});

describe('parseRows', () => {
	it('maps numbered single-cell lines to explicit question numbers', () => {
		expect(parseRows([['1. B'], ['2) C'], ['10 D']]).answers).toEqual({
			1: ['B'],
			2: ['C'],
			10: ['D']
		});
	});

	it('maps a numbered single-cell multi-answer line', () => {
		expect(parseRows([['7) A,C']]).answers).toEqual({ 7: ['A', 'C'] });
	});

	it('maps sequential answers starting at question 1', () => {
		expect(parseRows([['B'], ['C']]).answers).toEqual({ 1: ['B'], 2: ['C'] });
	});
});
