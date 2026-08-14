import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { CommunicationStore } from '$lib/stores/communication';
import StoreHarness from './StoreHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101
7654321\t李四\tSi Li\tJ102`;

// Constructing the store needs component-init context (its `$effect`s), so we
// mount the harness and capture the store instance it hands back.
async function mountStore(): Promise<CommunicationStore> {
	let captured: CommunicationStore | null = null;
	await render(StoreHarness, {
		onReady: (store) => {
			captured = store;
		}
	});
	return captured!;
}

describe('CommunicationStore record lifecycle (behind the store interface)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('assembles currentRecord and tracks saveable/modified state', async () => {
		const store = await mountStore();
		expect(store.isSaveable).toBe(false); // no class number, no students
		expect(store.isModified).toBe(true); // nothing loaded yet -> dirty

		store.handlePaste(MOCK_STUDENTS);
		store.classNum = '1';
		await tick();

		expect(store.isSaveable).toBe(true);
		expect(store.isModified).toBe(true);

		expect(store.currentRecord.classNum).toBe('1');
		expect(store.currentRecord.grade).toBe('G7');
		expect(store.currentRecord.studentsParsed).toHaveLength(2);
	});

	it('save -> clean; a fresh store saves and loads it via the manager', async () => {
		const store = await mountStore();
		store.handlePaste(MOCK_STUDENTS);
		store.classNum = '1';

		const result = store.saveRecord();
		expect(result.success).toBe(true);
		expect(store.isModified).toBe(false);
		expect(store.savedRecords).toContain(result.recordName);

		// A brand-new store instance reloads the same record from localStorage.
		const reloaded = await mountStore();
		reloaded.loadRecord(result.recordName!);
		expect(reloaded.classNum).toBe('1');
		expect(reloaded.studentsParsed).toHaveLength(2);
		expect(reloaded.lastLoadedRecordName).toBe(result.recordName);
		expect(reloaded.isModified).toBe(false);
	});

	it('clearAll resets the form, records, and save state', async () => {
		const store = await mountStore();
		store.handlePaste(MOCK_STUDENTS);
		store.classNum = '1';
		store.saveRecord();
		expect(store.savedRecords).toHaveLength(1);

		store.clearAll();

		expect(store.studentsParsed).toHaveLength(0);
		expect(store.classNum).toBe('');
		expect(store.lastLoadedRecordName).toBeNull();
		expect(store.isSaveable).toBe(false);
		expect(store.savedRecords).toHaveLength(1); // persisted records survive a form clear
	});

	it('deleteRecord removes it from the manager and storage', async () => {
		const store = await mountStore();
		store.handlePaste(MOCK_STUDENTS);
		store.classNum = '1';
		const { recordName } = store.saveRecord();

		store.deleteRecord(recordName!);
		expect(store.savedRecords).not.toContain(recordName);
		expect(localStorage.getItem(`comm_${recordName}`)).toBeNull();
	});
});
