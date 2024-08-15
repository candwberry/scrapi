<script lang='ts'>
    export let show: boolean = true;
    export let callback: () => void;
    let name: string = '';
    let freqNum: number = 24;
    let freqUnit: string = 'Hours';
    let brefs: string = '';

    function timeAndUnitToEpoch(time: number, unit: string) {
        time *= 1000; // Seconds to milliseconds.
        switch (unit) {
            case 'Minutes':
                return time * 60;
            case 'Hours':
                return time * 60 * 60;
            case 'Days':
                return time * 60 * 60 * 24;
            default:
                return time;
        }
    }

    async function uploadBatch() {
        // take the b-refs from the textarea, and split them by \n then join by ,
        const batch = brefs.split('\n').join(',').replaceAll(' ', ''); // This feels nicer than using .replaceAll idk why.
        await fetch ('/api/db/batch', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                frequency: timeAndUnitToEpoch(freqNum, freqUnit),
                batch
            })
        })

        callback();
    };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="fixed inset-0 z-50 bg-black/50" class:hidden={!show} on:click={(e) => {
	if (e.target === e.currentTarget) show = false;
}}>
	<div
		class="fixed left-1/2 top-1/2 z-50 gap-4 flex justify-center flex-col -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-6 py-4 shadow-lg"
	>
		<div class="flex flex-row justify-between items-center">
			<h2 class="m-0 mr-2 text-lg font-medium text-black">New Batch</h2>
			<button
				class="text-black hover:text-berry-600"
				aria-label="Close"
				on:click={() => (show = false)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
        <input bind:value={name} type='text' placeholder='Batch Name' class='w-full border rounded p-2 ' />
        <textarea class='w-full border rounded p-2 h-48' placeholder='B-refs (one on each line)' bind:value={brefs}
        ></textarea>
        <div class='flex flex-row gap-2 items-center justify-center'>
            <p>Run every:</p>
            <input type='number' min='1' class='w-12 px-1 text-sm border rounded' bind:value={freqNum} />
            <select class='border rounded px-1' on:change={(e) => freqUnit = e.target?.value || 'Hours'}>
                <option selected>Minutes</option>
                <option selected>Hours</option>
                <option>Days</option>
            </select>
        </div>

		<button
		class="px-4 mt-2 py-2 text-berry-600 bg-berry-100 rounded-md hover:bg-berry-200"
		on:click={uploadBatch}
	>
		Create
	</button>
	</div>
</div>