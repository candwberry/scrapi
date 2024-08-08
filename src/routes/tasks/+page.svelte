<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  // Stores for task management
  let currentTask = writable("verify-asin");
  let taskList = writable([
    {
      id: "verify-asin",
      name: "Verify Amazon ASINs",
      description: "Confirm the accuracy of the ASINs we found",
    },
    {
      id: "price-location",
      name: "Website Price Locations",
      description:
        "Help the scraper find the price element on websites it's unsure about",
    },
  ]);

  function selectTask(taskId) {
    currentTask.set(taskId);
  }

  let products = writable([]);
  let suppliers = writable([]);
  let newSupplierName = "";
  let newSupplierUrl = "";

  async function fetchUnlabelledProducts() {
    try {
      const response = await fetch("/api/db/products");
      const data = await response.json();
      products.set(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching unlabelled products:", error);
    }
  }

  async function fetchSuppliers() {
    try {
      const response = await fetch("/api/db/suppliers");
      const data = await response.json();
      suppliers.set(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }

  async function addNewSupplier() {
    try {
      const response = await fetch("/api/db/suppliers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ name: newSupplierName }]),
      });
      const data = await response.json();
      console.log(data);
      fetchSuppliers();
      newSupplierName = "";
      newSupplierUrl = "";
    } catch (error) {
      console.error("Error adding new supplier:", error);
    }
  }

  async function updateProductSupplier(productId, supplierId) {
    if (supplierId === "") return;
    const product = $products.find((p) => p.berry === productId);
    try {
      await fetch(`/api/db/products/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            berry: product.berry,
            barcode: product.barcode,
            title: product.title,
            supplier: supplierId,
            supplierCode: product.supplierCode,
            amazonLast: product.amazonLast,
            ebayLast: product.ebayLast,
            googleLast: product.googleLast,
            amazonJSON: product.amazonJSON,
          },
        ]), // the above could overwrite a just written amazon, ebay, googelLast but too much effort to change right now lol
        // change this to a PUT later at /api/db/products/{berry}
      });
      products.update((p) => p.filter((product) => product.id !== productId));
    } catch (error) {
      console.error("Error updating product supplier:", error);
    }
  }

  onMount(() => {
    fetchUnlabelledProducts();
    fetchSuppliers();
  });

  let unvalidatedProducts = writable([]);
  let isAutoplayRunning = writable(false);

  async function fetchunvalidatedProducts() {
    try {
      const response = await fetch("/api/db/unvalidatedasins");
      if (response.ok) {
        const data = await response.json();
        unvalidatedProducts.set(data);
      } else {
        console.error("Error fetching unvalidated ASINs:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching unvalidated ASINs:", error);
    }
  }

  let validationResult = null;

  async function validateAsin(product) {
    if (product === undefined) {
      console.error("Product is undefined");
      return false;
    }
    console.log(product);
    let asin = JSON.parse(product.amazonJSON).asin;
    const berry = product.berry;
    const title = product.title;
    const supplier = product.supplier;
    const supplierCode = product.supplierCode;

    if (asin === undefined || asin === "") {
      asin = "B00Y0QTUHE"; // default to a random ASIN for testing
    }
    console.log(asin, berry);
    try {
      console.log("Validating ASIN:", asin);
      const response = await fetch(
        `/api/tasks/amazon?asin=${encodeURIComponent(asin)}&berry=${encodeURIComponent(berry)}&title=${encodeURIComponent(title)}&supplier=${encodeURIComponent(supplier)}&supplierCode=${encodeURIComponent(supplierCode)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        validationResult = data; // Set the validation result
        unvalidatedProducts.update((asins) => asins.filter((a) => a !== asin));
      } else {
        console.error("Error validating ASIN:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error validating ASIN:", error);
      return false;
    }
    return true;
  }

  async function startAutoplay() {
    isAutoplayRunning.set(true);
    for (let asin of $unvalidatedProducts) {
      if (!$isAutoplayRunning) break;
      const success = await validateAsin(asin);
      console.log("Hello");
      if (!success) {
        isAutoplayRunning.set(false);
        break;
      }
    }
    isAutoplayRunning.set(false);
  }

  function stopAutoplay() {
    isAutoplayRunning.set(false);
  }

  let unvalidatedGoogleItems = writable([]);

  async function fetchUnvalidatedGoogleItems() {
    try {
      const response = await fetch("/api/db/getunvalidatedgoogles");
      if (response.ok) {
        const data = await response.json();
        unvalidatedGoogleItems.set(data);
      } else {
        console.error(
          "Error fetching unvalidated Google items:",
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching unvalidated Google items:", error);
    }
  }

  async function validateGoogleItem(item) {
    if (item === undefined) {
      console.error("Item is undefined");
      return false;
    }
    console.log(item);
    const { domain, url } = item;

    try {
      console.log("Validating Google item:", domain);
      const response = await fetch(
        `/api/tasks/google?domain=${encodeURIComponent(domain)}&url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        // Update the regex using the /api/db/getGoogleRegex endpoint
        await updateGoogleRegex(domain, data.regex);
        unvalidatedGoogleItems.update((items) =>
          items.filter((i) => i.domain !== domain),
        );
      } else {
        console.error("Error validating Google item:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error validating Google item:", error);
      return false;
    }
    return true;
  }

  async function updateGoogleRegex(domain, regex) {
    try {
      const response = await fetch("/api/db/getGoogleRegex", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain, regex }),
      });
      if (!response.ok) {
        throw new Error("Failed to update Google regex");
      }
    } catch (error) {
      console.error("Error updating Google regex:", error);
    }
  }

  async function startGoogleAutoplay() {
    isAutoplayRunning.set(true);
    for (let item of $unvalidatedGoogleItems) {
      if (!$isAutoplayRunning) break;
      const success = await validateGoogleItem(item);
      if (!success) {
        isAutoplayRunning.set(false);
        break;
      }
    }
    isAutoplayRunning.set(false);
  }

  onMount(() => {
    fetchUnlabelledProducts();
    fetchSuppliers();
    fetchunvalidatedProducts();
    fetchUnvalidatedGoogleItems();
  });
</script>

<div class="w-full h-full flex flex-row bg-black/10 p-4 rounded-lg gap-4">
  <!-- Task List Sidebar -->
  <div class="w-1/4 bg-white rounded-lg shadow p-4">
    <h2 class="text-xl font-bold mb-4">Tasks</h2>
    <ul>
      {#each $taskList as task}
        <li
          class={`cursor-pointer p-2 hover:bg-berry-100 rounded mb-2 ${$currentTask === task.id ? "bg-berry-200 hover:bg-berry-200" : ""}`}
          on:click={() => selectTask(task.id)}
        >
          <h3 class="font-semibold">{task.name}</h3>
          <p class="text-sm text-gray-600">{task.description}</p>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Main Task Area -->
  <div class="w-3/4 bg-white rounded-lg shadow p-4">
    {#if $currentTask === "verify-asin"}
      <h2 class="text-2xl font-bold mb-4">Verify ASIN and Amazon URL</h2>
      <p class="mb-4">
        <strong>This job will make scraping Amazon products easier and quicker.</strong> If we
        know a product's exact ASIN, we will be able to just jump straight to that product and
        leave, rather than relying on Amazon search.
      </p>

      <div class="flex flex-row w-full gap-4 mb-4">
        <button
          on:click={startAutoplay}
          class="inline-flex items-center justify-center rounded-xl bg-berry-600 px-4 py-3 font-medium leading-none text-white shadow hover:opacity-90 gap-3"
          disabled={$isAutoplayRunning}
        >
          Autoplay Verification
        </button>
      </div>

      <div
        class="bg-white rounded-lg shadow p-4 mt-6"
        style="overflow-y: auto; max-height: 500px;"
      >
        <table class="w-full text-md">
          <thead>
            <tr class="bg-[#e5e7eb]">
              <th class="p-2 text-left">ASIN</th>
              <th class="p-2 text-left">Title</th>
              <th class="p-2 text-left">Supplier + Code</th>
              <th class="p-2 text-left">Validated</th>
            </tr>
          </thead>
          <tbody>
            {#each $unvalidatedProducts as asin, i}
              <tr class="{i % 2 === 0 ? 'bg-[#f9f9f9]' : ''} border-b">
                <td class="p-2">{JSON.parse(asin.amazonJSON).asin}</td>
                <td class="p-2">{asin.title}</td>
                <td class="p-2 font-bold"
                  >{asin.supplier} {asin.supplierCode}</td
                >
                <td class="p-2">
                  {#if JSON.parse(asin.amazonJSON).validated === "true"}
                    ✅
                  {:else}
                    ❌
                  {/if}

                  <button
                    on:click={() => validateAsin(asin)}
                    class="bg-berry-600 text-white px-3 py-1 rounded-lg hover:bg-berry-700 text-sm"
                    disabled={$isAutoplayRunning}
                  >
                    Validate
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if validationResult && 1 + 1 == 3}
        <div class="mt-6 bg-white rounded-lg shadow p-4">
          <h3 class="text-lg font-semibold mb-2">Validation Result</h3>
          <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto">
        {JSON.stringify(validationResult, null, 2)}
      </pre>
        </div>
      {/if}
    {:else if $currentTask === "price-location"}
      <h2 class="text-2xl font-bold mb-4">Find Price Location on Websites</h2>
      <p class="mb-4">
        <strong
          >Some websites are awkward or stupid and don't make it easy for us to
          find the price.</strong
        >
        You will please need to manually click on the price element for 3 products
        for each of the websites below. This will teach the Scraper and give it enough
        information to find the price next time.
      </p>

      <div class="flex flex-row w-full gap-4 mb-4">
        <button
          on:click={startGoogleAutoplay}
          class="inline-flex items-center justify-center rounded-xl bg-berry-600 px-4 py-3 font-medium leading-none text-white shadow hover:opacity-90 gap-3"
          disabled={$isAutoplayRunning}
        >
          Autoplay Google Verification
        </button>
      </div>

      <div
        class="bg-white rounded-lg shadow p-4 mt-6"
        style="overflow-y: auto; max-height: 500px;"
      >
        <table class="w-full text-md">
          <thead>
            <tr class="bg-[#e5e7eb]">
              <th class="p-2 text-left">Domain</th>
              <th class="p-2 text-left">URL</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $unvalidatedGoogleItems as item, i}
              <tr class="{i % 2 === 0 ? 'bg-[#f9f9f9]' : ''} border-b">
                <td class="p-2">{item.domain}</td>
                <td class="p-2">{item.url}</td>
                <td class="p-2">
                  <button
                    on:click={() => validateGoogleItem(item)}
                    class="bg-berry-600 text-white px-3 py-1 rounded-lg hover:bg-berry-700 text-sm"
                    disabled={$isAutoplayRunning}
                  >
                    Validate
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p><strong>Select a task from the sidebar to begin.</strong></p>
    {/if}
  </div>
</div>
