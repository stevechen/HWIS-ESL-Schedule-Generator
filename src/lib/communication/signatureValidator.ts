import { Limit } from '$lib/stores/communicationStore.svelte';

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export interface SignatureValidationOptions {
	maxSizeKB: number;
	minHeight: number;
	allowedTypes: string[];
}

/**
 * Validates image file for signature upload
 * Checks file type, size, and dimensions
 */
export function validateSignatureFile(file: File, options?: Partial<SignatureValidationOptions>): ValidationResult {
	const config = {
		maxSizeKB: options?.maxSizeKB ?? Limit.size,
		minHeight: options?.minHeight ?? Limit.height,
		allowedTypes: options?.allowedTypes ?? ['image/jpeg', 'image/png']
	};

	// Check file type
	if (!config.allowedTypes.some(type => file.type.match(type))) {
		return {
			isValid: false,
			error: 'Only JPG and PNG formats are allowed.'
		};
	}

	// Check file size
	if (file.size > config.maxSizeKB * 1024) {
		return {
			isValid: false,
			error: `File size must be under ${config.maxSizeKB}KB.`
		};
	}

	return { isValid: true };
}

/**
 * Validates image dimensions asynchronously
 * Returns a promise that resolves with validation result
 */
export function validateImageDimensions(file: File, minHeight: number = Limit.height): Promise<ValidationResult> {
	return new Promise((resolve) => {
		const fileURL = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			URL.revokeObjectURL(fileURL); // Clean up
			
			if (img.height <= minHeight) {
				resolve({
					isValid: false,
					error: `Image height must be greater than ${minHeight}px.`
				});
			} else {
				resolve({ isValid: true });
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(fileURL); // Clean up
			resolve({
				isValid: false,
				error: 'Failed to load the image.'
			});
		};

		img.src = fileURL;
	});
}

/**
 * Converts file to base64 data URL
 * Returns a promise that resolves with the data URL string
 */
export function fileToDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		
		reader.onloadend = () => {
			if (reader.result) {
				resolve(reader.result as string);
			} else {
				reject(new Error('Failed to read file'));
			}
		};
		
		reader.onerror = () => {
			reject(new Error('Error reading file'));
		};
		
		reader.readAsDataURL(file);
	});
}

/**
 * Complete signature validation and processing
 * Validates file, dimensions, and converts to data URL
 */
export async function processSignatureFile(file: File, options?: Partial<SignatureValidationOptions>): Promise<{
	success: boolean;
	dataURL?: string;
	error?: string;
}> {
	// Basic file validation
	const fileValidation = validateSignatureFile(file, options);
	if (!fileValidation.isValid) {
		return {
			success: false,
			error: fileValidation.error
		};
	}

	// Dimension validation
	const dimensionValidation = await validateImageDimensions(file, options?.minHeight);
	if (!dimensionValidation.isValid) {
		return {
			success: false,
			error: dimensionValidation.error
		};
	}

	// Convert to data URL
	try {
		const dataURL = await fileToDataURL(file);
		return {
			success: true,
			dataURL
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to process file'
		};
	}
}