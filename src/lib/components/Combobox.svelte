<script lang="ts">
    import {
      createCombobox,
      melt,
      type ComboboxOptionProps,
    } from '@melt-ui/svelte';
    import Check from "lucide-svelte/icons/check";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import ChevronUp from "lucide-svelte/icons/chevron-up";
    import { fly } from 'svelte/transition';

    type Manga = {
      author: string;
      title: string;
      disabled: boolean;
    };
  
    let mangas: Manga[] = [
      {
          author: 'www.ebay.co.uk',
          title: 'ebay',
          disabled: false,
      },
      {
        author: 'www.amazon.co.uk',
        title: 'amazon',
        disabled: false,
      },
      {
        author: 'www.google.com',
        title: 'google',
        disabled: false,
      }
    ];
  
    const toOption = (manga: Manga): ComboboxOptionProps<Manga> => ({
      value: manga,
      label: manga.title,
      disabled: manga.disabled,
    });
  
    const {
      elements: { menu, input, option, label },
      states: { open, inputValue, touchedInput, selected },
      helpers: { isSelected },
    } = createCombobox<Manga>({
      forceVisible: true,
      defaultSelected: toOption(mangas[0]),
    });
  
    $: if (!$open) {
      $inputValue = $selected?.label ?? '';
    }
  
    $: filteredMangas = $touchedInput
      ? mangas.filter(({ title, author }) => {
          const normalizedInput = $inputValue.toLowerCase();
          return (
            title.toLowerCase().includes(normalizedInput) ||
            author.toLowerCase().includes(normalizedInput)
          );
        })
      : mangas;

    import { mode } from '$lib/stores';
    $: mode.set($inputValue.toLowerCase());
    // make sure inputValue also updates when mode changes
    // this looks like it would infinite loop but I assume svelte catches this on purpose?
    // i hope thats a correct assumption LOl.
    
    $: $inputValue = $mode;
    $: console.log($inputValue);

  </script>
  
  <div class="flex flex-col ">
    <!-- svelte-ignore a11y-label-has-associated-control - $label contains the 'for' attribute -->
    <label use:melt={$label}>
      <span class="text-sm font-medium text-berry-900"
        ></span
      >
    </label>
  
    <div class="relative">
      <input
        use:melt={$input}
        class="flex h-10 items-center justify-between rounded-lg bg-white
            px-3 pr-12 text-black w-full"
        style="outline: 2px solid black;"
        placeholder="eBay, Amazon, Google..."
      />
      <div class="absolute right-2 top-1/2 z-[999] -translate-y-1/2 text-berry-900">
        {#if $open}
          <ChevronUp class="size-4" />
        {:else}
          <ChevronDown class="size-4" />
        {/if}
      </div>
    </div>
  </div>
  {#if $open}
    <ul
      class="z-[999] flex max-h-[300px] flex-col w-full overflow-hidden rounded-lg"
      use:melt={$menu}
      transition:fly={{ duration: 150, y: -5 }}
    >
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        class="flex max-h-full z-50 w-full flex-col gap-0 overflow-y-auto bg-white px-2 py-2 text-black"
        tabindex="0"
      >
        {#each filteredMangas as manga, index (index)}
          <li
            use:melt={$option(toOption(manga))}
            class="relative cursor-pointer scroll-my-2 rounded-md py-2 pl-4 pr-4
          hover:bg-berry-100
          data-[highlighted]:bg-berry-200 data-[highlighted]:text-berry-900
            data-[disabled]:opacity-50"
          >
            {#if $isSelected(manga)}
              <div class="check absolute left-2 top-1/2 z-10 text-berry-900">
                <Check class="size-4" />
              </div>
            {/if}
            <div class="pl-4">
              <span class="font-medium">{manga.title}</span>
              <span class="block text-sm opacity-75">{manga.author}</span>
            </div>
          </li>
        {:else}
          <li class="relative cursor-pointer rounded-md py-1 pl-8 pr-4">
            No results found
          </li>
        {/each}
      </div>
    </ul>
  {/if}
  
  <style lang="postcss">
    .check {
      @apply absolute left-2 top-1/2 text-berry-500;
      translate: 0 calc(-50% + 1px);
    }

    /* make sure everything is ON TOP */
    * {
      @apply z-10;
    }
  </style>
  
  