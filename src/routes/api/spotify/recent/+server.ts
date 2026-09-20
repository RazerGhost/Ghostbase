import { json } from '@sveltejs/kit';
import { getRecentlyPlayed, spotifyConfigured } from '$lib/server/spotify';
import type { RequestHandler } from './$types';

// Degrades to `{ available: false }` instead of erroring when the refresh
// token lacks the recently-played scope, so the widget just hides that
// section. getRecentlyPlayed() caches upstream for 30s so concurrent
// viewers share one Spotify request.
export const GET: RequestHandler = async () => {
	if (!spotifyConfigured()) {
		return json({ available: false, items: [] });
	}

	try {
		return json(await getRecentlyPlayed());
	} catch (e) {
		// Still degrades to "nothing to show" for the widget, but no longer
		// silently: a bare catch here meant a dead token and an idle account
		// looked identical from the outside and left nothing in the log.
		console.warn('[spotify] recently-played unavailable:', e instanceof Error ? e.message : e);
		return json({ available: false, items: [] });
	}
};
