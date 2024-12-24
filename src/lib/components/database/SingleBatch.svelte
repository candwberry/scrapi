<script lang='ts'>
    let waiting = false;
    let brefs: string = '';
    import { rows } from '$lib/stores';

    async function startBatch() {
        try {
            if (Notification.permission !== 'granted') {
                await Notification.requestPermission();
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
        }

        try {
            if (brefs.trim().length === 0) {
                // get all from /api/db/products
                const resp = await fetch(`/api/db/products`);
                if (resp.ok) {
                    const data = await resp.json();
                    console.log("BatchBatch data:", data);
                    brefs = data.map((product: any) => product.berry).join('\n');
                }
            }
            
            waiting = true;
            const resp = await fetch(`/api/db/batch`, {
                method: "POST",
                body: JSON.stringify({ batch: brefs.split('\n').map((bref: string) => bref.trim()).join(',') }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const body = await resp.json();
            console.log("BatchBatch body:", body);

            rows.set([Array.isArray(body.google) ? body.google : [], Array.isArray(body.amazon) ? body.amazon : [], Array.isArray(body.ebay) ? body.ebay : [], Array.isArray(body.manomano) ? body.manomano : []].flat());
            
        } catch (error) {
            console.error("Error starting batch:", error);
        } finally {
            waiting = false;
        }

        try{
            if (Notification.permission === 'granted') {
                new Notification('Batch completed', {
                    body: 'Your batch has been completed.',
                    icon: '/favicon.ico'
                });
            }
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    }

    async function exportBatch() {
    try {
        waiting = true;
        const berryList = brefs.split('\n').map((bref: string) => bref.trim());
        
        const response = await fetch('/api/db/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'batch',
                array: berryList
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition && contentDisposition.match(/filename="?(.+)"?/i);
        const filename = filenameMatch ? filenameMatch[1] : 'export.csv';

        // Create a blob from the response
        const blob = await response.blob();

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger the download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error("Error exporting batch:", error);
        // You might want to show an error message to the user here
    } finally {
        waiting = false;
    }
}
</script>

<div class="bg-white rounded-xl w-full w-full p-2">
    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <div class="flex flex-row items-center gap-2">
                <div class={`w-3 h-3 rounded-full text-xs ${waiting ? 'bg-[#febb2e]' : (!waiting ? 'bg-[#fe5c54]' : 'bg-[#27c840]')}`}></div>
                <h2 class="font-bold text-lg capitalize">one time batch</h2>
            </div>
            <div class="flex items-center gap-2">
                <button class="bg-[#f9f3ed] text-[#000] font-bold px-2 py-1 rounded-lg text-sm" on:click={exportBatch}>Export</button>
                {#if !waiting}
                <button class="bg-[#f9f3ed] text-[#27c840] font-bold px-2 py-1 rounded-lg text-sm" on:click={startBatch}>Launch</button>
                {:else}
                <button class="bg-[#f9f3ed] text-[#febb2e] font-bold px-2 py-1 rounded-lg text-sm" disabled>Waiting</button>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-2 mt-2">
            <div class="flex flex-col gap-1 w-full">
                <textarea class='w-full border rounded p-2 h-16' placeholder='B-refs (one on each line)' bind:value={brefs} />
            </div>
        </div>
    </div>
</div>