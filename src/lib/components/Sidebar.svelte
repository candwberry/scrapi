<script context="module" lang="ts">
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import Folder from 'lucide-svelte/icons/folder';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import Home from 'lucide-svelte/icons/house';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import Database from 'lucide-svelte/icons/database';
  import Settings from 'lucide-svelte/icons/settings';
  import SquareTerminal from 'lucide-svelte/icons/square-terminal';
  import FileSpreadsheet from 'lucide-svelte/icons/file-spreadsheet';
  import Hammer from 'lucide-svelte/icons/hammer';
  type Icon = 'folder' |'home' | 'schedule' | 'database' | 'settings' | 'terminal' | 'excel' | 'hammer';

  export type TreeItem = {
    title: string;
    icon: Icon;

    children?: TreeItem[];
  };

  export const icons = {
    home: Home,
    folder: Folder,
    folderOpen: FolderOpen,
    highlight: ArrowLeft,
    schedule: CalendarClock,
    database: Database,
    settings: Settings,
    terminal: SquareTerminal,
    excel: FileSpreadsheet,
    hammer: Hammer,
  };
</script>

<script lang="ts">
  import { melt, type TreeView } from '@melt-ui/svelte';
  import { getContext, onMount } from 'svelte';
  import { goto } from '$app/navigation';
    import { page } from '$app/stores';

  export let treeItems: TreeItem[];
  export let level = 1;

  const {
    elements: { item, group },
    helpers: { isExpanded, isSelected },
  } = getContext<TreeView>('tree');

  onMount(() => {
    console.log($page.url.pathname);
  });
</script>

{#each treeItems as { title, icon, children }, i}
  {@const itemId = `${title}-${i}`}
  {@const hasChildren = !!children?.length}

  <li class={level !== 1 ? 'pl-4' : ''}>
    <button
      on:click={() => {
        if (!hasChildren) {
          goto(`/${title === 'Home' ? '' : title.toLowerCase()}`);
        }
      }}
      class={`flex items-center gap-1 rounded-md p-1 ${($page.url.pathname === "/" + title.toLowerCase() || ($page.url.pathname === "/" && title === 'Home')) ? 'bg-berry-200' : ''}`}
      use:melt={$item({
        id: itemId,
        hasChildren,
      })}
    >
      <!-- Add icon. -->
      {#if icon === 'folder' && hasChildren && $isExpanded(itemId)}
        <svelte:component this={icons['folderOpen']} class="h-4 w-4" />
      {:else}
        <svelte:component this={icons[icon]} class="h-4 w-4" />
      {/if}

      <span class="select-none">{title}</span>

      <!-- Selected icon. -->
      {#if ($page.url.pathname === "/" + title.toLowerCase() || ($page.url.pathname === "/" && title === 'Home'))}
        <svelte:component this={icons['highlight']} class="h-4 w-4" />
      {/if}
    </button>

    {#if children}
      <ul use:melt={$group({ id: itemId })}>
        <svelte:self treeItems={children} level={level + 1} />
      </ul>
    {/if}
  </li>
{/each}

<style>
  /* Remove docs' focus box-shadow styling. */
  li:focus {
    box-shadow: none !important;
  }
</style>