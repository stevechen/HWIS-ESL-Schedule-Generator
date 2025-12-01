<script lang="ts">
	import { RecordManager, type CommunicationRecord } from '$lib/communication/recordManager.svelte';

	// Props
	interface Props {
		recordManager: RecordManager;
		onLoadRecord: (record: CommunicationRecord) => void;
	}

	let { recordManager, onLoadRecord }: Props = $props();

	function handleLoadRecord(recordName: string) {
		const result = recordManager.load(recordName);
		if (result.success && result.record) {
			onLoadRecord(result.record);
		} else {
			alert(result.error || 'Failed to load record.');
		}
	}

	function handleDeleteRecord(recordName: string) {
		const result = recordManager.delete(recordName);
		if (!result.success) {
			alert(result.error || 'Failed to delete record.');
		}
	}
</script>

{#if recordManager.savedRecords.length > 0}
	<div class="print:hidden">
		<!-- MARK: saved records -->
		<details
			class="group bg-white mt-0.5 mb-2 border border-gray-300 rounded-sm open:outline open:outline-blue-600 overflow-hidden text-gray-800"
		>
			<summary
				class="relative bg-gray-200 hover:bg-gray-100 group-open:bg-blue-500 group-open:hover:bg-blue-500 px-3 py-2 rounded-t-sm group-open:outline group-open:outline-blue-600 text-gray-700 hover:text-gray-600 group-open:hover:text-white group-open:text-white transition-all duration-200 ease-in-out cursor-pointer"
			>
				Saved Records ({recordManager.savedRecords.length})
			</summary>
			<ul
				id="records_list"
				class="opacity-0 group-open:opacity-100 mx-0 max-h-0 group-open:max-h-screen overflow-hidden transition-all duration-300 ease-in-out list-none"
			>
				{#each recordManager.savedRecords as recordName}
					<li class="record">
						<div
							class="flex justify-between items-center pl-2 {recordManager.lastLoadedRecordName ===
							recordName
								? 'bg-blue-300 hover:bg-blue-400'
								: 'hover:bg-blue-200'}"
						>
							<button
								class="flex-1 bg-transparent border-none text-left cursor-pointer"
								onclick={() => handleLoadRecord(recordName)}
							>
								{recordName}
							</button>
							<button
								class="shrink-0 hover:bg-red-600 ml-2 p-1 rounded"
								aria-label="Delete record"
								onclick={(e) => {
									e.stopPropagation();
									handleDeleteRecord(recordName);
								}}
							>
								<svg class="size-6 text-gray-400 hover:text-white" viewBox="0 0 32 32">
									<use href="#icon-trash" />
								</svg>
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</details>
	</div>
{/if}
