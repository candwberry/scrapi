<script>
  import { writable } from "svelte/store";
  import Input from "$lib/components/Input.svelte";
  import { createScrollArea, melt } from '@melt-ui/svelte';
  import Combobox from "$lib/components/Combobox.svelte";
  import { mode } from '$lib/stores';

  const {
    elements: {
      root,
      content,
      viewport,
      corner,
      scrollbarY,
      thumbY,
      thumbX,
      scrollbarX,
    },
  } = createScrollArea({
    type: 'hover',
    dir: 'ltr',
  });

  const progress = writable(0);
  const limit = writable(20);
  let query = "";

  let lastResponse = writable({
    first: {
      href: "/",
      thumbnail: "no-image.png",
      price: "0.00",
      shipping: "0.00",
      title: "No Product Found"
    },
    others: []
  });

  async function api() {
    switch ($mode) {
      case "ebay":
        const resp = await fetch("/api/ebay?query=" + query);
        const data = await resp.json();
        lastResponse.set(data);
        console.log(data);
        break;
      case "amazon":
        const resp2 = await fetch("/api/amazon?query=" + query);
        const data2 = await resp2.json();
        lastResponse.set(data2);
        console.log(data2);
        break;
      default:
        alert("Invalid mode? " + $mode);
    }
  }

  async function batch() {
    switch ($mode) {
      case "ebay":
        const resp = fetch("/api/ebay?batch=true");
        break;
      case "amazon":
        const resp2 = fetch("/api/amazon?batch=true");
        break;
      default:
        alert("Invalid mode? " + $mode);
    }
  }

  $: console.log($mode);
</script>

<p class="text-2xl font-bold border-b border-berry-600 pb-2 mb-4">Dashboard</p>
<!-- First Item -->
<div class="grid grid-cols-5 gap-4">
  <div class="bg-black/10 rounded-lg p-4 gap-4 flex flex-row col-span-1 justify-between items-center">
    <Combobox />
    <!--<img src={["ebay", "amazon", "google"].includes($mode) ? $mode+".png" : "no-image.png"} class="w-10 h-10" alt="Amazon Logo" />-->
  </div>
  <div class="bg-black/10 rounded-lg p-4 flex flex-col col-span-2 justify-between">
    <div class="flex flex-row justify-between items-center font-bold">
      Batch Processing
      <button class="bg-berry-600 text-white p-2 rounded-lg flex flex-row gap-4" on:click={batch}>
        <span>Launch {$mode} batch process.</span>
    </div>
    <div class="flex flex-row justify-between">
      <!--<button on:click={api} class="bg-red-600 text-white p-2 rounded-lg">Reject </button>
      <button on:click={api} class="bg-berry-600 text-white p-2 rounded-lg flex flex-row gap-4">Accept</button>-->
    </div>

  </div>

  <div class="bg-black/10 rounded-lg p-4 flex flex-col col-span-2 justify-between">
    <div class="flex flex-row justify-between items-center font-bold">
      Manual Mode
    </div>
    <div class="flex flex-row justify-between">
      <Input name="search" callback={api} bind:value={query}/>
      <!--<button on:click={api} class="bg-red-600 text-white p-2 rounded-lg">Reject </button>
      <button on:click={api} class="bg-berry-600 text-white p-2 rounded-lg flex flex-row gap-4">Accept</button>-->
    </div>

  </div>
</div>
<div class="search-result col-span-2 flex items-start p-4 w-full bg-blue-100 rounded-lg">
  <div class="thumbnail mr-4">
    <img src={$lastResponse.first.thumbnail} alt="Thumbnail" class="w-20 h-20 object-cover" />
  </div>
  <div class="content flex-grow">
    <h3 class="text-xl text-blue-600 hover:underline mb-1">
      <a href={$lastResponse.first.href}>{$lastResponse.first.title}</a>
    </h3>
    <div class="text-sm text-green-700 mb-1">£{$lastResponse.first.price} + <span class="text-xs text-gray-600 mb-2">£{$lastResponse.first.shipping} shipping</span></div>
  </div>
</div>

<div
  use:melt={$root}
  class="relative h-72 overflow-hidden rounded-lg text-berry-900 w-full bg-berry-800/20"
>
  <div use:melt={$viewport} class="h-full w-full rounded-[inherit]">
    <div use:melt={$content}>
      <div class="p-4">
        <h4 class="mb-4 font-semibold leading-none">Other Results</h4>
        <!-- Other Items -->
        {#each $lastResponse.others as item}
          <div class="search-result flex items-start p-4 max-w-2xl border-b border-gray-200">
            <div class="thumbnail mr-4">
              <img src={item.thumbnail} alt="Thumbnail" class="w-16 h-16 object-cover" />
            </div>
            <div class="content flex-grow">
              <h3 class="text-lg text-blue-600 hover:underline mb-1">
                <a href={item.href}>{item.title}</a>
              </h3>
              <div class="text-sm text-green-700 mb-1">£{item.price} + <span class="text-xs text-gray-600 mb-2">£{item.shipping} shipping</span></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
  <div
    use:melt={$scrollbarY}
    class="flex h-full w-2.5 touch-none select-none border-l border-l-transparent bg-berry-800/10 p-px transition-colors"
  >
    <div
      use:melt={$thumbY}
      class="relative flex-1 rounded-full bg-berry-600"
    />
  </div>
  <div
    use:melt={$scrollbarX}
    class="flex h-2.5 w-full touch-none select-none border-t border-t-transparent bg-berry-800/10 p-px"
  >
    <div use:melt={$thumbX} class="relative rounded-full bg-berry-600" />
  </div>
  <div use:melt={$corner} />
</div>

