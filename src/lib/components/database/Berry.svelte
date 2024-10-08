<script lang="ts">
	export let show = true;
	import { berry, rows } from '$lib/stores';
    import { browser } from '$app/environment';
    function epochToHuman(epoch: string) {
        return new Date(parseInt(epoch)).toLocaleDateString();
    }
    let fetching = false;

    async function update() {
        if (! browser) return;
        try {
            const resp = await fetch(`/api/db/productWithPrice?berry=${$berry.berry}`);
            if (resp.ok) {
                const data = await resp.json();
                console.log(data);
                if (Array.isArray(data) && data.length > 0) {
                    $berry = data[0];
                }
            }
        } catch (e) {
            console.error(e);
        } 
    }

    async function refresh() {
        // if berry.berry exists       
         try {
            fetching = true;

        if ($berry.berry) {
            // post /api/db/batch with batch: "berry.berry"
            const resp = await fetch (`/api/db/batch`, {
                method: 'POST',
                body: JSON.stringify( {batch: $berry.berry} ),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            update();
        } } catch (e) {
            console.error(e);
        } finally {
            fetching = false;
        }
    }

    $: if (show) update();
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
		class="fixed flex flex-col left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg w-1/3 gap-4"
	>
		<div class="flex flex-row w-full gap-4">
			<img src={$berry.image ? $berry.image : '/no-image.png'} alt={$berry.berry} class="w-32 h-32" />
			<div class="flex flex-col w-full gap-4 justify-between h-32">
				<div class="flex flex-row justify-between gap-2 items-center">
					<p class="text-1xl font-bold">{$berry.berry}</p>
					<p>{$berry.barcode}</p>
					<p>{$berry.supplier} : {$berry.supplierCode}</p>
				</div>
                <div class="flex flex-row w-full justify-between items-center">
                    <p class='text-sm'>{$berry.description}</p>
                </div>
                <button class={`rounded-md p-1 ${fetching ? 'bg-berry-500' : 'bg-berry-700'} text-white`} on:click={refresh}>{fetching ? "FETCHING DATA" : "REFRESH"}</button>
			</div>
		</div>
		<hr class="border-b border-gray-200" />
		<div class="flex flex-col gap-2">
			<div class="flex flex-col gap-1">
				<p class="text-sm font-bold">ebay</p>
				<div class="flex flex-row justify-between">
                    {#if $berry.e_price}
					<div class="flex flex-row gap-4">
                        <p class='font-bold'>
                            £{parseFloat($berry.e_price) + parseFloat($berry.e_ship)}
                        </p> |
                        <p>£{$berry.e_price}</p>
						<p>with £{$berry.e_ship} shipping</p>
					</div>
                    <div class='flex flex-row gap-4'>
                        <p>{epochToHuman($berry.e_date)}</p>
                        <a href={$berry.e_href} class="text-berry-500" target="_blank">link</a>
                    </div>
                    {/if}
				</div>
			</div>
			<div class="flex flex-col gap-1">
				<p class="text-sm font-bold">amazon</p>
				<div class="flex flex-row justify-between">
                    {#if $berry.a_price}
					<div class="flex flex-row gap-4">
                        <p class='font-bold'>
                            £{parseFloat($berry.a_price) + parseFloat($berry.a_ship)}
                        </p> |
                        <p>£{$berry.a_price}</p>
						<p>with £{$berry.a_ship} shipping</p>
					</div>
                    <div class='flex flex-row gap-4'>
                        <p>{epochToHuman($berry.a_date)}</p>
                        <a href={$berry.a_href} class="text-berry-500" target="_blank">link</a>
                    </div>
                    {/if}
				</div>
			</div>
            <div class="flex flex-col gap-1">
				<p class="text-sm font-bold">manomano</p>
				<div class="flex flex-row justify-between">
                    {#if $berry.m_price}
					<div class="flex flex-row gap-4">
                        <p class='font-bold'>
                            £{parseFloat($berry.m_price) + parseFloat($berry.m_ship)}
                        </p> |
                        <p>£{$berry.m_price}</p>
						<p>with £{$berry.m_ship} shipping</p>
					</div>
                    <div class='flex flex-row gap-4'>
                        <p>{epochToHuman($berry.m_date)}</p>
                        <a href={$berry.m_href} class="text-berry-500" target="_blank">link</a>
                    </div>
                    {/if}
				</div>
			</div>
            <p class="text-sm font-bold">google</p>
            <div class="flex flex-col gap-1">
			<div class="flex flex-row justify-between">
                {#if $berry.g_price1}
                <div class="flex flex-row gap-4">
                    <p class='font-bold'>
                        £{parseFloat($berry.g_price1) + parseFloat($berry.g_ship1)}
                    </p> |
                    <p>£{$berry.g_price1}</p>
                    <p>with £{$berry.g_ship1} shipping</p>
                </div>
                <div class='flex flex-row gap-4'>
                    <p>{epochToHuman($berry.g_date1)}</p>
                    <a href={$berry.g_href1} class="text-berry-500" target="_blank">link</a>
                </div>
                {/if}
        </div>
			<div class="flex flex-row justify-between">
                {#if $berry.g_price2}
                <div class="flex flex-row gap-4">
                    <p class='font-bold'>
                        £{parseFloat($berry.g_price2) + parseFloat($berry.g_ship2)}
                    </p> |
                    <p>£{$berry.g_price2}</p>
                    <p>with £{$berry.g_ship2} shipping</p>
                </div>
                <div class='flex flex-row gap-4'>
                    <p>{epochToHuman($berry.g_date2)}</p>
                    <a href={$berry.g_href2} class="text-berry-500" target="_blank">link</a>
                </div>
                {/if}
			</div>
			<div class="flex flex-row justify-between">
                {#if $berry.g_price3}
                <div class="flex flex-row gap-4">
                    <p class='font-bold'>
                        £{parseFloat($berry.g_price3) + parseFloat($berry.g_ship3)}
                    </p> |
                    <p>£{$berry.g_price3}</p>
                    <p>with £{$berry.g_ship3} shipping</p>
                </div>
                <div class='flex flex-row gap-4'>
                    <p>{epochToHuman($berry.g_date3)}</p>
                    <a href={$berry.g_href3} class="text-berry-500" target="_blank">link</a>
                </div>
                {/if}
			</div>
            </div>
		</div>
	</div>
</div>
