import { PAGE_SIZE } from './layout';

/** On-screen zoom presets, as a percentage of the sheet's print width. */
export const ZOOM_PRESETS = [100, 150, 200, 250, 300] as const;

/** Default zoom when nothing has been persisted. */
export const DEFAULT_ZOOM = 200;

const MIN_EDIT_ZOOM = 150;

/** On-screen width in px for the sheet at a given zoom level. */
export function sheetWidthAt(zoom: number): number {
	return Math.round((PAGE_SIZE.widthPt * zoom) / 100);
}

/**
 * Whether a teacher should be able to edit answers at this zoom level.
 *
 * Touch devices (phones, tablets) can always edit: fit-width is the only view
 * that shows the whole sheet, so gating on zoom would lock them out. The
 * non-touch gate exists to prevent accidental taps on a tiny sheet.
 */
export function canEditAt(zoom: number, isTouch = false): boolean {
	return isTouch || zoom >= MIN_EDIT_ZOOM;
}

/** Move one preset in the given direction, clamped to the ends. */
export function stepZoom(current: number, direction: 1 | -1): number {
	const index = ZOOM_PRESETS.indexOf(current as (typeof ZOOM_PRESETS)[number]);
	if (index === -1) return current;
	const next = index + direction;
	if (next < 0 || next >= ZOOM_PRESETS.length) return current;
	return ZOOM_PRESETS[next];
}

const ZOOM_STORAGE_KEY = 'zipgradeZoom';

/** Restore the persisted zoom level, falling back to the default for bad input. */
export function loadZoom(storage: Pick<Storage, 'getItem'>): number {
	try {
		const raw = storage.getItem(ZOOM_STORAGE_KEY);
		if (raw === null) return DEFAULT_ZOOM;
		const value = Number(raw);
		if (!Number.isFinite(value) || !(ZOOM_PRESETS as readonly number[]).includes(value)) {
			return DEFAULT_ZOOM;
		}
		return value;
	} catch {
		return DEFAULT_ZOOM;
	}
}

/** Persist the zoom level, ignoring storage failures. */
export function saveZoom(storage: Pick<Storage, 'setItem'>, zoom: number): void {
	try {
		storage.setItem(ZOOM_STORAGE_KEY, String(zoom));
	} catch {
		// Ignore storage failures (private mode, quota, etc.).
	}
}
