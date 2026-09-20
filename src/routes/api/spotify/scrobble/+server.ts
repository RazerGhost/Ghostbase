import { timingSafeEqual } from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	getSpotifyAccessToken,
	noteSpotifyRateLimit,
	spotifyConfigured,
	spotifyCooldownMs,
	SpotifyAuthError
} from '$lib/server/spotify';
import { insertPlays } from '$lib/server/spotify-history-db';
import type { PlayRecord } from '$lib/server/spotify-history-db';
import type { RequestHandler } from './$types';

// Meant to run on a schedule to top up spotify-history.db between manual
// exports — Spotify's recently-played endpoint only returns the last 50
// plays, so gaps longer than the poll interval are otherwise lost.
// insertPlays is idempotent on (played_at, spotify_uri, ms_played), so
// overlapping polls are safe. Prefer the `Authorization: Bearer <secret>`
// header over `?secret=`, which leaks into proxy/access logs — still
// accepted so existing cron entries keep working.
export const GET: RequestHandler = async ({ url, request }) => {
	const secret = env.SPOTIFY_SCROBBLE_SECRET;
	if (!secret) error(503, 'Scrobbling not configured');
	const provided =
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
		url.searchParams.get('secret');
	const a = Buffer.from(provided ?? '');
	const b = Buffer.from(secret);
	if (a.length !== b.length || !timingSafeEqual(a, b)) error(401, 'Unauthorized');

	if (!spotifyConfigured()) error(503, 'Spotify not configured');

	// Spotify has already told us to back off. Skip the run rather than spend
	// a request to be told again — and report it as a success, because it is
	// one: a skipped run inserts no rows, which is the same outcome as a run
	// where nothing new was played. Only the run that *discovers* the rate
	// limit fails (below), so the scheduler reports it once instead of once
	// per run for as long as the penalty lasts.
	const cooling = spotifyCooldownMs();
	if (cooling > 0) {
		return json({
			fetched: 0,
			inserted: 0,
			skipped: 'rate_limited',
			retryInSeconds: Math.ceil(cooling / 1000)
		});
	}

	let accessToken: string;
	try {
		accessToken = await getSpotifyAccessToken();
	} catch (e) {
		// A refresh failure used to surface as an unhandled 500 with the reason
		// only in the container log. The scheduled task sees this body.
		if (e instanceof SpotifyAuthError) error(502, e.message);
		throw e;
	}

	const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
		headers: { Authorization: `Bearer ${accessToken}` },
		signal: AbortSignal.timeout(10_000)
	});

	if (res.status === 403) error(403, 'Missing user-read-recently-played scope');
	// The run that discovers the rate limit is the one that fails, so it shows
	// up in the scheduler once. Every run until the window closes takes the
	// skip path above.
	if (res.status === 429) {
		const ms = noteSpotifyRateLimit(res);
		error(429, `Rate limited by Spotify; retry in ${Math.ceil(ms / 1000)}s`);
	}
	if (!res.ok) error(res.status, `Spotify API request failed (${res.status})`);

	const data = await res.json();
	const records: PlayRecord[] = (data.items ?? [])
		.map(
			(entry: {
				track: {
					name: string;
					duration_ms: number;
					artists: { name: string }[];
					album?: { name?: string };
					uri?: string;
				};
				played_at: string;
			}) => {
				if (!entry.track?.name || !entry.played_at) return null;
				return {
					playedAt: new Date(entry.played_at).toISOString(),
					// recently-played doesn't report actual listen duration, only
					// track length — approximate assuming a full play.
					msPlayed: entry.track.duration_ms ?? 0,
					track: entry.track.name,
					artist: entry.track.artists?.map((a) => a.name).join(', ') ?? '',
					album: entry.track.album?.name ?? null,
					spotifyUri: entry.track.uri ?? null,
					platform: 'live-scrobble',
					shuffle: null,
					skipped: null
				} satisfies PlayRecord;
			}
		)
		.filter((r: PlayRecord | null): r is PlayRecord => r !== null && r.msPlayed > 0);

	const { inserted } = insertPlays(records);
	return json({ fetched: records.length, inserted });
};
