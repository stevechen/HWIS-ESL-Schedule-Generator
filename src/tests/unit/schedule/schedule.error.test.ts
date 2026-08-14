import { describe, it, expect, vi } from 'vitest';
import { deriveSchedule, ERROR_OUTPUT } from '$lib/schedule';

vi.mock('$lib/utils/getAllClassDays', () => ({
	getDates: vi.fn(() => {
		throw new Error('boom');
	})
}));

describe('deriveSchedule error branch', () => {
	it('returns a renderable error object when parsing throws', () => {
		const result = deriveSchedule('anything', 'CLIL', [true, false, true, false, true]);
		expect(result.status).toBe('error');
		expect(result.output).toBe(ERROR_OUTPUT);
		expect(result.rows).toEqual({ header: [], rows: [] });
		expect(result.name).toBeTruthy();
	});
});
