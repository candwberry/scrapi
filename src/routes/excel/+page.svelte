<script lang='ts'>
	import Window from '$lib/components/Window.svelte';
    let url = "https://cwberry2-my.sharepoint.com/personal/j_white_cwberry_com/_layouts/15/Doc.aspx?sourcedoc=1945dcf4-1a4a-4a39-b259-32850945082c&action=embedview&wdAutoSave=1&AllowTyping=True&ActiveCell='products'!B2&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True&wdInConfigurator=True";
</script>

<Window head='#2c7a4e' bg='#ffffff'>
	<h1 slot='title' class='font-bold text-white'>Excel</h1>
    <input slot='file' type='text' bind:value={url}  class='min-w-[50vw] border rounded px-2 ml-4 text-sm' />
	<iframe
		width='100%'
		height='100%'
		frameborder='0'
		scrolling='no'
		loading='lazy'
		title='Spreadsheet'
		src={url}
	></iframe>
</Window>
