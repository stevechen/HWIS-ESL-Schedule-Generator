<!-- TabBar.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Determine the current page to apply active styling
	$: currentPage = get(page).url.pathname;
</script>

<nav class="tab-bar no-print">
	<a href="/" class:active={currentPage === '/'}>Schedule</a>
	<a href="/commslip" class:active={currentPage === '/commslip'}>Communication Slip</a>
</nav>

<style>
	@media print {
		.no-print {
			display: none;
			visibility: hidden;
			height: 0;
			overflow: hidden;
		}
	}
	.tab-bar {
		display: flex;
		justify-content: center;
		background-color: #f0f0f0;
		margin-bottom: 3px;
	}
	.tab-bar a {
		text-decoration: none;
		color: darkgray;
		font-weight: bold;
		padding: 0.5em 2em;
	}

	.tab-bar a:not(.active):hover {
		color: white;
		background-color: darkred;
		cursor: pointer;
	}

	.tab-bar .active {
		color: black;
		background-color: white;
		cursor: default;
	}
</style>
