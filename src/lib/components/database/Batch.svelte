<script lang='ts'>
    export let batch = {
        name: '',
        date: 0,
        last: 0,
        frequency: 0,
        batch: '',
        next: 0,
    }

    function epochToHuman(epoch: number) {
        return new Date(epoch).toLocaleDateString();
    }

    function epochSubtractEpochToHuman(epoch: number, subtract: number) {
        let distance = epoch - subtract;
        if (distance < 60) {
            return `in ${distance} seconds`;
        } else if (distance < 60 * 60) {
            return `in ${Math.floor(distance / 60)} minutes`;
        } else if (distance < 60 * 60 * 24) {
            return `in ${Math.floor(distance / 60 / 60)} hours`;
        } else {
            return `in ${Math.floor(distance / 60 / 60 / 24)} days`;
        }
    };

    async function startNow() {
        await fetch('/api/db/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(batch)
        });
    }
</script>

<div class='flex flex-col items-center justify-center gap-2 rounded-lg bg-white p-2'>
    <div class='flex flex-row w-full items-center gap-2 justify-between'>
        <div class='flex flex-row items-center gap-2'>
            <div class='w-3 h-3 rounded-full text-xs bg-[#fe5c54]'></div>
            <h3 class='font-bold'>{batch.name}</h3>
        </div>
        <div>
            <div class="flex items-center">
                <label for="switch" class="flex items-center cursor-pointer">
                    <div class="relative">
                        <input type="checkbox" id="switch" class="sr-only" />
                        <div class="block bg-[#444] w-9 h-5 rounded-full"></div>
                        <div class="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition"></div>
                    </div>
                    <div class="ml-3 text-gray-700 font-medium">{batch.next === 0 ? "Off" : "On"}</div>
                </label>
            </div>    
        </div>
    </div>
    <div class='flex flex-col items-center justify-start text-sm w-full'>
        <div class='flex flex-row gap-4 w-full justify-between'>
            <p>Made: {epochToHuman(batch.date)}</p>
            <p>Last: {epochToHuman(batch.last)}</p>
        </div>
        <div class='flex flex-row gap-4 w-full justify-between'>
            <p>Next: {epochToHuman(batch.next)}</p>
            <p class='font-bold'>{epochSubtractEpochToHuman(batch.next, batch.frequency)}</p>
        </div>
        <div class='flex flex-row w-full justify-between my-2'>
            <div class='flex flex-row gap-2 items-center'>
                <p>Freq:</p>
                <input type='number' min='1' class='w-12 px-1 text-sm border rounded' />
                <select>
                    <option>Minutes</option>
                    <option>Hours</option>
                    <option>Days</option>
                </select>
            </div>
            <button class='bg-[#f9f3ed] text-[#fe5c54] font-bold px-2 py-1 rounded-lg text-sm'>START NOW</button>
        </div>
    </div>
</div>
