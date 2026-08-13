import { describe, it, expect } from 'vitest';
import {
	createEmptyAnswers,
	countAnswered,
	toggleAnswer,
	normalizeAnswers,
	applyAnswers,
	sortLetters,
	type AnswerSet
} from '$lib/zipgrade/answers';

describe('createEmptyAnswers', () => {
	it('creates 65 empty answer sets', () => {
		const answers = createEmptyAnswers();
		expect(answers).toHaveLength(65);
		expect(answers.every((set) => Array.isArray(set) && set.length === 0)).toBe(true);
	});

	it('returns a fresh array on each call', () => {
		expect(createEmptyAnswers()).not.toBe(createEmptyAnswers());
	});
});

describe('countAnswered', () => {
	it('counts questions with at least one letter', () => {
		const answers: AnswerSet = createEmptyAnswers();
		answers[0] = ['A'];
		answers[2] = ['A', 'C'];
		expect(countAnswered(answers)).toBe(2);
	});
});

describe('toggleAnswer', () => {
	it('adds a letter to an unanswered question', () => {
		const answers = createEmptyAnswers();
		const next = toggleAnswer(answers, 1, 'A');
		expect(next[0]).toEqual(['A']);
		expect(answers[0]).toEqual([]);
	});

	it('removes the letter when toggled again', () => {
		const answers = createEmptyAnswers();
		const once = toggleAnswer(answers, 1, 'A');
		const twice = toggleAnswer(once, 1, 'A');
		expect(twice[0]).toEqual([]);
	});

	it('keeps letters sorted when adding out of order', () => {
		let answers = createEmptyAnswers();
		answers = toggleAnswer(answers, 1, 'C');
		answers = toggleAnswer(answers, 1, 'A');
		expect(answers[0]).toEqual(['A', 'C']);
	});

	it('adds a second letter alongside the first (multi-response)', () => {
		let answers = createEmptyAnswers();
		answers = toggleAnswer(answers, 3, 'A');
		answers = toggleAnswer(answers, 3, 'C');
		expect(answers[2]).toEqual(['A', 'C']);
	});

	it('leaves other questions untouched', () => {
		let answers = createEmptyAnswers();
		answers = toggleAnswer(answers, 1, 'A');
		answers = toggleAnswer(answers, 5, 'B');
		expect(answers[0]).toEqual(['A']);
		expect(answers[4]).toEqual(['B']);
		expect(answers[1]).toEqual([]);
	});
});

describe('sortLetters', () => {
	it('dedupes, uppercases and sorts A..E', () => {
		expect(sortLetters(['E', 'a', 'C', 'A'])).toEqual(['A', 'C', 'E']);
	});
});

describe('normalizeAnswers', () => {
	it('returns empty sets for non-array or wrong-length input', () => {
		expect(normalizeAnswers(null)).toEqual(createEmptyAnswers());
		expect(normalizeAnswers([])).toEqual(createEmptyAnswers());
		expect(normalizeAnswers(new Array(3).fill('A'))).toEqual(createEmptyAnswers());
	});

	it('migrates legacy single-letter string format', () => {
		const legacy = Array.from({ length: 65 }, (_, i) => (i === 0 ? 'A' : i === 2 ? 'B' : null));
		const answers = normalizeAnswers(legacy);
		expect(answers[0]).toEqual(['A']);
		expect(answers[2]).toEqual(['B']);
		expect(answers[1]).toEqual([]);
	});

	it('normalizes array-of-letters values', () => {
		const raw = Array.from({ length: 65 }, () => null);
		raw[0] = ['c', 'A', 'a'];
		const answers = normalizeAnswers(raw);
		expect(answers[0]).toEqual(['A', 'C']);
	});

	it('drops invalid letters from array values', () => {
		const raw = Array.from({ length: 65 }, () => null);
		raw[0] = ['A', 'Z', 42];
		expect(normalizeAnswers(raw)[0]).toEqual(['A']);
	});
});

describe('applyAnswers', () => {
	it('overwrites only provided questions', () => {
		const answers: AnswerSet = createEmptyAnswers();
		answers[0] = ['A'];
		answers[4] = ['B'];
		const next = applyAnswers(answers, { 1: ['C'], 5: ['A', 'D'] });
		expect(next[0]).toEqual(['C']);
		expect(next[4]).toEqual(['A', 'D']);
	});

	it('sorts parsed letters on overwrite', () => {
		const answers: AnswerSet = createEmptyAnswers();
		const next = applyAnswers(answers, { 2: ['D', 'B'] });
		expect(next[1]).toEqual(['B', 'D']);
	});
});
