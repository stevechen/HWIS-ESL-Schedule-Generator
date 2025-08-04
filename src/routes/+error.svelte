<!-- src/routes/+error.svelte -->
<script>
	export let status; // HTTP status code (e.g., 500)
	export let error; // Error object

	// Extract the error message and stack trace with proper error handling
	const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
</script>

<h1>Error {status}</h1>
<p>{errorMessage}</p>
