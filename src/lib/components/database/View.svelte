<script context='module'>
    export async function getAllTable(table = 'productsWithPrices', limit='-1') {
        fetch(`/api/db/${table}?limit=${limit}`)
        .then(res => res.json())
        .then(data => {
            // if data is an array then update rows
            if (Array.isArray(data))
                rows.set(data);
        });
    }
</script>

<script lang="ts">
    import { rows, hidden, filteredRows } from '$lib/stores';
    import { onMount } from 'svelte';
    export let show: boolean;
    export let x: number;
    export let y: number;
    let table = 'products';
    let tables: {name: string, count: number}[] = [];

    $: {
        $filteredRows = $hidden.length === 0 ? $rows : $rows.map(row => {
            const newRow = {...row};
            $hidden.forEach(key => {
                delete newRow[key];
            });
            return newRow;
        });
    }

    onMount(async () => {
        const res = await fetch('/api/db');
        const data = await res.json();
        tables = data;
    });
</script>

<div class:hidden={!show} class="context-menu flex flex-col absolute bg-white border border-gray-300 rounded-md shadow-md" style="left: {x}px; top: {y}px">
    <div class="px-4 py-2 context">
        <select class="w-full px-2 py-1 mb-2 border border-gray-300 rounded-md" bind:value={table} on:change={() => {show = false; getAllTable(table)}}>
            {#if tables.length === 0}
                <option>Loading...</option>
            {/if}
            {#each tables as table}
                <option value={table.name}>{table.name} ({table.count})</option>
            {/each}
        </select>
        
        {#if $rows.length === 0}
            <div>No keys found.</div>
        {:else}
            <div class="mt-2">
                {#each Object.keys($rows[0]) as key}
                    <div class="flex flex-row items-center gap-1 select-none hover:bg-gray-100">
                        <input type="checkbox" id={`view-checkbox-${key}`} checked={!$hidden.includes(key)} on:change={() => hidden.update(value => {
                            if (value.includes(key)) {
                                return value.filter(v => v !== key);
                            } else {
                                return [...value, key];
                            }
                        })} />
                        <label for={`view-checkbox-${key}`}>{key}</label>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .context-menu {
        z-index: 1000;
    }
</style>
