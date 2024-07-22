<script lang="ts">
  import { createLabel, melt } from '@melt-ui/svelte';
  import Highlight from "svelte-highlight";
  import github from "svelte-highlight/styles/github";
  import sql from "svelte-highlight/languages/sql";

  export let name = "label";
  export let value = "";
  export let callback = () => {};
  const {
    elements: { root },
  } = createLabel();
</script>

<form class="w-full relative overflow-hidden flex flex-col gap-2">
  <div class="flex flex-row z-50 py-2 items-center justify-between h-[56px] w-full rounded-xl focus:outline-none">
    <input
    bind:value
    type="text"
    id={name}
    class="h-10 w-full rounded-l-xl bg-white caret-berry-700 pl-3 focus:outline-none"
    placeholder="SELECT * FROM products"
    />
    <button on:click={callback} class="p-0 bg-berry-600 w-[50px] h-full rounded-r-xl flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z"/></svg>
    </button>
  </div>
  {@html github}
  <Highlight language={sql} code={value} style="max-height: 56px;"/>
</form>