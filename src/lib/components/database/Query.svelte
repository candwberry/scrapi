<script lang="ts">
	import Highlight from 'svelte-highlight';
	import github from 'svelte-highlight/styles/github';
	import sql from 'svelte-highlight/languages/sql';
	import { onMount } from 'svelte';
	import { rows } from '$lib/stores';
	export let show: boolean = false;

	export let callback = async () => {
		try {
			const resp = await fetch(`/api/db`, {
				method: 'POST',
				body: JSON.stringify({ query: value })
			});

			if (resp.ok) {
				const data = await resp.json();
				rows.set(data);
			} else {
                console.error('Error executing query:', resp.statusText);
            }
		} catch (error) {
			console.error('Error executing query:', error);
		}
	};
	export let value: string = '';
	export let name: string = 'name';

	onMount(() => {
		let hljs = document.querySelector('.hljs') as HTMLElement;
		if (hljs) hljs.style.backgroundColor = 'transparent';
	});

	let tables = [];
	let selectedTable = '';
	let columns = [];
	let selectedColumns = [];
	let whereCondition = '';
	let orderByColumn = '';
	let orderDirection = 'ASC';
	let limit = '';

	let queryString = '';

	onMount(async () => {
		const tablesResponse = await fetch(`/api/db`);
		tables = await tablesResponse.json();
	});

	async function handleTableSelect() {
		if (selectedTable) {
			const columnsResponse = await fetch(`/api/db`, {
				method: 'POST',
				body: JSON.stringify({ query: `PRAGMA table_info(${selectedTable})` })
			});
			columns = await columnsResponse.json();
		}
	}

	let whereConditions = [{ column: '', operator: '', value: '', connector: 'AND' }];
	const defaultConnector = 'AND';
	function addWhereCondition() {
		whereConditions = [
			...whereConditions,
			{ column: '', operator: '', value: '', connector: defaultConnector }
		];
	}

	function removeWhereCondition(index: number) {
		whereConditions = whereConditions.filter((_, i) => i !== index);
	}

	$: {
		// This is so stupid
		buildQuery();
		console.log(
			tables,
			selectedTable,
			columns,
			selectedColumns,
			whereConditions,
			orderByColumn,
			orderDirection,
			limit
		);
	}

	function buildQuery() {
		let query = 'SELECT ';
		query += selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
		query += selectedTable ? ` FROM ${selectedTable}` : '';

		if (whereConditions.length > 0) {
			const conditions = whereConditions
				.filter((cond) => cond.column && cond.value)
				.map((cond, index, array) => {
					const conditionStr = `${cond.column} ${cond.operator == '' ? '=' : cond.operator} '${cond.value}'`;
					return index < array.length - 1 ? `${conditionStr} ${cond.connector}` : conditionStr;
				})
				.join(' ');
			if (conditions) {
				query += ` WHERE ${conditions}`;
			}
		}

		if (orderByColumn) query += ` ORDER BY ${orderByColumn} ${orderDirection}`;
		if (limit) query += ` LIMIT ${limit}`;

		queryString = query;
		value = query;
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed inset-0 z-50 bg-black/50"
	class:hidden={!show}
	on:click={(e) => {
		if (e.target === e.currentTarget) show = false;
	}}
>
	<div
		class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg"
	>
		<form class="w-full relative overflow-hidden flex flex-col gap-2" class:hidden={!show}>
			<div
				class="flex flex-col z-50 pb-2 items-center justify-between max-w-full w-full rounded-xl focus:outline-none"
			>
				<input
					bind:value
					type="text"
					id={name}
					class="h-[56px] w-full max-w-full rounded-xl bg-white border text-white caret-berry-700 pl-4 focus:outline-none"
					style={'font-size: 1em;'}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							callback();
						}
					}}
				/>
				{@html github}
				<Highlight
					language={sql}
					code={value === '' ? 'SELECT * FROM products' : value}
					class="h-full w-full shadow-md rounded-xl bg-none pointer-events-none"
					style="transform: translateY(-56px); padding-left: 1px; user-select: none;"
				/>
				<!--
      <button on:click={callback} class="p-0 bg-berry-600 w-[60px] min-w-[60px] h-full rounded-r-xl flex items-center justify-center shadow" >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z"/></svg>
      </button>
      -->
			</div>
			<div class="hljs"></div>
		</form>

		<div
			class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg max-h-[500px] overflow-y-auto border"
			style="margin-top: -56px"
		>
			<h3 class="text-sm font-medium text-gray-500 mb-4">
				Use this query builder, or type the command yourself above.
			</h3>
			<div class="space-y-4">
				<div>
					<label for="table-select" class="block text-sm font-medium text-gray-700 mb-1"
						>Which Table?</label
					>
					<select
						id="table-select"
						bind:value={selectedTable}
						on:change={handleTableSelect}
						class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
					>
						{#each tables as table}
							<option value={table.name}>{table.name}</option>
						{/each}
					</select>
				</div>

				{#if columns.length > 0}
					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1"
							>Which Columns? (All by default)</label
						>
						<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
							{#each columns as column}
								<label class="inline-flex items-center">
									<input
										type="checkbox"
										bind:group={selectedColumns}
										value={column.name}
										class="rounded border-gray-300 text-berry-600 shadow-sm focus:border-berry-300 focus:ring focus:ring-berry-200 focus:ring-opacity-50"
									/>
									<span class="ml-2 text-sm">{column.name}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="flex flex-col">
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">Conditions:</label>
						{#each whereConditions as condition, index}
							<div class="flex items-center space-x-2 mb-2">
								<select
									bind:value={condition.column}
									style="width: 40%"
									class="block w-1/4 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
								>
									<option value="">Column</option>
									{#each columns as column}
										<option value={column.name}>{column.name}</option>
									{/each}
								</select>
								<select
									bind:value={condition.operator}
									style="width: 15%"
									class="flex w-[20%] 9 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
								>
									<option value="">=</option>
									<option value=">">&gt;</option>
									<option value="<">&lt;</option>
									<option value=">=">&ge;</option>
									<option value="<=">&le;</option>
									<option value="!=">!=</option>
								</select>
								<input
									type="text"
									bind:value={condition.value}
									placeholder="Value"
									style="width: 40%"
									class="block w-1/4 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-berry-600 focus:border-berry-600"
								/>
								<button
									on:click={() => removeWhereCondition(index)}
									style="min-width: 30px; min-height: 30px"
									class="text-sm font-bold bg-berry-600 rounded-full text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-6 h-6 flex items-center justify-center"
								>
									X
								</button>
							</div>
							{#if index < whereConditions.length - 1}
								<select
									bind:value={condition.connector}
									style="width: 20%; align-self: center;"
									class="block w-[20%] pl-3 pr-10 py-1 mb-2 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
								>
									<option value="AND">AND</option>
									<option value="OR">OR</option>
								</select>
							{/if}
						{/each}
						<div class="flex items-center space-x-2 mt-2">
							<button
								on:click={addWhereCondition}
								class="text-sm bg-berry-600 rounded-full text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 p-2 flex items-center justify-center"
							>
								Add another condition
							</button>
						</div>
					</div>
					<div class="flex space-x-4">
						<div class="w-1/2">
							<label for="order-by" class="block text-sm font-medium text-gray-700 mb-1"
								>Order by:</label
							>
							<div class="flex items-center space-x-2">
								<select
									id="order-by"
									bind:value={orderByColumn}
									class="block w-2/3 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
								>
									<option value="">None</option>
									{#each columns as column}
										<option value={column.name}>{column.name}</option>
									{/each}
								</select>
								<select
									bind:value={orderDirection}
									class="block w-1/3 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-600 focus:border-berry-600 rounded-md"
								>
									<option value="ASC">Ascending</option>
									<option value="DESC">Descending</option>
								</select>
							</div>
						</div>

						<div class="w-1/2">
							<label for="limit" class="block text-sm font-medium text-gray-700 mb-1">Limit:</label>
							<input
								id="limit"
								type="number"
								bind:value={limit}
								min="1"
								class="block w-full px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-berry-600 focus:border-berry-600"
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<button
			class="p-2 mt-4 full-width text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200"
			on:click={callback}
		>
			Execute
		</button>
	</div>
</div>

<style>
	input {
		font-family:
			ui-monospace,
			SFMono-Regular,
			SF Mono,
			Menlo,
			Consolas,
			Liberation Mono,
			monospace;
	}
	input::selection {
		color: transparent;
		background-color: #92c2f1;
	}

	label {
		display: block;
		margin-bottom: 5px;
	}

	select,
	input[type='number'] {
		width: 100%;
		padding: 5px;
	}

	select {
		border: grey 1px solid;
	}
</style>
