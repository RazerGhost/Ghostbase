import {
	getListeningStats,
	getAvailableYears,
	getHeatmap,
	getHourlyBreakdown,
	getWeekdayHourBreakdown,
	getOnThisDay,
	getTopAlbums,
	getSkipShuffleStats,
	getMonthlyTrend,
	getDiscoveries,
	getDiscoveryCount,
	getLatestArtists,
	getActiveDates
} from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import { deferred, streamOnNavigation } from '$lib/server/stream';
import type { PageServerLoad } from './$types';

/**
 * Everything the page draws from the history. Memoized per year in
 * spotify-history-db.ts, so warm this is a couple of milliseconds — but every
 * scrobble clears the memo, and cold it measured 1.2s for a year and 1.5s for
 * all time against 200k plays, most of it getListeningStats().
 */
function loadHistory(year: number | null) {
	const yearOpts = year != null ? { year } : {};

	const today = new Date();
	const monthDay = `${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

	return {
		stats: getListeningStats(yearOpts),
		heatmap: year != null ? getHeatmap(year) : [],
		hourly: getHourlyBreakdown(),
		weekdayHourly: getWeekdayHourBreakdown(yearOpts),
		onThisDay: getOnThisDay(monthDay, today.getUTCFullYear()),
		topAlbums: getTopAlbums(yearOpts),
		skipShuffle: getSkipShuffleStats(yearOpts),
		monthlyTrend: getMonthlyTrend(yearOpts),
		discoveries: getDiscoveries(year),
		discoveryCount: getDiscoveryCount(year),
		latestArtists: getLatestArtists(year),
		streaks: computeStreaks(getActiveDates())
	};
}

export type ListeningHistory = ReturnType<typeof loadHistory>;

export const load: PageServerLoad = async ({ url, isDataRequest }) => {
	const years = getAvailableYears();
	const yearParam = url.searchParams.get('year');
	// "All time" needs its own sentinel ("year=all") rather than just omitting
	// the param — an omitted param is indistinguishable from a fresh /listens
	// load with no selection yet, which should default to the latest year.
	const year =
		yearParam === 'all'
			? null
			: yearParam && years.includes(Number(yearParam))
				? Number(yearParam)
				: (years[0] ?? null);

	return {
		// Any year with plays means history has been imported — cheaper than a
		// second, unfiltered getListeningStats() pass just for this flag.
		configured: years.length > 0,
		years,
		selectedYear: year,
		// The header, the year picker, now-playing and search need none of
		// this, so on navigation they render first (see stream.ts).
		...(await streamOnNavigation(isDataRequest, { history: deferred(() => loadHistory(year)) }))
	};
};
