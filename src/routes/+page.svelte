<script lang="ts">
    import Window from "$lib/components/Window.svelte";
    import Scraper from "$lib/components/Scraper.svelte";
    import SingleBatch from "$lib/components/database/SingleBatch.svelte";
    import Database from "$lib/components/Database.svelte";
    import { onMount } from "svelte";

    let show: boolean = false;
    let showSingleTime: boolean = false;
    let batches: {
        name: "";
        date: 0;
        last: 0;
        frequency: 0;
        batch: "";
        next: 0;
    }[] = [];

    async function getBatches() {
        const resp = await fetch("/api/db/batch");
        if (resp.ok) {
            batches = await resp.json();
        }
    }

    onMount(async () => {
        await getBatches();
    });
</script>

<svelte:head>
    <title>Scrapi</title>
</svelte:head>

<Window>
    <h1 slot="title" class="font-bold">Home</h1>
    <div class="grid grid-cols-5 p-4 pb-0 gap-4 items-center max-h-full">
        <Scraper name="ebay" />
        <Scraper name="amazon" />
        <Scraper name="manomano" />
        <Scraper name="google" />
        <SingleBatch />
        <!--
        <div class="bg-white rounded-xl w-full w-full p-2">
            <div class="flex flex-col">
                <h2 class="m-0 mr-2 text-lg font-medium text-black">One Time Batch <span class='text-xs'>(Or single product)</span></h2>
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
            <textarea class='w-full border rounded p-2 h-48' placeholder='B-refs (one on each line)' 
            ></textarea>
            <button
            class="px-4 mt-2 py-2 text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200"
        >
            Execute
        </button>
        </div>
        -->
        <!--
            <div class='mt-4 flex-col bg-white rounded-xl p-2 items-center justify-center flex font-bold gap-2'>
        <div class='mt-4 flex-col bg-white rounded-xl p-2 items-center justify-center flex font-bold gap-2'>
            <p>Batches</p>
            <div class='flex flex-row gap-2'>
                <button on:click={() => show = true} class='bg-[#f9f3ed] text-[#27c840] font-bold px-2 py-1 rounded-lg text-sm'>Upload New</button>
                <button on:click={() => showSingleTime = true} class='bg-[#f9f3ed] text-[#fe5c54] font-bold px-2 py-1 rounded-lg text-sm'>One-Time-Batch</button>
            </div>
        </div>
        <div class='overflow-auto flex max-h-full w-full'>
        <div class='w-full mt-1 grid grid-cols-1 p-2 items-center gap-8 justify-center xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
        {#each batches as batch}
            <Batch batch={batch} />
        {/each}
        </div>
        <button on:click={() => show = true} class='bg-[#f9f3ed] text-[#8f32a8] font-bold px-2 py-1 rounded-lg text-sm'>Go to batch scheduler</button>
        -->
    </div>
    <div class="col-span-4 h-full p-4 overflow-hidden h-[100%]">
        <Database data={{}} />
    </div>
</Window>
