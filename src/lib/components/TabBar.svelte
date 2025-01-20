<!-- TabBar.svelte -->
<script lang="ts">
	import { page } from '$app/state';

	// Determine the current page to apply active styling
	let currentUrl = $state(page.url.pathname);

	const NAV_ITEM = [
		{ name: 'Schedule', url: '/' },
		{ name: 'Communication Slip', url: '/communication' }
	];
</script>

<nav class="tab-bar mb-1 flex justify-center bg-slate-200 print:hidden">
	{#each NAV_ITEM as { url, name }}
		<a
			class="text-decoration-none rounded-t-lg px-6 py-2 font-bold text-slate-500
			{currentUrl === url
				? ' cursor-default bg-white text-black'
				: ' hover:cursor-pointer hover:bg-red-800 hover:text-white'}"
			href={url}
			class:active={currentUrl === url}
			>{name}
		</a>
	{/each}
</nav>

<style>
</style>
