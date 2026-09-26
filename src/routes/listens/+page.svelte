<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import ListeningNowCard from "$lib/components/ListeningNowCard.svelte";
    import Music from "@lucide/svelte/icons/music";
    import LoadFailed from "$lib/components/LoadFailed.svelte";
    import ListensBodySkeleton from "$lib/components/skeletons/ListensBodySkeleton.svelte";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import { goto } from "$app/navigation";
    import { fly } from "svelte/transition";
    import { albumArt } from "$lib/stores/album-art.svelte";
    import { navigating } from "$app/state";
    import ListensHistory, { trackHref } from "./ListensHistory.svelte";
    import type { PageData } from "./$types";
    import type { ListeningHistory } from "./+page.server";

    let { data }: { data: PageData } = $props();

    function selectYear(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        const params = new URLSearchParams(location.search);
        // "all" needs its own explicit value in the URL — deleting the param
        // entirely would make it indistinguishable from a fresh /listens load
        // with no selection yet, which the server defaults to the latest year.
        params.set("year", value);
        goto(`?${params.toString()}`, {
            keepFocus: true,
            noScroll: true,
            invalidateAll: true,
        });
    }

    // A year switch keeps this page up — it is a query change, so the layout
    // does not swap in a skeleton (navigation-skeleton.ts) — and the switch
    // asks for noScroll. So the figures below should not drop to a skeleton
    // either, which would collapse the page under the reader: the last year
    // shown stays up, marked as not current, until the new one arrives.
    let previous = $state<{ history: ListeningHistory; year: number | null } | null>(null);
    $effect(() => {
        const pending = data.history;
        const year = data.selectedYear;
        Promise.resolve(pending)
            .then((history) => {
                if (data.history === pending) previous = { history, year };
            })
            .catch(() => {});
    });
    const switchingYear = $derived(navigating.to?.url.pathname === "/listens");

    // --- Search ---
    type SearchResult = {
        track: string;
        artist: string;
        album: string | null;
        plays: number;
        spotifyUri: string | null;
    };

    let query = $state("");
    let searchResults = $state<SearchResult[]>([]);
    let searching = $state(false);
    let searchedFor = $state("");
    let searchTimeout: ReturnType<typeof setTimeout>;

    function onSearchInput() {
        clearTimeout(searchTimeout);
        const q = query.trim();
        if (q.length < 2) {
            searching = false;
            searchResults = [];
            searchedFor = "";
            return;
        }
        searching = true;
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/listening/search?q=${encodeURIComponent(q)}`,
                );
                const body = await res.json();
                // A newer keystroke may have superseded this request while it
                // was in flight — never overwrite fresher results with stale ones.
                if (q !== query.trim()) return;
                searchResults = body.results ?? [];
                searchedFor = q;
            } catch {
                if (q !== query.trim()) return;
                searchResults = [];
                searchedFor = q;
            } finally {
                if (q === query.trim()) searching = false;
            }
        }, 250);
    }

    function clearSearch() {
        query = "";
        searchResults = [];
        searchedFor = "";
        searching = false;
    }

    function onSearchKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") clearSearch();
    }

</script>

<Seo
    title="Listens — RazerGhost"
    description="What I've been listening to on Spotify, built from my own extended streaming history export."
    path="/listens"
/>

<main class="page">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1
                class="h-page"
                data-hero-reveal="0"
            >
                Listens
            </h1>
            <p class="mt-2 text-gray" data-hero-reveal="1">
                My Spotify listening history, imported from my own data export —
                not a live feed, just everything I've listened to so far.
            </p>
        </div>

        {#if data.configured && data.years.length > 1}
            <label class="flex items-center gap-2 text-sm text-dim">
                Year
                <select
                    class="rounded-md border border-border bg-surface px-2 py-1.5 text-white"
                    value={data.selectedYear ?? "all"}
                    onchange={selectYear}
                >
                    <option value="all">All time</option>
                    {#each data.years as y}
                        <option value={y}>{y}</option>
                    {/each}
                </select>
            </label>
        {/if}
    </div>

    {#if !data.configured}
        <p class="mt-10 flex items-center gap-2 text-sm text-dim">
            <Music size={15} aria-hidden="true" /> No listening history imported yet.
        </p>
    {:else}
        <div class="mt-6">
            <ListeningNowCard />
        </div>

        <div class="mt-6">
            <div class="relative">
                <Search
                    size={15}
                    class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    placeholder="Search your listening history…"
                    class="card w-full py-2 pr-9 pl-9 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
                    bind:value={query}
                    oninput={onSearchInput}
                    onkeydown={onSearchKeydown}
                />
                {#if query}
                    <button
                        type="button"
                        aria-label="Clear search"
                        onclick={clearSearch}
                        class="absolute top-1/2 right-3 -translate-y-1/2 text-dim hover:text-white"
                    >
                        <X size={15} aria-hidden="true" />
                    </button>
                {/if}
            </div>

            {#if searching}
                <p class="meta mt-4">Searching…</p>
            {:else if searchedFor && !searchResults.length}
                <p class="meta mt-4">
                    No plays match "{searchedFor}".
                </p>
            {:else if searchResults.length}
                <div
                    class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                >
                    {#each searchResults as r, i (r.spotifyUri ?? r.track + r.artist)}
                        {@const href = trackHref(r.spotifyUri)}
                        {@const art = albumArt(r.spotifyUri)}
                        <a
                            {href}
                            target={href ? "_blank" : undefined}
                            rel="noreferrer"
                            in:fly={{ y: 8, duration: 200, delay: i * 20 }}
                            class="card group flex flex-col gap-2 p-3 transition-colors hover:border-primary hover:bg-surface-2"
                        >
                            <div
                                class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-2"
                            >
                                {#if art}
                                    <img
                                        src={art}
                                        alt=""
                                        class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                {:else}
                                    <div
                                        class="flex h-full w-full items-center justify-center"
                                    >
                                        <Music
                                            size={20}
                                            class="text-dim"
                                            aria-hidden="true"
                                        />
                                    </div>
                                {/if}
                            </div>
                            <div class="min-w-0">
                                <p
                                    class="truncate text-sm font-medium text-white group-hover:text-primary"
                                >
                                    {r.track}
                                </p>
                                <p class="meta truncate">{r.artist}</p>
                            </div>
                            <p class="meta">
                                {r.plays} play{r.plays === 1 ? "" : "s"}
                            </p>
                        </a>
                    {/each}
                </div>
            {/if}
        </div>

        {#await data.history}
            {#if previous}
                <div class="is-pending" aria-busy="true">
                    <ListensHistory history={previous.history} selectedYear={previous.year} />
                </div>
            {:else}
                <ListensBodySkeleton />
            {/if}
        {:then history}
            <div class={switchingYear ? "is-pending" : ""} aria-busy={switchingYear}>
                <ListensHistory {history} selectedYear={data.selectedYear} />
            </div>
        {:catch}
            <LoadFailed class="rule mt-8 pt-8" message="The listening history didn't finish loading." />
        {/await}
    {/if}
</main>
