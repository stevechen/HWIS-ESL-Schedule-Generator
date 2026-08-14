<script lang="ts">
	import { onMount } from 'svelte';
	import { CommunicationStore } from '$lib/stores/communication';
	import StudentTable from '$lib/components/communication/StudentTable.svelte';
	import AssignmentForm from '$lib/components/communication/AssignmentForm.svelte';

	// Constructed here so the store's `$effect`s run during component init.
	const store = new CommunicationStore();
	let {
		seed = '',
		classNum = '',
		clearForm = () => store.clearAll()
	}: { seed?: string; classNum?: string; clearForm?: () => void } = $props();

	onMount(() => {
		if (seed) store.handlePaste(seed);
		if (classNum) store.classNum = classNum;
	});
</script>

<StudentTable {store} />
<AssignmentForm {store} onClearForm={clearForm} />
