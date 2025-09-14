<script lang="ts">
	// Props
	interface Props {
		printStatusMessage: string;
		printButtonStyle: { className: string; title: string };
		printButtonText: string;
		printValidation: { isInvalid: boolean; hasCaution: boolean };
		onPrint: () => void;
	}

	let {
		printStatusMessage,
		printButtonStyle,
		printButtonText,
		printValidation,
		onPrint
	}: Props = $props();
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