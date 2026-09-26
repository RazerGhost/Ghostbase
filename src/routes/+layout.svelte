<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import { dev } from '$app/environment';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { page, navigating } from '$app/state';
	import { isAdminPath } from '$lib/config';
	import { skeletonFor, SKELETON_DELAY_MS, type Skeleton } from '$lib/navigation-skeleton';
	import RunningHead from '$lib/components/RunningHead.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import OfflineNotice from '$lib/components/OfflineNotice.svelte';
	import { CACHE_PREFIX, SERVICE_WORKER_ENABLED } from '$lib/service-worker/policy';
	import { isLocalHost, offlineNavigation } from '$lib/stores/offline-navigation.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// design.md § Loading. While a navigation's data is loading, the page
	// being left gives way to a skeleton of the one being opened — but only
	// once the load has run past SKELETON_DELAY_MS, so a page whose data is
	// already in hand never flashes one.
	let skeleton = $state<Skeleton | null>(null);

	// The private side supplies its own head and dock (see admin/+layout.svelte):
	// a dock whose cells are the public pages is the wrong set of destinations
	// while you are editing, and the footer's RSS and social links have no job
	// there at all. The ground, the fonts and the command palette stay shared.
	//
	// Declared after `skeleton` because it depends on it: a skeleton only ever
	// stands in for a public page (navigation-skeleton.ts skips admin
	// destinations), so while one is up the public head and dock belong on
	// screen — even when the page being left is an admin one, whose own
	// chrome has just been unmounted with it.
	const admin = $derived(!skeleton && isAdminPath(page.url.pathname));

	$effect(() => {
		const next = skeletonFor(navigating);
		if (!next) {
			skeleton = null;
			return;
		}
		// Already showing one and the reader tapped somewhere else: switch
		// to the new destination at once rather than waiting out the delay
		// again with the old destination's skeleton on screen.
		if (untrack(() => skeleton)) {
			skeleton = next;
			return;
		}
		const timer = setTimeout(() => {
			skeleton = next;
			// The skeleton is a new page, so it starts where a new page does.
			// Without this, a reader deep in a long page lands partway down a
			// short skeleton, or past its end in the footer. SvelteKit still
			// restores the saved position afterwards on back/forward.
			// 'instant' because tokens.css sets scroll-behavior: smooth on the
			// root, which a bare scrollTo(0, 0) obeys — the skeleton would
			// glide up the whole page instead of simply starting at the top.
			window.scrollTo({ top: 0, behavior: 'instant' });
		}, SKELETON_DELAY_MS);
		return () => clearTimeout(timer);
	});

	// Offline, a navigation's data request cannot reach the server, and
	// SvelteKit's answer to that is a full page load — with no service worker
	// that is the browser's own "No internet" page, and with one it is still a
	// full reload that drops the dock and the page being read. So a navigation
	// that is about to fail that way is held back here and OfflineNotice
	// stands in for it. navigator.onLine only knows about a missing
	// connection, not a bad one; a request that dies on a flaky one still
	// takes the full-load route (and the service worker catches that).
	beforeNavigate((nav) => {
		if (nav.willUnload || !nav.to || nav.type === 'form' || navigator.onLine) return;
		// navigator.onLine describes the device, not the server. Under `pnpm
		// dev` or a preview build on this machine, a laptop with no network
		// still reaches its own server fine — holding navigation back there
		// would make the whole site, admin editors included, unusable offline.
		if (dev || isLocalHost(location.hostname)) return;
		// The admin editors guard unsaved work with their own beforeNavigate
		// (UnsavedGuard.svelte). Stepping in here first would put the notice
		// over an editor with edits in it; leave those pages to their guard.
		if (admin) return;
		// A jump to a heading on the page being read needs no network.
		if (nav.to.url.pathname === page.url.pathname && nav.to.url.search === page.url.search) return;
		nav.cancel();
		offlineNavigation.scrollY = window.scrollY;
		offlineNavigation.target = nav.to.url;
		window.scrollTo({ top: 0, behavior: 'instant' });
	});
	afterNavigate(() => {
		offlineNavigation.target = null;
	});

	// The service worker (src/service-worker.ts) covers full page loads that
	// cannot reach the network. Never under `pnpm dev`: a worker there sits
	// between the browser and Vite, outlives the dev server, and turns "the
	// dev server is not running" into an offline page. Any registration left
	// on the dev origin by an earlier build is removed for the same reason,
	// and the same path is the kill switch's (SERVICE_WORKER_ENABLED).
	$effect(() => {
		if (!('serviceWorker' in navigator)) return;
		if (dev || !SERVICE_WORKER_ENABLED) {
			void navigator.serviceWorker
				.getRegistrations()
				.then((registrations) => registrations.forEach((r) => r.unregister()));
			// Unregistering leaves the worker's cache behind, and this path
			// usually runs before a new worker could clear it itself.
			void caches
				.keys()
				.then((keys) => keys.filter((k) => k.startsWith(CACHE_PREFIX)).forEach((k) => caches.delete(k)));
			return;
		}
		navigator.serviceWorker.register('/service-worker.js').catch((err) => {
			// Not fatal — the site works without it; it just loses the
			// offline page. Logged so a failure is visible when looked for.
			console.warn('[service worker] registration failed', err);
		});
	});
</script>

<!-- No ambient glow behind the page: Editorial's ground is flat paper-dark,
     and a radial gradient under everything is the one piece of marketing
     furniture that survived the first pass (design.md § Divergence).

     The order here is the design: the head and the footer are part of the
     document and scroll with it, and only the dock is fixed on top of it
     (design.md § Chrome). `.dock-clear` gives the page its height back under
     the bottom bar on a phone. The dock stays live while a skeleton is up,
     so a mistaken tap can be corrected without waiting for the load. -->
<div class="dock-clear relative flex min-h-screen flex-col bg-bg text-white">
	{#if !admin}
		<RunningHead />
	{/if}
	<div class="relative flex-1">
		{#if offlineNavigation.target}
			<OfflineNotice target={offlineNavigation.target} />
		{:else if skeleton}
			<PageSkeleton {skeleton} />
		{/if}
		<!-- Hidden, not unmounted, under the offline notice: the page the
		     reader tried to leave is still theirs — a half-typed search, an
		     expanded row — and "Back to where I was" should mean it. A
		     skeleton does unmount it: that navigation is going ahead. -->
		{#if !skeleton || offlineNavigation.target}
			<div class={offlineNavigation.target ? 'hidden' : 'contents'}>
				{@render children()}
			</div>
		{/if}
	</div>
	{#if !admin}
		<Footer />
		<Dock />
	{/if}
	<CommandPalette entries={data.commandPaletteEntries} />
</div>
