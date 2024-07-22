<script lang="ts">
  import Input from "$lib/components/SQLInput.svelte";
  import Combobox from "$lib/components/Combobox.svelte";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  let error = "";
  let tableSelect: HTMLSelectElement;  
  // lets call api/db?tables=get
  function selectAll(table: string) {
    fetch(`/api/db?tables=${table}`)
      .then((res) => res.json())
      .then((data) => {
        rows.set(data);
      });
  }

  onMount(async () => {
    const resp = await fetch("/api/db?tables=get");
    const data = await resp.json();
    if (data.error) {
      console.error(data.error);
      return;
    }

    data.forEach((table: { name: string; }) => {
      const option = document.createElement("option");
      option.value = table.name;
      option.innerText = table.name;
      if (tableSelect !== undefined)
      tableSelect.appendChild(option);
  });
  tableSelect.value = "products";

    selectAll("products");
  });

  export let query = "";
  function customQuery() {
    fetch(`/api/db?query=${query}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.error) {
          error = data.error;
          return;
        }
        rows.set(data);
      }).catch((err) => {
        error = err;
      });
  }

  let rows = writable([]);
</script>

<div class="w-full flex flex-col bg-black/10 p-4 rounded-lg gap-4">
  <div class="flex flex-row w-full gap-4">
    <select bind:this={tableSelect} on:change={() => {
      selectAll(tableSelect.value);
    }} class="bg-white p-2 rounded-lg w-full">
    </select>
    <button class="bg-berry-600 text-white p-2 rounded-lg flex flex-row gap-2">EXPORT <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m648-140 112-112v92h40v-160H640v40h92L620-168l28 28Zm-448 20q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Z"/></svg></button>
  </div>
  <Input name="query" bind:value={query} callback={customQuery}/>
</div>

<p class="text-red-500 font-xs h-5">
  {error}
</p>

<table class="w-full">
  <thead>
    <tr>
      <!-- Generate table headers based on the keys of the first row -->
      {#if $rows.length > 0}
        {#each Object.keys($rows[0]) as column}
          <th class="bg-gray-200 p-2">{column}</th>
        {/each}
      {/if}
    </tr>
  </thead>
  <tbody>
    <!-- Generate table rows based on the rows in the writable store -->
    {#each $rows as row}
      <tr>
        {#each Object.values(row) as value}
          <td class="p-2">{value}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
