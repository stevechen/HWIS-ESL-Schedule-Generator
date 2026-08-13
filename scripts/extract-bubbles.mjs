// Regenerate src/lib/zipgrade/layout.ts QUESTION_POSITIONS from the actual
// printed circle outlines in static/ZipGrade.svg.
//
// Usage: bun scripts/extract-bubbles.mjs
//
// The template renders each answer bubble as a closed 4-segment cubic path
// (stroke-width 0.5, gray). This script reads those paths, applies each
// element's PDF->SVG matrix transform, takes the bounding-box centre as the
// circle centre, clusters them into the 3 question columns (x) and 65 rows
// (y), and emits the table. Run it again whenever the ZipGrade template
// changes.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const svgPath = join(root, 'static', 'ZipGrade.svg');
const layoutPath = join(root, 'src', 'lib', 'zipgrade', 'layout.ts');

const svg = readFileSync(svgPath, 'utf8');

const paths = [...svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*transform="matrix\(([^)]+)\)"/g)];

const circles = [];
for (const m of paths) {
	const [sx, , , sy, tx, ty] = m[2].split(',').map(Number);
	const nums = (m[1].match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (let i = 0; i + 1 < nums.length; i += 2) {
		const x = nums[i] * sx + tx;
		const y = nums[i + 1] * sy + ty;
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	const w = maxX - minX;
	const h = maxY - minY;
	if (Number.isFinite(w) && w > 2 && w < 15 && Math.abs(w - h) < 0.3) {
		circles.push({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 });
	}
}

// Sanity: 65 questions * 5 letters + 5 calibration dots at the bottom.
if (circles.length !== 330) {
	throw new Error(`expected 330 circles, found ${circles.length}`);
}

// Cluster by row (y). Calibration dots sit alone at y~616 — drop them.
const rows = new Map();
for (const c of circles) {
	const key = Math.round(c.cy);
	if (key > 610) continue;
	if (!rows.has(key)) rows.set(key, []);
	rows.get(key).push(c);
}
if (rows.size !== 22) {
	throw new Error(`expected 22 answer rows, found ${rows.size}`);
}

const rowKeys = [...rows.keys()].sort((a, b) => a - b);
const grid = new Map(); // rowIndex -> array of 15 circles sorted by cx
for (const [i, key] of rowKeys.entries()) {
	const row = rows.get(key).sort((a, b) => a.cx - b.cx);
	// The last row only has the first two columns (Q22, Q44): column 2 is one
	// question short (Q45-65 = 21 rows).
	if (row.length !== 15 && !(i === 21 && row.length === 10)) {
		throw new Error(`row ${i} expected 15 circles, found ${row.length}`);
	}
	grid.set(i, row);
}

// Question columns: Q1-22 in column 0, Q23-44 in column 1, Q45-65 in column 2.
const COLUMN_LETTERS = [
	[1, 22],
	[23, 44],
	[45, 65]
];

function fmt(v) {
	return v.toFixed(2);
}

const positions = [];
for (const [col, [qStart, qEnd]] of COLUMN_LETTERS.entries()) {
	// Column x offsets: the 15 circles of a row are A..E of each column, and
	// each column is 5 letters wide.
	let letter = 0;
	for (let row = 0; row < 22; row++) {
		const q = qStart + row;
		if (q > qEnd) break;
		const base = grid.get(row);
		// Take the circles belonging to this column: 5 consecutive from cx[col*5..col*5+5].
		const colCircles = base.slice(col * 5, col * 5 + 5);
		if (colCircles.length !== 5) throw new Error(`question ${q} missing circles`);
		const entry = {
			n: q,
			A: colCircles[0],
			B: colCircles[1],
			C: colCircles[2],
			D: colCircles[3],
			E: colCircles[4]
		};
		positions.push(entry);
		letter++;
	}
}
positions.sort((a, b) => a.n - b.n);
if (positions.length !== 65) throw new Error(`expected 65 questions, found ${positions.length}`);

const lines = [];
lines.push(`export const ANSWER_CHOICES = ['A', 'B', 'C', 'D', 'E'] as const;`);
lines.push(`export type AnswerChoice = (typeof ANSWER_CHOICES)[number];`);
lines.push(``);
lines.push(`export const QUESTION_COUNT = 65;`);
lines.push(``);
lines.push(
	`/** Size of the ZipGrade template page, in PDF points (matches static/ZipGrade.svg). */`
);
lines.push(`export const PAGE_SIZE = {`);
lines.push(`\twidthPt: 498.96,`);
lines.push(`\theightPt: 708.72,`);
lines.push(`\twidthMm: 176.02,`);
lines.push(`\theightMm: 250.02`);
lines.push(`} as const;`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Radius of a filled answer bubble in SVG units (= PDF points). The template's`);
lines.push(` * calibration dots are r=6 and the letters are ~4.7pt wide with 15pt horizontal`);
lines.push(` * and 20pt vertical spacing, so r=6.2 covers a letter without touching neighbours.`);
lines.push(` */`);
lines.push(`export const BUBBLE_RADIUS = 6.2;`);
lines.push(``);
lines.push(`export interface QuestionPositions {`);
lines.push(`\tn: number;`);
lines.push(`\tA: [number, number];`);
lines.push(`\tB: [number, number];`);
lines.push(`\tC: [number, number];`);
lines.push(`\tD: [number, number];`);
lines.push(`\tE: [number, number];`);
lines.push(`}`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Center of each answer bubble on the sheet, in SVG coordinates (x from the`);
lines.push(` * left edge, y from the top edge, matching static/ZipGrade.svg). Extracted`);
lines.push(` * from the printed circle outlines in the template — regenerate with`);
lines.push(` * "bun scripts/extract-bubbles.mjs" if the ZipGrade sheet changes.`);
lines.push(` */`);
lines.push(`export const QUESTION_POSITIONS: QuestionPositions[] = [`);
for (const p of positions) {
	lines.push(`\t{`);
	lines.push(`\t\tn: ${p.n},`);
	for (const L of ['A', 'B', 'C', 'D', 'E']) {
		lines.push(`\t\t${L}: [${fmt(p[L].cx)}, ${fmt(p[L].cy)}],`);
	}
	lines.push(`\t},`);
}
lines.push(`];`);

writeFileSync(layoutPath, lines.join('\n') + '\n');
execSync(`bunx prettier --write ${layoutPath}`, { stdio: 'inherit' });
console.log(`wrote ${layoutPath} (${positions.length} questions)`);
