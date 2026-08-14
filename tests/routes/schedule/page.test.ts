import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from '../../../src/routes/+page.svelte';
import { deriveSchedule } from '$lib/schedule';

// Registers page.getByCSS for id/class selectors.
import '../../components/communication/css-locator';

const FIXTURE = `2026-09-01\t\tCLIL WB Check\tCLIL
2026-09-02\t\tPassport Check\tCLIL
2026-09-03\t\tCLIL WB Check\tCLIL
2026-09-04\t\tPassport Check\tCLIL`;

// 2026-09-01 = Tue, 09-02 = Wed, 09-03 = Thu, 09-04 = Fri.
// Default checked days (Mon, Wed, Fri) -> only 09-02 and 09-04 remain.
const DEFAULT_CHECKED_DAYS = [true, false, true, false, true];
const DEFAULT_RESULT = deriveSchedule(FIXTURE, 'CLIL', DEFAULT_CHECKED_DAYS);

// #csv-output also contains the dates, so scope text lookups to the table.
const table = () => page.getByCSS('#output_table');
const cell = (date: string) => table().getByText(date);

describe('schedule page — rendering', () => {
	it('renders the title from the schedule module', async () => {
		render(Page, { props: { schoolEventsText: FIXTURE } });
		await expect.element(page.getByCSS('#output h3')).toHaveTextContent(DEFAULT_RESULT.name);
	});

	it('renders only the checked weekdays as table rows', async () => {
		render(Page, { props: { schoolEventsText: FIXTURE } });
		await expect.element(cell('2026-09-02')).toBeInTheDocument();
		await expect.element(cell('2026-09-04')).toBeInTheDocument();
		await expect.element(cell('2026-09-01')).not.toBeInTheDocument();
		await expect.element(cell('2026-09-03')).not.toBeInTheDocument();
	});
});

describe('schedule page — day filter', () => {
	it('updates the table when day switches are toggled', async () => {
		render(Page, { props: { schoolEventsText: FIXTURE } });
		// Default (Mon, Wed, Fri): Wed (09-02) and Fri (09-04) shown.
		// Uncheck Wednesday: only Friday (09-04) remains.
		await page.getByText('Wed', { exact: true }).click();
		await expect.element(cell('2026-09-02')).not.toBeInTheDocument();
		await expect.element(cell('2026-09-04')).toBeInTheDocument();
		// Check Tuesday: Tuesday (09-01) reappears.
		await page.getByText('Tue', { exact: true }).click();
		await expect.element(cell('2026-09-01')).toBeInTheDocument();
		// Uncheck Monday (Tue and Fri remain): both dates still shown.
		await page.getByText('Mon', { exact: true }).click();
		await expect.element(cell('2026-09-01')).toBeInTheDocument();
		await expect.element(cell('2026-09-04')).toBeInTheDocument();
		// Uncheck Friday too: only Tuesday (09-01) remains.
		await page.getByText('Fri', { exact: true }).click();
		await expect.element(cell('2026-09-01')).toBeInTheDocument();
		await expect.element(cell('2026-09-04')).not.toBeInTheDocument();
	});
});

describe('schedule page — class type', () => {
	it('updates the title and table when the class type changes', async () => {
		render(Page, { props: { schoolEventsText: FIXTURE } });
		const commResult = deriveSchedule(FIXTURE, 'Comm', DEFAULT_CHECKED_DAYS);
		// CLIL keeps the event note attribute (both Wed and Fri rows carry it).
		await expect.element(table().getByText('Passport Check').first()).toBeInTheDocument();
		await page.getByText('G7/8 Comm', { exact: true }).click();
		await expect.element(page.getByCSS('#output h3')).toHaveTextContent(commResult.name);
		// Comm strips the CLIL event attributes, so the note disappears from the table.
		await expect.element(table().getByText('Passport Check').first()).not.toBeInTheDocument();
	});
});

describe('schedule page — copy and download', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('copies the derived output to the clipboard', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});

		render(Page, { props: { schoolEventsText: FIXTURE } });
		await page.getByCSS('#copy_button').click();

		expect(writeText).toHaveBeenCalledWith(DEFAULT_RESULT.output);
	});

	it('downloads a CSV named after the derived title', async () => {
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

		render(Page, { props: { schoolEventsText: FIXTURE } });
		await page.getByCSS('#download_button').click();

		const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
		expect(anchor.getAttribute('download')).toBe(`${DEFAULT_RESULT.name}.csv`);

		const blob = createUrlSpy.mock.calls[0][0] as Blob;
		expect(await blob.text()).toBe(DEFAULT_RESULT.output.replace(/\t/g, ','));
	});
});
