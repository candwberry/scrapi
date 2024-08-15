<script lang="ts">
    import { goto } from '$app/navigation';

    export let show: boolean;
    export let x: number;
    export let y: number;

    async function handleExport(exportType: string) {
        goto(`/api/db/export?type=${exportType}`);
    }
</script>

{#if show}
<div class="context-menu flex flex-col absolute bg-white border border-gray-300 rounded-md shadow-md" style="left: {x}px; top: {y}px">
    <div class="px-4 py-1 context hover:bg-gray-100 cursor-pointer"
    role="button" tabindex="0"
    on:click={() => handleExport('productsWithPrices')}
    on:keydown={(e) => e.key === 'Enter' && handleExport('productsWithPrice')}
    >Export Products With Prices</div>
    <div class="px-4 py-1 context hover:bg-gray-100 cursor-pointer"
    role="button" tabindex="0"
    on:click={() => handleExport('products')}
    on:keydown={(e) => e.key === 'Enter' && handleExport('products')}
    >Export Products</div>
</div>
{/if}

<style>
    .context-menu {
        z-index: 1000;
    }
</style>
