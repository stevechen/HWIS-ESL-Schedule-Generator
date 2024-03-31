<!-- src/routes/+error.svelte -->
<script>
	export let status; // HTTP status code (e.g., 500)
	export let error; // Error object

	// Extract the error message and stack trace
	const errorMessage = error.message;
</script>

<h1>Error {status}</h1>
<p>{errorMessage}</p>
