<script lang="ts">
  import { onMount } from "svelte";
  let isLoading: boolean = true;

  onMount(() => {
    const iframe: HTMLIFrameElement = document.querySelector("iframe") as HTMLIFrameElement;
    if (iframe) iframe.onload = () => {
      isLoading = false;
    };
  });
</script>

<div class="relative -translate-y-4">
  {#if isLoading}
    <div class="absolute top-0 left-0 text-xl font-bold">Loading spreadsheet...</div>
  {/if}
</div>

<iframe
  width="100%"
  height="100%"
  frameborder="0"
  scrolling="no"
  loading="lazy"
  title="Spreadsheet"
  src="https://cwberry2-my.sharepoint.com/personal/j_white_cwberry_com/_layouts/15/Doc.aspx?sourcedoc=1945dcf4-1a4a-4a39-b259-32850945082c&action=embedview&wdAutoSave=1&AllowTyping=True&ActiveCell='products'!B2&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True&wdInConfigurator=True"
></iframe>