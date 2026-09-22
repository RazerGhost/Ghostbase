import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '$env/dynamic/private';
import {
	__resetSpotifyForTests,
	describeTokenError,
	getRecentlyPlayed,
	noteSpotifyRateLimit,
	spotifyCooldownMs
} from './spotify';

const KEYS = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'] as const;
let original: Record<string, string | undefined>;

function rateLimitResponse(retryAfter?: string): Response {
	return new Response('', {
		status: 429,
		headers: retryAfter ? { 'retry-after': retryAfter } : {}
	});
}

beforeEach(() => {
	original = Object.fromEntries(KEYS.map((k) => [k, env[k]]));
	for (const k of KEYS) env[k] = 'test-value';
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

describe('describeTokenError', () => {
	it('surfaces the OAuth error code and description Spotify sends', () => {
		const { message, code } = describeTokenError(
			400,
			JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token revoked' })
		);
		expect(code).toBe('invalid_grant');
		expect(message).toBe('400 invalid_grant: Refresh token revoked');
	});

	it('still reports the code when there is no description', () => {
		const { message, code } = describeTokenError(400, JSON.stringify({ error: 'invalid_client' }));
		expect(code).toBe('invalid_client');
		expect(message).toBe('400 invalid_client');
	});

	it('falls back to the raw body when the response is not JSON', () => {
		const { message, code } = describeTokenError(502, '  Bad Gateway  ');
		expect(code).toBeNull();
		expect(message).toBe('502 Bad Gateway');
	});

	it('truncates a long non-JSON body so an HTML error page cannot flood the log', () => {
		const { message } = describeTokenError(500, '<html>' + 'x'.repeat(5000));
		expect(message.length).toBeLessThan(230);
	});

	it('degrades to the bare status when the body is empty', () => {
		expect(describeTokenError(503, '').message).toBe('503');
	});
});

describe('rate-limit backoff', () => {
	it('is not cooling down by default', () => {
		expect(spotifyCooldownMs()).toBe(0);
	});

	it('honours Retry-After', () => {
		noteSpotifyRateLimit(rateLimitResponse('120'));
		const remaining = spotifyCooldownMs();
		expect(remaining).toBeGreaterThan(115_000);
		expect(remaining).toBeLessThanOrEqual(120_000);
	});

	it('falls back to a minute when Spotify sends no Retry-After', () => {
		noteSpotifyRateLimit(rateLimitResponse());
		expect(spotifyCooldownMs()).toBeGreaterThan(55_000);
		expect(spotifyCooldownMs()).toBeLessThanOrEqual(60_000);
	});

	it('ignores a malformed Retry-After rather than trusting it', () => {
		noteSpotifyRateLimit(rateLimitResponse('not-a-number'));
		expect(spotifyCooldownMs()).toBeLessThanOrEqual(60_000);
	});

	it('caps the backoff at a day so a bad header cannot disable the integration', () => {
		noteSpotifyRateLimit(rateLimitResponse('999999999'));
		expect(spotifyCooldownMs()).toBeLessThanOrEqual(86_400_000);
	});

	it('never shortens an existing cooldown', () => {
		noteSpotifyRateLimit(rateLimitResponse('600'));
		noteSpotifyRateLimit(rateLimitResponse('5'));
		expect(spotifyCooldownMs()).toBeGreaterThan(500_000);
	});

	// The cooldown is written to the data volume, because it used to be a bare
	// module variable: Spotify hands out penalties in hours — one run was told
	// to retry in 30,000 seconds — and a redeploy replaced the container and
	// forgot it, so every deploy during a penalty went straight back at
	// Spotify. On a day with eleven deploys that is eleven fresh starts.
	it('survives a restart, which is the whole point of writing it down', async () => {
		const file = path.join(
			fs.mkdtempSync(path.join(os.tmpdir(), 'ghostbase-backoff-')),
			'backoff.json'
		);
		__resetSpotifyForTests(file);
		noteSpotifyRateLimit(rateLimitResponse('3600'));
		expect(spotifyCooldownMs()).toBeGreaterThan(3_500_000);

		// A redeploy: fresh module, same volume.
		vi.resetModules();
		const fresh = await import('./spotify');
		fresh.__resetSpotifyForTests(file);
		expect(fresh.spotifyCooldownMs()).toBeGreaterThan(3_500_000);
	});

	it('treats an unreadable backoff file as not rate limited', async () => {
		const file = path.join(
			fs.mkdtempSync(path.join(os.tmpdir(), 'ghostbase-backoff-')),
			'backoff.json'
		);
		fs.writeFileSync(file, 'not json at all', 'utf-8');
		vi.resetModules();
		const fresh = await import('./spotify');
		fresh.__resetSpotifyForTests(file);
		expect(fresh.spotifyCooldownMs()).toBe(0);
	});

	it('does not call Spotify while cooling down', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		noteSpotifyRateLimit(rateLimitResponse('300'));
		const result = await getRecentlyPlayed();

		// The whole point: a rate-limited process stops asking. Calling again
		// before the window closes is what turns a short penalty into a long one.
		expect(fetchMock).not.toHaveBeenCalled();
		expect(result).toEqual({ available: false, items: [] });
	});
});
