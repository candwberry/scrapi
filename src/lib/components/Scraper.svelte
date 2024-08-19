<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { rows } from "$lib/stores";
    import VirtualList from "svelte-tiny-virtual-list";

    export let name = "ebay";
    export let details = writable({
        status: false,
        total: 0,
        processed: 0,
        logs: [],
        limit: 0,
        remaining: 0,
        estimatedTime: "0s",
    });

    let waiting = false;
    let progress = 0;
    let intervalId: Timer | undefined;
    let showLogs = false;

    $: progress =
        $details.total > 0 ? ($details.processed / $details.total) * 100 : 0;

    async function checkBatch() {
        try {
            const resp = await fetch(`/api/${name}?batch=check`);
            if (resp.ok) {
                const data = await resp.json();

                details.update((currentDetails) => ({
                    ...currentDetails,
                    status: data.isBatchProcessingCopy.status,
                    total: data.isBatchProcessingCopy.total,
                    processed: data.isBatchProcessingCopy.processed,
                    limit: data.isBatchProcessingCopy.limit,
                    remaining: data.isBatchProcessingCopy.remaining,
                    estimatedTime: data.isBatchProcessingCopy.estimatedTime,
                    logs: [
                        ...currentDetails.logs,
                        ...data.isBatchProcessingCopy.logs,
                    ],
                }));

                if (data.isBatchProcessingCopy.status) {
                    waiting = false;
                }
            }
        } catch (error) {
            console.error("Error checking batch:", error);
        }

        setTimeout(checkBatch, 500);
    }

    function startBatch() {
        try {
            waiting = true;
            fetch(`/api/${name}`, {
                method: "POST",
                body: JSON.stringify({}),
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((resp) => {
                    if (resp.ok) {
                        return resp.json();
                    }
                    throw new Error("Network response was not ok.");
                })
                .then((body) => {
                    rows.set(body);
                })
                .catch((error) => {
                    console.error(
                        "There was a problem with the fetch operation:",
                        error,
                    );
                });
        } catch (error) {
            console.error("Error starting batch:", error);
        } finally {
            waiting = false;
        }
    }

    async function stopBatch() {
        try {
            waiting = true;
            const resp = await fetch(`/api/${name}?batch=stop`);
            if (resp.ok) {
                const data = await resp.json();
            }
        } catch (error) {
            console.error("Error stopping batch:", error);
        } finally {
            waiting = false;
        }
    }

    onMount(async () => {
        await checkBatch();
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    function formatTimestamp(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
</script>

<div class="bg-white flex flex-col rounded-xl h-full w-full p-2">
    <div class="flex flex-col h-full">
        <div class="flex items-center justify-between">
            <div class="flex flex-row items-center gap-2">
                <div
                    class={`w-3 h-3 rounded-full text-xs ${waiting ? "bg-[#febb2e]" : !$details.status ? "bg-[#fe5c54]" : "bg-[#27c840]"}`}
                ></div>
                <h2 class="font-bold text-lg capitalize">{name}</h2>
                {#if $details.remaining !== undefined && $details.limit !== undefined}
                    <div class="text-xs ml-4">
                        ({$details.remaining} / {$details.limit}) calls
                    </div>
                {/if}
            </div>
            <div class="flex items-center gap-2">
                {#if waiting}
                    <button
                        class="bg-[#f9f3ed] text-[#febb2e] font-bold px-2 py-1 rounded-lg text-sm"
                        disabled>Waiting</button
                    >
                {:else if !$details.status}
                    <button
                        class="bg-[#f9f3ed] text-[#27c840] font-bold px-2 py-1 rounded-lg text-sm"
                        on:click={startBatch}>Run All</button
                    >
                {:else}
                    <button
                        class="bg-[#f9f3ed] text-[#fe5c54] font-bold px-2 py-1 rounded-lg text-sm"
                        on:click={stopBatch}>Stop</button
                    >
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-2">
            <div class="flex flex-col gap-1">
                <div class="text-xs">
                    This Batch: {$details.processed} / {$details.total}, ({progress}%)
                </div>
                <div class="text-xs">EST: {$details.estimatedTime}</div>
            </div>
        </div>
        <div class="flex items-center justify-between h-full">
            <div class="flex flex-row items-center gap-2">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="text-xs"
                    on:click={() => {
                        // show div with all logs
                    }}
                >
                    Log: {$details.logs.length > 0
                        ? $details.logs[
                              $details.logs.length - 1
                          ].info.substring(0, 30)
                        : "no logs"}
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button
                    class="bg-[#f9f3ed] text-[#000] font-bold px-2 py-1 rounded-lg text-xs"
                    on:click={() => (showLogs = !showLogs)}
                >
                    Logs ({$details.logs.length})
                </button>
            </div>
        </div>
    </div>
</div>

{#if showLogs}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        on:click={(e) => e.target === e.currentTarget && (showLogs = false)}
        on:keydown={(e) => e.key === "Escape" && (showLogs = false)}
        role="dialog"
        aria-modal="true"
        tabIndex="-1"
    >
        <div
            class="bg-white rounded-xl p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">Logs</h3>
                <button
                    class="text-gray-500 hover:text-gray-700"
                    on:click={() => (showLogs = false)}
                >
                    &times;
                </button>
            </div>
            {#if $details.logs.length > 0}
                <VirtualList
                    width="100%"
                    height={400}
                    itemCount={$details.logs.length}
                    itemSize={60}
                >
                    <div slot="item" let:index let:style {style}>
                        <div class="border-b pb-2">
                            <span class="text-xs text-gray-500"
                                >{$details.logs[index].error || "Info"}</span
                            >
                            <p class="text-sm">{$details.logs[index].info}</p>
                        </div>
                    </div>
                </VirtualList>
            {:else}
                <p class="text-sm text-gray-500">No logs available.</p>
            {/if}
        </div>
    </div>
{/if}
