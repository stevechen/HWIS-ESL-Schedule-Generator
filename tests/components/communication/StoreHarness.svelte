<script lang="ts">
	import { onMount } from 'svelte';
	import { CommunicationStore } from '$lib/stores/communication';

	let { onReady = () => {} }: { onReady?: (store: CommunicationStore) => void } = $props();

	// Constructed here (component init) so the store's `$effect`s are not orphaned.
	const store = new CommunicationStore();

	onMount(() => {
		onReady(store);
	});
</script>

{store.studentsParsed.length}
