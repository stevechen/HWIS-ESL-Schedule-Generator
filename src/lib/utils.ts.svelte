<script module lang="ts">
	import tippy from 'tippy.js';
	import 'tippy.js/dist/tippy.css';
	// #region Functions
	export function isValidMonthAndDay(dateStr: string | null): boolean {
		const REGEX =
			/^((0?[13578]|1[02])\/(0?[1-9]|[12][0-9]|3[01])|(0?[469]|11)\/(0?[1-9]|[12][0-9]|30)|(0?2)\/(0?[1-9]|1[0-9]|2[0-9]))$/;
		return dateStr === null ? false : REGEX.test(dateStr);
	}

	// this function would cause an issue if you want precise printing. The tippy object do not hide with parents at print.
	// it alters the layout of the page
	export function tooltip(node: HTMLElement, options: () => object) {
		$effect(() => {
			const tooltip = tippy(node, options());
			return tooltip.destroy;
		});
	}
</script>
