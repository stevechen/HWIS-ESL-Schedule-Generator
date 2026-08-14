import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FullHarness from './FullHarness.svelte';
import './css-locator';

const MOCK_STUDENTS = `1234567\t張三\tSan Chang\tJ101`;

// Build a real image File in the browser so the dimension validator decodes it.
async function makeImageFile(height: number, type = 'image/png'): Promise<File> {
	const canvas = document.createElement('canvas');
	canvas.width = 200;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#333';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), type));
	const ext = type === 'image/png' ? 'png' : 'jpg';
	return new File([blob], `sig.${ext}`, { type });
}

const upload = () => page.getByCSS('#signature-upload');
const preview = () => page.getByCSS('img.signature-preview');
const previewSrc = () =>
	(preview().element() as HTMLImageElement | null)?.getAttribute('src') ?? '';

describe('SignatureUpload (validates via the store interface)', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('rejects a signature image that is too short', async () => {
		const alertSpy = vi.mocked(vi.fn());
		vi.stubGlobal('alert', alertSpy);
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await upload().upload(await makeImageFile(100));

		await expect.poll(() => alertSpy).toHaveBeenCalled();
		expect(alertSpy.mock.calls[0][0]).toMatch(/must be greater than 160px/);
		await expect.element(preview()).not.toBeVisible();
	});

	it('rejects a non jpg/png signature file', async () => {
		const alertSpy = vi.mocked(vi.fn());
		vi.stubGlobal('alert', alertSpy);
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		const bmp = new File(['not an image'], 'sig.bmp', { type: 'image/bmp' });
		await upload().upload(bmp);

		await expect.poll(() => alertSpy).toHaveBeenCalled();
		expect(alertSpy.mock.calls[0][0]).toMatch(/Only JPG and PNG formats are allowed/);
	});

	it('uploads and displays a valid PNG signature', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await upload().upload(await makeImageFile(300));

		await expect.element(preview()).toBeVisible();
		await expect.poll(previewSrc).toMatch(/^data:image\/png/);
	});

	it('uploads and displays a valid JPG signature', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await upload().upload(await makeImageFile(300, 'image/jpeg'));

		await expect.element(preview()).toBeVisible();
		await expect.poll(previewSrc).toMatch(/^data:image\/jpeg/);
	});

	it('allows re-uploading a signature after removing it', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await upload().upload(await makeImageFile(300));
		await expect.element(preview()).toBeVisible();

		await page.getByCSS('#remove-signature').click();
		await expect.element(preview()).not.toBeVisible();

		await upload().upload(await makeImageFile(320));
		await expect.element(preview()).toBeVisible();
	});

	it('persists the uploaded signature to localStorage', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });

		await upload().upload(await makeImageFile(300));

		await expect.poll(() => localStorage.getItem('signatureImage')).toMatch(/^data:image\/png/);
	});
});

describe('SignatureUpload - no signature mounted in an empty form', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('alert', vi.fn());
	});

	it('shows the drop zone (no preview) when the signature is empty', async () => {
		render(FullHarness, { seed: MOCK_STUDENTS, classNum: '1' });
		await expect.element(page.getByCSS('#signature-drop-zone')).toBeVisible();
		await expect.element(preview()).not.toBeVisible();
	});
});
