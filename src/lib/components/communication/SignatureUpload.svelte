<script lang="ts">
	import { processSignatureFile } from '$lib/communication/signatureValidator';

	let { signatureImage = $bindable() }: { signatureImage: string } = $props();

	let dragCounter = $state(0);
	const isDraggingOver = $derived(dragCounter > 0);
	let fileInput: HTMLInputElement; // Declare fileInput for bind:this

	async function validateAndSetImage(file: File): Promise<void> {
		const result = await processSignatureFile(file);

		if (!result.isValid) {
			alert(result.error);
			return;
		}

		if (result.data) {
			signatureImage = result.data;
		}
	}

	async function handleFileSelect(event: Event) {
		const inputField = event.target as HTMLInputElement | null;
		if (!inputField) return;

		const file = inputField.files?.[0];
		if (file) {
			await validateAndSetImage(file);
			// Reset input value to allow re-uploading the same file or uploading after validation failure
			inputField.value = '';
		}
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		dragCounter++;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragCounter--;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragCounter = 0;
		const dataTransfer = event.dataTransfer;
		if (dataTransfer) {
			const file = dataTransfer.files[0];
			await validateAndSetImage(file);
		}
	}

	function removeSignature(event: MouseEvent) {
		event.stopPropagation();
		signatureImage = '';
		// Reset the file input value so the same file can be uploaded again
		if (fileInput) fileInput.value = '';
	}

	function handleBrowseClick() {
		if (fileInput) {
			fileInput.click();
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			handleBrowseClick();
		}
	}
</script>

<!-- MARK: signature -->
<div
	class="flex flex-wrap justify-self-start col-start-1 col-end-9 mr-4 *:border-dashed *:rounded-lg cursor-default"
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	ondragleave={handleDragLeave}
	onkeyup={handleKeyUp}
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
			{`    Drag and drop a jpg/png signature file
	------------------- or -------------------`}
		</p>
		<button
			id="browse"
			class="bg-blue-400 hover:bg-blue-500 shadow-blue-800 shadow-xs my-2 ml-28 px-4 py-1 rounded-lg text-white animate-pulse hover:animate-none hover:pointer"
			onclick={handleBrowseClick}
			aria-label="browse image">Browse…</button
		>
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
			onclick={removeSignature}
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
		onchange={handleFileSelect}
		bind:this={fileInput}
	/>
</div>
