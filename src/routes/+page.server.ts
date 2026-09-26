import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import { getListeningStats, getActiveDates, getRecentDailyPlayCounts } from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { getStatus } from '$lib/server/status-db';
import { deferred, streamOnNavigation } from '$lib/server/stream';
import type { PageServerLoad } from './$types';

/**
 * What the home page shows from Simkl: the show in progress and the days
 * spent watching. `ok: false` is Simkl unreachable with no snapshot to fall
 * back on — the page says so rather than rendering a zero.
 */
async function loadWatching() {
	if (!simklConfigured()) return { ok: true as const, watching: null, daysWatched: 0 };
	try {
		const { library } = await getLibraryWithFallback();
		// Days spent watching, for the home page's stat line. The library is
		// already being fetched for `watching`, so this is a sum over data in
		// hand rather than a second call — same arithmetic the watchlist page
		// does client-side (episodes seen x runtime, everything but plan-to-watch).
		const minutesWatched = [
			...library.watching,
			...library.completed,
			...library.onHold,
			...library.dropped
		].reduce((sum, item) => sum + item.watchedEpisodes * (item.runtime ?? 0), 0);
		return {
			ok: true as const,
			watching: library.watching[0] ?? null,
			daysWatched: Math.floor(minutesWatched / (60 * 24))
		};
	} catch {
		return { ok: false as const, watching: null, daysWatched: null };
	}
}

export const load: PageServerLoad = async ({ isDataRequest }) => {
	const status = getStatus();
	const entries = getAllDevlogEntries();

	return {
		// getAllDevlogEntries() is sorted oldest-first (prev/next math depends
		// on that) — reverse before slicing so "Latest" means newest.
		latest: entries.toReversed().slice(0, 3),
		postCount: entries.length,
		projects: getAllProjects().slice(0, 3),
		statusItems: status.items,
		// The two slow sources: listening aggregates cold-start at around a
		// second, and Simkl is a network call whenever its snapshot is old.
		// Both stream on navigation (see stream.ts).
		...(await streamOnNavigation(isDataRequest, {
			listening: deferred(() => ({
				totalPlays: getListeningStats().totalPlays,
				currentStreak: computeStreaks(getActiveDates()).current?.days ?? null,
				recentDaily: getRecentDailyPlayCounts(14)
			})),
			watch: loadWatching()
		}))
	};
};
