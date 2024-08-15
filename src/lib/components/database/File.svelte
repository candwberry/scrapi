<script lang="ts">
    import Import from '$lib/components/database/Import.svelte';

    export let show: boolean;
    export let x: number;
    export let y: number;
    let importShow = false;
</script>

<div class:hidden={!show} class="context-menu absolute bg-white border border-gray-300 rounded-md shadow-md" style="left: {x}px; top: {y}px">
    <button on:click={() => { show = false; importShow = true }} class="px-4 py-1 context hover:bg-gray-100 cursor-pointer">Import Products</button>
</div>

<Import bind:show={importShow} />

<style>
    .context-menu {
        z-index: 1000;
    }
</style>
