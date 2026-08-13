import { describe, it, expect } from 'vitest';
import {
	ZOOM_PRESETS,
	DEFAULT_ZOOM,
	stepZoom,
	canEditAt,
	sheetWidthAt,
	loadZoom,
	saveZoom
} from '$lib/scantron/zoom';

function makeStorage(initial: Record<string, string> = {}): Storage {
	const map = new Map(Object.entries(initial));
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key: string) => map.get(key) ?? null,
		key: (index: number) => [...map.keys()][index] ?? null,
		removeItem: (key: string) => map.delete(key),
		setItem: (key: string, value: string) => map.set(key, value)
	};
}

describe('zoom presets and stepping', () => {
	it('offers the agreed preset list', () => {
		expect(ZOOM_PRESETS).toEqual([100, 150, 200, 250, 300]);
	});

	it('defaults to 200%', () => {
		expect(DEFAULT_ZOOM).toBe(200);
	});

	it('steps up one preset', () => {
		expect(stepZoom(200, 1)).toBe(250);
	});

	it('steps down one preset', () => {
		expect(stepZoom(250, -1)).toBe(200);
	});

	it('clamps at the top preset', () => {
		expect(stepZoom(300, 1)).toBe(300);
	});

	it('clamps at the bottom preset', () => {
		expect(stepZoom(100, -1)).toBe(100);
	});

	it('leaves a non-preset value unchanged', () => {
		expect(stepZoom(123, 1)).toBe(123);
	});
});

describe('editability at a zoom level', () => {
	it('locks editing at fit-width (100%)', () => {
		expect(canEditAt(100)).toBe(false);
	});

	it('enables editing from 150% up', () => {
		for (const zoom of [150, 200, 250, 300]) {
			expect(canEditAt(zoom)).toBe(true);
		}
	});
});

describe('sheet width at a zoom level', () => {
	it('is the print width at 100%', () => {
		expect(sheetWidthAt(100)).toBe(499);
	});

	it('scales linearly with the preset', () => {
		expect(sheetWidthAt(200)).toBe(998);
		expect(sheetWidthAt(300)).toBe(1497);
		expect(sheetWidthAt(150)).toBe(748);
	});
});

describe('zoom persistence', () => {
	it('falls back to the default when nothing is stored', () => {
		expect(loadZoom(makeStorage())).toBe(DEFAULT_ZOOM);
	});

	it('restores a stored preset', () => {
		expect(loadZoom(makeStorage({ scantronZoom: '250' }))).toBe(250);
	});

	it('falls back to the default for a non-preset value', () => {
		expect(loadZoom(makeStorage({ scantronZoom: '123' }))).toBe(DEFAULT_ZOOM);
	});

	it('falls back to the default for garbage', () => {
		expect(loadZoom(makeStorage({ scantronZoom: 'abc' }))).toBe(DEFAULT_ZOOM);
	});

	it('falls back to the default when storage throws', () => {
		const throwing = {
			getItem: () => {
				throw new Error('denied');
			}
		} as unknown as Storage;
		expect(loadZoom(throwing)).toBe(DEFAULT_ZOOM);
	});

	it('persists the current zoom', () => {
		const storage = makeStorage();
		saveZoom(storage, 250);
		expect(storage.getItem('scantronZoom')).toBe('250');
	});

	it('swallows storage failures when saving', () => {
		const throwing = {
			setItem: () => {
				throw new Error('denied');
			}
		} as unknown as Storage;
		expect(() => saveZoom(throwing, 200)).not.toThrow();
	});
});
