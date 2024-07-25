<script lang="ts">
  import Input from "$lib/components/SQLInput.svelte";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  import { createDialog, melt } from "@melt-ui/svelte";
  /** Internal helpers */
  import X from "lucide-svelte/icons/x";
  import { fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  import Progress from "$lib/components/Progress.svelte";
  import { createScrollArea } from '@melt-ui/svelte';

  const {
    elements: {
      root,
      content: scrollContent,
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

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });

  let fileName = "";
  let columnNames: string[] = [];
  let berrySKUColumn = "";
  let supplierCodeColumn = "";
  let barcodeColumn = "";
  let titleColumn = "";

  function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      processFile(file);
    }
  }

  function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      processFile(file);
    }
  }

  let fileContents: string[] = [];
  function processFile(file: File) {
    fileName = file.name;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        const lines = content.split("\n");
        fileContents = lines;
        if (lines.length > 0) {
          const tempColumnNames = lines[0]
            .split(",")
            .map((name) => name.trim());

          const berrySKUExamples = ["SKU", "Berry SKU", "BerrySKU", "Code"];
          const supplierCodeExamples = [
            "Supplier Code",
            "SupplierCode",
            "Supplier",
          ];
          const barcodeExamples = ["Barcode", "UPC", "EAN"];
          const titleExamples = [
            "Title",
            "Name",
            "Product Name",
            "Description",
          ];

          // go through each column name, if any match the examples, set them as the default
          tempColumnNames.forEach((name) => {
            if (berrySKUExamples.includes(name)) {
              berrySKUColumn = name;
            } else if (supplierCodeExamples.includes(name)) {
              supplierCodeColumn = name;
            } else if (barcodeExamples.includes(name)) {
              barcodeColumn = name;
            } else if (titleExamples.includes(name)) {
              titleColumn = name;
            }
          });

          columnNames = tempColumnNames;
        } else {
          alert("File seems empty.");
        }
      }
    };

    reader.readAsText(file);
  }

  const handleAllProducts = async () => {
  fileContents.shift(); // remove the header row
  const products = fileContents.map((line) => {
    const values = line.split(",");
    return {
      berry: values[columnNames.indexOf(berrySKUColumn)],
      barcode: values[columnNames.indexOf(barcodeColumn)],
      supplierCode: values[columnNames.indexOf(supplierCodeColumn)],
      title: values[columnNames.indexOf(titleColumn)],
      supplier: "NA",
    };
  });

  let completed = 0;
  const total = products.length;
  const batchSize = 500;
  
  progress.set(0.0001);
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}`);
    
    try {
      const resp = await fetch("/api/db/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      const data = await resp.json();
      console.log(data);
      if (data.error) {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      completed += batch.length;
      console.log(`Completed: ${completed}`);
      progress.set((completed / total) * 100);
    }
  }

  open.set(false);
  await new Promise((resolve) => setTimeout(resolve, 500));
  progress.set(0);
};


  let error = "";
  let tableSelect: HTMLSelectElement;
  // lets call api/db?tables=get
  async function selectAll(table: string) {
    await fetch(`/api/db/${table}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        rows.set(data);
      });
  }

  onMount(async () => {
    const resp = await fetch("/api/db");
    const data = await resp.json();
    if (data.error) {
      console.error(data.error);
      return;
    }

    data.forEach((table: { name: string; count: number }) => {
      const option = document.createElement("option");
      option.value = table.name;
      option.innerText = table.name + ` (${table.count})`;
      if (tableSelect !== undefined) tableSelect.appendChild(option);
    });
    tableSelect.value = "products";

    selectAll("products");
  });

  export let query = "";
  async function customQuery() {
    await fetch(`/api/db?query=${query}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.error) {
          error = data.error;
          return;
        }
        rows.set(data);
      })
      .catch((err) => {
        error = err;
      });
  }
  const {
    elements: {
      trigger: exportTrigger,
      overlay: exportOverlay,
      content: exportContent,
      title: exportTitle,
      close: exportClose,
      portalled: exportPortalled,
    },
    states: { open: exportOpen },
  } = createDialog({
    forceVisible: true,
  });

  let exportOption = "products";

  async function handleExport() {
    try {
      const response = goto(`/api/db?export=${exportOption}`);
    } catch (error) {
      console.error("Export error:", error);
    }
    exportOpen.set(false);
  }

  let rows = writable([]);
</script>

<div class="w-full flex flex-col bg-black/10 p-4 rounded-lg gap-4">
  <div class="flex flex-row w-full gap-4">
    <select
      bind:this={tableSelect}
      on:change={() => {
        selectAll(tableSelect.value);
      }}
      class="bg-white p-2 rounded-lg w-full shadow font-medium"
    >
    </select>
    <button
      use:melt={$trigger}
      class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3
      font-medium leading-none text-berry-700 shadow hover:opacity-90 gap-3"
    >
      ADD&nbsp;PRODUCTS <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#aaa"
        ><path
          d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Zm-20-80h40v-100h100v-40H740v-100h-40v100H600v40h100v100Z"
        /></svg
      >
    </button>
    <button
      use:melt={$exportTrigger}
      class="inline-flex items-center justify-center rounded-xl bg-berry-700 px-4 py-3
    font-medium leading-none text-white shadow hover:opacity-90 gap-3"
    >
      EXPORT
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#FFFFFF"
      >
        <path
          d="m648-140 112-112v92h40v-160H640v40h92L620-168l28 28Zm-448 20q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Z"
        />
      </svg>
    </button>
    {#if $exportOpen}
      <div class="" use:melt={$exportPortalled}>
        <div
          use:melt={$exportOverlay}
          class="fixed inset-0 z-50 bg-black/50"
          transition:fade={{ duration: 150 }}
        />
        <div
        class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
        max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white
        p-6 shadow-lg"
    use:melt={$exportContent}
    transition:fade={{ duration: 150 }}
      >
          <h2
            use:melt={$exportTitle}
            class="m-0 text-lg font-medium text-black"
          >
            Export Data
          </h2>
          <div class="my-4">
            <label for="exportOption" class="block mb-2"
              >Select data to export:</label
            >
            <select
              id="exportOption"
              class="w-full p-2 border rounded"
              bind:value={exportOption}
            >
              <option value="products">All Products</option>
              <option value="prices">All Prices</option>
            </select>
          </div>
          <div class="mt-6 flex justify-end gap-4">
            <button
              use:melt={$exportClose}
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
            >
              Cancel
            </button>
            <button
              on:click={handleExport}
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-berry-100 px-4 font-medium leading-none text-berry-900"
            >
              Export
            </button>
          </div>
          <button
            use:melt={$exportClose}
            aria-label="close"
            class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-berry-800
                hover:bg-berry-100 focus:shadow-berry-400"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    {/if}

    {#if $open}
      <div class="" use:melt={$portalled}>
        <div
          use:melt={$overlay}
          class="fixed inset-0 z-50 bg-black/50"
          transition:fade={{ duration: 150 }}
        />
        <div
        class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
        max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white
        p-6 shadow-lg"
    use:melt={$content}
    transition:fade={{ duration: 150 }}
      >
          <h2 use:melt={$title} class="m-0 text-lg font-medium text-black">
            Upload Products
          </h2>
          <div class="relative my-4">
            {#if $progress > 0}
            <Progress value={progress} />
            {:else}
            <label
              for="file"
              class="flex items-center justify-center w-full h-40 px-4 transition bg-white border-2 border-berry-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-berry-700 focus:outline-none"
              on:dragover|preventDefault
              on:drop|preventDefault={handleFileDrop}
            >
              <span class="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-6 h-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span class="font-medium text-gray-600">
                  Drop files to Upload, or
                  <span class="text-berry-600 underline">browse</span>
                </span>
              </span>
              <input
                id="file"
                type="file"
                accept=".csv"
                class="hidden"
                on:change={handleFileUpload}
              />
            </label>
            {/if}
          </div>

          {#if fileName}
            <p class="font-bold">Selected file: {fileName}</p>
            <p class="mb-4">
              Select the column names that match up to each field.<br />I will
              try match them for you.
            </p>
          {/if}

          
          {#if columnNames.length > 0}
            <div class="mb-4">
              <label for="berrySKU" class="block mb-2">Berry SKU</label>
              <select
                id="berrySKU"
                class="w-full p-2 border rounded"
                bind:value={berrySKUColumn}
              >
                {#each columnNames as column}
                  <option value={column}>{column}</option>
                {/each}
              </select>
            </div>

            <div class="mb-4">
              <label for="supplierCode" class="block mb-2">Supplier Code</label>
              <select
                id="supplierCode"
                class="w-full p-2 border rounded"
                bind:value={supplierCodeColumn}
              >
                {#each columnNames as column}
                  <option value={column}>{column}</option>
                {/each}
              </select>
            </div>

            <div class="mb-4">
              <label for="barcode" class="block mb-2">Barcode</label>
              <select
                id="barcode"
                class="w-full p-2 border rounded"
                bind:value={barcodeColumn}
              >
                {#each columnNames as column}
                  <option value={column}>{column}</option>
                {/each}
              </select>
            </div>

            <div class="mb-4">
              <label for="title" class="block mb-2">Title</label>
              <select
                id="title"
                class="w-full p-2 border rounded"
                bind:value={titleColumn}
              >
                {#each columnNames as column}
                  <option value={column}>{column}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="mt-6 flex justify-end gap-4">
            <button
              use:melt={$close}
              class="inline-flex h-8 items-center justify-center rounded-sm
                      bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
            >
              Cancel
            </button>
            <button
              on:click={handleAllProducts}
              class="inline-flex h-8 items-center justify-center rounded-sm
                      bg-berry-100 px-4 font-medium leading-none text-berry-900"
            >
              Add Products
            </button>
          </div>
          <button
            use:melt={$close}
            aria-label="close"
            class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                  items-center justify-center rounded-full p-1 text-berry-800
                  hover:bg-berry-100 focus:shadow-berry-400"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    {/if}
  </div>
  <Input name="query" bind:value={query} callback={customQuery} />
</div>

<p class="text-red-500 font-xs h-5">
  {error}
</p>

<div
  use:melt={$root}
  class="relative h-full w-full overflow-hidden rounded-md border bg-white text-magnum-900 shadow-lg"
>
  <div use:melt={$viewport} class="h-full w-full rounded-[inherit]">
    <div use:melt={$scrollContent}>
      <div class="p-4">
        <h4 class="mb-4 font-semibold leading-none">Results</h4>

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
</div>
</div>
</div>
<div
use:melt={$scrollbarY}
class="flex h-full w-2.5 touch-none select-none border-l border-l-transparent bg-magnum-800/10 p-px transition-colors"
>
<div
  use:melt={$thumbY}
  class="relative flex-1 rounded-full bg-magnum-600"
/>
</div>
<div
use:melt={$scrollbarX}
class="flex h-2.5 w-full touch-none select-none border-t border-t-transparent bg-magnum-800/10 p-px"
>
<div use:melt={$thumbX} class="relative rounded-full bg-magnum-600" />
</div>
<div use:melt={$corner} />
</div>

