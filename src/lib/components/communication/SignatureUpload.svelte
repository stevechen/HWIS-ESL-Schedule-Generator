<script lang="ts">
	import { Limit } from '$lib/stores/communicationStore.svelte';

	// Props
	interface Props {
		signatureImage: string;
		isDraggingOver: boolean;
		onFileSelect: (event: Event) => void;
		onDragEnter: (event: DragEvent) => void;
		onDragOver: (event: DragEvent) => void;
		onDragLeave: (event: DragEvent) => void;
		onDrop: (event: DragEvent) => void;
		onRemoveSignature: (event: MouseEvent) => void;
		onBrowseClick: () => void;
		onKeyUp: (event: KeyboardEvent) => void;
	}

	let {
		signatureImage = $bindable(),
		isDraggingOver,
		onFileSelect,
		onDragEnter,
		onDragOver,
		onDragLeave,
		onDrop,
		onRemoveSignature,
		onBrowseClick,
		onKeyUp
	}: Props = $props();
</script>

<!-- MARK: signature -->
<section class="*:self-center grid grid-cols-12 mx-5 my-0 w-full">
	<div
		class="flex flex-wrap justify-self-start col-start-1 col-end-10 mr-4 *:border-dashed *:rounded-lg cursor-default"
		ondragenter={onDragEnter}
		ondragover={onDragOver}
		ondrop={onDrop}
		ondragleave={onDragLeave}
		onkeyup={onKeyUp}
		aria-label="Drag & drop signature file"
		tabindex="0"
		role="button"
	>
		<!-- Signature drop box -->
		<div
			id="signature-drop-zone"
			class={[
				signatureImage && '-z-10 mt-[-50%] scale-y-0 self-start opacity-0',
				!signatureImage && 'z-1 mt-0',
				'w-full border-2 bg-no-repeat text-center transition-all duration-450',
				isDraggingOver
					? 'border-orange-400 bg-orange-100'
					: "border-orange-300 bg-slate-50 bg-[url('/static/icon-image.svg')]"
			]}
		>
			<p class="mt-0 ml-24 text-orange-500 text-sm text-center whitespace-pre">
				{`Darg and drop a jpg/png signature file
------------------ or ------------------`}
			</p>
			<button
				id="browse"
				class="bg-blue-400 hover:bg-blue-500 shadow-blue-800 shadow-xs my-2 ml-24 px-4 py-1 rounded-lg text-white animate-pulse hover:animate-none hover:pointer"
				onclick={onBrowseClick}
				aria-label="browse image">Browse…</button
			>
			<p class="mb-0 ml-24 text-slate-400 text-sm">Max file size: {Limit.size}KB</p>
		</div>

		<!-- Signature preview and remove button -->
		<div
			class={[
				signatureImage && 'has-signature z-1 mt-0',
				!signatureImage && '-z-10 mt-[-50%] scale-y-0 self-start opacity-0',
				'flex w-full items-center border-slate-300 bg-slate-50 transition-all duration-450'
			]}
		>
			<img class="m-auto h-[14mm] signature-preview" src={signatureImage} alt="Signature" />
			<button
				id="remove-signature"
				class="bg-blue-400 hover:bg-blue-500 shadow-blue-800 shadow-xs mr-4 p-1.5 rounded-lg size-9 hover:pointer"
				onclick={onRemoveSignature}
				aria-label="remove-signature"
			>
				<svg class="size-6 text-white" viewBox="0 0 32 32">
					<use href="#icon-trash" />
				</svg>
			</button>
		</div>

		<input
			id="signature-upload"
			class="absolute -m-px p-0 border-0 w-px h-px overflow-hidden [clip:rect(0,0,0,0)]"
			type="file"
			accept="image/*"
			onchange={onFileSelect}
		/>
	</div>
</section>