<script lang="ts">
	/**
	 * The page being navigated to, while its data loads (design.md § Loading).
	 * The layout renders this in place of the page once a navigation has run
	 * past SKELETON_DELAY_MS; navigation-skeleton.ts picks the kind.
	 *
	 * Each kind is the destination's own layout with the data missing. What
	 * is known before the data is — a list page's heading, a tag's name, the
	 * labels — renders as real text, so the page that lands only fills in.
	 */
	import type { Skeleton } from '$lib/navigation-skeleton';
	import HomeSkeleton from './HomeSkeleton.svelte';
	import AboutSkeleton from './AboutSkeleton.svelte';
	import StreamSkeleton from './StreamSkeleton.svelte';
	import PostSkeleton from './PostSkeleton.svelte';
	import WatchlistBodySkeleton from './WatchlistBodySkeleton.svelte';
	import ListensBodySkeleton from './ListensBodySkeleton.svelte';

	let { skeleton }: { skeleton: Skeleton } = $props();
</script>

<main class="page skel-in" class:page--narrow={skeleton.narrow} aria-busy="true">
	{#if skeleton.kind === 'home'}
		<HomeSkeleton />
	{:else if skeleton.kind === 'about'}
		<AboutSkeleton />
	{:else if skeleton.kind === 'stream'}
		<StreamSkeleton title={skeleton.title} />
	{:else if skeleton.kind === 'post'}
		<PostSkeleton />
	{:else if skeleton.kind === 'watchlist'}
		<p class="h-page">Watchlist</p>
		<p class="mt-2 text-gray">What I'm working through, have finished, and want to get to.</p>
		<!-- The profile links' row, held at its height: the links are known,
		     but they are the page's own markup and not worth a second copy. -->
		<div class="mt-4 h-[31px]" aria-hidden="true"></div>
		<WatchlistBodySkeleton />
	{:else if skeleton.kind === 'listens'}
		<p class="h-page">Listens</p>
		<p class="mt-2 text-gray">
			My Spotify listening history, imported from my own data export — not a live feed, just
			everything I've listened to so far.
		</p>
		<ListensBodySkeleton />
	{:else}
		<p class="sr-only" role="status">Loading…</p>
		<div aria-hidden="true">
			<p class="h-page"><span class="skel skel--text" style:width="9ch"></span></p>
			<p class="lead mt-3"><span class="skel skel--text" style:width="24ch"></span></p>
			<div class="rule mt-8 grid gap-3 pt-6">
				{#each ['92%', '100%', '86%', '64%'] as width}
					<p><span class="skel skel--text" style:width></span></p>
				{/each}
			</div>
		</div>
	{/if}
</main>
