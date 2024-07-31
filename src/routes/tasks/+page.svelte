<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  // Stores for task management
  let currentTask = writable('label-suppliers');
  let taskList = writable([
    { 
      id: 'label-suppliers', 
      name: 'Label Suppliers',
      description: 'Assign suppliers to products and add new suppliers to the database.'
    },
    { 
      id: 'verify-asin', 
      name: 'Verify ASIN and Amazon URL',
      description: 'Confirm the accuracy of ASIN and Amazon URLs for products.'
    },
    { 
      id: 'price-location', 
      name: 'Google Website Prices.',
      description: "Help the scraper find the price element on websites it's unsure about."
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
      const response = await fetch('/api/db/products');
      const data = await response.json();
      products.set(data);
      console.log(data);
    } catch (error) {
      console.error('Error fetching unlabelled products:', error);
    }
  }

  async function fetchSuppliers() {
    try {
      const response = await fetch('/api/db/suppliers');
      const data = await response.json();
      suppliers.set(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }

  async function addNewSupplier() {
    try {
      const response = await fetch('/api/db/suppliers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ name: newSupplierName }]),
      });
      const data = await response.json();
      console.log(data);
      fetchSuppliers();
      newSupplierName = "";
      newSupplierUrl = "";
    } catch (error) {
      console.error('Error adding new supplier:', error);
    }
  }

  async function updateProductSupplier(productId, supplierId) {
    if (supplierId === "") return;
    const product = $products.find(p => p.berry === productId);
    try {
      await fetch(`/api/db/products/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ 
          berry: product.berry,
          barcode: product.barcode,
          title: product.title,
          supplier: supplierId,
          supplierCode: product.supplierCode,
          amazonLast: product.amazonLast,
          ebayLast: product.ebayLast,
          googleLast: product.googleLast
         }]), // the above could overwrite a just written amazon, ebay, googelLast but too much effort to change right now lol
         // change this to a PUT later at /api/db/products/{berry}
      });
      products.update(p => p.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error updating product supplier:', error);
    }
  }

  onMount(() => {
    fetchUnlabelledProducts();
    fetchSuppliers();
  });

</script>

<div class="w-full h-full flex flex-row bg-black/10 p-4 rounded-lg gap-4">
  <!-- Task List Sidebar -->
  <div class="w-1/4 bg-white rounded-lg shadow p-4">
    <h2 class="text-xl font-bold mb-4">Tasks</h2>
    <ul>
      {#each $taskList as task}
        <li 
          class={`cursor-pointer p-2 hover:bg-berry-100 rounded mb-2 ${$currentTask === task.id ? 'bg-berry-200 hover:bg-berry-200' : ''}`}
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
    {#if $currentTask === 'label-suppliers'}
      <h2 class="text-2xl font-bold mb-4">Label Suppliers</h2>
      <p class="mb-4">This isn't really important and is just admin for the sake of admin. It will allow you to easily select all products from a certain supplier later on.</p>
    <!-- Add New Supplier Form -->
    <div class="mb-10 p-4 bg-berry-100 rounded-lg">
      {#if $suppliers.length === 0}
      <h3 class="text-lg font-semibold mb-2">Existing Suppliers</h3>
      <div class="grid gap-2 grid-cols-6">
      {#each $suppliers as supplier}
        <div class="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg">
          <span class="flex-grow">{supplier.name}</span>
        </div>
      {/each}
      </div>
      {/if}
    
      <h3 class="text-lg font-semibold my-2">Add New Supplier</h3>
      <div class="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Supplier Name"
          bind:value={newSupplierName}
          class="p-2 rounded-lg flex-grow"
        />
        <!--
        <input
          type="url"
          placeholder="Supplier URL"
          bind:value={newSupplierUrl}
          class="p-2 rounded-lg flex-grow"
        />-->
        <button
          on:click={addNewSupplier}
          class="bg-berry-600 text-white px-4 py-2 rounded-lg hover:bg-berry-700"
        >
          Add Supplier
        </button>
      </div>
    </div>

    <!-- Product List -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-2">Unlabelled Products</h3>
      {#each $products as product}
        <div class="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-lg">
          <span class="flex-grow">{product.berry} - {product.title}</span>
          <select
            on:change={(e) => updateProductSupplier(product.berry, e.target.value)}
            class="p-2 rounded-lg"
          >
            <option value="">Select Supplier</option>
            {#if $suppliers.length === 0}
              <option value="" disabled>No suppliers found. Please add some above.</option>
            {/if}
            {#each $suppliers as supplier}
              <option value={supplier.name}>{supplier.name}</option>
            {/each}
          </select>
        </div>
      {/each}
    </div>

    {#if $products.length === 0}
      <p class="mt-4 text-center text-gray-600">All products are labelled! Good job. (Or none are found?)</p>
    {/if}
    {:else if $currentTask === 'verify-asin'}
      <h2 class="text-2xl font-bold mb-4">Verify ASIN and Amazon URL</h2>
      <p class="mb-4">This job will make scraping Amazon products easier and quicker, if we know their exact ASIN and product url.</p>
      <!-- Implement ASIN verification UI here -->
    {:else if $currentTask === 'price-location'}
      <h2 class="text-2xl font-bold mb-4">Find Price Location on Websites</h2>
      <p class="mb-4">This is an important job. Some websites are awkward or stupid and don't make it easy for us to find the price. You will please need to manually click on the price element for 3 products for each of the websites below. This will teach the Scraper and give it enough information to find the price next time.</p>
      <!-- Implement price location finder UI here -->
    {:else}
      <p><strong>Select a task from the sidebar to begin.</strong></p>
    {/if}
  </div>
</div>