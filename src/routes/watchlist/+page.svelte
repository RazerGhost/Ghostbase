<script lang="ts">
    import { page } from "$app/state";
    import Seo from "$lib/components/Seo.svelte";
    import LoadFailed from "$lib/components/LoadFailed.svelte";
    import WatchlistBodySkeleton from "$lib/components/skeletons/WatchlistBodySkeleton.svelte";
    import Tv from "@lucide/svelte/icons/tv";
    import SimklIcon from "@icons-pack/svelte-simple-icons/icons/SiSimkl";
    import MyanimelistIcon from "@icons-pack/svelte-simple-icons/icons/SiMyanimelist";
    import FilmIcon from "@lucide/svelte/icons/film";
    import { watchProfiles } from "$lib/config";
    import WatchlistLibrary from "./WatchlistLibrary.svelte";
    import { hasAnime, type Group } from "./groups";
    import type { Component } from "svelte";
    import type { PageData } from "./$types";

    const profileIcons: Record<(typeof watchProfiles)[number]["icon"], Component<any>> = {
        simkl: SimklIcon,
        mydramalist: FilmIcon,
        myanimelist: MyanimelistIcon
    };

    let { data }: { data: PageData } = $props();

    // Held here rather than in WatchlistLibrary because the tab that changes
    // them sits in this page's header row, which renders before the library
    // has arrived.
    let activeGroup = $state<Group>(page.url.searchParams.get("group") === "anime" ? "anime" : "tv");
    let selectedGenre = $state<string | null>(page.url.searchParams.get("genre"));

    function switchGroup(group: Group) {
        activeGroup = group;
        selectedGenre = null;
    }
</script>

<Seo
    title="Watchlist — RazerGhost"
    description="Shows, movies, and anime I'm watching, have finished, and plan to watch."
    path="/watchlist"
/>

<main class="page">
    <h1
        class="h-page"
        data-hero-reveal="0"
    >
        Watchlist
    </h1>
    <p class="mt-2 text-gray" data-hero-reveal="1">
        What I'm working through, have finished, and want to get to.
    </p>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-4" data-hero-reveal="2">
        <ul class="flex flex-wrap gap-3">
            {#each watchProfiles as profile}
                {@const Icon = profileIcons[profile.icon]}
                <li>
                    <a
                        href={profile.href}
                        target="_blank"
                        rel="noreferrer"
                        class="link flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-gray transition-colors hover:border-primary hover:text-primary"
                    >
                        <Icon size={13} aria-hidden="true" />
                        {profile.label}
                    </a>
                </li>
            {/each}
        </ul>

        {#if data.configured}
            {#await data.library then library}
                {#if !library.error && hasAnime([
                    library.watching,
                    library.completed,
                    library.planToWatch,
                    library.onHold,
                    library.dropped,
                ])}
                    <div
                        class="inline-flex rounded-lg border border-border p-1"
                        role="tablist"
                        aria-label="Media type"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeGroup === "tv"}
                            onclick={() => switchGroup("tv")}
                            class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeGroup ===
                            'tv'
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray hover:text-primary'}"
                        >
                            TV & Movies
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeGroup === "anime"}
                            onclick={() => switchGroup("anime")}
                            class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeGroup ===
                            'anime'
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray hover:text-primary'}"
                        >
                            Anime
                        </button>
                    </div>
                {/if}
            {/await}
        {/if}
    </div>

    {#if !data.configured}
        <p class="mt-10 flex items-center gap-2 text-sm text-dim">
            <Tv size={15} aria-hidden="true" /> Simkl not connected.
        </p>
    {:else}
        {#await data.library}
            <WatchlistBodySkeleton />
        {:then library}
            {#if library.error}
                <LoadFailed
                    class="mt-10"
                    message="Couldn't reach Simkl right now, and there's no saved copy to fall back on."
                />
            {:else}
                <WatchlistLibrary {library} bind:activeGroup bind:selectedGenre />
            {/if}
        {:catch}
            <LoadFailed class="mt-10" message="The watchlist didn't finish loading." />
        {/await}
    {/if}
</main>
