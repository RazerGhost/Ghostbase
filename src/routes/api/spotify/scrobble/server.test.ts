import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '$env/dynamic/private';
import { __resetSpotifyForTests, noteSpotifyRateLimit } from '$lib/server/spotify';
import { GET } from './+server';

const SECRET = 'test-scrobble-secret';
const KEYS = [
	'SPOTIFY_SCROBBLE_SECRET',
	'SPOTIFY_CLIENT_ID',
	'SPOTIFY_CLIENT_SECRET',
	'SPOTIFY_REFRESH_TOKEN'
] as const;
let original: Record<string, string | undefined>;

/** The handler only reads `url` and `request`, so a bare pair is enough. */
function call() {
	const url = new URL('https://example.test/api/spotify/scrobble');
	const request = new Request(url, { headers: { authorization: `Bearer ${SECRET}` } });
	return GET({ url, request } as never);
}

function rateLimitResponse(retryAfter: string): Response {
	return new Response('', { status: 429, headers: { 'retry-after': retryAfter } });
}

beforeEach(() => {
	original = Object.fromEntries(KEYS.map((k) => [k, env[k]]));
	env.SPOTIFY_SCROBBLE_SECRET = SECRET;
	env.SPOTIFY_CLIENT_ID = 'id';
	env.SPOTIFY_CLIENT_SECRET = 'secret';
	env.SPOTIFY_REFRESH_TOKEN = 'refresh';
	__resetSpotifyForTests();
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	for (const k of KEYS) {
		if (original[k] === undefined) delete env[k];
		else env[k] = original[k];
	}
	__resetSpotifyForTests();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('scrobble endpoint under a Spotify rate limit', () => {
	it('reports a skipped run as a success, so the scheduler does not alert on every run', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		noteSpotifyRateLimit(rateLimitResponse('600'));

		const res = await call();

		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({
			fetched: 0,
			inserted: 0,
			skipped: 'rate_limited'
		});
		// The whole point of skipping: no request is spent being told "429" again.
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reports how long is left so the run says why it did nothing', async () => {
		vi.stubGlobal('fetch', vi.fn());
		noteSpotifyRateLimit(rateLimitResponse('600'));

		const body = await (await call()).json();

		expect(body.retryInSeconds).toBeGreaterThan(590);
		expect(body.retryInSeconds).toBeLessThanOrEqual(600);
	});

	it('still fails on the run that discovers the rate limit', async () => {
		// Token refresh succeeds, then Spotify rate-limits the data call — the
		// asymmetry that makes the scheduler report this once rather than once
		// per run until the window closes.
		const fetchMock = vi.fn(async (input: string | URL | Request) => {
			const href = typeof input === 'string' ? input : input.toString();
			if (href.includes('accounts.spotify.com')) {
				return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }), {
					status: 200
				});
			}
			return rateLimitResponse('600');
		});
		vi.stubGlobal('fetch', fetchMock);

		await expect(call()).rejects.toMatchObject({ status: 429 });
	});

	it('rejects a wrong secret before doing anything else', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const url = new URL('https://example.test/api/spotify/scrobble');
		const request = new Request(url, { headers: { authorization: 'Bearer nope' } });
		await expect(GET({ url, request } as never)).rejects.toMatchObject({ status: 401 });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
