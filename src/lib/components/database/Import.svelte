<script lang="ts">
	import { onMount } from 'svelte';
	export let show: boolean = true;
	let file: string = '';
	let fileContents: string[] = [];

	let berryColumn: string = '';
	let supplierCodeColumn: string = '';
	let barcodeColumn: string = '';
	let descriptionColumn: string = '';
	let columns: string[] = [];
	let deleteOld: boolean = false;
	let progress: { done: number; total: number } = { done: 0, total: 0 };
	
	let percent: number = 0;
	$: percent = progress.total === 0 ? 0 : (progress.done / progress.total) * 100;
	
	function processFile(newFile: File) {
		file = newFile.name;

		const reader: FileReader = new FileReader();

		reader.onload = (e: ProgressEvent<FileReader>) => {
			const content: string = e.target?.result as string;
			if (typeof content === 'string') {
				const lines: string[] = content.split('\n');
				fileContents = lines;

				if (lines.length > 0) {
					const tempColumns: string[] = lines[0].split(',').map((name) => name.trim());

					const berryExamples = ['sku', 'berry', 'code'];
					const supplierCodeExamples = ['purchasing.supplierproductcode'];
					const barcodeExamples = ['p_barcode_manufact', 'barcode'];
					const descriptionExamples = ['title', 'name', 'product', 'description', 'd_longdescription'];

					tempColumns.forEach((name) => {
						if (berryExamples.includes(name.toLowerCase())) {
							berryColumn = name;
						} else if (supplierCodeExamples.includes(name.toLowerCase())) {
							supplierCodeColumn = name;
						} else if (barcodeExamples.includes(name.toLowerCase())) {
							barcodeColumn = name;
						} else if (descriptionExamples.includes(name.toLowerCase())) {
							descriptionColumn = name;
						}
					});

					columns = tempColumns;
				} else {
					alert('File is empty?');
				}
			}
		};

		reader.readAsText(newFile);
	}

	function handleFileDrop(event: DragEvent) {
		event.preventDefault();
		const newFile = event.dataTransfer?.files[0];
		if (newFile) processFile(newFile);
	}
	function handleFileUpload(event: Event) {
		const newFile = (event.target as HTMLInputElement).files?.[0];
		if (newFile) processFile(newFile);
	}

	async function handleAllProducts() {
		progress = { done: 0, total: 0 };
		const now = Date.now();

		// create a copy of the fileContents
		const data: string[] = [...fileContents];
		data.shift();
		const products = data.map((line) => {
			const values = line.split(',');
			let description = values[columns.indexOf(descriptionColumn)] || '';

			
			// let us clean it:
			// remove things inside of brackets (including brackets)
			description = description.replace(/\(.*?\)/g, '');
			// end words to remove after 
			const deleteafterwords = ["To Order", "must be paired with"]
			// for each deleteafterwords, remove all text after and including occurance
			deleteafterwords.forEach((word) => {
				description = description.replace(new RegExp(word + '.*'), '');
			});
			const deletewords = ["Pre-Finished", "Pre-Fin", "c/w", "- Only"]
			// for each deletewords, remove all occurance
			deletewords.forEach((word) => {
				description = description.replace(new RegExp(word, 'g'), '');
			});
			
			// remove "To Order"
			description = description.replace(/To Order/g, '');
			// remove "inc."
			description = description.replace(/inc\./g, '');
			// remove "&,  and asterisk and ;
			description = description.replace(/&/g, '');
			description = description.replace(/\*/g, '');
			description = description.replace(/;/g, '');
			// replace + with ' +' so that whole words arent ignored by search engines
			// we dont want to remove since + could be a different product
			description = description.replace(/\+/g, ' +');
			// remove speach marks if at start and end
			description = description.replace(/^"/, '');
			description = description.replace(/"$/, '');
			// remove mm from <number>mm and m from <number>m and cm, M from <number>cm
			description = description.replace(/(\d+)mm/g, '$1');
			description = description.replace(/(\d+)m/g, '$1');
			description = description.replace(/(\d+)cm/g, '$1');
			description = description.replace(/(\d+)M/g, '$1');
			// replace <number>x<number> with <number> x <number>
				description = description.replace(/(\d+)x(\d+)/g, '$1 x $2');

			// remove any non-ascii
			description = description.replace(/[^\x20-\x7E]/g, '');
			// replace double speech marks with single
			description = description.replace(/""/g, '"');
			// replace /pk with empty string
			description = description.replace(/\/pk/g, '');
			// replace / with space
			description = description.replace(/\//g, ' ');
			// replace - Order with empty string
			description = description.replace(/- Order/g, '');
			// replace - with space
			description = description.replace(/-/g, ' ');
			// replace double spaces with single
			description = description.replace(/  /g, ' ');
			// remove any leading or trailing spaces
			description = description.trim();
					
			return {
				berry: values[columns.indexOf(berryColumn)],
				supplierCode: values[columns.indexOf(supplierCodeColumn)],
				barcode: values[columns.indexOf(barcodeColumn)],
				description: description,
			};
		});
		
		// batch size: 
		const batchSize = 500;
		const total = products.length;
		progress.total = total;
		progress.done = 1;
		for (let i = 0; i < total; i += batchSize) {
			const batch = products.slice(i, i + batchSize);
			await fetch('/api/db/products', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(batch)
		});

			progress.done = i + batchSize;
		}
		progress.done = total;
		
		if (deleteOld) {
			// get all berry references from the above products
			const berryRefs = products.map((product) => product.berry);
			await fetch('/api/db/products', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(berryRefs)
			});
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-50 bg-black/50" class:hidden={!show} on:click={(e) => {
	if (e.target === e.currentTarget) show = false;
}}>
	<div
		class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg"
	>
		<div class="flex flex-row justify-between items-center">
			<h2 class="m-0 mr-2 text-lg font-medium text-black">Upload Products</h2>
			<button
				class="text-black hover:text-berry-600"
				aria-label="Close"
				on:click={() => (show = false)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
		{#if percent === 0}
		<div class="relative my-4">
			<label
				for="file"
				class="flex items-center justify-center w-full h-40 px-4 transition bg-white border-2 border-berry-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-berry-700 focus:outline-none"
				on:dragover|preventDefault
				on:drop|preventDefault={handleFileDrop}
			>
				<span class="flex items-center space-x-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6 text-gray-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<span class="font-medium text-gray-600">
						Drop files to Upload, or
						<span class="text-berry-600 underline">browse</span>
					</span>
				</span>
				<input id="file" type="file" accept=".csv" class="hidden" on:change={handleFileUpload} />
			</label>
		</div>
		{:else}
		{percent.toFixed(10)} %
		{/if}
		{#if columns.length > 0 && percent === 0 && file}
		<div class="mb-4">
				<p class="font-bold">Selected file: {file}</p>
				<p class="mb-4">
					Select the column names that match up to each field.<br />I will try match them for you.
				</p>
				<label for="berrySKU" class="block mb-2 font-bold">Berry SKU</label>
				<select id="berrySKU" class="w-full p-2 border rounded" bind:value={berryColumn}>
					{#each columns as column}
						<option value={column}>{column}</option>
					{/each}
				</select>
			</div>

			<div class="mb-4">
				<label for="supplierCode" class="block mb-2 font-bold">Supplier Code</label>
				<select id="supplierCode" class="w-full p-2 border rounded" bind:value={supplierCodeColumn}>
					{#each columns as column}
						<option value={column}>{column}</option>
					{/each}
				</select>
			</div>

			<div class="mb-4">
				<label for="barcode" class="block mb-2 font-bold">Barcode</label>
				<select id="barcode" class="w-full p-2 border rounded" bind:value={barcodeColumn}>
					{#each columns as column}
						<option value={column}>{column}</option>
					{/each}
				</select>
			</div>

			<div class="mb-4">
				<label for="description" class="block mb-2 font-bold">Description</label>
				<select id="description" class="w-full p-2 border rounded" bind:value={descriptionColumn}>
					{#each columns as column}
						<option value={column}>{column}</option>
					{/each}
				</select>
			</div>
			<div class="mt-6 flex justify-between gap-4 items-center">
				<div class="flex items-center">
					<label for="switch" class="flex items-center cursor-pointer">
						<div class="relative">
							<input type="checkbox" id="switch" class="sr-only" bind:checked={deleteOld} />
							<div class="block bg-[#444] w-9 h-5 rounded-full"></div>
							<div class="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition"></div>
						</div>
						<div class="ml-3 text-gray-700 font-medium">Delete Old</div>
					</label>
				</div>
				<button
					class="px-4 py-2 text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200"
					on:click={handleAllProducts}
				>
					Execute
				</button>
			</div>
		{:else if percent === 100}
		<button
		class="px-4 py-2 ml-2 text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200"
		on:click={() => {
			file = '';
			fileContents = [];
			berryColumn = '';
			supplierCodeColumn = '';
			barcodeColumn = '';
			descriptionColumn = '';
			columns = [];
			deleteOld = false;
			progress = { done: 0, total: 0 };
		}}
	>
		Upload More
	</button>

		{/if}
	</div>
</div>

<style>
	input:checked ~ .dot {
		transform: translateX(120%);
	}
	input:checked ~ .block {
		background-color: #4caf50;
	}
</style>
