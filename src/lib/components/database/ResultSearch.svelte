<script lang="ts">
    import { rows, filteredRows, hidden } from '$lib/stores';
    let query = '';

</script>

<input type="text" class="w-full px-2 h-2border border-gray-300 rounded-md" placeholder="Search results" bind:value={query} on:input={() => {
    try {
        filteredRows.set($rows.map(row => {
                const newRow = {...row};
                $hidden.forEach(key => {
                    delete newRow[key];
                });
                return newRow;
            }).filter((row) => {
            return Object.values(row).some((value) => {
                return (value) && (value).toString().toLowerCase().includes(query.toLowerCase());
            });
        }));
    } catch (e) {
        console.error(e);
    }
}}>
