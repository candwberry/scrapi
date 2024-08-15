<script lang='ts'>
    let waiting = false;
    let brefs: string = '';
    import { rows } from '$lib/stores';

    async function startBatch() {
        try {
            waiting = true;
            const resp = await fetch(`/api/db/batch`, {
                method: "POST",
                body: JSON.stringify({ batch: brefs.split('\n').map((bref: string) => bref.trim()).join(',') }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const body = await resp.json();
            rows.set([...body.google, ...body.amazon, ...body.ebay]);
            
        } catch (error) {
            console.error("Error starting batch:", error);
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
                <h2 class="font-bold text-lg capitalize">Batch</h2>
            </div>
            <div class="flex items-center gap-2">
                <button class="bg-[#f9f3ed] text-[#27c840] font-bold px-2 py-1 rounded-lg text-sm" on:click={startBatch}>Launch</button>
            </div>
        </div>
        <div class="flex items-center gap-2 mt-2">
            <div class="flex flex-col gap-1 w-full">
                <textarea class='w-full border rounded p-2 h-16' placeholder='B-refs (one on each line)' bind:value={brefs} />
            </div>
        </div>
    </div>
</div>