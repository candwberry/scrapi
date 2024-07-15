
<script lang="ts">
  import "../app.css";
  import { createTreeView } from '@melt-ui/svelte';
  import { setContext } from 'svelte';

  import type { TreeItem } from '$lib/components/Sidebar.svelte';
  import Tree from '$lib/components/Sidebar.svelte';

  const ctx = createTreeView({
    defaultExpanded: ['lib-0', 'tree-0'],
  });
  setContext('tree', ctx);

  const {
    elements: { tree },
  } = ctx;

  const treeItems: TreeItem[] = [
    { title: 'Dashboard', icon: 'home' },
    { title: 'Schedule', icon: 'schedule' },
    {
      title: 'Datasets',
      icon: 'folder',
      children: [
        {
          title: 'dataset1',
          icon: 'database',
        },
      ],
    },
    {
      title: 'Shell',
      icon: 'terminal',
    },
    {
      title: 'Settings',
      icon: 'settings',
    },
  ];
</script>

<div class="flex h-full w-full flex-row">
  <div
    class="flex h-full w-[15rem] max-w-[15rem] min-w-[15rem] flex-col rounded-r-xl bg-white text-neutral-900 justify-between"
  >    
    <div class="flex flex-col gap-1 px-4 pt-4">
      <img src="/berry.png" class="h-75 w-auto mb-8" alt="berry logo"/>
      <h3 class="text-lg font-bold">Price Scraper</h3>
      <hr />
      <ul class="overflow-auto px-4 pb-4 pt-2" {...$tree}>
        <Tree {treeItems} />
      </ul>
    </div>
    <div class="flex flex-col gap-1 px-4 pb-4">
      Version: 0.0.1
    </div>
  </div>
  <main class="w-full h-[full-8] m-8 p-8 bg-white flex rounded-xl flex flex-col gap-4">
    <slot/>
  </main>
</div>
