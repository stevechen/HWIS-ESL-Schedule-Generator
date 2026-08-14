import { browser } from '$app/environment';
import { type AnswerChoice } from './layout';
import {
	applyAnswers,
	countAnswered,
	createEmptyAnswers,
	normalizeAnswers,
	toggleAnswer,
	type AnswerSet
} from './answers';
import type { ParsedAnswers } from './parser';

const STORAGE_KEY = 'zipgradeAnswers';

export class ZipGradeStore {
	/** answers[q - 1] holds the selected letters for question q ([] = unanswered). */
	answers: AnswerSet = $state(createEmptyAnswers());

	answeredCount = $derived(countAnswered(this.answers));

	constructor() {
		// Load persisted answers on mount.
		$effect(() => {
			if (!browser) return;
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) this.answers = normalizeAnswers(JSON.parse(saved));
			} catch (error) {
				console.error('[ZipGradeStore] Failed to load answers:', error);
			}
		});

		// Persist on every change.
		$effect(() => {
			if (!browser) return;
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.answers));
			} catch (error) {
				console.error('[ZipGradeStore] Failed to save answers:', error);
			}
		});
	}

	/** Toggle a letter for a question (clicking the selected letter again removes it). */
	toggle(n: number, letter: AnswerChoice) {
		this.answers = toggleAnswer(this.answers, n, letter);
	}

	/** Merge parsed answers; only provided questions overwrite existing values. */
	apply(parsed: ParsedAnswers) {
		this.answers = applyAnswers(this.answers, parsed);
	}

	clear() {
		this.answers = createEmptyAnswers();
	}
}
