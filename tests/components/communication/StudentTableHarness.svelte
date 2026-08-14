<script lang="ts">
	import { onMount } from 'svelte';
	import { CommunicationStore } from '$lib/stores/communication';
	import StudentTable from '$lib/components/communication/StudentTable.svelte';

	// Constructed here (component init) so the store's `$effect`s are not orphaned.
	const store = new CommunicationStore();
	let { seed = '' }: { seed?: string } = $props();

	onMount(() => {
		if (seed) store.handlePaste(seed);
	});
</script>

<StudentTable {store} />
