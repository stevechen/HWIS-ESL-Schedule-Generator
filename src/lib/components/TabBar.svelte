<!-- TabBar.svelte -->
<script>
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Determine the current page to apply active styling
	$: currentPage = get(page).url.pathname;
</script>

<nav class="tab-bar">
	<a href="/" class:active={currentPage === '/'}>Schedule Generator</a>
	<a href="/commslip" class:active={currentPage === '/commslip'}>Communication Slip Generator</a>
</nav>

<style>
	.tab-bar {
		display: flex;
		justify-content: space-around;
		padding: 10px;
		background-color: #f0f0f0;
		margin-bottom: 5px;
	}
	.tab-bar a {
		text-decoration: none;
		color: black;
		font-weight: bold;
	}
	.tab-bar .active {
		color: blue;
	}
</style>
