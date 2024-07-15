<script lang="ts">
  import { createSlider, melt } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';
  const value = writable([20]);

  const {
    elements: { root, range, thumbs, ticks },
  } = createSlider({
    defaultValue: [20],
    min: 1,
    step: 1,
    max: 50,
    value: value,
  });
</script>

<div class="flex flex-col gap-1 justify-center">
  <label class="block text-berry-900">Max results: {$value}</label>
  <span use:melt={$root} class="relative flex h-[20px] w-[200px] items-center ">
    <span class="h-[3px] w-full bg-black/40">
      <span use:melt={$range} class="h-[3px] bg-white" />
    </span>

    {#each $ticks as tick}
      <span
        use:melt={tick}
        class="h-[3px] w-[3px] rounded-full bg-white/50 data-[bounded]:bg-magnum-800/75"
      />
    {/each}

    <span
      use:melt={$thumbs[0]}
      class="h-5 w-5 rounded-full bg-white focus:ring-4 focus:!ring-black/40"
    />
  </span>
</div>
