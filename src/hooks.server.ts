import { error, redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE_NAME, verifySessionToken } from '$lib/server/session';
import { startSimklRefreshLoop } from '$lib/server/simkl-refresh';
import { checkRateLimit } from '$lib/server/rate-limit';

startSimklRefreshLoop();

// Auth is enforced here, not (only) in +layout.server.ts loads: form actions
// run *before* layout load functions, so a layout redirect alone would let an
// unauthenticated POST hit an action's side effects first. The per-endpoint
// locals.user checks in +server.ts files stay as defense in depth.
const PROTECTED_PREFIXES = ['/admin', '/spotify-import'];

function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Auth endpoints get a generous limit since legitimate OAuth redirects can
// bounce through here more than once; secret-gated endpoints are meant to be
// hit by a scheduled job every 15-30 min, so a tight limit doesn't interfere.
const RATE_LIMITED_ROUTES: { prefix: string; limit: number; windowSeconds: number }[] = [
	{ prefix: '/auth/login', limit: 10, windowSeconds: 60 },
	{ prefix: '/auth/callback', limit: 10, windowSeconds: 60 },
	{ prefix: '/api/backup', limit: 5, windowSeconds: 60 },
	{ prefix: '/api/spotify/scrobble', limit: 5, windowSeconds: 60 },
	// The only public route that can cost an upstream Spotify call. It was the
	// one secretless endpoint here with no limit at all, which made it the
	// cheapest way for anything — a crawler, a stuck tab, a script — to spend
	// our shared refresh token's quota. The server cache absorbs bursts; this
	// stops a single client sustaining one.
	{ prefix: '/api/spotify/recent', limit: 20, windowSeconds: 60 }
];

// Requests arrive via Cloudflare -> Traefik -> app, so the socket address is
// always Traefik's and X-Forwarded-For's last hop is a Cloudflare edge. Keying
// on either would put every visitor in one bucket, letting anyone exhaust the
// login or cron limits for everyone. Cloudflare sets CF-Connecting-IP to the
// real client and overwrites any client-sent value. It's absent on direct
// calls (the in-container backup/scrobble helpers), which fall back to the
// socket address. adapter-node's ADDRESS_HEADER isn't used because it throws
// when the header is missing, which would break those helpers.
function clientAddress(event: RequestEvent): string {
	return event.request.headers.get('cf-connecting-ip')?.trim() || event.getClientAddress();
}

const SECURITY_HEADERS: Record<string, string> = {
	// No script-src/style-src policy yet: the theme script, embeds and inline
	// styles would need nonces or hashes first. These directives are safe now.
	'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

function applySecurityHeaders(response: Response): Response {
	const headers = { ...SECURITY_HEADERS };
	// Only razerghost.xyz itself, no includeSubDomains or preload, so it can't
	// lock out a subdomain that isn't on HTTPS.
	if (!dev) headers['Strict-Transport-Security'] = 'max-age=31536000';
	for (const [name, value] of Object.entries(headers)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	return response;
}

// error()/redirect() thrown below bypass applySecurityHeaders, which is fine
// for 401s and redirects: they carry no page content to frame or sniff.
export const handle: Handle = async ({ event, resolve }) =>
	applySecurityHeaders(await handleRequest(event, resolve));

async function handleRequest(event: RequestEvent, resolve: Parameters<Handle>[0]['resolve']): Promise<Response> {
	const rateLimited = RATE_LIMITED_ROUTES.find((r) => event.url.pathname === r.prefix || event.url.pathname.startsWith(`${r.prefix}/`));
	if (rateLimited) {
		const key = `${rateLimited.prefix}:${clientAddress(event)}`;
		const result = checkRateLimit(key, rateLimited.limit, rateLimited.windowSeconds);
		if (result.limited) {
			return new Response('Too many requests', {
				status: 429,
				headers: { 'Retry-After': String(result.retryAfterSeconds) }
			});
		}
	}

	const session = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));
	if (session) {
		event.locals.user = { username: session.sub };
	}

	if (!event.locals.user && isProtectedPath(event.url.pathname)) {
		// Only unauthenticated *page* GETs get bounced to the login flow; API
		// paths and side-effectful methods (form actions, API writes) get a
		// plain 401 — redirecting those into an OAuth dance helps nobody.
		const isPageGet =
			!event.url.pathname.startsWith('/api/') &&
			(event.request.method === 'GET' || event.request.method === 'HEAD');
		if (!isPageGet) error(401, 'Unauthorized');
		redirect(303, `/auth/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
}
