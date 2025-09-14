<script lang="ts">
	import {
		validatePrintReadiness,
		getPrintButtonStyle,
		getPrintStatusMessage,
		getPrintButtonText
	} from '$lib/communication/printValidator';
	import type { Student } from '$lib/stores/communication';

	// Props
	interface Props {
		classNum: string;
		studentsRaw: Student[];
		selectedStudentsCount: number;
		assignmentDates: {
			assigned: string;
			due: string;
			late: string;
		};
		grade: string | null;
		signatureImage: string;
		onPrint: () => void;
	}

	let {
		classNum,
		studentsRaw,
		selectedStudentsCount,
		assignmentDates,
		grade,
		signatureImage,
		onPrint
	}: Props = $props();

	// Calculate isAllChecked for print validation
	const isAllChecked = $derived(
		(() => {
			let allChecked = studentsRaw.every((student) => student.selected);
			let anyChecked = studentsRaw.some((student) => student.selected);
			return {
				checked: allChecked,
				indeterminate: !allChecked && anyChecked
			};
		})()
	);

	const printValidation = $derived(
		validatePrintReadiness({
			classNum,
			studentsRaw,
			isAllChecked,
			assignmentDates,
			grade,
			signatureImage
		})
	);

	const printButtonStyle = $derived(getPrintButtonStyle(printValidation));
	const printStatusMessage = $derived(getPrintStatusMessage(printValidation, selectedStudentsCount));
	const printButtonText = $derived(getPrintButtonText(selectedStudentsCount));
</script>

<!-- Print button -->
<div class="justify-self-end col-start-10 col-end-13 my-0 text-center">
	<p
		class={[
			printValidation.isInvalid && 'text-red-400',
			printValidation.hasCaution && 'text-orange-400',
			'text-center text-sm text-blue-400'
		]}
	>
		{printStatusMessage}
	</p>
	<button
		class={printButtonStyle.className}
		title={printButtonStyle.title}
		onclick={onPrint}
	>
		{printButtonText}
	</button>
</div>