<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import ListeningNowCard from "$lib/components/ListeningNowCard.svelte";
    import Music from "@lucide/svelte/icons/music";
    import Disc from "@lucide/svelte/icons/disc-3";
    import Sparkle from "@lucide/svelte/icons/sparkle";
    import Ranking, { type RankItem } from "$lib/components/Ranking.svelte";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import { goto } from "$app/navigation";
    import { fly } from "svelte/transition";
    import { albumArt } from "$lib/stores/album-art.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const WEEKDAY_NAMES = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const listenTime = $derived.by(() => {
        const totalMinutes = data.stats.totalMsPlayed / 60000;
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = Math.round(totalMinutes % 60);
        return { days, hours, minutes };
    });

    function formatDate(iso: string | null): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function trackHref(spotifyUri: string | null): string | null {
        if (!spotifyUri) return null;
        const id = spotifyUri.split(":").pop();
        return id ? `https://open.spotify.com/track/${id}` : null;
    }

    /** "4h 22m" / "38m" — a ranked artist's or album's listening time. */
    function listened(ms: number): string {
        const minutes = Math.round(ms / 60000);
        const hours = Math.floor(minutes / 60);
        return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
    }

    // The three top-fives, shaped for Ranking. They are set as type rather than
    // as bars (design.md § Lists), so the magnitude lives in the count and the
    // context line, not in a track width.
    const artistRanking = $derived(
        data.stats.topArtists.map((a) => ({
            key: a.artist,
            title: a.artist,
            sub: `${a.plays.toLocaleString()} plays`,
            value: listened(a.msPlayed),
            valueLabel: "listened",
            onpick: () => toggleArtist(a.artist),
            expanded: expandedArtist === a.artist,
        })),
    );
    const trackRanking = $derived(
        data.stats.topTracks.map((t) => ({
            key: `${t.track}-${t.artist}`,
            title: t.track,
            sub: t.artist,
            value: t.plays.toLocaleString(),
            valueLabel: "plays",
            href: trackHref(t.spotifyUri),
        })),
    );
    // Discovered-in is ranked by plays now (see getDiscoveries), so it IS a
    // ranking and gets the numerals its neighbour has. Ordered by recency it
    // was a flat list because nothing about it was ordered.
    const discoveryRanking = $derived(
        data.discoveries.map((d) => ({
            key: d.artist,
            title: d.artist,
            sub:
                data.selectedYear != null
                    ? `since ${formatDate(d.firstPlayedAt)}`
                    : formatDate(d.firstPlayedAt),
            value: d.plays.toLocaleString(),
            valueLabel: "plays",
        })),
    );
    const albumRanking = $derived(
        data.topAlbums.map((a) => ({
            key: `${a.album}-${a.artist}`,
            title: a.album,
            sub: `${a.artist} · ${a.plays.toLocaleString()} plays`,
            value: listened(a.msPlayed),
            valueLabel: "listened",
        })),
    );

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

    // --- Calendar heatmap ---
    const heatmapWeeks = $derived.by(() => {
        if (!data.heatmap.length || data.selectedYear == null) return [];
        const byDate = new Map(data.heatmap.map((d) => [d.date, d.plays]));
        const maxPlays = Math.max(1, ...data.heatmap.map((d) => d.plays));
        const start = new Date(Date.UTC(data.selectedYear, 0, 1));
        const startPad = start.getUTCDay();
        const end = new Date(Date.UTC(data.selectedYear, 11, 31));
        type Day = { date: string; plays: number; level: number; peak: boolean };
        const days: Day[] = [];
        for (let i = 0; i < startPad; i++)
            days.push({ date: "", plays: 0, level: -1, peak: false });
        for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
        ) {
            const key = d.toISOString().slice(0, 10);
            const plays = byDate.get(key) ?? 0;
            const level =
                plays === 0
                    ? 0
                    : Math.min(4, Math.ceil((plays / maxPlays) * 4));
            days.push({ date: key, plays, level, peak: plays === maxPlays });
        }
        const weeks: Day[][] = [];
        for (let i = 0; i < days.length; i += 7)
            weeks.push(days.slice(i, i + 7));
        return weeks;
    });

    // --- Hourly listening clock ---
    const maxHourly = $derived(Math.max(1, ...data.hourly.map((h) => h.plays)));
    const hourlyByHour = $derived.by(() => {
        const byHour = new Map(data.hourly.map((h) => [h.hour, h.plays]));
        return Array.from({ length: 24 }, (_, hour) => byHour.get(hour) ?? 0);
    });
    // Every plot marks its own maximum in --accent (design.md § Theme — the
    // accent points at something rather than filling a field), so each series
    // needs to know which one it is. -1 when the series is empty.
    const peakHour = $derived(hourlyByHour.indexOf(Math.max(...hourlyByHour)));

    // --- Weekday x hour heatmap ---
    const weekdayHourGrid = $derived.by(() => {
        if (!data.weekdayHourly.length) return [];
        const byKey = new Map(
            data.weekdayHourly.map((d) => [`${d.weekday}:${d.hour}`, d.plays]),
        );
        const maxPlays = Math.max(1, ...data.weekdayHourly.map((d) => d.plays));
        return Array.from({ length: 7 }, (_, weekday) => ({
            weekday,
            hours: Array.from({ length: 24 }, (_, hour) => {
                const plays = byKey.get(`${weekday}:${hour}`) ?? 0;
                const level =
                    plays === 0
                        ? 0
                        : Math.min(4, Math.ceil((plays / maxPlays) * 4));
                return { hour, plays, level, peak: plays === maxPlays };
            }),
        }));
    });

    // --- Monthly trend ---
    const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    function formatMonth(month: string): string {
        const [y, m] = month.split("-").map(Number);
        return `${MONTH_NAMES[m - 1]} ${y}`;
    }
    const monthlyBars = $derived.by(() => {
        const byMonth = new Map(data.monthlyTrend.map((m) => [m.month, m]));
        let months: string[];
        if (data.selectedYear != null) {
            months = Array.from(
                { length: 12 },
                (_, i) => `${data.selectedYear}-${String(i + 1).padStart(2, "0")}`,
            );
        } else {
            const keys = data.monthlyTrend.map((m) => m.month);
            if (!keys.length) return [];
            months = [];
            let [y, m] = keys[0].split("-").map(Number);
            const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
            while (y < ly || (y === ly && m <= lm)) {
                months.push(`${y}-${String(m).padStart(2, "0")}`);
                m++;
                if (m > 12) {
                    m = 1;
                    y++;
                }
            }
        }
        return months.map((month) => ({
            month,
            plays: byMonth.get(month)?.plays ?? 0,
        }));
    });
    const maxMonthly = $derived(
        Math.max(1, ...monthlyBars.map((m) => m.plays)),
    );
    const peakMonth = $derived(
        monthlyBars.findIndex((m) => m.plays === maxMonthly && m.plays > 0),
    );

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

    // --- Artist drill-down ---
    let expandedArtist = $state<string | null>(null);
    let artistTracks = $state<
        { track: string; plays: number; spotifyUri: string | null }[]
    >([]);

    async function toggleArtist(artist: string) {
        if (expandedArtist === artist) {
            expandedArtist = null;
            return;
        }
        expandedArtist = artist;
        artistTracks = [];
        try {
            const res = await fetch(
                `/api/listening/artist?artist=${encodeURIComponent(artist)}`,
            );
            const body = await res.json();
            // Ignore a slow response for an artist that's no longer the one
            // expanded — rapid clicks would otherwise show the wrong tracks.
            if (expandedArtist !== artist) return;
            artistTracks = body.tracks ?? [];
        } catch {
            // Row just stays empty — nothing worse to do here.
        }
    }
