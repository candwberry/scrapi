<script lang='ts'>
	import { onMount } from 'svelte';
    import { getAllTable } from '$lib/components/database/View.svelte';

	export let show: boolean = true;
	let tables: string[] = [];
	let inputs: any[] = [];
    let table: string = 'suppliers';

	const sqlite_to_html = {
		INTEGER: 'number',
		TEXT: 'text',
		REAL: 'number',
		BLOB: 'file'
	};

	async function addItem() {
        const resp = await fetch(`/api/db/${table}`, {
            method: 'POST',
            body: JSON.stringify({
                data: inputs.reduce((acc, input) => {
                    acc[input.name] = input.value;
                    return acc;
                }, {})
            })
        });

        getAllTable(table);
    };

	async function getColumnsAndTypes() {
		const resp = await fetch('/api/db', {
			method: 'POST',
			body: JSON.stringify({ query: `PRAGMA table_info(${table})` })
		});

		const columns = (await resp.json()).map((column: { name: any; type: any }) => ({
			name: column.name,
			type: column.type,
			value: ''
		}));

        inputs = columns;
		console.log(columns);
	};

	onMount(async () => {
		const response = await fetch('/api/db');
		tables = (await response.json()).map((table: { name: any }) => table.name);
        getColumnsAndTypes();
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class='fixed inset-0 z-50 bg-black/50'
	class:hidden={!show}
	on:click={(e) => {
		if (e.target === e.currentTarget) show = false;
	}}
>
	<div
		class='fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg'
	>
		<div class='flex flex-row justify-between gap-4'>
			<select
				class='w-full border border-gray-300 rounded-md px-2 py-1'
				bind:value={table}
                on:change={getColumnsAndTypes}
			>
				{#each tables as table}
					<option value={table}>{table}</option>
				{/each}
			</select>
			<button class='p-2 full-width text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200' on:click={addItem}>CREATE</button>
		</div>
		<div class='grid grid-cols-3 gap-4 my-4'>
			{#each inputs.filter(x => x.name !== 'json') as input}
				<input
					type={sqlite_to_html[input.type]}
					placeholder={input.name}
					class='border border-gray-300 rounded-md px-2 py-1'
				/>
			{/each}
		</div>
	</div>
</div>
