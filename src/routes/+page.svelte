<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { createDialog, melt, createScrollArea } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { mode } from "$lib/stores";
  import { writable } from "svelte/store";
  import Input from "$lib/components/Input.svelte";
  import Combobox from "$lib/components/Combobox.svelte";

  let query = "";
  let productFields: any[] = [];
  let draggedItem: number;
  let intervalId: number | Timer | undefined;

  const ebay = writable({
    status: false,
    total: 0,
    processed: 0,
    errorArray: [],
    limit: 5000,
    remaining: 5000,
    estimatedTime: "0s",
  });

  let ebayProgress = 0;
  $: ebayProgress =
    $ebay.total == 0 ? 0 : ($ebay.processed / $ebay.total);
  $: console.log(ebayProgress);

  let manualResponse = writable({
    first: {
      href: "/",
      thumbnail: "no-image.png",
      price: "0.00",
      shipping: "0.00",
      title: "No Product Found",
    },
    others: [],
  });

  async function manualApi() {
    const resp = await fetch(
      `/api/${$mode}?query=${encodeURIComponent(query)}`,
    );
    const data = await resp.json();
    manualResponse.set(data);
  }

  async function getProductFields() {
    const response = await fetch(
      `/api/db?query=${encodeURIComponent('SELECT name FROM PRAGMA_TABLE_INFO("products")')}`,
    );
    let fields = await response.json();
    fields = fields.filter(
      (field: { name: string }) =>
        !["ebayLast", "amazonLast", "googleLast", "supplier", "berry"].includes(
          field.name,
        ),
    );
    fields = fields.map((field: { name: any }) => field.name);
    return fields;
  }

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
    type: "hover",
    dir: "ltr",
  });

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

  const {
    elements: {
      trigger: amazonTrigger,
      overlay: amazonOverlay,
      content: amazonContent,
      title: amazonTitle,
      description: amazonDescription,
      close: amazonClose,
      portalled: amazonPortalled,
    },
    states: { open: amazonOpen },
  } = createDialog({
    forceVisible: true,
  });

  let tab = "";

  async function checkBatchStatus() {
    try {
      const response = await fetch("/api/ebay?batch=check");
      let data = await response.json();
      data = data["isBatchProcessing"];
      ebay.set(data);
    } catch (error) {
      console.error("Error checking batch status:", error);
    }
    try {
      const response = await fetch("/api/amazon?batch=check");
      let data = await response.json();
      data = data["isBatchProcessing"];
      amazon.set(data);
    } catch (error) {
      console.error("Error checking batch status:", error);
    }
    try {
      const response = await fetch("/api/google?batch=check");
      let data = await response.json();
      data = data["isBatchProcessing"];
      google.set(data);
    } catch (error) {
      console.error("Error checking batch status:", error);
    }
  }

  function startBatchProcessing(modemode: string) {
    console.log(modemode);
    fetch(`/api/${modemode}?batch=true`)
      .then(() => {})
      .catch((error) => {
        console.error("Error starting batch processing:", error);
      });
  }

  function stopBatchProcessing(modemode: string) {
    fetch(`/api/${modemode}?batch=stop`)
      .then(() => {})
      .catch((error) => {
        console.error("Error stopping batch processing:", error);
      });
  }

  onMount(async () => {
    productFields = await getProductFields();
    checkBatchStatus();
    intervalId = setInterval(checkBatchStatus, 100);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  function dragStart(
    event: DragEvent & { currentTarget: EventTarget & HTMLLIElement },
    index: number,
  ) {
    draggedItem = index;
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }

  function dragOver(
    event: DragEvent & { currentTarget: EventTarget & HTMLLIElement },
    index: number,
  ) {
    event.preventDefault();
    if (index !== draggedItem) {
      const newFields = [...productFields];
      const [reorderedItem] = newFields.splice(draggedItem, 1);
      newFields.splice(index, 0, reorderedItem);
      productFields = newFields;
      draggedItem = index;
    }
  }

  function setTab(newTab: string) {
    if (tab === newTab) tab = "";
    else tab = newTab;
    console.log(tab);
  }

  const amazon = writable({
  status: false,
  total: 0,
  processed: 0,
  errorArray: [],
  limit: 5000,
  remaining: 5000,
  estimatedTime: "0s",
});

let amazonProgress = 0;
$: amazonProgress =
  $amazon.total == 0 ? 0 : ($amazon.processed / $amazon.total);

</script>

<div class="flex flex-col gap-8 h-full w-full max-w-full">
  <!-- eBay Block-->
  <div class={`w-half flex flex-col relative gap-4 text-nowrap p-4 pb-0 items-center rounded-xl transition-all bg-[#f7f7f7] shadow ${$ebay.status ? "" : ""}`}>
    <div
      class="w-full flex flex-row text-nowrap gap-8 items-center "
    >
      <p
        class="text-2xl z-50 font-bold border-b flex justify-between flex-row items-center border-berry-600 ml-2 pb-1 w-[13rem]"
      >
        eBay
      </p>
      <div
        class="border border-gray-300 border-2 rounded-full p-2 w-full shadow"
      >
        {#if $ebay.errorArray.length > 0}
          {#each $ebay.errorArray.slice(-1) as error}
            <div>{error.error}: {error.info}</div>
          {/each}
        {:else}
          <div>No information to display.</div>
        {/if}
      </div>
      <button
        use:melt={$trigger}
        on:click={() => {
          mode.set("ebay");
        }}
        class="inline-flex items-center justify-center rounded-full px-4 py-3
  font-medium leading-none bg-berry-100 text-berry-600 text-lg shadow hover:opacity-90 gap-3"
        >Manual
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="16px"
          viewBox="0 -960 960 960"
          width="16px"
          fill="#009845"
          ><path
            d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"
          ></path></svg
        >
      </button>
      <div>
        <button
          class={`${$ebay.status === false ? "bg-berry-600" : "bg-red-300"} text-white rounded-full px-4 py-2 font-bold shadow w-[10rem]`}
          on:click={$ebay.status === false
            ? () => {
                startBatchProcessing("ebay");
              }
            : () => {
                stopBatchProcessing("ebay");
              }}
        >
          {$ebay.status === false ? "LAUNCH BATCH" : "PAUSE BATCH"}
        </button>
      </div>
    </div>
    <div class="w-full flex flex-row justify-between items-center">
      <p >EST: {$ebay.estimatedTime}</p>

    <div class="w-1/2 cursor-pointer" on:click={() => setTab("ebay")}>
      <div
        use:melt={$root}
        class="relative h-6 w-full overflow-hidden rounded-[99999px] bg-black/10 pointer-events-none"
      >
        <div
          on:click={() => setTab("ebay")}
          class="h-full w-full bg-berry-600 transition-transform duration-[1100ms]
          ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={`transform: translateX(-${100 - 100 * (ebayProgress ?? 0)}%)`}
        />
      </div>
    </div>
    <div class="flex flex-row gap-4 items-center">
      <p>{$ebay.processed} / {$ebay.total} Items</p>
      <span class="text-xs text-nowrap"
      >{$ebay.remaining} / {$ebay.limit} API calls</span
    >
      </div>


    </div>
    {#if tab === "ebay"}
      <div
        class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-6"
      >
        <div class="flex flex-col gap-2">
          <label for="items-per-search" class="font-bold"
            >Items per search:</label
          >
          <input
            type="number"
            id="items-per-search"
            class="w-full rounded-xl bg-white caret-berry-700 px-3 focus:outline-none shadow h-10"
            value="10"
          />
        </div>
        <div class="grid grid-cols-2">
          <div class="flex flex-col">
            <label class="font-bold">Businesses only:</label>
            <div class="flex flex-row gap-4">
              <input
                type="checkbox"
                id="businesses-only"
                class="rounded"
                checked
              />
              <label for="businesses-only">Yes</label>
            </div>
          </div>
          <div class="flex flex-col">
            <label class="font-bold">Price type:</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="price-type" value="fixed" checked />
                Fixed
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="price-type" value="auction" />
                Fixed & Auction
              </label>
            </div>
          </div>
        </div>
        <div class="w-full flex flex-col gap-4">
          <h3 class="font-bold">Query Priority:</h3>
          <ul class="w-full">
            {#each productFields as field, index (field)}
              <li
                animate:flip={{ duration: 300 }}
                draggable={true}
                on:dragstart={(event) => dragStart(event, index)}
                on:dragover={(event) => dragOver(event, index)}
                class="bg-white shadow rounded-lg p-2 mb-2 cursor-move"
              >
                {field}
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <div
        class="bg-red-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-4 h-40 overflow-y-auto"
        role="alert"
      >
        <strong class="font-bold">LOGS:</strong>
        <ul>
          {#each $ebay.errorArray as error}
            <li><strong>{error.error}:</strong> {error.info}</li>
          {/each}
        </ul>
      </div>
    {/if}
    <div></div>
  </div>
  <div class={`w-half flex flex-col relative gap-4 text-nowrap p-4 pb-0 items-center rounded-xl transition-all bg-[#f7f7f7] shadow ${$amazon.status ? "" : ""}`}>
    <div class="w-full flex flex-row text-nowrap gap-8 items-center">
      <p class="text-2xl z-50 font-bold border-b flex justify-between flex-row items-center border-berry-600 ml-2 pb-1 w-[13rem]">
        Amazon
      </p>
      <div class="border border-gray-300 border-2 rounded-full p-2 w-full shadow">
        {#if $amazon.errorArray.length > 0}
          {#each $amazon.errorArray.slice(-1) as error}
            <div>{error.error}: {error.info}</div>
          {/each}
        {:else}
          <div>No information to display.</div>
        {/if}
      </div>
      <button
        use:melt={$amazonTrigger}
        on:click={() => {
          mode.set("amazon");
        }}
        class="inline-flex items-center justify-center rounded-full px-4 py-3 font-medium leading-none bg-berry-100 text-berry-600 text-lg shadow hover:opacity-90 gap-3"
      >
        Manual
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="16px"
          viewBox="0 -960 960 960"
          width="16px"
          fill="#009845"
        >
          <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"></path>
        </svg>
      </button>
      <div>
        <button
          class={`${$amazon.status === false ? "bg-berry-600" : "bg-red-300"} text-white rounded-full px-4 py-2 font-bold shadow w-[10rem]`}
          on:click={$amazon.status === false
            ? () => {
                startBatchProcessing("amazon");
              }
            : () => {
                stopBatchProcessing("amazon");
              }}
        >
          {$amazon.status === false ? "LAUNCH BATCH" : "PAUSE BATCH"}
        </button>
      </div>
    </div>
    <div class="w-full flex flex-row justify-between items-center">
      <p>EST: {$amazon.estimatedTime}</p>

      <div class="w-1/2 cursor-pointer" on:click={() => setTab("amazon")}>
        <div
          use:melt={$root}
          class="relative h-6 w-full overflow-hidden rounded-[99999px] bg-black/10 pointer-events-none"
        >
          <div
            on:click={() => setTab("amazon")}
            class="h-full w-full bg-berry-600 transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={`transform: translateX(-${100 - 100 * (amazonProgress ?? 0)}%)`}
          />
        </div>
      </div>
      <div class="flex flex-row gap-4 items-center">
        <p>{$amazon.processed} / {$amazon.total} Items</p>
        <span class="text-xs text-nowrap">♾️ / ♾️ API calls</span>
      </div>
    </div>
    {#if tab === "amazon"}
      <div class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-6">
        <!-- Add Amazon-specific settings here, similar to the eBay block -->
      </div>
      <div
        class="bg-red-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-4 h-40 overflow-y-auto"
        role="alert"
      >
        <strong class="font-bold">LOGS:</strong>
        <ul>
          {#each $amazon.errorArray as error}
            <li><strong>{error.error}:</strong> {error.info}</li>
          {/each}
        </ul>
      </div>
    {/if}
    <div></div>
  </div>

</div>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-10 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-10 max-h-[85vh] w-[90vw]
        max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white
        p-6 shadow-lg"
      use:melt={$content}
      transition:fade={{ duration: 150 }}
    >
      <div class="flex flex-row justify-between items-center">
        <h2 use:melt={$title} class="m-0 text-lg font-medium text-black">
          Manual Search
        </h2>
      </div>
      <div class="relative my-4 gap-4 flex flex-col">
        <div class="flex flex-row gap-4 items-center">
          <Input name="search" callback={manualApi} bind:value={query} />
          <Combobox />
        </div>
        <div
          class="search-result col-span-2 flex items-start p-4 w-full bg-blue-100 rounded-lg"
        >
          <div class="thumbnail mr-4">
            <img
              src={$manualResponse.first.thumbnail}
              alt="Thumbnail"
              class="w-20 h-20 object-cover"
            />
          </div>
          <div class="content flex-grow">
            <h3 class="text-xl text-blue-600 hover:underline mb-1">
              <a href={$manualResponse.first.href}
                >{$manualResponse.first.title}</a
              >
            </h3>
            <div class="text-sm text-green-700 mb-1">
              £{$manualResponse.first.price} +
              <span class="text-xs text-gray-600 mb-2"
                >£{$manualResponse.first.shipping} shipping</span
              >
            </div>
          </div>
        </div>
        <div
          use:melt={$root}
          class="relative h-72 overflow-hidden rounded-lg text-berry-900 w-full bg-berry-800/20"
        >
          <div use:melt={$viewport} class="h-full w-full rounded-[inherit]">
            <div use:melt={$scrollContent}>
              <div class="p-4">
                <h4 class="mb-4 font-semibold leading-none">Other Results</h4>
                <!-- Other Items -->
                {#each $manualResponse.others as item}
                  <div
                    class="search-result flex items-start p-4 max-w-2xl border-b border-gray-200"
                  >
                    <div class="thumbnail mr-4">
                      <img
                        src={item.thumbnail}
                        alt="Thumbnail"
                        class="w-16 h-16 object-cover"
                      />
                    </div>
                    <div class="content flex-grow">
                      <h3 class="text-lg text-blue-600 hover:underline mb-1">
                        <a href={item.href}>{item.title}</a>
                      </h3>
                      <div class="text-sm text-green-700 mb-1">
                        £{item.price} +
                        <span class="text-xs text-gray-600 mb-2"
                          >£{item.shipping} shipping</span
                        >
                      </div>
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
            <div
              use:melt={$thumbX}
              class="relative rounded-full bg-berry-600"
            />
          </div>
          <div use:melt={$corner} />
        </div>
      </div>

      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                  items-center justify-center rounded-full p-1 text-berry-800
                  hover:bg-berry-100 focus:shadow-berry-400"
        >X
      </button>
    </div>
  </div>
{/if}
