<!-- src/routes/+error.svelte -->
<script>
	import { page } from '$app/stores';

	// Extract the error message and stack trace with proper error handling
	const errorMessage = $derived(
		$page.error?.message || $page.error?.toString() || 'An unknown error occurred'
	);
</script>

<h1>Error {$page.status}</h1>
<p>{errorMessage}</p>
