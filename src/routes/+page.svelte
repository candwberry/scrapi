<script>
  import Progress from "$lib/components/Progress.svelte";
  import { writable } from "svelte/store";
  import Input from "$lib/components/Input.svelte";
  import Select from "$lib/components/Select.svelte";
  import Slider from "$lib/components/Slider.svelte";
  
  const progress = writable(10);
  const limit = writable(20);
  
  
</script>

<Progress value={progress} />
<div class="flex flex-row gap-4 items-center bg-black/10 p-[1rem] rounded-[1rem]">
  <Select />  
  <Slider />
  <button
    class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3
    font-medium leading-none text-berry-700 shadow hover:opacity-75"
    >
    Search
  </button>
</div>
<div class="flex flex-row gap-4 items-center bg-black/10 p-[1rem] rounded-[1rem]">
  <Input label="Search" name="search" placeholder="50123543536345" />
</div>
