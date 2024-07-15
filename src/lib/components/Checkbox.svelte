<script lang="ts">
  import { createCheckbox, melt } from '@melt-ui/svelte';
  import Check from "lucide-svelte/icons/Check";
  import Minus from "lucide-svelte/icons/Minus";

  const {
    elements: { root, input },
    helpers: { isChecked, isIndeterminate },
  } = createCheckbox({
    defaultChecked: undefined, // no indeterminate state
  });
</script>

<form>
  <div class="flex items-center justify-center">
    <button
      use:melt={$root}
      class="flex size-7 appearance-none items-center justify-center
            rounded-lg bg-white text-magnum-600 shadow hover:opacity-75"
      id="checkbox"
    >
      {#if $isIndeterminate}
        <Minus class="size-5" color="#009845" />
      {:else if $isChecked}
        <Check class="size-5" color="#009845" />
      {/if}
      <input use:melt={$input} />
    </button>
    <label class="pl-4 font-medium text-magnum-900" for="checkbox">
      {#if $isChecked}
        Checked
      {:else}
        Unchecked
      {/if}
    </label>
  </div>
</form>