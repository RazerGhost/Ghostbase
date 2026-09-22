import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from '$env/dynamic/private';

// In-memory access-token cache (per server process). Refreshed lazily once
// it's within 60s of expiring. Shared by every route that still talks to
// Spotify's own API (recently-played history, live scrobbling) so they don't
// each keep their own cache. Currently-playing no longer lives here — see
// stores/lanyard.svelte.ts.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// Single-flight guard: when the cache is cold, concurrent requests (recent +
// scrobble) would otherwise each hit the token endpoint at once — share one
// in-flight refresh instead.
let refreshInFlight: Promise<string> | null = null;

// Spotify may hand back a rotated refresh_token when an access token is
// refreshed, and the one it replaces stops working. Reading only the env var
// would mean the app keeps presenting a token Spotify has already retired, and
// the next restart strands it for good. Hold the newest one we have seen for
// the life of the process and say loudly that the env var needs updating — the
// token value itself is never logged.
let rotatedRefreshToken: string | null = null;

function currentRefreshToken(): string | undefined {
	return rotatedRefreshToken ?? env.SPOTIFY_REFRESH_TOKEN;
}

export function spotifyConfigured(): boolean {
	return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && currentRefreshToken());
}

// Shared 429 backoff. Spotify answers a rate-limited app with 429 and a
// Retry-After header; calling again before that window closes is what turns a
// short penalty into a long one. Both callers below (the widget's
// recently-played poll and the scrobble job) check this before going upstream,
// so one rate-limited response quiets the whole process rather than just the
// caller that happened to hit it.
//
// It is written to the data volume because it used to be a bare module
// variable, and Spotify hands out penalties in hours — one observed run was
// told to retry in 30,000 seconds, which is eight and a half. A redeploy
// replaces the container, so every deploy during a penalty forgot it and went
// straight back at Spotify, which is how a short ban becomes a long one. On a
// day with eleven deploys that is eleven fresh starts.
let backoffPathOverride: string | null = null;

const BACKOFF_FILE = () =>
	backoffPathOverride ?? path.join(process.cwd(), 'data', 'spotify-backoff.json');

let rateLimitedUntil = readBackoff();

function readBackoff(): number {
	try {
		const raw = JSON.parse(fs.readFileSync(BACKOFF_FILE(), 'utf-8')) as { until?: unknown };
		return typeof raw.until === 'number' && Number.isFinite(raw.until) ? raw.until : 0;
	} catch {
		// No file yet, unreadable, or malformed — all mean "not rate limited",
		// which is the same answer a fresh process gave before.
		return 0;
	}
}

function writeBackoff(until: number): void {
	try {
		const file = BACKOFF_FILE();
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, JSON.stringify({ until }), 'utf-8');
	} catch (e) {
		// A read-only or missing volume must not break scrobbling; the backoff
		// just falls back to being process-local, as it was before.
		console.warn('[spotify] could not persist backoff:', e instanceof Error ? e.message : e);
	}
}

/** Milliseconds left on the shared Spotify backoff; 0 when not rate limited. */
export function spotifyCooldownMs(): number {
	return Math.max(0, rateLimitedUntil - Date.now());
}

/**
 * Record a 429 and return the backoff it imposes, honouring Retry-After when
 * Spotify sends one. Capped at a day so a malformed header cannot pin the
 * integration off indefinitely.
 */
export function noteSpotifyRateLimit(res: Response): number {
	const header = res.headers.get('retry-after')?.trim();
	const seconds = header && /^\d+$/.test(header) ? Number(header) : 60;
	const ms = Math.min(seconds, 86_400) * 1000;
	rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + ms);
	writeBackoff(rateLimitedUntil);
	console.warn(
		`[spotify] rate limited (429), backing off ${seconds}s` +
			(header ? ' (Retry-After)' : ' (no Retry-After header, using default)')
	);
	return ms;
}

/**
 * Thrown when Spotify rejects the refresh token. Carries the upstream status
 * and OAuth error code so callers can say something better than "500".
 */
export class SpotifyAuthError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: string | null
	) {
		super(message);
		this.name = 'SpotifyAuthError';
	}
}

/**
 * Turn a failed token response into one readable line.
 *
 * Spotify answers with `{"error":"invalid_grant","error_description":"Refresh
 * token revoked"}`, which is the whole diagnosis — this used to be dropped on
 * the floor in favour of the bare status code, so a revoked token and a
 * misconfigured client id were indistinguishable in the logs.
 *
 * Exported for the test; `body` is the raw response text.
 */
export function describeTokenError(
	status: number,
	body: string
): { message: string; code: string | null } {
	let code: string | null = null;
	let description: string | null = null;
	try {
		const parsed = JSON.parse(body);
		if (typeof parsed?.error === 'string') code = parsed.error;
		else if (typeof parsed?.error?.message === 'string') description = parsed.error.message;
		if (typeof parsed?.error_description === 'string') description = parsed.error_description;
	} catch {
		// Not JSON — fall back to the raw text, trimmed so a stray HTML error
		// page cannot flood the log.
		description = body.trim().slice(0, 200) || null;
	}

	const detail = [code, description].filter(Boolean).join(': ');
	return {
		message: detail ? `${status} ${detail}` : String(status),
		code
	};
}

