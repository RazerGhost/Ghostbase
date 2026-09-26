<script lang="ts">
	import Music from '@lucide/svelte/icons/music';
	import { useLanyard } from '$lib/stores/lanyard.svelte';

	interface HistoryLookup {
		found: boolean;
		plays?: number;
		firstPlayedAt?: string;
	}

	let { bare = false, fallback }: { bare?: boolean; fallback?: import('svelte').Snippet } = $props();

	// Currently-playing state comes from Lanyard (shared with SpotifyWidget /
	// DiscordPresence via stores/lanyard.svelte.ts) rather than a second
	// independent request to /api/spotify — see that file for why.
	const lanyard = useLanyard();
	let history = $state<HistoryLookup | null>(null);
	let now = $state(Date.now());
	let lastTrackId = '';
	// Set for one animation when the track actually changes, so the card can
	// flash in --color-action. This is the site's only "something just fired"
	// signal — see design.md § Motion. Skipped on the first track seen after
	// mount, which is a page load, not an event.
	let trackChanged = $state(false);
	let flashTimer: ReturnType<typeof setTimeout>;

	// spotifyAt drops a track Lanyard has stopped vouching for — see
	// lanyard-live.ts.
	const spotify = $derived(lanyard.spotifyAt(now));
	const playing = $derived(Boolean(spotify));
	const track = $derived(spotify?.song);
	const artist = $derived(spotify?.artist);
	const albumArt = $derived(spotify?.album_art_url);
	const trackUrl = $derived(spotify ? `https://open.spotify.com/track/${spotify.track_id}` : undefined);
	const durationMs = $derived(spotify ? spotify.timestamps.end - spotify.timestamps.start : undefined);

	async function lookupHistory(uri: string) {
		try {
			const res = await fetch(`/api/spotify/history-lookup?uri=${encodeURIComponent(uri)}`);
			history = await res.json();
		} catch {
			history = null;
		}
	}

	$effect(() => {
		const id = spotify?.track_id;
		if (!id) {
			history = null;
			lastTrackId = '';
			return;
		}
		if (id !== lastTrackId) {
			const isFirstSeen = lastTrackId === '';
			lastTrackId = id;
			lookupHistory(`spotify:track:${id}`);
			if (!isFirstSeen) {
				trackChanged = false;
				clearTimeout(flashTimer);
				// Next frame, so removing and re-adding the class restarts the
				// animation even when two tracks change back to back.
				requestAnimationFrame(() => {
					trackChanged = true;
					flashTimer = setTimeout(() => (trackChanged = false), 700);
				});
			}
		}
	});

	$effect(() => {
		lanyard.start();
		const tick = setInterval(() => (now = Date.now()), 1000);
		return () => {
			lanyard.stop();
			clearInterval(tick);
			clearTimeout(flashTimer);
		};
	});

	// Computed straight from Lanyard's absolute start/end timestamps rather
	// than "progress at last fetch + elapsed", so it stays accurate regardless
	// of when Lanyard last said anything.
	const localProgressMs = $derived.by(() => {
		if (!spotify || durationMs == null) return 0;
		return Math.min(durationMs, Math.max(0, now - spotify.timestamps.start));
	});

	const progressPct = $derived(durationMs ? Math.min(100, (localProgressMs / durationMs) * 100) : 0);

	function formatDate(iso: string | undefined): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	}
</script>

{#snippet nowPlaying()}
	{#if !bare}
		<p class="label label--icon">
			<span class="relative flex h-2 w-2">
				<span class="absolute h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
				<span class="h-2 w-2 rounded-full bg-primary"></span>
			</span>
			Listening now
		</p>
	{/if}
	<div class="{bare ? '' : 'mt-3'} flex items-center gap-3 rounded-md {trackChanged
		? 'flash-in'
		: ''}">
		{#if albumArt}
			<img src={albumArt} alt="" class="h-14 w-14 shrink-0 rounded-md object-cover" />
		{:else}
			<span class="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface-2">
				<Music size={20} class="text-primary" aria-hidden="true" />
			</span>
		{/if}
		<div class="min-w-0 flex-1">
			<a
				href={trackUrl}
				target="_blank"
				rel="noreferrer"
				class="link block truncate text-sm font-medium text-white hover:text-primary"
			>
				{track}
			</a>
			<p class="meta truncate">{artist}</p>
			{#if history?.found}
				<p class="meta mt-1">
					Played {history.plays} time{history.plays === 1 ? '' : 's'} before
					{#if history.firstPlayedAt}
						&middot; first in {formatDate(history.firstPlayedAt)}
					{/if}
				</p>
			{/if}
		</div>
	</div>
	{#if durationMs}
		<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
				style:width="{progressPct}%"
			></div>
		</div>
	{/if}
{/snippet}

{#if playing && track}
	{#if bare}
		{@render nowPlaying()}
	{:else}
		<div class="rounded-lg border border-border p-5 sm:p-6" data-hero-reveal="0">
			{@render nowPlaying()}
		</div>
	{/if}
{:else if fallback}
	{@render fallback()}
{/if}
