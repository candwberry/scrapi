<script lang='ts'>
    export let show: boolean = true;
    let brefs: string = '';

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-50 bg-black/50" class:hidden={!show} on:click={(e) => {
	if (e.target === e.currentTarget) show = false;
}}>
	<div
        on:click={(e) => {if (e.target === e.currentTarget) show = false;}}
		class="fixed left-1/2 top-1/2 z-50 gap-4 flex justify-center flex-col -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg"
	>
    <textarea class='w-full border rounded p-2 h-48' placeholder='B-refs (one on each line)' bind:value={brefs} />
    </div>
</div>