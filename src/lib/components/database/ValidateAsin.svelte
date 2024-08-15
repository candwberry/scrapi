<script lang="ts">
	import { onMount } from 'svelte';

	let screenshot: string | null = null;
	let textInput = '';
	export let show: boolean = false;

	let asin = '';
	let their_description = '';
	let our_description = '';
	let supplierCode = '';
	let supplier = '';
	let barcode = '';
    let loading = false;
	export let berry = '';

	// watch for berry changing:
	$: if (berry !== '') {
		asin = '';
		their_description = '';
		our_description = '';
		supplierCode = '';
		supplier = '';
		barcode = '';
		screenshot = null;
		getASIN(berry);
	}

	async function getASIN(berry: string, asin?: string) {
		try {
            loading = true;
			const response = await fetch(`/api/amazon-asin?getImage=true&berry=${encodeURIComponent(berry)}${asin ? `&asin=${asin}` : ''}`);
            loading = false;
			if (response.ok) {
				const { screenshot: img, details } = await response.json();
				screenshot = `data:image/png;base64,${img}`;

				// Set the details
				asin = details.asin || '';
				their_description = details.their_description || '';
				our_description = details.our_description || '';
				supplierCode = details.supplierCode || '';
				supplier = details.supplier || '';
				barcode = details.barcode || '';
				berry = details.berry || '';
			} else {
                alert('No more ASINs to validate.');
				console.error('Failed to get data');
			}
		} catch (error) {
			console.error('Error fetching data');
		}
	}

	async function postASIN() {
		try {
			const response = await fetch('/api/amazon-asin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					asin,
					berry
				})
			});
            getASIN("next");
		} catch (error) {
			console.error('Error posting data');
		}
    }

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed inset-0 z-50 bg-black/50"
	class:hidden={!show}
	on:click={(e) => {
		if (e.target === e.currentTarget) show = false;
	}}
>
	<div
		class="bg-[#eeeeee] rounded-lg shadow-lg fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg w-1/2"
	>
		<div class="flex flex-col items-center" style="">
			<div class="flex flex-row w-full gap-4 items-center">
				<div class="flex flex-row h-6 gap-1">
					<button
                    on:click={() => {
                        getASIN("next");
                    }}
						class="bg-[#fe5c54] w-full  text-white rounded-lg px-2 text-xs font-bold"
						>Decline</button
					>
					<button
                        on:click={() => getASIN(berry, asin)}
						class="bg-[#febb2e] w-full  text-white rounded-lg px-2 text-xs font-bold"
						>Search </button
					>
                    <a
                    target="_blank"
                    href={`https://www.amazon.co.uk/s?q=${encodeURIComponent(our_description)}`}
                    class="bg-[#febb2e] w-full items-center justify-center middle text-white rounded-lg px-2 text-xs font-bold"
                    >Link </a
                >

					<button
                        on:click={postASIN}
						class="bg-[#27c840] w-full text-white rounded-lg px-2 text-xs font-bold"
						>Accept</button
					>
				</div>
				<div>
					<div class="text-xs text-gray-600">ASIN (editable)</div>
					<input type="text" class="text-md bg-black/10 px-2 text-gray-700 mb-4" bind:value={asin} />
				</div>
				<div>
					<div class="text-xs text-gray-600">Supplier Code</div>
					<div class="text-md text-gray-700 mb-4">{supplierCode}</div>
				</div>
				<div>
					<div class="text-xs text-gray-600">Supplier</div>
					<div class="text-md text-gray-700 mb-4">{supplier}</div>
				</div>
				<div>
					<div class="text-xs text-gray-600">Barcode</div>
					<div class="text-md text-gray-700 mb-4">{barcode}</div>
				</div>
				<div class="justify-end">
					<div class="text-xs text-gray-600">Berry</div>
					<div class="font-bold text-md text-gray-700 mb-4">{berry}</div>
				</div>
			</div>

            <div style="display: flex; max-width: 912px; min-width: 912px; max-height: 513px; min-height: 513px;">

            {#if loading}
            Taking screenshot...
            {:else}
			<img width="912" height="513" src={screenshot} alt="Loading.." class="rounded-lg shadow-lg" />
            {/if}
            </div>
			<div class="flex p-4 flex-col gap-2 w-full h-full justify-between">
				<div>
					<div class="w-full flex flex-col gap-1"></div>
				</div>

				<div style="min-height: 88px">
					<div class="mb-2">
						<div class="text-xs text-gray-600">Our Description</div>
						<div class="text-sm text-gray-700">{our_description}</div>
					</div>
					<div class="mb-2">
						<div class="text-xs text-gray-600">Their Description</div>
						<div class="text-sm text-gray-700">{their_description}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
