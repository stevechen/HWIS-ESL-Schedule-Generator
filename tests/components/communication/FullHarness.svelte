<script lang="ts">
	import { onMount } from 'svelte';
	import { CommunicationStore } from '$lib/stores/communication';
	import AssignmentForm from '$lib/components/communication/AssignmentForm.svelte';
	import SavedRecords from '$lib/components/communication/SavedRecords.svelte';
	import StudentTable from '$lib/components/communication/StudentTable.svelte';
	import SignatureUpload from '$lib/components/communication/SignatureUpload.svelte';
	import PrintButton from '$lib/components/communication/PrintButton.svelte';
	import Slip from '$lib/components/communication/Slip.svelte';
	import IconLib from '$lib/components/communication/IconLib.svelte';

	// Constructed here (component init) so the store's `$effect`s are not orphaned.
	const store = new CommunicationStore();
	let {
		seed = '',
		classNum = '',
		classType = '',
		clearForm = () => store.clearAll(),
		onPrint = () => {}
	}: {
		seed?: string;
		classNum?: string;
		classType?: string;
		clearForm?: () => void;
		onPrint?: () => void;
	} = $props();

	// One-time init from the test-declared props (seed/classNum/classType are
	// read-only inputs; only the initial values are used).
	onMount(() => {
		if (seed) store.handlePaste(seed);
		if (classNum) store.classNum = classNum;
		if (classType) store.classType = classType;
	});
</script>

<AssignmentForm {store} onClearForm={clearForm} />
<StudentTable {store} />
<SignatureUpload {store} />
<PrintButton {store} {onPrint} />
<SavedRecords {store} />
{#each store.students as student, i (student.id)}
	<Slip
		{student}
		index={i}
		signatureSrc={store.signatureImage}
		assignment={store.assignmentDetails}
	/>
{/each}
<IconLib />
