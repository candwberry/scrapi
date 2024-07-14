<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { ws } from "$lib/websocket";
  
    let status:
      | "connecting"
      | "connected"
      | "disconnected"
      | "socket broken, retrying" = "disconnected";
    let selectedFileName: string = "Open file";
    let currentProduct: string[][] = [];
    let progressPercent: number = 0;
    let requestBody: string = '';
    let responseBody: string = '';
    let currentProductJSON = {
      "SELECT:": "A PRODUCT FILE",
      "ABOVE": "TO SEE DETAILS",
    };
    let mode: "ebay" | "amazon" | "google" = "ebay";
    let productIndex = 1;
    let totalRequests = 0;
    let totalRequestTime = 0;
    let averageRequestTime = 0;
  
    $: progressPercent = (productIndex / (currentProduct.length === 0 ? 1 : currentProduct.length)) * 100;
  
    function prettyPrintJSON(obj: any): string {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          return Object.fromEntries(
            Object.entries(value)
          );
        }
        return value
      }, 2).replace("{\n", "").replace("}", "");
    }
  
    function csvToJSON(csv: string[]) {
      const [sku, description, supplierCode, barcode] = csv.slice(0, 4).map((field) => field.trim());
      return {
        berrySKU: sku,
        description,
        supplierCode,
        barcode
      };
    }
  
    onMount(() => {
      if (ws) {
        ws.onopen = () => {
          status = "connected";
        };
  
        ws.onclose = () => {
          status = "disconnected";
        };
  
        ws.onmessage = (message) => {
          const data = JSON.parse(message.data);
          const resp = JSON.parse(data.data);
          responseBody = prettyPrintJSON(resp);
        };
      }
    });
  
    function getAReasonableTimeEstimate(productIndex: number) {
      let time = ((currentProduct.length - productIndex) * averageRequestTime / 1000);
      let unit = "s";
      if (time > 60 * 10) {
        unit = "m";
        time /= 60;
        if (time > 60 * 10) {
          unit = "h";
          time /= 60;
          if (time > 24 * 10) {
            unit = "d";
            time /= 24;
          }
        }
      }
      return `${time.toFixed(2)}${unit}`;
    }
  
    onDestroy(() => {
      if (ws) ws.close();
    });
  
    function handleFileSelect(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        selectedFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const rows = content.split("\n").map((row) => row.split(","));
          currentProduct = rows;
          currentProductJSON = csvToJSON(rows[1]);
        };
        reader.readAsText(file);
      }
    }
  
    async function sendEbay(query: string="") {
      if (ws) {
        const startTime = Date.now();
        if (query === "") query = currentProduct[productIndex][3].trim().replace(/\s+/g, " ");
        const request = { type: "ebay", data: query };
        ws.send(JSON.stringify(request));
        requestBody = prettyPrintJSON(request);
  
        // Assuming a message response contains the end of the request
        ws.onmessage = (message) => {
          const data = JSON.parse(message.data);
          const resp = JSON.parse(data.data);
          responseBody = prettyPrintJSON(resp);
          
          const endTime = Date.now();
          const requestTime = endTime - startTime;
          totalRequests++;
          totalRequestTime += requestTime;
          averageRequestTime = totalRequestTime / totalRequests;
        };
      }
    }
  
    async function startEbay() {
        for (let i = productIndex; i < currentProduct.length; i++) {
            await sendEbay();
            productIndex = i;
            currentProductJSON = csvToJSON(currentProduct[i]);
            await new Promise((resolve) => setTimeout(resolve, 100));

        }
    }
  
    function selectMode(newMode: "ebay" | "amazon" | "google") {
      mode = newMode;
    }

    let limit = 10;
    let queryInput = '';
  </script>
  
  <main>
    <div class="title">
      <img src="/berry.png" alt="Berry logo" width="143px" />
      <h1>Price Scraper</h1>
      <div class="status-container">
        <div
          id="status"
          class:connected={status === "connected"}
          class:disconnected={status === "disconnected"}
        ></div>
        {status}
      </div>
    </div>
  
    <div style="display: flex; flex-direction: row; align-items: center; justify-content; center;">
      <div class="progress-bar">
        <div class="progress" style="width: {progressPercent}%"></div>
      </div>
      <div class="progress-info">
        <div style="min-width: 125px">({currentProduct.length === 0 ? 0 : productIndex}/{currentProduct.length})</div>
        <div style="min-width: 125px">EST: {getAReasonableTimeEstimate((currentProduct.length == 0) ? productIndex : (productIndex + 1) - 1)}</div>
      </div>
    </div>
  
    <div class="script-buttons">
      <div class="file-selector">
        <label for="file-upload">
          <img src="/csv.png" alt="CSV icon" width="32px" height="32px" />
          <span>{selectedFileName}</span>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          on:change={handleFileSelect}
        />
      </div>
      <div class="mode-selector">
        <div class="mode-options">
          <div class="mode google" class:selected={mode === 'google'} on:click={() => selectMode('google')}>
            <img src="/google.png" alt="Google logo" width="32" height="32" />
            <span class="mode-name">Google</span>
          </div>
          <div class="mode amazon" class:selected={mode === 'amazon'} on:click={() => selectMode('amazon')}>
            <img src="/amazon.png" alt="Amazon logo" width="32" height="32" />
            <span class="mode-name">Amazon</span>
          </div>
          <div class="mode ebay" class:selected={mode === 'ebay'} on:click={() => selectMode('ebay')}>
            <img src="/ebay.png" alt="eBay logo" width="32" height="32" />
            <span class="mode-name">eBay</span>
          </div>
        </div>
      </div> 
  
      <div class="search">
        <input type="text" placeholder="Search for a barcode" bind:value={queryInput} />
        <button type="button" on:click={() => sendEbay(queryInput)} disabled={(status !== "connected" || queryInput.length === 0)}
        >🔎</button>
      </div>
     
      <button on:click={startEbay} disabled={(status !== "connected" || currentProduct.length === 0)}>Start</button>
    </div>
  
    {#if mode === "ebay"}
      <div class="api-container">
        <div class="api-block product">
          <h3>Product</h3>
          <pre><code>{prettyPrintJSON(currentProductJSON)}</code></pre>
        </div>
  
        <div class="api-block request">
          <h3>Request</h3>
          <pre><code>{requestBody}</code></pre>
        </div>
        
        <div class="api-block response">
          <h3>Response</h3>
          <pre><code>{responseBody}</code></pre>
        </div>   
      </div>
    {:else}
      <p>Invalid Mode, sorry.</p>
    {/if}
  </main>
  
  <style>
    .search {
      display: flex;
      overflow: hidden;
      border-radius: 1rem;
      border: 2px solid #ccc;
    
    }
  
    .search > input {
      padding: 0.5rem;
      outline: none;
      border: none
    }
  
    .search > button {
      padding: 0.5rem;
      background-color: #f0f0f0;
      border: none;
      cursor: pointer;
    }
  
  
    .progress-info {
      display: flex;
      flex-direction: row;
      min-width: 250px;
    }
    main {
        font-family: Arial, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        color: #333;
    }
  
    .title {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  
    .title img {
      margin-right: 10px;
    }
  
    .status-container {
      display: flex;
      align-items: center;
    }
  
    .status-container #status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 10px;
    }
  
    .status-container .connected {
      background-color: green;
    }
  
    .status-container .disconnected {
      background-color: red;
    }
  
    .progress-bar {
      height: 5px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      display: inline;
      flex: 1;
      margin-right: 20px;
    }
  
    .progress-bar .progress {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s;
    }
  
    .script-buttons {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
  
    .file-selector {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
  
    .file-selector label:hover {
      text-decoration: underline;
    }
  
    .file-selector label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
  
    .file-selector img {
      margin-right: 10px;
    }
  
    .file-selector span {
      color: #555;
    }
  
    .file-selector input[type="file"] {
      display: none;
    }
  
    .api-container {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 20px auto;
    }
  
    .api-block {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
    }
  
    .api-block h3 {
      margin-top: 0;
      color: #333;
    }
  
  
    pre {
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 10px;
      overflow-x: auto;
    }
  
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
    }
  
    .product {
      border-left: 5px solid #4CAF50;
    }
  
    .request {
      border-left: 5px solid #ce6348;
    }
  
    .response {
      border-left: 5px solid #2196F3;
    }
  
    .mode-selector {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
    
      .mode-options {
        display: flex;
        gap: 0.5rem;
      }
    
      .mode {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        gap: 0.5rem;
        background-color: #fff;
        border-radius: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        max-width: 48px;
        overflow: hidden;
      }
    
      .mode.selected {
        max-width: 150px;
        background-color: var(--light-gray);
      }
    
      .mode-name {
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
    
      .mode.selected .mode-name {
        opacity: 1;
      }
  </style>