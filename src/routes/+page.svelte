<script>
	import Input from '$lib/components/Input.svelte';

	let generatedDatesOutput = '';
	/**
	 * Handles the 'generate' event from the Input component.
	 * @param {CustomEvent} event - The event object from the Input component.
	 */
	function handleMessage(event) {
		generatedDatesOutput = event.detail.generatedDatesOutput;
	}
</script>

<title>HWIS Schedule Generator</title>
<main>
	<section id="input">
		<Input on:generate={handleMessage} />
	</section>

	<section id="output">
		<h3>Generated Dates (Copy to Excel)</h3>
		<textarea rows="30" bind:value={generatedDatesOutput} readonly />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		justify-content: center;
		column-gap: 15px;
		font-size: 0.8em;
		font-family: Verdana, Geneva, Tahoma, sans-serif;
		min-height: calc(100vh - 2.3em);
		background: lightblue;
		padding-bottom: 1em;
	}
	#input,
	#output {
		display: flex;
		flex-direction: column;
	}
	textarea {
		min-width: 44em;
		flex: 1;
		font-size: 0.8em;
	}
</style>
