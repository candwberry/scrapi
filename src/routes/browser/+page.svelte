<script lang='ts'>
    import { onMount } from 'svelte';
    import Window from '$lib/components/Window.svelte';
    let url = '';
    let price = '';
    let priceFound = '';
    let screenshot = '';
    let loading = false;
    let input: HTMLInputElement;

    $: if (url) {
        fetch(`/api/browser?url=${url}`)
            .then((res) => res.json())
            .then((data) => {
                price = data.price;
                priceFound = data.priceFound;
                screenshot = data.screenshot;
            });
    }

    onMount(() => {
        if (input) input.focus();
        // also on window refocus, focus input

    })    
</script>

<Window head='#2b2b2b' bg='#ffffff'>
    <div slot='file' class='ml-4 flex flex-row gap-4'>
        <p class='text-sm font-bold text-white'>Price: {price}</p>
        <p class='text-sm text-bold text-white'>Found Using: {priceFound}</p>
    </div>
    <input slot='title' bind:this={input} type='text' bind:value={url} placeholder='URL' class='w-full px-2 border-b rounded-lg border-gray-300' />
    <img src={`data:image/png;base64,${screenshot}`} alt={loading ? "Loading..." : "Screenshot"} class='w-full h-full object-contain' />
</Window>
