<script lang="ts">
  import { createProgress, melt } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';

  export let value = writable(0);

  const {
    elements: { root },
    options: { max },
  } = createProgress({
    value,
    max: 100,
  });
</script>

<div
  use:melt={$root}
  class="relative h-6 w-full overflow-hidden rounded-[99999px] bg-black/10"
>
  <div
    class="h-full w-full bg-berry-600 transition-transform duration-[1100ms]
        ease-[cubic-bezier(0.65,0,0.35,1)]"
    style={`transform: translateX(-${
      100 - (100 * ($value ?? 0)) / ($max ?? 1)
    }%)`}
  />
</div>