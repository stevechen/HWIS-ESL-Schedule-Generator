<!-- TabBar.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Determine the current page to apply active styling
	$: currentPage = get(page).url.pathname;

	const NAV_ITEM = [
		{ path: '/', name: 'Schedule' },
		{ path: '/communication', name: 'Communication Slip' }
	];
</script>

<nav class="tab-bar no-print">
	{#each NAV_ITEM as nav}
		<a href={nav.path} class:active={currentPage === nav.path}>{nav.name}</a>
	{/each}
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
