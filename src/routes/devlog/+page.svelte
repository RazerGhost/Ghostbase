<script lang="ts">
	import DevlogStream from '$lib/components/DevlogStream.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Rss from '@lucide/svelte/icons/rss';
	import Terminal from '@lucide/svelte/icons/terminal';
	import Search from '@lucide/svelte/icons/search';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const initialParams = page.url.searchParams;

	let selectedTag = $state<string | null>(initialParams.get('tag'));
	let query = $state(initialParams.get('q') ?? '');

	// Keep the URL in sync with the search/tag filters so a filtered view is
	// reload-safe and shareable — replaceState only, since filtering happens
	// client-side over already-loaded data and shouldn't trigger a server
	// round-trip (same approach as /gear's category filter).
	$effect(() => {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (selectedTag) params.set('tag', selectedTag);
		const qs = params.toString();
		const search = qs ? `?${qs}` : '';
		// Skip when it's already correct (true on mount, since the filters are seeded
		// from the URL) — calling replaceState this early can throw "router is not
		// initialized yet" on a hard reload/direct load, which would otherwise permanently
		// kill this effect since an uncaught error stops it from ever re-running.
		if (search === location.search) return;
		try {
			replaceState(`${location.pathname}${search}`, {});
		} catch {
			// router not ready yet — safe to ignore, see above
		}
	});

	const tagCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const entry of data.entries) {
			for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
		return counts;
	});
	const tags = $derived([...tagCounts.keys()].sort());

	const latestDate = $derived(
		data.entries.reduce<string | null>((max, e) => (!max || e.date > max ? e.date : max), null)
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
	}

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		const q = query.trim().toLowerCase();
		return data.entries.filter((e) => {
			const matchesTag = !tag || e.tags.includes(tag);
			const matchesQuery =
				!q ||
				e.title.toLowerCase().includes(q) ||
				e.excerpt.toLowerCase().includes(q) ||
				e.searchText.includes(q);
			return matchesTag && matchesQuery;
		});
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}
</script>

<Seo title="Devlog — RazerGhost" description="Notes on whatever I'm building at the moment." path="/devlog" />

<main class="page page--wide">
	<div class="flex flex-wrap items-end justify-between gap-6" data-hero-reveal="0">
		<div>
			<h1 class="h-page">Devlog</h1>
			<p class="lead mt-3">Notes on whatever I'm building at the moment.</p>
		</div>
		<div class="flex items-center gap-6">
			<span class="meta">
				{data.entries.length}
				{data.entries.length === 1 ? 'post' : 'posts'} · {tags.length} tags{#if latestDate}
					· last {formatDate(latestDate)}{/if}
			</span>
			<a href="/devlog/rss.xml" data-sveltekit-reload class="ulink">
				<Rss size={13} aria-hidden="true" /> RSS
			</a>
		</div>
	</div>

	<div class="rule mt-8 flex flex-wrap items-center gap-3 pt-5" data-hero-reveal="1">
		<div class="relative min-w-0 flex-1">
			<Search
				size={14}
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
			/>
			<input
				type="search"
				bind:value={query}
				placeholder="Search posts…"
				aria-label="Search posts"
				class="input w-full pl-9"
			/>
		</div>
		{#if selectedTag || query.trim()}
			<button
				type="button"
				class="btn"
				onclick={() => {
					selectedTag = null;
					query = '';
				}}
			>
				Clear
			</button>
		{/if}
	</div>

	{#if tags.length}
		<ul class="mt-4 flex flex-wrap gap-2" data-hero-reveal="2">
			<li>
				<button
					type="button"
					class="chip {selectedTag === null ? 'chip--active' : ''}"
					onclick={() => (selectedTag = null)}
				>
					All <span class="chip__count">{data.entries.length}</span>
				</button>
			</li>
			{#each tags as tag}
				<li>
					<button
						type="button"
						class="chip {selectedTag === tag ? 'chip--active' : ''}"
						onclick={() => toggleTag(tag)}
					>
						{tag} <span class="chip__count">{tagCounts.get(tag)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="label label--icon mt-10 mb-3">
		<Terminal size={12} aria-hidden="true" />
		{#if selectedTag || query.trim()}
			{filtered.length}
			{filtered.length === 1 ? 'entry' : 'entries'} matching
		{:else}
			Every entry, newest first
		{/if}
	</p>

	<DevlogStream
		entries={filtered}
		seriesInfo={data.seriesInfo}
		empty="Nothing matches that search."
	/>
</main>
