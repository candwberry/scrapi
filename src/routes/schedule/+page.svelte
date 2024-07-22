<script>
    import { createScrollArea, melt } from '@melt-ui/svelte';
    import { writable } from "svelte/store";
    import Input from "$lib/components/Input.svelte";
    import Select from "$lib/components/Select.svelte";
    import Switch from "$lib/components/Switch.svelte";
    import Combobox from "$lib/components/Combobox.svelte";
    import { mode } from '$lib/stores';
  
    const {
      elements: { root, viewport, content, scrollbarY, thumbY },
    } = createScrollArea({
      type: 'hover',
      dir: 'ltr',
    });
  
    let schedules = writable([
      { time: '09:00', productFile: 'electronics.csv', mode: 'amazon' },
      { time: '14:00', productFile: 'homegoods.csv', mode: 'ebay' },
      { time: '20:00', productFile: 'fashion.csv', mode: 'amazon' },
    ]);
  
    let newSchedule = { time: '', productFile: '', mode: $mode };
  
    // This would be populated from your server
    let availableProductFiles = [
      'electronics.csv',
      'homegoods.csv',
      'fashion.csv',
      'toys.csv',
      'books.csv'
    ];
  
    function addSchedule() {
      if (newSchedule.time && newSchedule.productFile && newSchedule.mode) {
        schedules.update(s => [...s, newSchedule]);
        newSchedule = { time: '', productFile: '', mode: $mode };
      }
    }
  
    function removeSchedule(index) {
      schedules.update(s => s.filter((_, i) => i !== index));
    }
  </script>
  
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Scraper Scheduler</h1>
  
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-black/10 rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-2">Add New Schedule</h2>
        <div class="flex flex-col gap-2">
          <Input name="time" type="time" bind:value={newSchedule.time} placeholder="Time" />
          <Select 
            options={availableProductFiles} 
            bind:value={newSchedule.productFile} 
            placeholder="Select Product File"
          />
          <Combobox bind:value={newSchedule.mode} />
          <button on:click={addSchedule} class="bg-berry-600 text-white p-2 rounded-lg">Add Schedule</button>
        </div>
      </div>
  
      <div 
        use:melt={$root}
        class="bg-black/10 rounded-lg p-4 h-[400px] overflow-hidden"
      >
        <h2 class="text-xl font-semibold mb-2">Scheduled Runs</h2>
        <div use:melt={$viewport} class="h-full w-full rounded-[inherit]">
          <div use:melt={$content}>
            {#each $schedules as schedule, index}
              <div class="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <span class="font-semibold">{schedule.time}</span> - 
                  <span>{schedule.productFile}</span> 
                  <span class="text-sm text-gray-600">({schedule.mode})</span>
                </div>
                <button 
                  on:click={() => removeSchedule(index)}
                  class="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>
        </div>
        <div use:melt={$scrollbarY} class="flex w-2.5 touch-none select-none border-l border-l-transparent bg-berry-800/10 p-px transition-colors">
          <div use:melt={$thumbY} class="relative flex-1 rounded-full bg-berry-600" />
        </div>
      </div>
    </div>
  </div>