import { PDFDocument } from 'pdf-lib';
import { BUBBLE_RADIUS, PAGE_SIZE, QUESTION_POSITIONS } from './layout';
import type { AnswerSet } from './answers';

/** Raster scale: 300 DPI from 72-pt (PDF point) coordinates. */
export const PDF_SCALE = 300 / 72;

/** Rasterized sheet size, in canvas pixels. */
export function canvasSizeForPdf(scale: number = PDF_SCALE): { width: number; height: number } {
	return {
		width: PAGE_SIZE.widthPt * scale,
		height: PAGE_SIZE.heightPt * scale
	};
}

export interface BubblePixel {
	cx: number;
	cy: number;
	r: number;
}

/** Filled-bubble circles for the given answers, in canvas pixels. */
export function filledBubblesInPixels(
	answers: AnswerSet,
	scale: number = PDF_SCALE
): BubblePixel[] {
	const bubbles: BubblePixel[] = [];
	for (const q of QUESTION_POSITIONS) {
		for (const letter of answers[q.n - 1] ?? []) {
			const [cx, cy] = q[letter];
			bubbles.push({ cx: cx * scale, cy: cy * scale, r: BUBBLE_RADIUS * scale });
		}
	}
	return bubbles;
}

/** Render the template + filled bubbles to an offscreen canvas. */
export async function renderSheetToCanvas(
	answers: AnswerSet,
	scale: number = PDF_SCALE
): Promise<HTMLCanvasElement> {
	const { width, height } = canvasSizeForPdf(scale);

	const image = new Image();
	image.src = '/ZipGrade.svg';
	await new Promise<void>((resolve, reject) => {
		image.onload = () => resolve();
		image.onerror = () => reject(new Error('Failed to load the answer-sheet template.'));
	});

	const canvas = document.createElement('canvas');
	canvas.width = Math.round(width);
	canvas.height = Math.round(height);
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser.');

	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#000';
	for (const b of filledBubblesInPixels(answers, scale)) {
		ctx.beginPath();
		ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
		ctx.fill();
	}
	return canvas;
}

const FILE_NAME = 'hwis-answer-key.pdf';

/** Build the answer-key PDF from the given answers and trigger a download. */
export async function downloadAnswerKeyPdf(answers: AnswerSet): Promise<void> {
	const canvas = await renderSheetToCanvas(answers);
	const pngBlob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('PDF export failed.'))),
			'image/png'
		);
	});

	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([PAGE_SIZE.widthPt, PAGE_SIZE.heightPt]);
	const png = await pdfDoc.embedPng(await pngBlob.arrayBuffer());
	page.drawImage(png, { x: 0, y: 0, width: PAGE_SIZE.widthPt, height: PAGE_SIZE.heightPt });

	const pdfBytes = await pdfDoc.save();
	const pdfBuffer = pdfBytes.buffer.slice(
		pdfBytes.byteOffset,
		pdfBytes.byteOffset + pdfBytes.byteLength
	) as ArrayBuffer;

	const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = FILE_NAME;
	document.body.appendChild(anchor);
	anchor.click();
	// Give the browser a beat to begin the download before cleaning up —
	// removing the anchor / revoking the URL synchronously can cancel it.
	setTimeout(() => {
		anchor.remove();
		URL.revokeObjectURL(url);
	}, 1000);
}
