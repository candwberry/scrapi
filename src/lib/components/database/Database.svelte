<script lang="ts">
    import { berry, filteredRows, limit, rows } from '$lib/stores';
    import ArrowLeft from '$lib/assets/svgs/ArrowLeft.svelte';
    import Edit from '$lib/assets/svgs/Edit.svelte';
    import { onMount } from 'svelte';
    import Berry from '$lib/components/database/Berry.svelte';
    import { getAllTable } from '$lib/components/database/View.svelte';
    import ValidateAsin from '$lib/components/database/ValidateAsin.svelte';
    import VirtualList from 'svelte-tiny-virtual-list';
    import { browser } from '$app/environment';

    let sortColumn = 'berry';
    let sortDirection = 'asc';
    let show = false;
    let asinShow = false;
    let asinBerry = '';
    let rowHeight = 26;
    let listHeight = 500;

    $: data = $filteredRows;

    let virtualList;

    $: if ($filteredRows.length > 0 && $filteredRows[0][sortColumn] !== undefined)
        if (sortDirection === 'asc')
            $filteredRows = $filteredRows.sort((a, b) => (a[sortColumn] > b[sortColumn] ? 1 : -1));
        else $filteredRows = $filteredRows.sort((a, b) => (a[sortColumn] < b[sortColumn] ? 1 : -1));

    let hoveredRowIndex: number | null = null;
    let mouseX = 0;
    let mouseY = 0;
    let currentBerry: string | null = null;

    function handleRowClick(event: Event, berry: string) {
        const actualRow = $rows.find((r) => r.berry === berry);
        $berry = actualRow;
        show = true;
    }

    function handleAsinClick(event: Event, berry: string) {
        if ((event.target as HTMLElement).cellIndex === 0) {
            asinShow = true;
            asinBerry = berry;
        }
    }

    function handleMouseEnter(index: number, berry: string) {
        hoveredRowIndex = index;
        currentBerry = berry;
    }

    function handleMouseLeave() {
        hoveredRowIndex = null;
        currentBerry = null;
    }

    function getValidatedAsin(asin: string) {
        const actualRow = $rows.find((r) => r.asin === asin);
        if (actualRow.asin_validated && actualRow.asin_validated !== 0) {
            return 'text-berry-600';
        } else {
            return 'text-red-600';
        }
    }

	let tableColumnWidths: string | any[] = [];

function setColumnWidths() {
	const headerCells = document.querySelectorAll('table thead th');
	tableColumnWidths = Array.from(headerCells).map(cell => cell.offsetWidth);
}

$: {
    if ($filteredRows && $filteredRows.length > 0) {
        setTimeout(() => {
			if (browser)
            setColumnWidths();
        }, 0);
    }
}


onMount(() => {
	getAllTable('productsWithPrices');
	setColumnWidths();	
	if (browser) {
		window.addEventListener('resize', setColumnWidths);
		filteredRows.subscribe(() => setColumnWidths());
		// handle mouse events using above functions
		window.addEventListener('mousemove', (e) => {
			mouseX = e.clientX
			mouseY = e.clientY
		});
		return () => {
			window.removeEventListener('resize', setColumnWidths);
		};
	}
	setInterval(() => {
		setColumnWidths();
		$filteredRows = $filteredRows;
	}, 1000);
	
});

function getBiggestElements() {
    // return filteredArray, with the rows with the longest values for each column
    
    return $filteredRows.splice(0, 10);
}

</script>

<div class="flex flex-col max-h-[full] gap-4">
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
            <tbody style='visibility: collapse;'>
                {#each getBiggestElements() as row, index}
                    <tr>
                        {#each Object.entries(row) as [key, value]}
                            <td class="px-1 break-all text-sm">
                                {#if key === 'asin'}
                                    <span class={getValidatedAsin(value)}>{value}</span>
                                {:else if key === 'href'}
                                    <a href={value} target="_blank">{value}</a>
                                {:else}
                                    {value}
                                {/if}
                            </td>
                        {/each}
                        <td class="px-1 bg-gray-300">
                            <button on:click={() => {/* Handle edit */}}>
                                <Edit width="16px" height="16px" />
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <VirtualList
            bind:this={virtualList}
            width="100%"
            height={600}
            itemCount={data.length}
            itemSize={40}
        >
            <div slot="item" let:index let:style
                style="{style}; display: flex;"
                class:even={index % 2 === 0}
                class:hovered={hoveredRowIndex === index}
                on:click={(e) => handleRowClick(e, data[index].berry)}
                on:mouseenter={() => handleMouseEnter(index, data[index].berry)}
                on:mouseleave={handleMouseLeave}
            >
                {#each Object.entries(data[index]) as [key, value], colIndex}
                    <div class="px-1 break-all text-sm" style="width: {tableColumnWidths[colIndex] - 1}px; flex-shrink: 0;">
                        {#if key === 'asin'}
                            <span
                                class={getValidatedAsin(value)}
                                on:click={(e) => handleAsinClick(e, data[index].berry)}
                            >
                                {value}
                            </span>
                        {:else if key === 'href'}
                            <a href={value} target="_blank">{value}</a>
                        {:else}
                            {value}
                        {/if}
                    </div>
                {/each}
                <div class="px-1 bg-gray-300" style="width: {tableColumnWidths[tableColumnWidths.length - 1]}px; flex-shrink: 0;">
                    <button on:click={() => {/* Handle edit */}}>
                        <Edit width="16px" height="16px" />
                    </button>
                </div>
            </div>
        </VirtualList>
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
