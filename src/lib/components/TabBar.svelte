<!-- TabBar.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Determine the current page to apply active styling
	let currentPage = $state(get(page).url.pathname);

	const NAV_ITEM = [
		{ name: 'Schedule', url: '/' },
		{ name: 'Communication Slip', url: '/communication' }
	];
</script>

<nav class="tab-bar no-print flex justify-center bg-slate-200">
	{#each NAV_ITEM as { url, name }}
		<a
			class="rounded-t-lg py-2 px-6 text-decoration-none font-bold text-slate-500"
			href={url}
			class:active={currentPage === url}>{name}</a
		>
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
		margin-bottom: 3px;
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
