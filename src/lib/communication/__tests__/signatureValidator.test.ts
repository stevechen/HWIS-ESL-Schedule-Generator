import { describe, it, expect, vi } from 'vitest';
import { validateSignatureFile, validateImageDimensions, fileToDataURL, processSignatureFile } from '../signatureValidator';

// Mock File constructor
const createMockFile = (name: string, size: number, type: string): File => {
	const file = new File([''], name, { type });
	Object.defineProperty(file, 'size', { value: size });
	return file;
};

describe('signatureValidator', () => {
	describe('validateSignatureFile', () => {
		it('should accept valid JPEG files', () => {
			const file = createMockFile('test.jpg', 100 * 1024, 'image/jpeg'); // 100KB
			const result = validateSignatureFile(file);
			expect(result.isValid).toBe(true);
		});

		it('should accept valid PNG files', () => {
			const file = createMockFile('test.png', 100 * 1024, 'image/png'); // 100KB
			const result = validateSignatureFile(file);
			expect(result.isValid).toBe(true);
		});

		it('should reject files that are too large', () => {
			const file = createMockFile('test.jpg', 300 * 1024, 'image/jpeg'); // 300KB (over 200KB limit)
			const result = validateSignatureFile(file);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('File size must be under');
		});

		it('should reject unsupported file types', () => {
			const file = createMockFile('test.gif', 100 * 1024, 'image/gif');
			const result = validateSignatureFile(file);
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Only JPG and PNG formats are allowed.');
		});

		it('should accept custom validation options', () => {
			const file = createMockFile('test.jpg', 300 * 1024, 'image/jpeg');
			const result = validateSignatureFile(file, { maxSizeKB: 400 });
			expect(result.isValid).toBe(true);
		});
	});

	describe('validateImageDimensions', () => {
		it('should resolve with valid result for images with sufficient height', async () => {
			// Mock Image constructor
			const mockImage = {
				onload: null as any,
				onerror: null as any,
				height: 200,
				src: ''
			};
			
			global.Image = vi.fn(() => mockImage) as any;
			global.URL.createObjectURL = vi.fn(() => 'mock-url');
			global.URL.revokeObjectURL = vi.fn();

			const file = createMockFile('test.jpg', 100 * 1024, 'image/jpeg');
			const promise = validateImageDimensions(file, 160);

			// Simulate image load
			setTimeout(() => mockImage.onload(), 0);

			const result = await promise;
			expect(result.isValid).toBe(true);
		});

		it('should resolve with invalid result for images with insufficient height', async () => {
			const mockImage = {
				onload: null as any,
				onerror: null as any,
				height: 100,
				src: ''
			};
			
			global.Image = vi.fn(() => mockImage) as any;

			const file = createMockFile('test.jpg', 100 * 1024, 'image/jpeg');
			const promise = validateImageDimensions(file, 160);

			// Simulate image load
			setTimeout(() => mockImage.onload(), 0);

			const result = await promise;
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('Image height must be greater than');
		});
	});
});