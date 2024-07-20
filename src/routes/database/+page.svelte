<script>
    let query = '';
    let results = null;
    let loading = false;
    let error = null;
  
    async function executeQuery() {
      loading = true;
      error = null;
      try {
        const response = await fetch(`/api/db?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        results = await response.json();
      } catch (err) {
        error = err.message;
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Database Query</h1>
    
    <div class="mb-4">
      <textarea
        bind:value={query}
        class="w-full p-2 border border-gray-300 rounded"
        rows="4"
        placeholder="Enter your SQL query here..."
      ></textarea>
    </div>
    
    <button
      on:click={executeQuery}
      class="bg-berry-600 hover:bg-berry-700 text-white font-bold py-2 px-4 rounded transition-colors"
      disabled={loading}
    >
      {loading ? 'Executing...' : 'Execute Query'}
    </button>
    
    {#if error}
      <div class="mt-4 p-4 bg-red-100 text-red-700 rounded">
        Error: {error}
      </div>
    {/if}
    
    {#if results}
      <div class="mt-4">
        <h2 class="text-xl font-semibold mb-2">Results:</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                {#each Object.keys(results[0] || {}) as header}
                  <th class="py-2 px-4 border-b">{header}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each results as row}
                <tr>
                  {#each Object.values(row) as cell}
                    <td class="py-2 px-4 border-b">{cell}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>