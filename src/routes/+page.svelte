<script>
  import { onDestroy, onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { createDialog, melt, createScrollArea } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { mode } from "$lib/stores";
  import Input from "$lib/components/Input.svelte";
  import { writable } from "svelte/store";
  import Combobox from "$lib/components/Combobox.svelte";
  let query = "";

  let manualResponse = writable({
    first: {
      href: "/",
      thumbnail: "no-image.png",
      price: "0.00",
      shipping: "0.00",
      title: "No Product Found"
    },
    others: []
  });

  async function manualApi() {
    switch ($mode) {
      case "ebay":
        const resp = await fetch("/api/ebay?query=" + encodeURIComponent(query));
        const data = await resp.json();
        manualResponse.set(data);
        console.log(data);
        break;
      case "amazon":
        const resp2 = await fetch("/api/amazon?query=" + encodeURIComponent(query));
        const data2 = await resp2.json();
        manualResponse.set(data2);
        console.log(data2);
        break;
      default:
        alert("Invalid mode? " + $mode);
    }
  }


  /**
     * @type {any[]}
     */
  let productFields = [];
  /**
     * @type {number}
     */
  let draggedItem;
  let status = false;
  let total = 0;
  let processed = 0;
  /**
     * @type {any[]}
     */
  let errorArray = [];
  /**
     * @type {number | Timer | undefined}
     */
  let intervalId;

  async function getProductFields() {
    const response = await fetch(
      `/api/db?query=${encodeURIComponent('SELECT name FROM PRAGMA_TABLE_INFO("products")')}`,
    );
    let fields = await response.json();
    fields = fields.filter(
      (/** @type {{ name: string; }} */ field) => !["ebayLast", "amazonLast", "googleLast", "supplier", "berry"].includes(field.name),
    );
    fields = fields.map((/** @type {{ name: any; }} */ field) => field.name);
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
    type: 'hover',
    dir: 'ltr',
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

  let rateLimit = 5000;
  let rateRemaining = 5000;
  async function checkBatchStatus() {
    try {
      const response = await fetch("/api/ebay?batch=check");
      let data = await response.json();
      console.log(data);
      data = data["isBatchProcessing"];
      status = data.status;
      total = data.total;
      processed = data.processed;
      errorArray = data.errorArray;
      rateLimit = data.limit;
      rateRemaining = data.remaining;

      const response2 = await fetch("/api/amazon?batch=check");
      let data2 = await response2.json();
      console.log(data2);
      data2 = data2["isBatchProcessing"];
      amazonStatus = data2.status;
      amazonTotal = data2.total;
      amazonProcessed = data2.processed;
      amazonErrorArray = data2.errorArray;
      
      const response3 = await fetch("/api/google?batch=check");
    let data3 = await response3.json();
    console.log(data3);
    data3 = data3["isBatchProcessing"];
    googleStatus = data3.status;
    googleTotal = data3.total;
    googleProcessed = data3.processed;
    googleErrorArray = data3.errorArray;


    } catch (error) {
      console.error("Error checking batch status:", error);
    }
  }

  /**
     * @param {string} modemode
     */
  function startBatchProcessing(modemode) {
    console.log(modemode);
    const itemsPerSearch = document.getElementById("items-per-search").value;
    const businessesOnly = document.getElementById("businesses-only").checked;
    const priceType = document.querySelector(
      'input[name="price-type"]:checked',
    ).value;
    const queryPriority = productFields;
    fetch(`/api/${modemode}?batch=true`)
      .then(() => {
      })
      .catch((error) => {
        console.error("Error starting batch processing:", error);
      });
  }

  /**
     * @param {string} modemode
     */
  function stopBatchProcessing(modemode) {
    fetch(`/api/${modemode}?batch=stop`)
      .then(() => {
      })
      .catch((error) => {
        console.error("Error stopping batch processing:", error);
      });
  }

  onMount(async () => {
    productFields = await getProductFields();
    checkBatchStatus();
    intervalId = setInterval(checkBatchStatus, 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  /**
     * @param {DragEvent & { currentTarget: EventTarget & HTMLLIElement; }} event
     * @param {number} index
     */
  function dragStart(event, index) {
    draggedItem = index;
    event.dataTransfer.effectAllowed = "move";
  }

  /**
     * @param {DragEvent & { currentTarget: EventTarget & HTMLLIElement; }} event
     * @param {number} index
     */
  function dragOver(event, index) {
    event.preventDefault();
    if (index !== draggedItem) {
      const newFields = [...productFields];
      const [reorderedItem] = newFields.splice(draggedItem, 1);
      newFields.splice(index, 0, reorderedItem);
      productFields = newFields;
      draggedItem = index;
    }
  }

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

  // Add Amazon-specific variables and functions
  let amazonStatus = false;
  let amazonTotal = 0;
  let amazonProcessed = 0;
  /**
     * @type {any[]}
     */
  let amazonErrorArray = [];


  // Add Google-specific variables and functions
let googleStatus = false;
let googleTotal = 0;
let googleProcessed = 0;
    /**
     * @type {any[]}
     */
let googleErrorArray = [];

</script>

<div class="flex flex-row gap-16 h-full">
  <div class="w-1/3 p-2 flex flex-col">
    <p
      class="text-2xl font-bold border-b flex justify-between flex-row items-center border-berry-600 pb-2 mb-4"
    >
      eBay <span class="text-xs ">{rateRemaining} / {rateLimit} API calls</span>
      <button
        use:melt={$trigger}
        on:click={() => {mode.set("ebay");}}
        class="inline-flex items-center justify-center rounded-full px-4 py-3
      font-medium leading-none bg-berry-100 text-lg shadow hover:opacity-90 gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#009845"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"></path></svg>
      </button>
    </p>
    <div
      class="bg-berry-600/10 rounded-xl h-30 w-full flex p-4 flex-row justify-between items-center"
    >
      <div class="flex flex-col">
        <p class="font-bold">
          {status ? "Currently running!" : "Not running."}
        </p>
        <p>{processed} / {total} Items</p>
      </div>
      <div>
        <button
          class="bg-berry-600 text-white rounded-lg px-4 py-2 font-bold"
          on:click={status === false
            ? () => {
                startBatchProcessing("ebay");
              }
            : () => {
                stopBatchProcessing("ebay");
            }}
        >
          {status === false ? "LAUNCH" : "STOP"}
        </button>
      </div>
    </div>
    <div class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-6">
      <div class="flex flex-col gap-2">
        <label for="items-per-search" class="font-bold">Items per search:</label
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
      <strong class="font-bold">Errors:</strong>
      <ul>
        {#each errorArray as error}
          <li><strong>{error.error}:</strong> {error.info}</li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="w-1/3 p-2 flex flex-col">
    <p
      class="text-2xl font-bold border-b flex justify-between flex-row items-center border-berry-600 pb-2 mb-4"
    >
      Amazon <span class="text-xs ">∞ / ∞ API calls</span><button
        use:melt={$trigger}
        on:click={() => {mode.set("amazon");}}
        class="inline-flex items-center justify-center rounded-full px-4 py-3
      font-medium leading-none bg-berry-100 text-lg shadow hover:opacity-90 gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#009845"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"></path></svg>
      </button>
    </p>
    <div
      class="bg-berry-600/10 rounded-xl h-30 w-full flex p-4 flex-row justify-between items-center"
    >
      <div class="flex flex-col">
        <p class="font-bold">
          {amazonStatus ? "Currently running!" : "Not running."}
        </p>
        <p>{amazonProcessed} / {amazonTotal} Items</p>
      </div>
      <div>
        <button
          class="bg-berry-600 text-white rounded-lg px-4 py-2 font-bold"
          on:click={amazonStatus === false
            ? () => {
                startBatchProcessing("amazon");
              }
            : () => {
                stopBatchProcessing("amazon");
            }}
        >
          {amazonStatus === false ? "LAUNCH" : "STOP"}
        </button>
      </div>
    </div>
    <div class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-6">
      <div class="flex flex-col gap-2">
        <label for="amazon-items-per-search" class="font-bold">Items per search:</label>
        <input
          type="number"
          id="amazon-items-per-search"
          class="w-full rounded-xl bg-white caret-berry-700 px-3 focus:outline-none shadow h-10"
          value="10"
        />
      </div>
      <div class="grid grid-cols-2">
        <div class="flex flex-col">
          <label class="font-bold">Prime only:</label>
          <div class="flex flex-row gap-4">
            <input
              type="checkbox"
              id="amazon-prime-only"
              class="rounded"
              checked
            />
            <label for="amazon-prime-only">Yes</label>
          </div>
        </div>
        <div class="flex flex-col">
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
      <strong class="font-bold">Errors:</strong>
      <ul>
        {#each amazonErrorArray as error}
          <li><strong>{error.error}:</strong> {error.info}</li>
        {/each}
      </ul>
    </div>
  </div>
  
  <div class="w-1/3 p-2 flex flex-col">
    <p
      class="text-2xl font-bold border-b flex justify-between flex-row items-center border-berry-600 pb-2 mb-4"
    >
      Google <span class="text-xs ">∞ / ∞ API calls</span><button
        use:melt={$trigger}
        on:click={() => {mode.set("google");}}
        class="inline-flex items-center justify-center rounded-full px-4 py-3
      font-medium leading-none bg-berry-100 text-lg shadow hover:opacity-90 gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#009845"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"></path></svg>
      </button>
    </p>
    <div
      class="bg-berry-600/10 rounded-xl h-30 w-full flex p-4 flex-row justify-between items-center"
    >
      <div class="flex flex-col">
        <p class="font-bold">
          {googleStatus ? "Currently running!" : "Not running."}
        </p>
        <p>{googleProcessed} / {googleTotal} Items</p>
      </div>
      <div>
        <button
          class="bg-berry-600 text-white rounded-lg px-4 py-2 font-bold"
          on:click={googleStatus === false
            ? () => {
                startBatchProcessing("google");
              }
            : () => {
                stopBatchProcessing("google");
            }}
        >
          {googleStatus === false ? "LAUNCH" : "STOP"}
        </button>
      </div>
    </div>
    <div class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-6">
      <div class="flex flex-col gap-2">
        <label for="google-items-per-search" class="font-bold">Items per search:</label>
        <input
          type="number"
          id="google-items-per-search"
          class="w-full rounded-xl bg-white caret-berry-700 px-3 focus:outline-none shadow h-10"
          value="10"
        />
      </div>
      <div class="grid grid-cols-2">
        <div class="flex flex-col">
          <label class="font-bold">Shopping results only:</label>
          <div class="flex flex-row gap-4">
            <input
              type="checkbox"
              id="google-shopping-only"
              class="rounded"
              checked
            />
            <label for="google-shopping-only">Yes</label>
          </div>
        </div>
        <div class="flex flex-col">
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
      <strong class="font-bold">Errors:</strong>
      <ul>
        {#each googleErrorArray as error}
          <li><strong>{error.error}:</strong> {error.info}</li>
        {/each}
      </ul>
    </div>
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
        <Input name="search" callback={manualApi} bind:value={query}/>
        <Combobox/>
      </div>
      <div class="search-result col-span-2 flex items-start p-4 w-full bg-blue-100 rounded-lg">
        <div class="thumbnail mr-4">
          <img src={$manualResponse.first.thumbnail} alt="Thumbnail" class="w-20 h-20 object-cover" />
        </div>
        <div class="content flex-grow">
          <h3 class="text-xl text-blue-600 hover:underline mb-1">
            <a href={$manualResponse.first.href}>{$manualResponse.first.title}</a>
          </h3>
          <div class="text-sm text-green-700 mb-1">£{$manualResponse.first.price} + <span class="text-xs text-gray-600 mb-2">£{$manualResponse.first.shipping} shipping</span></div>
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
