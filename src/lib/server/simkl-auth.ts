import { env } from '$env/dynamic/private';

export const APP_NAME = 'ghostbase';
export const APP_VERSION = '1.0';

const TOKEN_URL = 'https://api.simkl.com/oauth2/token';

// V2 access tokens live 7 days; refresh a day early rather than waiting for a
// 401, per https://api.simkl.org/api-reference/oauth2-tokens.
const REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;

// After a failed refresh (Simkl down, grant revoked), don't retry on every
// page load — the library already falls back to its snapshot, so hammering
// the token endpoint buys nothing.
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

type CachedToken = { accessToken: string; expiresAt: number; refreshToken: string };
type AuthState = { token?: CachedToken; inflight?: Promise<string>; failedAt?: number };

// Memory only, deliberately: the access token is re-mintable from
// SIMKL_REFRESH_TOKEN at any time (refresh tokens don't rotate), and anything
// written to data/ ends up in the backup git remote — Simkl auto-revokes
// tokens it finds on GitHub, and revoking the access token kills the whole
// grant. globalThis so Vite's dev HMR doesn't drop it and refresh again,
// which would invalidate the token the previous module instance handed out.
const STATE_KEY = Symbol.for('razerghost.simklAuth');
function state(): AuthState {
	const g = globalThis as typeof globalThis & { [STATE_KEY]?: AuthState };
	return (g[STATE_KEY] ??= {});
}

// 'v2' = AUTH V2 refresh-token grant. 'v1' = the legacy long-lived
// SIMKL_ACCESS_TOKEN, which Simkl retires around April 2027 — kept only so an
// existing deployment keeps working until its env is switched over.
export function simklAuthMode(): 'v2' | 'v1' | null {
	if (!env.SIMKL_CLIENT_ID) return null;
	if (env.SIMKL_REFRESH_TOKEN) return 'v2';
	if (env.SIMKL_ACCESS_TOKEN) return 'v1';
	return null;
}

async function refresh(refreshToken: string): Promise<string> {
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': `${APP_NAME}/${APP_VERSION}`
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			client_id: env.SIMKL_CLIENT_ID ?? '',
			refresh_token: refreshToken
		}),
		signal: AbortSignal.timeout(10_000)
	});

	const data = await res.json().catch(() => ({}));
	if (!res.ok || typeof data.access_token !== 'string') {
		// Only Simkl's error code, never the body — it could echo credentials.
		// invalid_grant = revoked or 180 days unused: run scripts/simkl-token.mjs again.
		throw new Error(`Simkl token refresh failed: ${res.status} ${data.error ?? ''}`.trim());
	}

	const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 7 * 24 * 60 * 60;
	state().token = { accessToken: data.access_token, expiresAt: Date.now() + expiresIn * 1000, refreshToken };
	return data.access_token;
}

// Returns a usable access token, refreshing if needed. Pass `rejected` after
// a 401 to force a refresh — but only if that token is still the current
// one, so parallel requests that all 401 on the same token trigger a single
// refresh instead of each one invalidating the token the others just got.
export async function getSimklAccessToken(opts: { rejected?: string } = {}): Promise<string> {
	const mode = simklAuthMode();
	if (mode === 'v1') return env.SIMKL_ACCESS_TOKEN ?? '';
	if (mode !== 'v2') throw new Error('Simkl not configured');

	const s = state();
	const refreshToken = env.SIMKL_REFRESH_TOKEN ?? '';
	// A new refresh token in env means a new grant — the cached access token
	// belongs to the old one.
	if (s.token && s.token.refreshToken !== refreshToken) s.token = undefined;

	const current = s.token;
	const usable =
		current && current.accessToken !== opts.rejected && current.expiresAt - Date.now() > REFRESH_MARGIN_MS;
	if (usable) return current.accessToken;

	if (s.inflight) return s.inflight;
	if (s.failedAt && Date.now() - s.failedAt < FAILURE_COOLDOWN_MS) {
		// Still inside its 7 days even if within the refresh margin — better
		// than nothing while the token endpoint is failing.
		if (current && current.accessToken !== opts.rejected && current.expiresAt > Date.now()) return current.accessToken;
		throw new Error('Simkl token refresh failed recently; waiting before retrying');
	}

	s.inflight = refresh(refreshToken)
		.then((token) => {
			s.failedAt = undefined;
			return token;
		})
		.catch((err) => {
			s.failedAt = Date.now();
			throw err;
		})
		.finally(() => {
			s.inflight = undefined;
		});
	return s.inflight;
}

export function __resetSimklAuthForTests(): void {
	const s = state();
	s.token = undefined;
	s.inflight = undefined;
	s.failedAt = undefined;
}
