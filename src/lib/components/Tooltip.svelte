<script lang="ts">
    export let content: string;
    export let x: number;
    export let y: number;

    let tooltip: HTMLDivElement;
    $: {
        if (tooltip) {
            tooltip.innerHTML = content || "";
        }
    }
  </script>
  
  {#if content}
  <div bind:this={tooltip}
  class="absolute z-50 bg-white border border-gray-200 rounded-xl p-2 shadow-lg max-w-xs pointer-events-none"
    style="left: {x}px; top: {y - 10}px;"
  >
  </div>
  {/if}
