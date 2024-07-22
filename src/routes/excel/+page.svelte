<script>
    import { onMount } from 'svelte';
  
    let isLoading = true;
  
    onMount(() => {
      const iframe = document.querySelector('iframe');
      iframe.onload = () => {
        isLoading = false;
      };
    });
  </script>
  
<div style="position: relative; transform: translateY(-1rem)">
{#if isLoading}
<div class="loading-indicator">
Loading spreadsheet...
</div>
{/if}
</div>
  <iframe
    width="100%"
    height="100%"
    frameborder="0"
    scrolling="no"
    loading="lazy"
    src="https://cwberry2-my.sharepoint.com/personal/j_white_cwberry_com/_layouts/15/Doc.aspx?sourcedoc=1945dcf4-1a4a-4a39-b259-32850945082c&action=embedview&wdAutoSave=1&AllowTyping=True&ActiveCell='products'!B2&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True&wdInConfigurator=True"
  ></iframe>
  
  <style>
    .loading-indicator {
      position: absolute;
      top: 0;
      left: 0;
      font-size: 1.2em;
      font-weight: bold;
    }
  </style>