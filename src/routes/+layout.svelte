<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
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
	import { offlineNavigation } from '$lib/stores/offline-navigation.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// The private side supplies its own head and dock (see admin/+layout.svelte):
	// a dock whose cells are the public pages is the wrong set of destinations
	// while you are editing, and the footer's RSS and social links have no job
	// there at all. The ground, the fonts and the command palette stay shared.
	const admin = $derived(isAdminPath(page.url.pathname));

	// design.md § Loading. While a navigation's data is loading, the page
	// being left gives way to a skeleton of the one being opened — but only
	// once the load has run past SKELETON_DELAY_MS, so a page whose data is
	// already in hand never flashes one.
	let skeleton = $state<Skeleton | null>(null);

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
			window.scrollTo(0, 0);
		}, SKELETON_DELAY_MS);
		return () => clearTimeout(timer);
	});

	// Offline, a navigation's data request cannot reach the server, and
	// SvelteKit's answer to that is a full page load — the browser's own
	// "No internet" page, with the site gone. So a navigation that is about
	// to fail that way is held back here and OfflineNotice stands in for it.
	// navigator.onLine only knows about a missing connection, not a bad one;
	// a request that dies on a flaky one still takes the browser's route.
	beforeNavigate((nav) => {
		if (nav.willUnload || !nav.to || nav.type === 'form' || navigator.onLine) return;
		// A jump to a heading on the page being read needs no network.
		if (nav.to.url.pathname === page.url.pathname && nav.to.url.search === page.url.search) return;
		nav.cancel();
		offlineNavigation.target = nav.to.url;
		window.scrollTo(0, 0);
	});
	afterNavigate(() => {
		offlineNavigation.target = null;
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
		{:else}
			{@render children()}
		{/if}
	</div>
	{#if !admin}
		<Footer />
		<Dock />
	{/if}
	<CommandPalette entries={data.commandPaletteEntries} />
</div>
