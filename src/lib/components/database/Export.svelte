<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let show: boolean;
    export let x: number;
    export let y: number;

    async function handleExport(exportType: string) {
        goto(`/api/db/export?type=${exportType}`);
    }

    // add mousedown listener that if not inside our element then close 
    onMount(() => {
        const handleMouseDown = (event) => {
            const element = document.querySelector('.context-menu');
            if (element && !element.contains(event.target)) {
                show = false;
            }
        };

        window.addEventListener('mousedown', handleMouseDown);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
        };
    });
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
