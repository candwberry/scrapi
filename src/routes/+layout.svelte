<script>
    import "../app.css";
    import Sidebar from "$lib/components/Sidebar.svelte";
</script>

<Sidebar/>
<main class="p-8 w-full h-full">
    <slot/>
</main>