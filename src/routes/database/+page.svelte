<script lang="ts">
	import Window from '$lib/components/Window.svelte';
	import Export from '$lib/components/database/Export.svelte';
	import Database from '$lib/components/database/Database.svelte';
	import ResultSearch from '$lib/components/database/ResultSearch.svelte';
	import View, { getAllTable } from '$lib/components/database/View.svelte';
	import Query from '$lib/components/database/Query.svelte';
	import { writable, type Writable } from 'svelte/store';
	import Import from '$lib/components/database/Import.svelte';
	import { rows } from '$lib/stores';
	import type { PageData } from '../$types';
	import { onMount } from 'svelte';
	import Add from '$lib/components/database/Add.svelte';
	import Refresh from '$lib/assets/svgs/Refresh.svelte';
	
	export let data: PageData;

	const contextMenus: Writable<{
		file: { show: boolean; x: number; y: number; button: HTMLDivElement };
		export: { show: boolean; x: number; y: number; button: HTMLDivElement };
		view: { show: boolean; x: number; y: number; button: HTMLDivElement };
		query: { show: boolean; x: number; y: number; button: HTMLDivElement };
		add: { show: boolean; x: number; y: number; button: HTMLDivElement };
	}> = writable({
		file: {
			show: false,
			x: 0,
			y: 0,
			button: null as unknown as HTMLDivElement
		},
		export: {
			show: false,
			x: 0,
			y: 0,
			button: null as unknown as HTMLDivElement
		},
		view: {
			show: false,
			x: 0,
			y: 0,
			button: null as unknown as HTMLDivElement
		},
		query: {
			show: false,
			x: 0,
			y: 0,
			button: null as unknown as HTMLDivElement
		},
		add: {
			show: false,
			x: 0,
			y: 0,
			button: null as unknown as HTMLDivElement
		}
	});

	function handleContext(key: 'file' | 'export' | 'view' | 'query' | 'add') {
		contextMenus.update((value) => {
			Object.keys(value).forEach((k) => {
				if (k !== key) {
					value[k as 'file' | 'export' | 'view' | 'query' | 'add'].show = false;
				}
			});

			const contextMenu = value[key];
			contextMenu.show = !contextMenu.show;

			if (contextMenu.show && contextMenu.button) {
				const rect = contextMenu.button.getBoundingClientRect();
				contextMenu.x = rect.left;
				contextMenu.y = rect.top + rect.height;
			}

			return value;
		});
	}

	onMount(() => {
		if (data.props.data) rows.update(() => data.props.data);
	});
</script>

<Window bg="#f6f6f6" head="#eeeeee" svg="#9c9c9c" border="#dcdcdc">
	<div slot="title" class="flex flex-row gap-2">
		<ResultSearch />
		<div
		class="query bg-[#f6f6f6] rounded-md text-xs p-1 text-black cursor-pointer select-none"
		role="button"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === 'Enter') {
				getAllTable();
			}
		}}
		on:click={() => {
			getAllTable();
		}}
	>
		<Refresh width="16" height="16" />
	</div>

	</div>
	<div slot="file" class="flex flex-row ml-4 gap-1">
		<div
			class="file bg-[#f6f6f6] rounded-md text-xs px-4 py-1 text-f6f6f6 cursor-pointer select-none"
			bind:this={$contextMenus.file.button}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					handleContext('file');
				}
			}}
			on:click={() => handleContext('file')}
		>
			Import
		</div>
		<div
			class="export bg-[#f6f6f6] rounded-md text-xs px-4 py-1 text-black cursor-pointer select-none"
			bind:this={$contextMenus.export.button}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					handleContext('export');
				}
			}}
			on:click={() => handleContext('export')}
		>
			Export
		</div>
		<div
			class="view bg-[#f6f6f6] rounded-md text-xs px-4 py-1 text-black cursor-pointer select-none"
			bind:this={$contextMenus.view.button}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					handleContext('view');
				}
			}}
			on:click={() => handleContext('view')}
		>
			View
		</div>
		<div
			class="query bg-[#f6f6f6] rounded-md text-xs px-4 py-1 text-black cursor-pointer select-none"
			bind:this={$contextMenus.query.button}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					handleContext('query');
				}
			}}
			on:click={() => handleContext('query')}
		>
			Query
		</div>
		<div
			class="query bg-[#f6f6f6] rounded-md text-xs px-4 py-1 text-black cursor-pointer select-none"
			bind:this={$contextMenus.add.button}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					handleContext('add');
				}
			}}
			on:click={() => handleContext('add')}
		>
			Add
		</div>

	</div>
	<Database />
</Window>

<Import 
	bind:show={$contextMenus.file.show}
/>
<Export
	bind:show={$contextMenus.export.show}
	bind:x={$contextMenus.export.x}
	bind:y={$contextMenus.export.y}
/>
<View 
	bind:show={$contextMenus.view.show}
	bind:x={$contextMenus.view.x}
	bind:y={$contextMenus.view.y}
/>
<Query 
	bind:show={$contextMenus.query.show}
/>
<Add bind:show={$contextMenus.add.show} />