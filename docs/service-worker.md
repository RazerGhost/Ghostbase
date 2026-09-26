# Service worker

[src/service-worker.ts](../src/service-worker.ts), with its decisions in [src/lib/service-worker/](../src/lib/service-worker/).

## What it does

One thing: when a **page load** can't reach the network at all, it answers with an offline page, not the browser's own "No internet" screen. The page matches the site, retries by itself when the connection comes back, and says "couldn't reach the site" rather than "you're offline" when the device has a connection but the server didn't answer.

It's the full-page half of the offline handling. The other half is [OfflineNotice.svelte](../src/lib/components/OfflineNotice.svelte), which catches navigations inside an already-loaded page before they start. The worker covers what that can't:

- a first visit or a reload with no connection;
- a connection that drops partway through a navigation, where SvelteKit gives up and falls back to a full page load.

## What it deliberately doesn't do

Each of these is a common way for a service worker to make a site hard to debug, so none of them happens here:

- **It caches no pages, page data or app code.** Every page load goes to the network, and the network's answer is passed through untouched. There's never a stale page or an old build.
- **It passes HTTP errors through.** A 404, a 500 or a Traefik 502 reaches the browser exactly as sent. The fallback is only for a request that got **no response at all**, meaning a network error.
- **It ignores everything that isn't a page load.** Fetches, images, API calls and `__data.json` never go near it. The one exception is the three woff2 files the offline page is set in; they're fingerprinted and immutable, so a cached copy can't be stale.
- **It leaves `/auth/*` alone.** The OAuth callback carries a one-time code, and the offline page's auto-retry would replay a spent code.
- **It isn't registered under `pnpm dev`.** A worker in dev would sit between the browser and Vite, outlive the dev server, and turn "dev server not running" into an offline page. The layout also removes any registration left on the dev origin.

## Debugging with it installed

- **Is a response from the worker?** In DevTools → Network, every page load shows as served by the service worker, because it forwards all of them. That's expected; the response itself is the server's, headers and status included. A response the worker **made up** is a `503` carrying `X-Ghostbase-SW: offline-fallback`. A 503 *without* that header came from the server.
- **Which version is running?** The worker logs `[service worker] <version> active` when it takes over. The version is SvelteKit's build timestamp. DevTools → Application → Service workers shows the same.
- **Updates:** each deploy is a new worker, and it takes over at once (`skipWaiting` + `clients.claim`). Because it holds no app code, there's no old site for it to be out of step with. Browsers check for a new worker on navigation, bypassing the HTTP cache.
- **Local production builds:** `pnpm preview` / `node build/index.js` **do** register the worker on that origin (e.g. `localhost:4173`). If you stop that server and reload, you get the offline page, which on localhost says so and points here, instead of Chrome's "connection refused". To get the plain browser behaviour back: DevTools → Application → Service workers → **Unregister**, or tick **Bypass for network**.
- **Hard reload** (Shift+reload) also bypasses the worker for that one load.

## Turning it off

`SERVICE_WORKER_ENABLED` in [policy.ts](../src/lib/service-worker/policy.ts) is the kill switch. Set it to `false` and deploy. On each visitor's next visit:

- the layout stops registering the worker, unregisters any registration it finds and deletes its cache; and
- if the page's own JS never runs (a broken client build, say), the worker itself deletes its cache, unregisters and reloads open tabs **once**.

Both halves read the same constant on purpose. If only the worker switched off, the layout would re-register it on the reload, and the tab would reload forever. Both paths were tested against a browser with the worker installed: no registration and no cache afterwards, and no reload loop.

To remove the worker for good, leave the switch off for a while (visitors only pick it up when they come back), then delete `src/service-worker.ts` and the register call in [+layout.svelte](../src/routes/+layout.svelte). Deleting the file straight away would leave installed workers orphaned: the browser keeps running the last one it has until it can fetch a replacement.
