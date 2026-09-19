import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '$env/dynamic/private';
import { __resetSimklAuthForTests, getSimklAccessToken, simklAuthMode } from './simkl-auth';

const DAY = 24 * 60 * 60 * 1000;
const KEYS = ['SIMKL_CLIENT_ID', 'SIMKL_REFRESH_TOKEN', 'SIMKL_ACCESS_TOKEN'] as const;
let original: Record<string, string | undefined>;

// Each call to the mocked token endpoint mints a fresh, numbered access token.
function mockTokenEndpoint(response?: { status: number; body: object }) {
	let n = 0;
	const fetchMock = vi.fn(async () => {
		if (response) return new Response(JSON.stringify(response.body), { status: response.status });
		n++;
		return new Response(
			JSON.stringify({ access_token: `simkl_at_${n}`, token_type: 'Bearer', expires_in: 7 * 24 * 60 * 60 }),
			{ status: 200 }
		);
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

beforeEach(() => {
	original = Object.fromEntries(KEYS.map((k) => [k, env[k]]));
	env.SIMKL_CLIENT_ID = 'client';
	env.SIMKL_REFRESH_TOKEN = 'simkl_rt_a';
	env.SIMKL_ACCESS_TOKEN = '';
	__resetSimklAuthForTests();
	vi.useFakeTimers();
});

afterEach(() => {
	for (const k of KEYS) env[k] = original[k] as string;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('simklAuthMode', () => {
	it('prefers V2 when a refresh token is set, falls back to V1, else null', () => {
		env.SIMKL_ACCESS_TOKEN = 'legacy';
		expect(simklAuthMode()).toBe('v2');
		env.SIMKL_REFRESH_TOKEN = '';
		expect(simklAuthMode()).toBe('v1');
		env.SIMKL_ACCESS_TOKEN = '';
		expect(simklAuthMode()).toBeNull();
	});
});

describe('getSimklAccessToken', () => {
	it('returns the legacy token in V1 mode without calling Simkl', async () => {
		env.SIMKL_REFRESH_TOKEN = '';
		env.SIMKL_ACCESS_TOKEN = 'legacy';
		const fetchMock = mockTokenEndpoint();
		expect(await getSimklAccessToken()).toBe('legacy');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('sends a refresh_token grant and caches the result', async () => {
		const fetchMock = mockTokenEndpoint();
		expect(await getSimklAccessToken()).toBe('simkl_at_1');
		expect(await getSimklAccessToken()).toBe('simkl_at_1');
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.simkl.com/oauth2/token');
		const body = init.body as URLSearchParams;
		expect(body.get('grant_type')).toBe('refresh_token');
		expect(body.get('refresh_token')).toBe('simkl_rt_a');
		expect(body.get('client_id')).toBe('client');
	});

	it('shares one refresh between concurrent callers', async () => {
		const fetchMock = mockTokenEndpoint();
		const tokens = await Promise.all([getSimklAccessToken(), getSimklAccessToken(), getSimklAccessToken()]);
		expect(tokens).toEqual(['simkl_at_1', 'simkl_at_1', 'simkl_at_1']);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('refreshes once the token is within a day of expiry', async () => {
		const fetchMock = mockTokenEndpoint();
		await getSimklAccessToken();
		vi.advanceTimersByTime(5 * DAY);
		expect(await getSimklAccessToken()).toBe('simkl_at_1');
		vi.advanceTimersByTime(1.5 * DAY);
		expect(await getSimklAccessToken()).toBe('simkl_at_2');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('refreshes on a rejected token only if it is still the current one', async () => {
		const fetchMock = mockTokenEndpoint();
		const first = await getSimklAccessToken();
		// Three parallel requests all 401'd on the same token.
		const retried = await Promise.all([1, 2, 3].map(() => getSimklAccessToken({ rejected: first })));
		expect(retried).toEqual(['simkl_at_2', 'simkl_at_2', 'simkl_at_2']);
		// A late 401 on the old token must not cut off the new one.
		expect(await getSimklAccessToken({ rejected: first })).toBe('simkl_at_2');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('drops the cached token when the env refresh token changes', async () => {
		const fetchMock = mockTokenEndpoint();
		await getSimklAccessToken();
		env.SIMKL_REFRESH_TOKEN = 'simkl_rt_b';
		expect(await getSimklAccessToken()).toBe('simkl_at_2');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('surfaces the error code and backs off after a failed refresh', async () => {
		const fetchMock = mockTokenEndpoint({ status: 400, body: { error: 'invalid_grant' } });
		await expect(getSimklAccessToken()).rejects.toThrow('400 invalid_grant');
		await expect(getSimklAccessToken()).rejects.toThrow('waiting before retrying');
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(6 * 60 * 1000);
		await expect(getSimklAccessToken()).rejects.toThrow('invalid_grant');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
