<script lang="ts">
  import { createLabel, melt } from '@melt-ui/svelte';

  export let name = "label";
  export let label = "Label";
  export let placeholder = "placeholder";
  const {
    elements: { root },
  } = createLabel();
</script>

<form>
  <div class="flex flex-col items-start justify-center">
    <input
      type="text"
      id={name}
      class="h-10 w-[240px] rounded-md bg-white px-3 py-2 text-berry-700"
      placeholder="Search"
    />
  </div>
</form>