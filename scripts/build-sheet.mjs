#!/usr/bin/env node
// Regenerate static/ZipGrade.svg from the printed template PDF.
//
// Usage: bun scripts/build-sheet.mjs [path/to/template.pdf]
//        (defaults to "static/Scantron New.pdf")
//
// static/ZipGrade.svg is the page image the app draws behind the answer
// bubbles -- SheetBubbles.svelte <img>s it and pdf.ts rasterises it into the
// exported answer-key PDF. It must therefore stay in exact agreement with
// QUESTION_POSITIONS in src/lib/zipgrade/layout.ts, or every filled bubble
// the app paints lands off the bubble the student printed and marked.
//
// Poppler renders each bubble as a closed 4-segment cubic path carrying a
// matrix() transform, so this script extracts the circles the same way
// scripts/extract-bubbles.mjs does and asserts each one sits on its
// QUESTION_POSITIONS centre within TOLERANCE_PT. Run extract-bubbles.mjs
// afterwards (or before) whenever the circles themselves have moved.
//
// Requires pdftocairo (poppler) on PATH.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const SOURCE_PDF = process.argv[2] ?? 'static/Scantron New.pdf';
const SVG_OUT = join(root, 'static', 'ZipGrade.svg');
const LAYOUT_TS = join(root, 'src', 'lib', 'zipgrade', 'layout.ts');
const SHEET_URL_TS = join(root, 'src', 'lib', 'zipgrade', 'sheetUrl.ts');

/** Max pt a printed bubble may sit from the centre the app paints into. */
const TOLERANCE_PT = 0.05;

/** Circle centres from a poppler-rendered sheet, using extract-bubbles.mjs's logic. */
function circlesFromSvg(svg) {
	const circles = [];
	for (const m of svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*transform="matrix\(([^)]+)\)"/g)) {
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
	return circles;
}

/** QUESTION_POSITIONS entries, parsed back out of the generated layout.ts. */
function positionsFromLayout() {
	const layout = readFileSync(LAYOUT_TS, 'utf8');
	const entries = [...layout.matchAll(/\n\t\tn: (\d+),([\s\S]*?)\n\t\},?/g)].map((m) => {
		const q = { n: Number(m[1]) };
		for (const letter of ['A', 'B', 'C', 'D', 'E']) {
			const r = new RegExp(`${letter}: \\[([\\d.]+), ([\\d.]+)\\]`).exec(m[2]);
			if (!r) throw new Error(`question ${q.n} is missing letter ${letter}`);
			q[letter] = [Number(r[1]), Number(r[2])];
		}
		return q;
	});
	if (entries.length === 0) throw new Error(`could not parse QUESTION_POSITIONS from ${LAYOUT_TS}`);
	return entries;
}

/**
 * Rewrite sheetUrl.ts so SHEET_URL carries the sheet's content hash.
 *
 * Browsers key the HTTP cache on the whole URL, so a new hash is a new URL and
 * guarantees a freshly regenerated sheet is fetched instead of served from a
 * stale cache entry left over from the previous template.
 */
function writeSheetUrl(svg) {
	const hash = createHash('sha256').update(svg).digest('hex').slice(0, 8);
	const contents = `/**
 * URL of the printed sheet image (static/ZipGrade.svg).
 *
 * The \`?v=\` query is the first 8 hex digits of the file's SHA-256, written by
 * scripts/build-sheet.mjs whenever the sheet is regenerated. It exists so a
 * regenerated sheet is never served from a stale cache: browsers key their HTTP
 * cache on the full URL including the query, so a new content hash is a new
 * URL and therefore a cache miss that must hit the network.
 *
 * Do not hand-edit -- rerun "bun scripts/build-sheet.mjs" instead.
 */
export const SHEET_URL = '/ZipGrade.svg?v=${hash}';
`;
	const previous = readFileSync(SHEET_URL_TS, 'utf8');
	if (previous !== contents) {
		writeFileSync(SHEET_URL_TS, contents);
		execFileSync('bunx', ['prettier', '--write', SHEET_URL_TS], { stdio: 'inherit' });
	}
	return hash;
}

const pdfPath = resolve(root, SOURCE_PDF);
const tmp = mkdtempSync(join(tmpdir(), 'zipgrade-sheet-'));
const tmpSvg = join(tmp, 'sheet.svg');

try {
	console.log(`rendering ${basename(pdfPath)} -> static/ZipGrade.svg`);
	execFileSync('pdftocairo', ['-svg', pdfPath, tmpSvg], {
		stdio: ['ignore', 'inherit', 'inherit']
	});

	const rendered = readFileSync(tmpSvg, 'utf8');
	const circles = circlesFromSvg(rendered);
	const positions = positionsFromLayout();

	// Nearest printed circle to each position the app paints into.
	const failures = [];
	let worst = 0;
	for (const q of positions) {
		for (const letter of ['A', 'B', 'C', 'D', 'E']) {
			const [cx, cy] = q[letter];
			let best = Infinity;
			for (const c of circles) {
				const d = Math.hypot(c.cx - cx, c.cy - cy);
				if (d < best) best = d;
			}
			if (best > worst) worst = best;
			if (best > TOLERANCE_PT) {
				failures.push(
					`Q${q.n}${letter} expected (${cx}, ${cy}) nearest printed bubble is ${best.toFixed(3)}pt away`
				);
			}
		}
	}

	if (failures.length > 0) {
		console.error(
			`\nFAIL: ${failures.length} of ${positions.length * 5} bubbles disagree with layout.ts ` +
				`(worst ${worst.toFixed(3)}pt > ${TOLERANCE_PT}pt tolerance).\n` +
				`First few:\n  ${failures.slice(0, 5).join('\n  ')}\n\n` +
				`The template PDF's circles have moved. Regenerate layout.ts with:\n  bun scripts/extract-bubbles.mjs\n` +
				`static/ZipGrade.svg was left untouched.`
		);
		process.exitCode = 1;
	} else {
		renameSync(tmpSvg, SVG_OUT);
		const written = readFileSync(SVG_OUT);
		const hash = writeSheetUrl(written);
		console.log(
			`OK: all ${positions.length * 5} bubbles agree with layout.ts ` +
				`(worst ${worst.toFixed(4)}pt <= ${TOLERANCE_PT}pt).`
		);
		console.log(`sheet hash ${hash} -> ${'/ZipGrade.svg?v=' + hash}`);
		console.log(
			'Note: if a browser still shows the old sheet, unregister its service worker\n' +
				'      (the cache is keyed on pathname, so it ignores the ?v= query).'
		);
	}
} catch (err) {
	if (err?.code === 'ENOENT' && String(err.message).includes('pdftocairo')) {
		console.error('pdftocairo not found on PATH. Install poppler (macOS: brew install poppler).');
	} else {
		console.error(err?.message ?? err);
	}
	process.exitCode = 1;
} finally {
	rmSync(tmp, { recursive: true, force: true });
}
