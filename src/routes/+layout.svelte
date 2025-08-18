<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const NAV_ITEM = [
		{ title: 'Schedule', url: '/' },
		{ title: 'White Slip', url: '/communication' }
	];
</script>

<nav class="mt-1 mb-1 flex justify-center bg-slate-200 print:hidden">
	{#each NAV_ITEM as { url, title }}
		<a
			class="text-decoration-none mt-1 block rounded-t-lg px-5 py-1 font-bold text-slate-500 hover:cursor-pointer hover:bg-blue-800 hover:text-yellow-400 aria-current:cursor-default aria-current:bg-white aria-current:text-black"
			href={url}
			aria-current={page.url.pathname === url}
			>{title}
		</a>
	{/each}
</nav>

{@render children()}
