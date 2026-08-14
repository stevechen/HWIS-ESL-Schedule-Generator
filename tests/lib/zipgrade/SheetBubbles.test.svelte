<script lang="ts">
	import { PAGE_SIZE } from '$lib/zipgrade/layout';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();
</script>

<!-- The real page wraps the sheet in a sized aspect-ratio box; replicate that so
     the absolutely-positioned layers have a containing block with real height. -->
<div style="aspect-ratio: {PAGE_SIZE.widthPt} / {PAGE_SIZE.heightPt}; width: {PAGE_SIZE.widthPt}px">
	{@render children?.()}
</div>
