import { QUESTION_COUNT, type AnswerChoice } from './layout';
import { sortLetters } from './answers';

/** question number -> sorted set of answer letters, for questions the input provided. */
export type ParsedAnswers = Record<number, AnswerChoice[]>;

export interface ParseResult {
	answers: ParsedAnswers;
	error?: string;
}

const HEADER_CELL = /^(question|answer|key|q|no\.?|number|item|#)$/i;

function stripBom(text: string): string {
	return text.startsWith('\uFEFF') ? text.slice(1) : text;
}

/**
 * Parse a token (or cell) into a sorted, deduplicated set of A-E letters.
 * Commas and whitespace inside the token are accepted as separators; a single
 * trailing period is tolerated. Returns null if any part is not A-E letters.
 */
export function parseToken(token: string): AnswerChoice[] | null {
	const parts = token.split(/[\s,]+/).filter(Boolean);
	const letters = new Set<AnswerChoice>();
	for (const part of parts) {
		const s = part.replace(/\.+$/, '');
		if (!/^[a-eA-E]+$/.test(s)) return null;
		for (const ch of s.toUpperCase()) letters.add(ch as AnswerChoice);
	}
	if (letters.size === 0) return null;
	return sortLetters([...letters]);
}

/** Union of tokens across multiple cells, or null when nothing parses. */
function parseCells(cells: string[]): AnswerChoice[] | null {
	const letters = new Set<AnswerChoice>();
	for (const cell of cells) {
		const set = parseToken(cell);
		if (set) for (const letter of set) letters.add(letter);
	}
	if (letters.size === 0) return null;
	return sortLetters([...letters]);
}

/** Match a single-cell line like "12. C", "7) A,C" or "10 D". */
function parseNumberedCell(cell: string): { n: number; set: AnswerChoice[] } | null {
	const s = cell.trim();
	const m = s.match(/^(\d{1,2})\s*[.)、,;:-]\s*(.+)$/);
	if (m) {
		const n = Number(m[1]);
		if (n >= 1 && n <= QUESTION_COUNT) {
			const set = parseToken(m[2]);
			if (set) return { n, set };
		}
		return null;
	}
	const m2 = s.match(/^(\d{1,2})\s+([a-eA-E.,\s]+)$/);
	if (m2) {
		const n = Number(m2[1]);
		if (n >= 1 && n <= QUESTION_COUNT) {
			const set = parseToken(m2[2]);
			if (set) return { n, set };
		}
	}
	return null;
}

/**
 * Parse rows of already-split cells into question -> answer sets.
 *
 * Supported shapes (in any file):
 *  - [question number, answer...] columns, with or without a header row.
 *  - [answer, question number].
 *  - Numbered single-cell lines like "1. B" / "7) A,C" / "10 D".
 *  - Rows of answer cells mapped sequentially from question 1 (extra cells in
 *    a row contribute more letters to the same question).
 *
 * Unparseable cells are skipped; header rows are recognized on the first
 * non-empty row only.
 */
export function parseRows(rows: string[][]): ParseResult {
	const result: ParsedAnswers = {};
	let next = 1;
	let checkedFirstRow = false;

	for (const row of rows) {
		const cells = row.map((cell) => cell.trim());
		const [c0 = '', c1 = ''] = cells;
		if (!c0 && !c1) continue;

		if (!checkedFirstRow) {
			checkedFirstRow = true;
			if (HEADER_CELL.test(c0)) continue;
		}

		const n0 = Number(c0);
		const n1 = Number(c1);
		const c0IsDigits = /^\d+$/.test(c0);
		const c1IsDigits = /^\d+$/.test(c1);

		// [question number, answer(s)]; out-of-range numbers are skipped.
		if (c0IsDigits) {
			if (n0 >= 1 && n0 <= QUESTION_COUNT) {
				const set = parseCells(cells.slice(1));
				if (set) result[n0] = set;
			}
			continue;
		}
		// [answer, question number]; out-of-range numbers are skipped.
		if (c1IsDigits) {
			if (n1 >= 1 && n1 <= QUESTION_COUNT) {
				const set = parseToken(c0);
				if (set) result[n1] = set;
			}
			continue;
		}
		// Numbered single cell, e.g. "12. C".
		const numbered = parseNumberedCell(c0);
		if (numbered) {
			result[numbered.n] = numbered.set;
			continue;
		}
		// Sequential answers.
		if (next > QUESTION_COUNT) continue;
		const set = parseCells(cells);
		if (set) {
			result[next] = set;
			next++;
		}
	}
	return { answers: result };
}

/** Parse delimited (CSV/TSV) text into question -> answer sets. */
export function parseDelimited(text: string, delimiter: ',' | '\t'): ParseResult {
	const rows = stripBom(text)
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '')
		.map((line) => splitRow(line, delimiter));
	return parseRows(rows);
}

/**
 * Parse plain text as a sequence of answer tokens split by commas or any
 * whitespace; each token answers the next question in order.
 */
export function parsePlainText(text: string): ParseResult {
	const tokens = stripBom(text)
		.split(/[\s,]+/)
		.filter((t) => t.trim() !== '');
	const answers: ParsedAnswers = {};
	for (let i = 0; i < tokens.length; i++) {
		const n = i + 1;
		if (n > QUESTION_COUNT) {
			return {
				answers: {},
				error: `More than ${QUESTION_COUNT} answers provided (found ${n}).`
			};
		}
		const set = parseToken(tokens[i]);
		if (!set) {
			return {
				answers: {},
				error: `Unrecognized answer "${tokens[i]}" for question ${n}.`
			};
		}
		answers[n] = set;
	}
	return { answers };
}

/**
 * Split a single line into cells. Tabs split directly; commas are parsed
 * CSV-style (respecting double-quoted fields).
 */
function splitRow(line: string, delimiter: ',' | '\t'): string[] {
	if (delimiter === '\t') return line.split('\t');
	const cells: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			cells.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	cells.push(current);
	return cells;
}
