import { Limit } from '$lib/stores/communication';

export interface ValidationResult {
	isValid: boolean;
	error?: string;
	data?: string; // For storing data URL when validation succeeds
}

export interface SignatureValidationOptions {
	// maxSizeKB: number; // Old requirement - commented out
	minHeight: number;
	allowedTypes: string[];
	imageLoadTimeout?: number; // Timeout in ms for image loading
}

// Default timeout for image loading (5 seconds)
const DEFAULT_IMAGE_LOAD_TIMEOUT = 5000;

/**
 * Validates image file type for signature upload
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns ValidationResult with isValid and optional error message
 */
export function validateFileType(
	file: File,
	allowedTypes: string[] = ['image/jpeg', 'image/png']
): ValidationResult {
	if (!allowedTypes.includes(file.type)) {
		const allowedFormats = allowedTypes
			.map((type) => type.replace('image/', '').replace('jpeg', 'jpg').toUpperCase())
			.join(' and ');
		return {
			isValid: false,
			error: `Only ${allowedFormats} formats are allowed. Received: ${file.type || 'unknown'}.`
		};
	}

	return { isValid: true };
}

// Old requirement - file size validation (commented out but ready for future use)
// /**
//  * Validates file size
//  * @param file - The file to validate
//  * @param maxSizeKB - Maximum allowed file size in kilobytes
//  * @returns ValidationResult with isValid and optional error message
//  */
// export function validateFileSize(file: File, maxSizeKB: number): ValidationResult {
// 	const fileSizeKB = file.size / 1024;
// 	if (fileSizeKB > maxSizeKB) {
// 		return {
// 			isValid: false,
// 			error: `File size (${fileSizeKB.toFixed(1)}KB) exceeds maximum allowed size of ${maxSizeKB}KB.`
// 		};
// 	}
// 	return { isValid: true };
// }

/**
 * Validates image dimensions asynchronously with timeout handling
 * @param file - The image file to validate
 * @param minHeight - Minimum required height in pixels
 * @param timeout - Timeout in milliseconds (default: 5000ms)
 * @returns Promise resolving to ValidationResult
 */
export function validateImageDimensions(
	file: File,
	minHeight: number = Limit.height,
	timeout: number = DEFAULT_IMAGE_LOAD_TIMEOUT
): Promise<ValidationResult> {
	return new Promise((resolve) => {
		const fileURL = URL.createObjectURL(file);
		const img = new Image();
		let isResolved = false;

		// Timeout handler to prevent hanging promises
		const timeoutId = setTimeout(() => {
			if (!isResolved) {
				isResolved = true;
				URL.revokeObjectURL(fileURL);
				resolve({
					isValid: false,
					error: `Image loading timed out after ${timeout}ms.`
				});
			}
		}, timeout);

		img.onload = () => {
			if (!isResolved) {
				isResolved = true;
				clearTimeout(timeoutId);
				URL.revokeObjectURL(fileURL);

				if (img.height <= minHeight) {
					resolve({
						isValid: false,
						error: `Image height (${img.height}px) must be greater than ${minHeight}px.`
					});
				} else {
					resolve({ isValid: true });
				}
			}
		};

		img.onerror = () => {
			if (!isResolved) {
				isResolved = true;
				clearTimeout(timeoutId);
				URL.revokeObjectURL(fileURL);
				resolve({
					isValid: false,
					error: 'Failed to load the image. The file may be corrupted.'
				});
			}
		};

		img.src = fileURL;
	});
}

/**
 * Converts file to base64 data URL
 * @param file - The file to convert
 * @returns Promise resolving to the data URL string
 */
export function fileToDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			if (reader.result && typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file: result is empty or invalid.'));
			}
		};

		reader.onerror = () => {
			reject(new Error(`Error reading file: ${reader.error?.message || 'Unknown error'}`));
		};

		reader.readAsDataURL(file);
	});
}

/**
 * Complete signature validation and processing
 * Validates file type, dimensions, and converts to data URL
 * @param file - The signature image file to process
 * @param options - Optional validation options
 * @returns Promise resolving to ValidationResult with data URL on success
 */
export async function processSignatureFile(
	file: File,
	options?: Partial<SignatureValidationOptions>
): Promise<ValidationResult> {
	const allowedTypes = options?.allowedTypes ?? ['image/jpeg', 'image/png'];
	const minHeight = options?.minHeight ?? Limit.height;
	const timeout = options?.imageLoadTimeout ?? DEFAULT_IMAGE_LOAD_TIMEOUT;

	// File type validation
	const typeValidation = validateFileType(file, allowedTypes);
	if (!typeValidation.isValid) {
		return typeValidation;
	}

	// Old requirement - file size validation (commented out)
	// if (options?.maxSizeKB) {
	// 	const sizeValidation = validateFileSize(file, options.maxSizeKB);
	// 	if (!sizeValidation.isValid) {
	// 		return sizeValidation;
	// 	}
	// }

	// Dimension validation
	const dimensionValidation = await validateImageDimensions(file, minHeight, timeout);
	if (!dimensionValidation.isValid) {
		return dimensionValidation;
	}

	// Convert to data URL
	try {
		const dataURL = await fileToDataURL(file);
		return {
			isValid: true,
			data: dataURL
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Failed to process file.'
		};
	}
}