</script>

<!-- Rendered under an expanded artist row by Ranking. The row's own click
     handler fetches the tracks, so this only has to show them. -->
{#snippet artistTrackList(item: RankItem)}
    {#if artistTracks.length}
        <ul class="flex flex-col gap-2 border-l border-border pl-4">
            {#each artistTracks as t}
                {@const href = trackHref(t.spotifyUri)}
                <li class="flex items-baseline justify-between gap-4 text-[14px]">
                    {#if href}
                        <a {href} target="_blank" rel="noreferrer" class="link truncate">{t.track}</a>
                    {:else}
                        <span class="truncate text-gray">{t.track}</span>
                    {/if}
                    <span class="mono shrink-0">{t.plays}</span>
                </li>
            {/each}
        </ul>
    {:else}
        <p class="meta">Loading {item.title}&rsquo;s tracks&hellip;</p>
    {/if}
{/snippet}

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

        <div
            class="rule mt-8 pt-8"
        >
            <p class="label">
                Spent listening
            </p>
            <p class="mt-2 flex items-baseline gap-1.5 text-white">
                <span class="text-4xl font-extrabold sm:text-5xl"
                    >{listenTime.days}</span
                >
                <span class="text-sm text-dim">d</span>
                <span class="text-4xl font-extrabold sm:text-5xl"
                    >{listenTime.hours}</span
                >
                <span class="text-sm text-dim">h</span>
                <span class="text-4xl font-extrabold sm:text-5xl"
                    >{listenTime.minutes}</span
                >
                <span class="text-sm text-dim">m</span>
            </p>

            <div
                class="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-center sm:grid-cols-3 lg:grid-cols-5"
            >
                <div>
                    <p class="h-section">
                        {data.stats.totalPlays.toLocaleString()}
                    </p>
                    <p class="meta mt-0.5">Total plays</p>
                </div>
                <div>
                    <p class="h-section">
                        {data.stats.peakYear ?? "—"}
                    </p>
                    <p class="meta mt-0.5">Peak year</p>
                </div>
                <div>
                    <p class="h-section">
                        {data.stats.peakWeekday != null
                            ? WEEKDAY_NAMES[data.stats.peakWeekday]
                            : "—"}
                    </p>
                    <p class="meta mt-0.5">Most active day</p>
                </div>
                <div>
                    <p class="h-section">
                        {formatDate(data.stats.firstPlayedAt)}
                    </p>
                    <p class="meta mt-0.5">Earliest play</p>
                </div>
                <div>
                    <p class="h-section">
                        {formatDate(data.stats.lastPlayedAt)}
                    </p>
                    <p class="meta mt-0.5">Most recent play</p>
                </div>
            </div>

            {#if data.skipShuffle.skipRate != null || data.skipShuffle.shuffleRate != null || data.streaks.longest || data.streaks.current}
                <div
                    class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center sm:grid-cols-4"
                >
                    {#if data.skipShuffle.skipRate != null}
                        <div>
                            <p class="h-section">
                                {Math.round(data.skipShuffle.skipRate)}%
                            </p>
                            <p class="meta mt-0.5">Skip rate</p>
                        </div>
                    {/if}
                    {#if data.skipShuffle.shuffleRate != null}
                        <div>
                            <p class="h-section">
                                {Math.round(data.skipShuffle.shuffleRate)}%
                            </p>
                            <p class="meta mt-0.5">Shuffle plays</p>
                        </div>
                    {/if}
                    {#if data.streaks.longest}
                        <div>
                            <p class="h-section">
                                {data.streaks.longest.days} day{data.streaks.longest.days === 1 ? "" : "s"}
                            </p>
                            <p class="meta mt-0.5">Longest streak</p>
                        </div>
                    {/if}
                    {#if data.streaks.current}
                        <div>
                            <p class="h-section">
                                {data.streaks.current.days} day{data.streaks.current.days === 1 ? "" : "s"}
                            </p>
                            <p class="meta mt-0.5">Current streak</p>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <div
            class="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
                {#if data.stats.topArtists.length}
                    <div>
                        <p class="label label--icon">
                            <Music size={12} aria-hidden="true" /> Top artists
                        </p>
                        <div class="mt-3">
                            <Ranking items={artistRanking} expandedContent={artistTrackList} />
                        </div>
                    </div>
                {/if}
                {#if data.stats.topTracks.length}
                    <div>
                        <p class="label label--icon">
                            <Music size={12} aria-hidden="true" /> Top tracks
                        </p>
                        <div class="mt-3">
                            <Ranking items={trackRanking} />
                        </div>
                    </div>
                {/if}
        </div>

        <!-- Two columns whenever either side has content, not only when both
             do. The grid used to collapse to one column the moment discoveries
             was empty, and .rank caps at 46rem, so "top albums" then drew a
             736px list inside a 1247px column — 511px of ragged nothing. A
             fixed pair keeps the lone list at its column width, which is the
             same measure it has in the common case. -->
        {#if data.topAlbums.length || data.discoveries.length}
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {#if data.topAlbums.length}
                    <div>
                        <p class="label label--icon">
                            <Disc size={12} aria-hidden="true" /> Top albums
                        </p>
                        <div class="mt-3">
                            <Ranking items={albumRanking} />
                        </div>
                    </div>
                {/if}

                {#if data.discoveries.length}
                    <div>
                        <p class="label label--icon">
                            <Sparkle size={12} aria-hidden="true" />
                            {data.selectedYear != null
                                ? `Discovered in ${data.selectedYear}`
                                : "Where it started"}
                        </p>
                        <div class="mt-3">
                            <Ranking items={discoveryRanking} />
                        </div>
                        {#if data.selectedYear != null}
                            <p class="meta mt-4">
                                The ones that stuck, out of {data.discoveryCount.toLocaleString()}
                                artists heard for the first time that year.
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- The two short time lists, paired. Each holds about 46rem of
             content, so either one alone under a full-width rule left ~500px
             of empty grid beside it. They belong together as well as fit
             together: one is what turned up lately, the other is what was
             playing on this date in every year before. -->
        {#if data.latestArtists.length || data.onThisDay.length}
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {#if data.latestArtists.length}
                    <div class="rule pt-8">
                        <p class="label">Latest additions</p>
                        <ul class="ledger mt-3 max-w-none">
                            {#each data.latestArtists as artist (artist.artist)}
                                <li class="ledger__row">
                                    <span class="h-card ledger__name">{artist.artist}</span>
                                    <span class="meta ledger__val">
                                        {formatDate(artist.firstPlayedAt)} · {artist.plays}
                                        {artist.plays === 1 ? "play" : "plays"}
                                    </span>
                                </li>
                            {/each}
                        </ul>
                        <p class="meta mt-4">
                            Newest first, three plays or more — below that it is a radio tail rather
                            than something I went looking for.
                        </p>
                    </div>
                {/if}

                {#if data.onThisDay.length}
                    <div class="rule pt-8">
                        <p class="label">On this day</p>
                        <ul class="ledger mt-3 max-w-none">
                            {#each data.onThisDay as entry}
                                {@const href = trackHref(entry.spotifyUri)}
                                <li class="ledger__row">
                                    <span class="mono ledger__lead">{entry.year}</span>
                                    <span class="h-card ledger__name">
                                        {#if href}
                                            <a {href} target="_blank" rel="noreferrer" class="link"
                                                >{entry.track}</a
                                            >
                                        {:else}
                                            {entry.track}
                                        {/if}
                                        <span class="meta"> — {entry.artist}</span>
                                    </span>
                                    <span class="meta ledger__val">
                                        {entry.plays} play{entry.plays === 1 ? "" : "s"}
                                    </span>
                                </li>
                            {/each}
                        </ul>
                        <p class="meta mt-4">The most-played track on this date, each year.</p>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- The two plots, paired. Neither filled the row alone — the clock
             drew 1104px of 1247 and a single year's monthly trend 744 — and
             both are the same kind of thing: one is the shape of a day, the
             other the shape of a year. -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            {#if hourlyByHour.some((n) => n > 0)}
                <div
                    class="rule mt-8 pt-8"
                >
                    <div class="flex items-baseline justify-between gap-4">
                        <p class="label">Listening clock</p>
                        <p class="meta">
                            busiest at {peakHour % 12 || 12}{peakHour < 12
                                ? "am"
                                : "pm"}
                        </p>
                    </div>
                    <div class="plot-figure mt-4" style:--plot-cols={24}>
                        <div class="plot h-20">
                            {#each hourlyByHour as plays, hour}
                                <div
                                    class="plot__col"
                                    class:plot__col--peak={hour === peakHour}
                                    style:height="{plays
                                        ? Math.max(2, (plays / maxHourly) * 100)
                                        : 0}%"
                                    title="{hour}:00 — {plays.toLocaleString()} plays"
                                ></div>
                            {/each}
                        </div>
                        <div class="plot__scale">
                            <span class="meta">12am</span>
                            <span class="meta">12pm</span>
                            <span class="meta">11pm</span>
                        </div>
                    </div>
                </div>
            {/if}

            {#if monthlyBars.length}
                <div
                    class="rule mt-8 pt-8"
                >
                    <div class="flex items-baseline justify-between gap-4">
                        <p class="label">Monthly trend</p>
                        {#if peakMonth >= 0}
                            <p class="meta">
                                busiest {formatMonth(monthlyBars[peakMonth].month)}
                            </p>
                        {/if}
                    </div>
                    <div
                        class="plot-figure plot-figure--wide mt-4"
                        style:--plot-cols={monthlyBars.length}
                    >
                        <div class="plot h-24">
                            {#each monthlyBars as m, i}
                                <div
                                    class="plot__col"
                                    class:plot__col--peak={i === peakMonth}
                                    style:height="{m.plays
                                        ? Math.max(2, (m.plays / maxMonthly) * 100)
                                        : 0}%"
                                    title="{formatMonth(m.month)} — {m.plays.toLocaleString()} plays"
                                ></div>
                            {/each}
                        </div>
                        <div class="plot__scale">
                            <span class="meta">{formatMonth(monthlyBars[0].month)}</span>
                            <span class="meta"
                                >{formatMonth(
                                    monthlyBars[monthlyBars.length - 1].month,
                                )}</span
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        {#if heatmapWeeks.length}
            <div
                class="rule mt-8 pt-8"
            >
                <p class="label">
                    {data.selectedYear} activity
                </p>
                <div class="mt-4 flex gap-[3px]">
                    {#each heatmapWeeks as week}
                        <div class="flex min-w-[3px] flex-1 flex-col gap-[3px]">
                            {#each week as day}
                                {#if day.level === -1}
                                    <div class="aspect-square w-full"></div>
                                {:else}
                                    <div
                                        class="plot-cell"
                                        class:plot-cell--peak={day.peak}
                                        data-lvl={day.level}
                                        title="{day.date}: {day.plays.toLocaleString()} plays"
                                    ></div>
                                {/if}
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if weekdayHourGrid.length}
            <div
                class="rule mt-8 pt-8"
            >
                <p class="label">
                    Listening habits by day &amp; hour
                </p>
                <div class="mt-4 flex flex-col gap-[3px]">
                    {#each weekdayHourGrid as row}
                        <div class="flex items-center gap-3">
                            <span class="label w-8 shrink-0">
                                {WEEKDAY_NAMES[row.weekday].slice(0, 3)}
                            </span>
                            <div class="flex flex-1 gap-[3px]">
                                {#each row.hours as cell}
                                    <div
                                        class="plot-cell min-w-[3px] flex-1"
                                        class:plot-cell--peak={cell.peak}
                                        data-lvl={cell.level}
                                        title="{WEEKDAY_NAMES[row.weekday]} {cell.hour}:00 — {cell.plays.toLocaleString()} plays"
                                    ></div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="plot__scale ml-11">
                    <span class="meta">12am</span>
                    <span class="meta">12pm</span>
                    <span class="meta">11pm</span>
                </div>
                <div class="mt-4 flex items-center justify-end gap-1.5">
                    <span class="meta">Less</span>
                    {#each [0, 1, 2, 3, 4] as level}
                        <div class="plot-cell h-3 w-3" data-lvl={level}></div>
                    {/each}
                    <span class="meta">More</span>
                </div>
            </div>
        {/if}
    {/if}
</main>
