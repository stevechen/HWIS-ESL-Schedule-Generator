<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const NAV_ITEM = [
		{ title: 'Schedule', url: '/' },
		{ title: 'White Slip', url: '/communication' },
		{ title: 'Sonic', url: '/sonic' }
	];
</script>

<nav class="mt-1 mb-1 flex justify-center bg-linear-to-r from-slate-300 to-slate-200 print:hidden">
	{#each NAV_ITEM as { url, title }}
		<a
			class="text-decoration-none mt-1 block rounded-t-lg px-5 py-1.5 font-bold transition-all duration-200 {page
				.url.pathname === url
				? 'cursor-default bg-white text-black shadow-md'
				: 'cursor-pointer text-slate-500 hover:-translate-y-0.5 hover:text-black'}"
			href={url}
			aria-current={page.url.pathname === url}
			>{title}
		</a>
	{/each}
</nav>

{@render children()}
