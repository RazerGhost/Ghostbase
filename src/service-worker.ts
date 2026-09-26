/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * The service worker. It does one thing: when a page load cannot reach the
 * network at all, it answers with an offline page instead of letting the
 * browser show its own "No internet" screen. docs/service-worker.md has the
 * design, and a section on debugging with it installed.
 *
 * What it deliberately does NOT do, because each is a way to make the site
 * confusing to debug:
 *
 * - It caches no pages, no page data and no app code. Every page load goes to
 *   the network and the network's answer is passed through untouched —
 *   including a 404, a 500 or Traefik's 502. The fallback is only for a
 *   request that failed to get any answer at all.
 * - It never touches other requests (fetches, images, API calls). The one
 *   exception is the three font files the offline page is set in, which are
 *   fingerprinted and immutable, so a cached copy cannot be stale.
 * - It is not registered under `pnpm dev` (see +layout.svelte).
 */
import { build, version } from '$service-worker';
import { offlinePage } from '$lib/service-worker/offline-page';
import {
	CACHE_PREFIX,
	SERVICE_WORKER_ENABLED,
	SW_HEADER,
	fallbackAllowed,
	pickFonts
} from '$lib/service-worker/policy';

const sw = self as unknown as ServiceWorkerGlobalScope;

// The kill switch lives in policy.ts, because the layout has to stop
// registering at the same time — see SERVICE_WORKER_ENABLED there.
const SELF_DESTRUCT = !SERVICE_WORKER_ENABLED;

const CACHE = `${CACHE_PREFIX}${version}`;
const fonts = pickFonts(build);
const FONT_PATHS = Object.values(fonts).filter((path): path is string => !!path);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			if (!SELF_DESTRUCT) {
				const cache = await caches.open(CACHE);
				// One at a time and allowed to fail: a font that does not cache
				// costs the offline page its typeface. Failing the install over
				// it would cost the offline page.
				await Promise.all(FONT_PATHS.map((path) => cache.add(path).catch(() => {})));
			}
			// Take over straight away rather than waiting for every tab to
			// close. Safe here because the worker holds no app code: there is
			// no old version of the site for a new worker to be out of step
			// with, and a waiting worker is one more state to reason about.
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key.startsWith(CACHE_PREFIX) && (SELF_DESTRUCT || key !== CACHE)) await caches.delete(key);
			}

			if (SELF_DESTRUCT) {
				await sw.registration.unregister();
				for (const client of await sw.clients.matchAll({ type: 'window' })) {
					client.navigate(client.url);
				}
				console.info('[service worker] self-destructed and unregistered');
				return;
			}

			// Starts the page request in parallel with the worker booting, so
			// having a worker costs a cold phone no extra latency on a page load.
			await sw.registration.navigationPreload?.enable();
			await sw.clients.claim();
			// Which build is in control, in the console, for when "is this the
			// new version?" is the question.
			console.info(`[service worker] ${version} active`);
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	if (SELF_DESTRUCT) return;

	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(navigate(event, url));
	} else if (FONT_PATHS.includes(url.pathname)) {
		event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
	}
	// Anything else: no respondWith, so the browser handles it exactly as it
	// would with no worker installed.
});

async function navigate(event: FetchEvent, url: URL): Promise<Response> {
	try {
		// Always awaited, even when unused: an unsettled preload makes Chrome
		// log a cancellation warning on every page load, which is noise in
		// exactly the console someone is debugging in.
		const preloaded = await event.preloadResponse;
		if (preloaded) return preloaded;
		return await fetch(event.request);
	} catch (err) {
		// Rethrowing hands the failure back to the browser, which shows its
		// own error page — the same result as having no worker.
		if (!fallbackAllowed(url)) throw err;
		return new Response(offlinePage(fonts), {
			// 503, not 200: in DevTools this should read as a failed load,
			// and the header says who answered.
			status: 503,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'no-store',
				[SW_HEADER]: 'offline-fallback'
			}
		});
	}
}
