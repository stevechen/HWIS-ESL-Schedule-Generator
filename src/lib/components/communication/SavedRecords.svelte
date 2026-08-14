<script lang="ts">
	import { CommunicationStore } from '$lib/stores/communication';

	// Props
	interface Props {
		store: CommunicationStore;
	}

	let { store }: Props = $props();

	function handleLoadRecord(recordName: string) {
		const result = store.loadRecord(recordName);
		if (!result.success) {
			alert(result.error || 'Failed to load record.');
		}
	}

	function handleDeleteRecord(recordName: string) {
		store.deleteRecord(recordName);
	}
</script>

{#if store.savedRecords.length > 0}
	<div class="print:hidden">
		<!-- MARK: saved records -->
		<details
			class="group bg-white mt-0.5 mb-2 border border-gray-300 rounded-sm open:outline open:outline-blue-600 overflow-hidden text-slate-600"
		>
			<summary
				class="relative bg-gray-200 hover:bg-gray-100 group-open:bg-blue-500 group-open:hover:bg-blue-500 px-3 py-2 rounded-t-sm group-open:outline group-open:outline-blue-600 text-slate-500 hover:text-slate-600 group-open:hover:text-white group-open:text-white transition-all duration-200 ease-in-out cursor-pointer"
			>
				Saved Records ({store.savedRecords.length})
			</summary>
			<ul
				id="records_list"
				class="opacity-0 group-open:opacity-100 mx-0 max-h-0 group-open:max-h-screen overflow-hidden transition-all duration-300 ease-in-out list-none"
			>
				{#each store.savedRecords as recordName (recordName)}
					<li class="record">
						<div
							class="flex justify-between items-center pl-2 {store.lastLoadedRecordName ===
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
