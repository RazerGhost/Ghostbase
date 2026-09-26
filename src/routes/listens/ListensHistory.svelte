<script lang="ts" module>
    export function trackHref(spotifyUri: string | null): string | null {
        if (!spotifyUri) return null;
        const id = spotifyUri.split(":").pop();
        return id ? `https://open.spotify.com/track/${id}` : null;
    }
</script>

<script lang="ts">
    /**
     * Everything on /listens that is drawn from the imported history — the
     * figures, the rankings and the plots. Split out of the page so the page
     * can render its header, year picker, now-playing and search straight
     * away and stream this in (see src/lib/server/stream.ts); every value
     * here is derived from the history, and derived state cannot live inside
     * an {#await}.
     */
    import Music from "@lucide/svelte/icons/music";
    import Disc from "@lucide/svelte/icons/disc-3";
    import Sparkle from "@lucide/svelte/icons/sparkle";
    import Ranking, { type RankItem } from "$lib/components/Ranking.svelte";
    import type { ListeningHistory } from "./+page.server";

    let { history, selectedYear }: { history: ListeningHistory; selectedYear: number | null } =
        $props();

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
        const totalMinutes = history.stats.totalMsPlayed / 60000;
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
        history.stats.topArtists.map((a) => ({
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
        history.stats.topTracks.map((t) => ({
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
        history.discoveries.map((d) => ({
            key: d.artist,
            title: d.artist,
            sub:
                selectedYear != null
                    ? `since ${formatDate(d.firstPlayedAt)}`
                    : formatDate(d.firstPlayedAt),
            value: d.plays.toLocaleString(),
            valueLabel: "plays",
        })),
    );
    const albumRanking = $derived(
        history.topAlbums.map((a) => ({
            key: `${a.album}-${a.artist}`,
            title: a.album,
            sub: `${a.artist} · ${a.plays.toLocaleString()} plays`,
            value: listened(a.msPlayed),
            valueLabel: "listened",
        })),
    );

    // --- Calendar heatmap ---
    const heatmapWeeks = $derived.by(() => {
        if (!history.heatmap.length || selectedYear == null) return [];
        const byDate = new Map(history.heatmap.map((d) => [d.date, d.plays]));
        const maxPlays = Math.max(1, ...history.heatmap.map((d) => d.plays));
        const start = new Date(Date.UTC(selectedYear, 0, 1));
        const startPad = start.getUTCDay();
        const end = new Date(Date.UTC(selectedYear, 11, 31));
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
    const maxHourly = $derived(Math.max(1, ...history.hourly.map((h) => h.plays)));
    const hourlyByHour = $derived.by(() => {
        const byHour = new Map(history.hourly.map((h) => [h.hour, h.plays]));
        return Array.from({ length: 24 }, (_, hour) => byHour.get(hour) ?? 0);
    });
    // Every plot marks its own maximum in --accent (design.md § Theme — the
    // accent points at something rather than filling a field), so each series
    // needs to know which one it is. -1 when the series is empty.
    const peakHour = $derived(hourlyByHour.indexOf(Math.max(...hourlyByHour)));

    // --- Weekday x hour heatmap ---
    const weekdayHourGrid = $derived.by(() => {
        if (!history.weekdayHourly.length) return [];
        const byKey = new Map(
            history.weekdayHourly.map((d) => [`${d.weekday}:${d.hour}`, d.plays]),
        );
        const maxPlays = Math.max(1, ...history.weekdayHourly.map((d) => d.plays));
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
        const byMonth = new Map(history.monthlyTrend.map((m) => [m.month, m]));
        let months: string[];
        if (selectedYear != null) {
            // The current year stops at the current month. A zero month draws
            // nothing — it is a month with no plays, and the baseline rule
            // already says so — which is right for a gap inside a year and
            // wrong for months that have not happened yet: three invisible
            // columns at the end made this chart span 321px of its 429px
            // figure while the clock beside it spanned all of it, and read as
            // the two plots being different sizes.
            const now = new Date();
            const lastMonth =
                selectedYear === now.getUTCFullYear() ? now.getUTCMonth() + 1 : 12;
            months = Array.from(
                { length: lastMonth },
                (_, i) => `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
            );
        } else {
            const keys = history.monthlyTrend.map((m) => m.month);
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
                    {history.stats.totalPlays.toLocaleString()}
                </p>
                <p class="meta mt-0.5">Total plays</p>
            </div>
            <div>
                <p class="h-section">
                    {history.stats.peakYear ?? "—"}
                </p>
                <p class="meta mt-0.5">Peak year</p>
            </div>
            <div>
                <p class="h-section">
                    {history.stats.peakWeekday != null
                        ? WEEKDAY_NAMES[history.stats.peakWeekday]
                        : "—"}
                </p>
                <p class="meta mt-0.5">Most active day</p>
            </div>
            <div>
                <p class="h-section">
                    {formatDate(history.stats.firstPlayedAt)}
                </p>
                <p class="meta mt-0.5">Earliest play</p>
            </div>
            <div>
                <p class="h-section">
                    {formatDate(history.stats.lastPlayedAt)}
                </p>
                <p class="meta mt-0.5">Most recent play</p>
            </div>
        </div>

        {#if history.skipShuffle.skipRate != null || history.skipShuffle.shuffleRate != null || history.streaks.longest || history.streaks.current}
            <div
                class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center sm:grid-cols-4"
            >
                {#if history.skipShuffle.skipRate != null}
                    <div>
                        <p class="h-section">
                            {Math.round(history.skipShuffle.skipRate)}%
                        </p>
                        <p class="meta mt-0.5">Skip rate</p>
                    </div>
                {/if}
                {#if history.skipShuffle.shuffleRate != null}
                    <div>
                        <p class="h-section">
                            {Math.round(history.skipShuffle.shuffleRate)}%
                        </p>
                        <p class="meta mt-0.5">Shuffle plays</p>
                    </div>
                {/if}
                {#if history.streaks.longest}
                    <div>
                        <p class="h-section">
                            {history.streaks.longest.days} day{history.streaks.longest.days === 1 ? "" : "s"}
                        </p>
                        <p class="meta mt-0.5">Longest streak</p>
                    </div>
                {/if}
                {#if history.streaks.current}
                    <div>
                        <p class="h-section">
                            {history.streaks.current.days} day{history.streaks.current.days === 1 ? "" : "s"}
                        </p>
                        <p class="meta mt-0.5">Current streak</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <div
        class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
            {#if history.stats.topArtists.length}
                <div class="flex flex-col">
                    <p class="label label--icon">
                        <Music size={12} aria-hidden="true" /> Top artists
                    </p>
                    <div class="mt-3">
                        <Ranking items={artistRanking} expandedContent={artistTrackList} />
                    </div>
                    <p class="meta mt-auto pt-4">
                        Ranked by time spent, so an artist with long tracks climbs on fewer
                        plays. Pick one to see what of theirs I played most.
                    </p>
                </div>
            {/if}
            {#if history.stats.topTracks.length}
                <div class="flex flex-col">
                    <p class="label label--icon">
                        <Music size={12} aria-hidden="true" /> Top tracks
                    </p>
                    <div class="mt-3">
                        <Ranking items={trackRanking} />
                    </div>
                    <p class="meta mt-auto pt-4">
                        Ranked by play count rather than time — the one measure on this page
                        where a short track is not at a disadvantage.
                    </p>
                </div>
            {/if}
    </div>

    <!-- Two columns whenever either side has content, not only when both
         do. The grid used to collapse to one column the moment discoveries
         was empty, and .rank caps at 46rem, so "top albums" then drew a
         736px list inside a 1247px column — 511px of ragged nothing. A
         fixed pair keeps the lone list at its column width, which is the
         same measure it has in the common case. -->
    <!-- Every column in a pair carries a caption, and every caption is
         pushed to the bottom of its column with mt-auto. The grid
         stretches a row to its taller side either way; anchoring the
         captions spends that slack between the list and its note instead
         of leaving it as a ragged gap under the shorter list. Same move as
         the home page masthead: a hole at the end of a column reads as
         something missing, the same space in the middle reads as room. -->
    {#if history.topAlbums.length || history.discoveries.length}
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {#if history.topAlbums.length}
                <div class="flex flex-col">
                    <p class="label label--icon">
                        <Disc size={12} aria-hidden="true" /> Top albums
                    </p>
                    <div class="mt-3">
                        <Ranking items={albumRanking} />
                    </div>
                    <p class="meta mt-auto pt-4">
                        By time spent as well, which is why a record can sit above one with
                        more plays against it.
                    </p>
                </div>
            {/if}

            {#if history.discoveries.length}
                <div class="flex flex-col">
                    <p class="label label--icon">
                        <Sparkle size={12} aria-hidden="true" />
                        {selectedYear != null
                            ? `Discovered in ${selectedYear}`
                            : "Where it started"}
                    </p>
                    <div class="mt-3">
                        <Ranking items={discoveryRanking} />
                    </div>
                    {#if selectedYear != null}
                        <p class="meta mt-auto pt-4">
                            The ones that stuck, out of {history.discoveryCount.toLocaleString()}
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
    {#if history.latestArtists.length || history.onThisDay.length}
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {#if history.latestArtists.length}
                <div class="rule flex flex-col pt-8">
                    <p class="label">Latest additions</p>
                    <ul class="ledger mt-3 max-w-none">
                        {#each history.latestArtists as artist (artist.artist)}
                            <li class="ledger__row">
                                <span class="h-card ledger__name">{artist.artist}</span>
                                <span class="meta ledger__val">
                                    {formatDate(artist.firstPlayedAt)} · {artist.plays}
                                    {artist.plays === 1 ? "play" : "plays"}
                                </span>
                            </li>
                        {/each}
                    </ul>
                    <p class="meta mt-auto pt-4">
                        Newest first, three plays or more — below that it is a radio tail rather
                        than something I went looking for.
                    </p>
                </div>
            {/if}

            {#if history.onThisDay.length}
                <div class="rule flex flex-col pt-8">
                    <p class="label">On this day</p>
                    <ul class="ledger mt-3 max-w-none">
                        {#each history.onThisDay as entry}
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
                    <p class="meta mt-auto pt-4">The most-played track on this date, each year.</p>
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
                    <div class="plot">
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
                    <div class="plot">
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
                {selectedYear} activity
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
