import { getAllDevlogEntries } from '$lib/server/devlog';
import { getAllProjects } from '$lib/server/projects';
import { getListeningStats, getActiveDates, getRecentDailyPlayCounts } from '$lib/server/spotify-history';
import { computeStreaks } from '$lib/server/listening-streaks';
import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { getStatus } from '$lib/server/status-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const listeningStats = getListeningStats();
	const streaks = computeStreaks(getActiveDates());
	const recentDaily = getRecentDailyPlayCounts(14);
	const status = getStatus();

	let watching = null;
	// Days spent watching, for the home page's stat line. The library is
	// already being fetched for `watching`, so this is a sum over data in
	// hand rather than a second call — same arithmetic the watchlist page
	// does client-side (episodes seen x runtime, everything but plan-to-watch).
	let minutesWatched = 0;
	if (simklConfigured()) {
		try {
			const { library } = await getLibraryWithFallback();
			watching = library.watching[0] ?? null;
			minutesWatched = [
				...library.watching,
				...library.completed,
				...library.onHold,
				...library.dropped
			].reduce((sum, item) => sum + item.watchedEpisodes * (item.runtime ?? 0), 0);
		} catch {
			watching = null;
		}
	}

	const entries = getAllDevlogEntries();

	return {
		// getAllDevlogEntries() is sorted oldest-first (prev/next math depends
		// on that) — reverse before slicing so "Latest" means newest.
		latest: entries.toReversed().slice(0, 3),
		postCount: entries.length,
		daysWatched: Math.floor(minutesWatched / (60 * 24)),
		projects: getAllProjects().slice(0, 3),
		totalPlays: listeningStats.totalPlays,
		currentStreak: streaks.current?.days ?? null,
		recentDaily,
		watching,
		statusItems: status.items
	};
};
