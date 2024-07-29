<script>
    import { onMount } from 'svelte';
    import { flip } from 'svelte/animate';
  
    let productFields = [];
    let draggedItem;
  
    onMount(async () => {
      productFields = await getProductFields();
    });
  
    function dragStart(event, index) {
      draggedItem = index;
      event.dataTransfer.effectAllowed = 'move';
    }
  
    function dragOver(event, index) {
      event.preventDefault();
      if (index !== draggedItem) {
        const newFields = [...productFields];
        const [reorderedItem] = newFields.splice(draggedItem, 1);
        newFields.splice(index, 0, reorderedItem);
        productFields = newFields;
        draggedItem = index;
      }
    }
  </script>
  
  <div class="bg-blue-600/10 rounded-xl w-full flex flex-col p-4 mt-4 gap-4">
    <h3 class="font-bold">Query Priority</h3>
    <ul class="w-full">
      {#each productFields as field, index (field)}
        <li 
          animate:flip={{ duration: 300 }}
          draggable={true}
          on:dragstart={(event) => dragStart(event, index)}
          on:dragover={(event) => dragOver(event, index)}
          class="bg-white shadow rounded-lg p-2 mb-2 cursor-move"
        >
          {field}
        </li>
      {/each}
    </ul>
  </div>
  
  