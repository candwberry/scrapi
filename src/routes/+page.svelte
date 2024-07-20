<script>
  import Progress from "$lib/components/Progress.svelte";
  import { writable } from "svelte/store";
  import Input from "$lib/components/Input.svelte";
  import Select from "$lib/components/Select.svelte";
  import Slider from "$lib/components/Slider.svelte";
  import { createScrollArea, melt } from '@melt-ui/svelte';
  import Switch from "$lib/components/Switch.svelte";
  import NumEnter from "$lib/svg/NumEnter.svelte";
  import NumZero from "$lib/svg/NumZero.svelte";
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

  const progress = writable(10);
  const limit = writable(20);
  const mode = writable("ebay");
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
      default:
        alert("Invalid mode? " + $mode);
    }
  }
</script>

<Progress value={progress} />
<div class="flex flex-row gap-4 items-center bg-black/10 p-[1rem] rounded-[1rem]">
  <Input name="search" callback={api} bind:value={query}/>
</div>

<!-- First Item -->
<div class="grid grid-cols-3 gap-4">
  <div class="search-result col-span-2 flex items-start p-4 max-w-2xl bg-blue-100 rounded-lg">
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
  <div class="bg-black/10 rounded-lg p-4">
    <div class="flex flex-row justify-between items-center">
      Manual Mode
      <Switch  />
    </div>
    <button on:click={api} class="bg-berry-600 text-white p-2 rounded-lg flex flex-row gap-4">Accept</button>
    <button on:click={api} class="bg-red-600 text-white p-2 rounded-lg">Reject </button>

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

