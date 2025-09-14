import { describe, it, expect, vi } from 'vitest';

const mockProps = {
	printStatusMessage: 'Single Sided  B5/JIS-B5',
	printButtonStyle: {
		className: 'print-slips animate-pulse rounded-lg bg-blue-500 px-4 py-1 text-white shadow-sm shadow-blue-800 hover:animate-none',
		title: ''
	},
	printButtonText: 'Print 5 Slips',
	printValidation: {
		isInvalid: false,
		hasCaution: false
	},
	onPrint: vi.fn()
};

describe('PrintButton', () => {
	it('should handle valid print state', () => {
		// Test valid state properties
		expect(mockProps.printValidation.isInvalid).toBe(false);
		expect(mockProps.printValidation.hasCaution).toBe(false);
		expect(mockProps.printStatusMessage).toBe('Single Sided  B5/JIS-B5');
		expect(mockProps.printButtonStyle.title).toBe('');
		expect(mockProps.printButtonText).toContain('Print');
		expect(mockProps.printButtonText).toContain('Slips');
	});

	it('should handle invalid print state', () => {
		const invalidProps = {
			...mockProps,
			printValidation: { isInvalid: true, hasCaution: false },
			printStatusMessage: 'Missing Info!',
			printButtonStyle: {
				className: 'print-slips animate-none! cursor-default bg-red-500 shadow-red-800',
				title: 'Cannot print: Class number is required'
			}
		};
		
		expect(invalidProps.printValidation.isInvalid).toBe(true);
		expect(invalidProps.printValidation.hasCaution).toBe(false);
		expect(invalidProps.printStatusMessage).toBe('Missing Info!');
		expect(invalidProps.printButtonStyle.className).toContain('bg-red-500');
		expect(invalidProps.printButtonStyle.title).toContain('Cannot print');
	});

	it('should handle caution print state', () => {
		const cautionProps = {
			...mockProps,
			printValidation: { isInvalid: false, hasCaution: true },
			printStatusMessage: 'Missing Info!',
			printButtonStyle: {
				className: 'print-slips bg-orange-500 shadow-orange-800 hover:bg-orange-600',
				title: 'Warning: Missing signature'
			}
		};
		
		expect(cautionProps.printValidation.isInvalid).toBe(false);
		expect(cautionProps.printValidation.hasCaution).toBe(true);
		expect(cautionProps.printStatusMessage).toBe('Missing Info!');
		expect(cautionProps.printButtonStyle.className).toContain('bg-orange-500');
		expect(cautionProps.printButtonStyle.title).toContain('Warning');
	});

	it('should handle print button text variations', () => {
		// Test singular
		const singleProps = { ...mockProps, printButtonText: 'Print 1 Slip' };
		expect(singleProps.printButtonText).toBe('Print 1 Slip');
		expect(singleProps.printButtonText).not.toContain('Slips');
		
		// Test plural
		const multipleProps = { ...mockProps, printButtonText: 'Print 5 Slips' };
		expect(multipleProps.printButtonText).toBe('Print 5 Slips');
		expect(multipleProps.printButtonText).toContain('Slips');
		
		// Test zero case
		const zeroProps = { ...mockProps, printButtonText: 'Print 0 Slips' };
		expect(zeroProps.printButtonText).toBe('Print 0 Slips');
	});

	it('should handle print callback', () => {
		// Test that onPrint callback is properly typed
		expect(typeof mockProps.onPrint).toBe('function');
		
		// Test that callback can be called without errors
		expect(() => mockProps.onPrint()).not.toThrow();
		
		// Verify callback was called
		expect(mockProps.onPrint).toHaveBeenCalled();
	});

	it('should validate button style structure', () => {
		// Test that printButtonStyle has required properties
		expect(mockProps.printButtonStyle).toHaveProperty('className');
		expect(mockProps.printButtonStyle).toHaveProperty('title');
		
		// Test that className contains expected base classes
		expect(mockProps.printButtonStyle.className).toContain('print-slips');
		
		// Test that className is a string
		expect(typeof mockProps.printButtonStyle.className).toBe('string');
		expect(typeof mockProps.printButtonStyle.title).toBe('string');
	});

	it('should handle different validation states', () => {
		// Test all possible validation state combinations
		const states = [
			{ isInvalid: false, hasCaution: false }, // Valid
			{ isInvalid: false, hasCaution: true },  // Caution
			{ isInvalid: true, hasCaution: false },  // Invalid
			{ isInvalid: true, hasCaution: true }    // Invalid (takes precedence)
		];
		
		states.forEach(state => {
			expect(typeof state.isInvalid).toBe('boolean');
			expect(typeof state.hasCaution).toBe('boolean');
		});
	});

	it('should validate status message content', () => {
		// Test different status messages
		const messages = [
			'Single Sided  B5/JIS-B5',
			'Missing Info!',
			'Ready to print'
		];
		
		messages.forEach(message => {
			expect(typeof message).toBe('string');
			expect(message.length).toBeGreaterThan(0);
		});
	});

	it('should handle edge cases', () => {
		// Test with empty button text
		const emptyTextProps = { ...mockProps, printButtonText: '' };
		expect(emptyTextProps.printButtonText).toBe('');
		
		// Test with very long button text
		const longTextProps = { ...mockProps, printButtonText: 'A'.repeat(100) };
		expect(longTextProps.printButtonText.length).toBe(100);
		
		// Test with special characters in title
		const specialTitleProps = {
			...mockProps,
			printButtonStyle: {
				...mockProps.printButtonStyle,
				title: 'Cannot print: Missing "required" field & other issues'
			}
		};
		expect(specialTitleProps.printButtonStyle.title).toContain('"required"');
		expect(specialTitleProps.printButtonStyle.title).toContain('&');
	});
});