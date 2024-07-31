<script lang="ts">
  import { createLabel, melt } from '@melt-ui/svelte';
  import Highlight from "svelte-highlight";
  import github from "svelte-highlight/styles/github";
  import sql from "svelte-highlight/languages/sql";
    import { onMount } from 'svelte';

  export let name = "label";
  export let value = "";
  export let callback = () => {};
  const {
    elements: { root },
  } = createLabel();

  onMount(() => {
    const hljs = document.querySelector(".hljs") as HTMLElement;
    if (hljs) 
      hljs.style.backgroundColor = "transparent";
  });

  let tables = [];
  let selectedTable = '';
  let columns = [];
  let selectedColumns = [];
  let whereCondition = '';
  let orderByColumn = '';
  let orderDirection = 'ASC';
  let limit = '';

  let queryString = '';

  onMount(async () => {
    // Fetch tables
    const tablesResponse = await fetch('/api/db?query=SELECT name FROM sqlite_master WHERE type="table"');
    tables = await tablesResponse.json();
  });

  async function handleTableSelect() {
    if (selectedTable) {
      // Fetch columns for the selected table
      const columnsResponse = await fetch(`/api/db?query=PRAGMA table_info(${selectedTable})`);
      columns = await columnsResponse.json();
    }
  }
  let whereConditions = [{ column: '', operator: '', value: '', connector: 'AND' }];

let whereConnector = 'AND';

  function addWhereCondition() {
  whereConditions = [...whereConditions, { column: '', operator: '', value: '', connector: 'AND' }];
}


  function removeWhereCondition(index) {
    whereConditions = whereConditions.filter((_, i) => i !== index);
  }

  $: {
    buildQuery();
    console.log(tables, selectedTable, columns, selectedColumns, whereConditions, orderByColumn, orderDirection, limit);
  }

  function buildQuery() {
    let query = 'SELECT ';
    query += selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
    query += selectedTable ? ` FROM ${selectedTable}` : '';
    
    if (whereConditions.length > 0) {
    const conditions = whereConditions
      .filter(cond => cond.column && cond.operator && cond.value)
      .map((cond, index, array) => {
        const conditionStr = `${cond.column} ${cond.operator} '${cond.value}'`;
        return index < array.length - 1 ? `${conditionStr} ${cond.connector}` : conditionStr;
      })
      .join(' ');
    if (conditions) {
      query += ` WHERE ${conditions}`;
    }
  }

    
    if (orderByColumn) {
      query += ` ORDER BY ${orderByColumn} ${orderDirection}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    queryString = query;
    value = query; // Update the value of the input field
  }

</script>

<form class="w-full relative overflow-hidden flex flex-col gap-2 ">
  <div class="flex flex-col z-50 py-2 items-center justify-between max-w-full w-full rounded-xl focus:outline-none">
    <input
    bind:value
    type="text"
    id={name}
    class="h-[56px] w-full max-w-full rounded-xl bg-white border text-white caret-berry-700 pl-4 focus:outline-none "
    style={"font-size: 1em;"}
    on:keydown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        callback();
      }
    }}
    />
    {@html github}
    <Highlight language={sql} code={value === "" ? "SELECT * FROM products" : value } 
    class="h-full w-full shadow-md rounded-xl bg-none pointer-events-none"
    style="transform: translateY(-56px); padding-left: 1px; user-select: none;"
    />  
    <!--
    <button on:click={callback} class="p-0 bg-berry-600 w-[60px] min-w-[60px] h-full rounded-r-xl flex items-center justify-center shadow" >
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z"/></svg>
    </button>
    -->
  </div>
  <div class="hljs"></div>
</form>

<style>
  pre code.hljs {
    background-color: transparent !important;
  }

  input {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  }
  input::selection {
    color: transparent;
    background-color: #92c2f1;
  }

  .sql-builder {
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  .sql-builder > div {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  select, input[type="number"] {
    width: 100%;
    padding: 5px;
  }


  .query-result {
    margin-top: 20px;
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
  }

  select {
    border: grey 2px solid;
  }
</style>

<div class="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg max-h-[500px] overflow-y-auto border"
style="margin-top: -56px"
>
  <h3 class="text-sm font-medium text-gray-500 mb-4">Use this query builder, or type the command yourself above.</h3>
  <div class="space-y-4">
    <div>
      <label for="table-select" class="block text-sm font-medium text-gray-700 mb-1">Which Table?</label>
      <select
        id="table-select"
        bind:value={selectedTable}
        on:change={handleTableSelect}
        class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
      >
        {#each tables as table}
          <option value={table.name}>{table.name}</option>
        {/each}
      </select>
    </div>

    {#if columns.length > 0}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Which Columns?</label>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {#each columns as column}
            <label class="inline-flex items-center">
              <input type="checkbox" bind:group={selectedColumns} value={column.name} class="rounded border-gray-300 text-berry-600 shadow-sm focus:border-berry-300 focus:ring focus:ring-berry-200 focus:ring-opacity-50">
              <span class="ml-2 text-sm">{column.name}</span>
            </label>
          {/each}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Conditions:</label>
        {#each whereConditions as condition, index}

          <div class="flex items-center space-x-2 mb-2">
            <select
              bind:value={condition.column}
              class="block w-1/4 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
            >
              <option value="">Column</option>
              {#each columns as column}
                <option value={column.name}>{column.name}</option>
              {/each}
            </select>
            <select
              bind:value={condition.operator}
              class="block w-1/5 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
            >
              <option value="">Operator</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&ge;</option>
              <option value="<=">&le;</option>
              <option value="==">==</option>
              <option value="!=">!=</option>
            </select>
            <input
              type="text"
              bind:value={condition.value}
              placeholder="Value"
              class="block w-1/4 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-berry-500 focus:border-berry-500"
            >
            <button on:click={() => removeWhereCondition(index)} class="text-sm bg-berry-500 rounded-full text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-6 h-6 flex items-center justify-center">
              x
            </button>
          </div>
          {#if index < whereConditions.length - 1}
          <select
            bind:value={condition.connector}
            class="block w-1/6 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        {/if}
  
        {/each}
        <div class="flex items-center space-x-2 mt-2">
          <button on:click={addWhereCondition} class="text-sm bg-berry-500 rounded-full text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-6 h-6 flex items-center justify-center">
            +
          </button>
        </div>
      </div>
      <div class="flex space-x-4">
        <div class="w-1/2">
          <label for="order-by" class="block text-sm font-medium text-gray-700 mb-1">Order by:</label>
          <div class="flex items-center space-x-2">
            <select
              id="order-by"
              bind:value={orderByColumn}
              class="block w-2/3 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
            >
              <option value="">None</option>
              {#each columns as column}
                <option value={column.name}>{column.name}</option>
              {/each}
            </select>
            <select
              bind:value={orderDirection}
              class="block w-1/3 pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-berry-500 focus:border-berry-500 rounded-md"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>

        <div class="w-1/2">
          <label for="limit" class="block text-sm font-medium text-gray-700 mb-1">LIMIT:</label>
          <input
            id="limit"
            type="number"
            bind:value={limit}
            min="1"
            class="block w-full px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-berry-500 focus:border-berry-500"
          >
        </div>
      </div>

    {/if}
  </div>
</div>