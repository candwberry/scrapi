<script>
  import Progress from "$lib/components/Progress.svelte";
  import { writable } from "svelte/store";
  import Input from "$lib/components/Input.svelte";
  import Select from "$lib/components/Select.svelte";
  import Slider from "$lib/components/Slider.svelte";
  
  const progress = writable(10);
  const limit = writable(20);
  const mode = writable("ebay");
  let query = "";

  let lastResponse = writable({
    href: "/",
    thumbnail: "no-image.png",
    price: "0.00",
    shipping: "0.00",
    title: "No Product Found"
  });

  async function api() {
    switch ($mode) {
      case "ebay":
        const resp = await fetch("/api/ebay?query=" + query);
        const data = await resp.json();
        lastResponse.update(() => data);
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
<div class="search-result flex items-start p-4 max-w-2xl">
  <div class="thumbnail mr-4">
    <img src={$lastResponse.thumbnail} alt="Thumbnail" class="w-20 h-20 object-cover" />
  </div>
  <div class="content flex-grow">
    <h3 class="text-xl text-blue-600 hover:underline mb-1">
      <a href={$lastResponse.href}>{$lastResponse.title}</a>
    </h3>
    <div class="text-sm text-green-700 mb-1">£{$lastResponse.price} + <span class="text-xs text-gray-600 mb-2">£{$lastResponse.shipping} shipping</span></div>
  </div>
</div>