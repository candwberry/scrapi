<script lang="ts">
	import { berry, filteredRows, limit, rows } from '$lib/stores';
	import ArrowLeft from '$lib/assets/svgs/ArrowLeft.svelte';
	import Edit from '$lib/assets/svgs/Edit.svelte';
	import { onMount } from 'svelte';
	import Berry from '$lib/components/database/Berry.svelte';
	import { getAllTable } from '$lib/components/database/View.svelte';
	import ValidateAsin from '$lib/components/database/ValidateAsin.svelte';
	let sortColumn = 'berry';
	let sortDirection = 'asc';
	let show = false;
	let asinShow = false;
	let asinBerry = '';


	$: if ($filteredRows.length > 0 && $filteredRows[0][sortColumn] !== undefined)
		if (sortDirection === 'asc')
			$filteredRows = $filteredRows.sort((a, b) => (a[sortColumn] > b[sortColumn] ? 1 : -1));
		else $filteredRows = $filteredRows.sort((a, b) => (a[sortColumn] < b[sortColumn] ? 1 : -1));

	let hoveredRowIndex: number | null = null;
	let mouseX = 0;
	let mouseY = 0;
	let currentBerry: string | null = null;

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function getValidatedAsin(asin: string) {
		const actualRow = $rows.find((r) => r.asin === asin);
		if (actualRow.asin_validated && actualRow.asin_validated !== 0) {
			return 'text-berry-600';
		} else {
			return 'text-red-600';
		}
	}	

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<div class="flex flex-col max-h-full gap-4 overflow-y-scroll">
	{#if $filteredRows.length === 0}
		<div class="text-center text-gray-500">No data found.</div>
	{:else}
		<table class="w-full max-w-full">
			<thead>
				<tr>
					{#if $filteredRows.length > 0}
						{#each Object.keys($filteredRows[0]) as column}
							<th class="bg-gray-200 p-1 break-all">
								<button
									class="p-1 flex flex-row items-center gap-1"
									on:click={() => {
										if (sortColumn === column) {
											sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
										} else {
											sortColumn = column;
											sortDirection = 'asc';
										}
									}}
								>
									{#if column.includes('_')}
										{column.split('_')[0]}<br />{column.split('_')[1]}
									{:else}
										{column}
									{/if}
									{#if sortColumn === column}
										<div
											class:rotate-90={sortColumn === column && sortDirection === 'desc'}
											class:rotate-[270deg]={sortColumn === column && sortDirection === 'asc'}
										>
											<ArrowLeft width="12" height="12" />
										</div>
									{/if}
								</button>
							</th>
						{/each}
						<th class="bg-gray-200 p-1 break-all"></th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each $filteredRows as row, index}
					<tr
						on:click={() => {return; const actualRow = $rows.find((r) => r.berry === row.berry); berry.set(actualRow); show = true;}}
						class:even={index % 2 === 0}
						class:hovered={hoveredRowIndex === index}
						on:mouseenter={() => {
							hoveredRowIndex = index;
							currentBerry = row.berry;
						}}
						on:mouseleave={() => {
							hoveredRowIndex = null;
							currentBerry = null;
						}}
									>
						{#each Object.entries(row) as [key, value]}
							{#if key === 'asin'} 
							<td on:click={() => {
								asinShow = true;
								asinBerry = row.berry;
							}} class={`px-1 break-all cursor-pointer text-sm ${getValidatedAsin(value)}`} >{value}</td>
							{:else if key === 'href'}
							<td class="px-1 break-all text-sm"><a href={value} target="_blank">{value}</a></td>
							{:else}
							<td class="px-1 break-all text-sm">{value}</td>
							{/if}
						{/each}
						<td class="px-1 bg-gray-300">
							<button on:click={() => {const actualRow = $rows.find((r) => r.berry === row.berry); berry.set(actualRow); show = true;}}>
								<Edit width="16px" height="16px" />
							</button>
						</td>
					</tr>
				{/each}
				<tr>
					<td colspan={Object.keys($filteredRows[0]).length} class="text-center">
						<button
							class="bg-gray-200 p-1 rounded-md"
							on:click={() => {
								getAllTable();
							}}
						>
							Load All
						</button>
					</td>
				</tr></tbody
			>
		</table>
	{/if}
</div>

{#if currentBerry}
    <div 
        class="fixed pointer-events-none bg-black/70 text-white px-2 py-1 rounded-md text-sm"
        style="left: {mouseX + 10}px; top: {mouseY + 10}px;"
    >
        {currentBerry}
    </div>
{/if}
<Berry bind:show={show}/>
<ValidateAsin bind:show={asinShow} bind:berry={asinBerry}/>

<style>
	tr.hovered {
		background-color: #e5e7eb;
	}
</style>
