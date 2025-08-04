<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const NAV_ITEM = [
		{ title: 'Schedule', url: '/' },
		{ title: 'White Slip', url: '/communication' }
	];
</script>

<nav class="print:hidden flex justify-center bg-slate-200 mb-1">
	{#each NAV_ITEM as { url, title }}
		<a
			class="aria-current:bg-white hover:bg-red-800 px-6 py-2 rounded-t-lg font-bold text-slate-500 aria-current:text-black hover:text-white text-decoration-none aria-current:cursor-default hover:cursor-pointer"
			href={url}
			aria-current={page.url.pathname === url}
			>{title}
		</a>
	{/each}
</nav>

{@render children()}
