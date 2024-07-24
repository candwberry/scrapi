
<script lang="ts">
  import "../app.css";
  import { createTreeView } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import type { TreeItem } from '$lib/components/Sidebar.svelte';
  import Tree from '$lib/components/Sidebar.svelte';
  import Toaster from "$lib/components/Toaster.svelte";

  const ctx = createTreeView({
    defaultExpanded: ['lib-0', 'tree-0'],
  });
  setContext('tree', ctx);

  const {
    elements: { tree },
  } = ctx;

  const treeItems: TreeItem[] = [
    { title: 'Home', icon: 'home' },
    { title: 'Database', icon: 'database' },
    {
      title: 'Tools',
      icon: 'folder',
      children: [
        { title: 'Schedule', icon: 'schedule' },
        { title: 'Excel', icon: 'excel' },
        { title: 'Shell', icon: 'terminal' },
      ],
    },
    {
      title: 'Settings',
      icon: 'settings',
    },
  ];
</script>

<Toaster />
<div class="flex h-full w-full flex-row">
  <div
    class="flex h-full w-[15rem] max-w-[15rem] min-w-[15rem] flex-col rounded-r-xl bg-white text-neutral-900 justify-between"
  >    
    <div class="flex flex-col gap-1 px-4 pt-4">
      <a href="https://www.cwberry.com">
        <img src="/berry.png" class="h-75 w-auto mb-8" alt="berry logo"/>
      </a>
      <h3 class="text-lg font-bold">Price Scraper</h3>
      <hr />
      <ul class="overflow-auto px-4 pb-4 pt-2" {...$tree}>
        <Tree {treeItems} />
      </ul>
    </div>
    <div class="flex flex-row gap-1 px-4 pb-4 justify-between">
      Version: 0.0.1 <a href="https://www.github.com/candwberry/scrapi" target="_blank" rel="noopener noreferrer"><svg width="24px" height="24px" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
    </div>
  </div>
  <main class="w-full h-[full-8] m-8 p-8 bg-white flex rounded-xl flex flex-col gap-4">
    <slot/>
  </main>
</div>
