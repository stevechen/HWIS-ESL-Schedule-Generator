/**
 * URL of the printed sheet image (static/ZipGrade.svg).
 *
 * The `?v=` query is the first 8 hex digits of the file's SHA-256, written by
 * scripts/build-sheet.mjs whenever the sheet is regenerated. It exists so a
 * regenerated sheet is never served from a stale cache: browsers key their HTTP
 * cache on the full URL including the query, so a new content hash is a new
 * URL and therefore a cache miss that must hit the network.
 *
 * Do not hand-edit -- rerun "bun scripts/build-sheet.mjs" instead.
 */
export const SHEET_URL = '/ZipGrade.svg?v=d8e7b7c1';
