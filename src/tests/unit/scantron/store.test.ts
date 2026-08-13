import { describe, it, expect } from 'vitest';
import { ScantronStore } from '$lib/scantron/store.svelte';

describe('ScantronStore', () => {
	it('starts empty', () => {
		const store = new ScantronStore();
		expect(store.answeredCount).toBe(0);
		expect(store.answers).toHaveLength(65);
		expect(store.answers.every((set) => set.length === 0)).toBe(true);
	});

	it('toggles letters for a question, preserving multiple answers', () => {
		const store = new ScantronStore();
		store.toggle(1, 'A');
		expect(store.answers[0]).toEqual(['A']);
		store.toggle(1, 'C');
		expect(store.answers[0]).toEqual(['A', 'C']);
		store.toggle(1, 'A');
		expect(store.answers[0]).toEqual(['C']);
		expect(store.answeredCount).toBe(1);
	});

	it('does not affect other questions when toggling', () => {
		const store = new ScantronStore();
		store.toggle(65, 'E');
		expect(store.answers[64]).toEqual(['E']);
		expect(store.answers[0]).toEqual([]);
		expect(store.answeredCount).toBe(1);
	});

	it('applies parsed answers by question number', () => {
		const store = new ScantronStore();
		store.toggle(1, 'A');
		store.apply({ 2: ['C'], 3: ['B', 'D'] });
		expect(store.answers[0]).toEqual(['A']);
		expect(store.answers[1]).toEqual(['C']);
		expect(store.answers[2]).toEqual(['B', 'D']);
		expect(store.answeredCount).toBe(3);
	});

	it('keeps existing answers for questions not provided in apply', () => {
		const store = new ScantronStore();
		store.toggle(5, 'B');
		store.apply({ 2: ['A'] });
		expect(store.answers[4]).toEqual(['B']);
		expect(store.answeredCount).toBe(2);
	});

	it('clears all answers', () => {
		const store = new ScantronStore();
		store.toggle(1, 'A');
		store.toggle(40, 'C');
		store.clear();
		expect(store.answeredCount).toBe(0);
		expect(store.answers.every((set) => set.length === 0)).toBe(true);
	});
});
