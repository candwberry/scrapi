<script lang="ts">
  import { createLabel, melt } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';

  export let name = "label";
  export let value = "";
  export let callback = () => {};
  const {
    elements: { root },
  } = createLabel();
</script>

<form class="w-full">
  <div class="h-10 flex  flex-row items-center justify-between h-10 w-full rounded-xl bg-white text-berry-700 focus: outline-none">
    <input
      bind:value
      type="text"
      id={name}
      class="h-10 w-full rounded-md bg-white border border-berry-600 border-solid border-[2px] rounded-r-none text-berry-700 pl-3 focus:outline-none"
      placeholder="Search"
    />
    <button on:click={callback} class="p-0 bg-berry-600 w-[50px] h-full rounded-r-xl flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
    </button>
  </div>
</form>