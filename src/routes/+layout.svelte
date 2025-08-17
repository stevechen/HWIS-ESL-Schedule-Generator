<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const NAV_ITEM = [
		{ title: 'Schedule', url: '/' },
		{ title: 'White Slip', url: '/communication' }
	];
</script>

<nav class="print:hidden flex justify-center bg-slate-200 mt-1 mb-1">
	{#each NAV_ITEM as { url, title }}
		<a
			class="block aria-current:bg-white hover:bg-blue-800 mt-1 px-5 py-1 rounded-t-lg font-bold text-slate-500 aria-current:text-black hover:text-yellow-400 text-decoration-none aria-current:cursor-default hover:cursor-pointer"
			href={url}
			aria-current={page.url.pathname === url}
			>{title}
		</a>
	{/each}
</nav>

{@render children()}
