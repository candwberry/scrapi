<script lang="ts">
    import ArrowLeft from "$lib/assets/svgs/ArrowLeft.svelte";
    import Home from "$lib/assets/svgs/Home.svelte";
    import Folder from "$lib/assets/svgs/Folder.svelte";
    import FolderOpen from "$lib/assets/svgs/FolderOpen.svelte";
    import Terminal from "$lib/assets/svgs/Terminal.svelte";
    import Spreadsheet from "$lib/assets/svgs/Spreadsheet.svelte";
    import Browser from "$lib/assets/svgs/Browser.svelte";
    import VPN from "$lib/assets/svgs/VPN.svelte";
    let open = false;

    /*
    let items = [
        {
            name: "Home",
            icon: Home,
            href: "/",
        },
        {
            name: "Tools",
            open: true,
            children: [
                {
                    name: "Browser",
                    icon: Browser,
                    href: "/browser",
                },
                {
                    name: "Shell",
                    icon: Terminal,
                    href: "/shell",
                },

                {
                    name: "Excel",
                    icon: Spreadsheet,
                    href: "/excel",
                },
            ],
        },
    ];*/

    let items = [
        {
            name: "Home",
            icon: Home,
            href: "/",
        },
        {
            name: "Browser",
            icon: Browser,
            href: "/browser",
        },
        {
            name: "Shell",
            icon: Terminal,
            href: "/shell",
        },

        {
            name: "Excel",
            icon: Spreadsheet,
            href: "/excel",
        },
    ];
</script>

<div
    class={`relative flex flex-col p-2 gap-4 h-full border-grey border-r-2 ${open ? "w-2/12" : "w-[4%]"}`}
    style="min-width: 36px"
>
    <div>
        <img src="berry.png" class:hidden={!open} alt="berry" width="100%" />
        <img src="favicon.png" class:hidden={open} alt="berry" width="100%" />
    </div>
    <div class="flex justify-end items-center w-full absolute bottom-1/2">
        <button
            class:rotate-180={!open}
            class="p-2"
            on:click={() => (open = !open)}
        >
            <ArrowLeft fill="#fff" width="2rem" height="2rem" />
        </button>
    </div>
    <div
        class="flex flex-col justify-between h-full w-full"
        class:items-center={!open}
    >
        <div class="gap-2 flex flex-col" class:items-center={!open}>
            {#each items as item}
                {#if item.children}
                    <button
                        class="flex flex-row gap-2 items-center text-md"
                        on:click={() => (item.open = !item.open)}
                        ><svelte:component
                            this={item.open ? FolderOpen : Folder}
                            fill="#222"
                            width="2rem"
                            height="2rem"
                        />
                        {#if open}
                            {item.name}
                        {/if}</button
                    >
                    {#if item.open}
                        {#each item.children as child}
                            <a
                                class="flex flex-row gap-2 items-center text-md"
                                class:ml-4={open}
                                href={child.href}
                                ><svelte:component
                                    this={child.icon}
                                    fill="#222"
                                    width="1.5rem"
                                    height="1.5rem"
                                />
                                {#if open}
                                    {child.name}
                                {/if}</a
                            >
                        {/each}
                    {/if}
                {:else}
                    <a
                        class="flex flex-row gap-2 items-center text-md"
                        href={item.href}
                        ><svelte:component
                            this={item.icon}
                            fill="#222"
                            width="2rem"
                            height="2rem"
                        />
                        {#if open}
                            {item.name}
                        {/if}</a
                    >
                {/if}
            {/each}
        </div>
        <a
            class="flex flex-row gap-2 items-center text-md"
            style="font-size: 1vw"
            href="https://www.github.com/candwberry/scrapi"
            target="_blank"
            rel="noopener noreferrer"
            ><svg
                width="2rem"
                height="2rem"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><title>GitHub</title><path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                /></svg
            >{#if open}candwberry/scrapi{/if}</a
        >
    </div>
</div>
