<script lang="ts">
	import { page } from '$app/state';
	import { inject } from '@vercel/analytics';
	import { dev } from '$app/environment';
	inject({ mode: dev ? 'development' : 'production' });
	import '../app.css';

	let { children } = $props();

	const NAV_ITEM = [
		{ title: 'Schedule', url: '/' },
		{ title: 'White Slip', url: '/communication' }
	];
</script>

<nav class="mb-1 flex justify-center bg-slate-200 print:hidden">
	{#each NAV_ITEM as { url, title }}
		<a
			class="text-decoration-none rounded-t-lg px-6 py-2 font-bold text-slate-500 hover:cursor-pointer hover:bg-red-800 hover:text-white aria-[current=true]:cursor-default aria-[current=true]:bg-white aria-[current=true]:text-black"
			href={url}
			aria-current={page.url.pathname === url}
			>{title}
		</a>
	{/each}
</nav>

{@render children()}
