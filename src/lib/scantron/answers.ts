import { ANSWER_CHOICES, QUESTION_COUNT, type AnswerChoice } from './layout';
import type { ParsedAnswers } from './parser';

/** answers[q - 1] is the sorted, deduplicated set of letters for question q. */
export type AnswerSet = AnswerChoice[][];

export function createEmptyAnswers(): AnswerSet {
	return Array.from({ length: QUESTION_COUNT }, () => []);
}

export function countAnswered(answers: AnswerSet): number {
	return answers.filter((set) => set.length > 0).length;
}

export function sortLetters(letters: AnswerChoice[]): AnswerChoice[] {
	return [...new Set(letters.map((l) => l.toUpperCase() as AnswerChoice))].sort(
		(a, b) => ANSWER_CHOICES.indexOf(a) - ANSWER_CHOICES.indexOf(b)
	);
}

/** Immutably toggle a letter for question n (1-based). */
export function toggleAnswer(answers: AnswerSet, n: number, letter: AnswerChoice): AnswerSet {
	return answers.map((set, index) => {
		if (index !== n - 1) return set;
		const has = set.includes(letter);
		return has ? set.filter((l) => l !== letter) : sortLetters([...set, letter]);
	});
}

/** Migrate persisted data (legacy single letters or new arrays) into AnswerSet. */
export function normalizeAnswers(raw: unknown): AnswerSet {
	if (!Array.isArray(raw) || raw.length !== QUESTION_COUNT) return createEmptyAnswers();
	return raw.map((value) => {
		if (typeof value === 'string' && /^[A-E]$/.test(value)) return [value as AnswerChoice];
		if (Array.isArray(value)) {
			const letters = value
				.filter((l): l is string => typeof l === 'string' && /^[a-eA-E]$/.test(l))
				.map((l) => l.toUpperCase() as AnswerChoice);
			return sortLetters(letters);
		}
		return [];
	});
}

/** Merge parsed answers; only provided questions overwrite existing sets. */
export function applyAnswers(current: AnswerSet, parsed: ParsedAnswers): AnswerSet {
	return current.map((set, index) => {
		const provided = parsed[index + 1];
		return provided ? sortLetters(provided) : set;
	});
}