async function refreshAccessToken(): Promise<string> {
	const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString(
		'base64'
	);

	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${basic}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: currentRefreshToken() ?? ''
		}),
		signal: AbortSignal.timeout(10_000)
	});

	if (!res.ok) {
		const { message, code } = describeTokenError(res.status, await res.text().catch(() => ''));
		throw new SpotifyAuthError(`Spotify token refresh failed: ${message}`, res.status, code);
	}

	const data = await res.json();
	if (typeof data.access_token !== 'string' || typeof data.expires_in !== 'number') {
		throw new SpotifyAuthError('Spotify token refresh: malformed response', res.status, null);
	}

	if (typeof data.refresh_token === 'string' && data.refresh_token !== currentRefreshToken()) {
		rotatedRefreshToken = data.refresh_token;
		console.warn(
			'[spotify] Spotify issued a rotated refresh token. It is held in memory for this ' +
				'process only — update SPOTIFY_REFRESH_TOKEN in Coolify, or scrobbling will fail ' +
				'after the next restart.'
		);
	}

	cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
	return cachedToken.accessToken;
}

/**
 * Test-only escape hatch, mirrors simkl-auth.ts. Clears every piece of
 * per-process state so one test's rate-limit or token cache cannot leak into
 * the next.
 */
/**
 * `backoffPath` is not optional decoration: noteSpotifyRateLimit writes the
 * cooldown to disk now, and the existing rate-limit tests call it several
 * times. Without redirecting the file they write a real backoff into data/,
 * and local dev then quietly refuses to call Spotify for as long as the last
 * test's Retry-After said — ten minutes, in the case that caught this.
 */
let resetCount = 0;

export function __resetSpotifyForTests(backoffPath?: string): void {
	cachedToken = null;
	refreshInFlight = null;
	rotatedRefreshToken = null;
	recentCache = null;
	recentInFlight = null;
	// A path of its own each time, so one test's cooldown cannot leak into
	// the next through the file. Given a path, it loads what is there instead
	// — which is what lets a test model a redeploy: same volume, new process.
	backoffPathOverride =
		backoffPath ??
		path.join(os.tmpdir(), `ghostbase-spotify-backoff-${process.pid}-${++resetCount}.json`);
	rateLimitedUntil = readBackoff();
}

export async function getSpotifyAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
		return cachedToken.accessToken;
	}

	if (!refreshInFlight) {
		refreshInFlight = refreshAccessToken().finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
}

export interface RecentlyPlayedItem {
	track: string;
	artist?: string;
	url?: string;
	albumArt?: string;
	playedAt: string;
}

export interface RecentlyPlayed {
	available: boolean;
	items: RecentlyPlayedItem[];
	reason?: 'missing_scope';
}

// SpotifyWidget is mounted on every page and polls this while open, so this
// cache collapses concurrent pollers into a single upstream call.
//
// It was 30s, which made the cache a FLOOR as much as a ceiling: while any
// tab anywhere was open — a hidden one, a crawler's — this sustained two
// upstream calls a minute forever. Measured against a 15-minute scrobble
// schedule that is 2,880 calls a day here against 96 there, so ~96% of
// everything this app asks Spotify for came from a widget nobody was looking
// at. That is what earned the 429, not the scrobble job it surfaced on.
//
// 150s is chosen against the data rather than against a feeling: the list is
// "recently played", and an entry cannot appear faster than a track can end.
// Nothing is lost, and the upstream floor drops fivefold.
const RECENT_CACHE_MS = 150_000;
let recentCache: { data: RecentlyPlayed; fetchedAt: number } | null = null;
let recentInFlight: Promise<RecentlyPlayed> | null = null;

async function fetchRecentlyPlayed(): Promise<RecentlyPlayed> {
	// Already rate limited — do not spend another request confirming it.
	if (spotifyCooldownMs() > 0) return { available: false, items: [] };

	const accessToken = await getSpotifyAccessToken();
	const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
		headers: { Authorization: `Bearer ${accessToken}` },
		signal: AbortSignal.timeout(10_000)
	});

	// Requires the `user-read-recently-played` scope on top of
	// `user-read-currently-playing` — a refresh token minted before that
	// scope was requested won't have it.
	if (res.status === 403) return { available: false, items: [], reason: 'missing_scope' };
	if (res.status === 429) {
		noteSpotifyRateLimit(res);
		return { available: false, items: [] };
	}
	if (!res.ok) {
		// Used to vanish silently: a non-OK response became an ordinary
		// "nothing to show" result and was cached as one, so an outage looked
		// exactly like an idle account.
		console.warn(`[spotify] recently-played failed: ${res.status}`);
		return { available: false, items: [] };
	}

	const data = await res.json();
	const items: RecentlyPlayedItem[] = (data.items ?? []).map(
		(entry: {
			track: {
				name: string;
				artists: { name: string }[];
				external_urls?: { spotify?: string };
				album?: { images?: { url: string }[] };
			};
			played_at: string;
		}) => ({
			track: entry.track.name,
			artist: entry.track.artists?.map((a) => a.name).join(', '),
			url: entry.track.external_urls?.spotify,
			albumArt: entry.track.album?.images?.[2]?.url ?? entry.track.album?.images?.[0]?.url,
			playedAt: entry.played_at
		})
	);

	return { available: true, items };
}

export async function getRecentlyPlayed(): Promise<RecentlyPlayed> {
	const now = Date.now();
	if (recentCache && now - recentCache.fetchedAt < RECENT_CACHE_MS) return recentCache.data;

	if (!recentInFlight) {
		recentInFlight = fetchRecentlyPlayed()
			.then((data) => {
				recentCache = { data, fetchedAt: Date.now() };
				return data;
			})
			.finally(() => {
				recentInFlight = null;
			});
	}
	return recentInFlight;
}
