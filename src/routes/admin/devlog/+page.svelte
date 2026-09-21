<script lang="ts">
	/**
	 * The devlog index, private side. Deliberately the same log stream the
	 * public index uses (design.md § Lists) rather than a second shape for the
	 * same content — the only thing this one adds is the state dot, because
	 * "written" and "published" are different here and nothing used to say so.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Filter = 'all' | 'drafts' | 'changed';

	let query = $state('');
	let filter = $state<Filter>('all');

	const counts = $derived({
		all: data.entries.length,
		drafts: data.entries.filter((e) => e.draft).length,
		changed: data.entries.filter((e) => e.changed).length
	});

	const filtered = $derived(
		data.entries.filter((entry) => {
			if (filter === 'drafts' && !entry.draft) return false;
			if (filter === 'changed' && !entry.changed) return false;
			if (!query.trim()) return true;
			const q = query.trim().toLowerCase();
			return (
				entry.title.toLowerCase().includes(q) ||
				(entry.series ?? '').toLowerCase().includes(q) ||
				entry.tags.some((t) => t.toLowerCase().includes(q))
			);
		})
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	const lede = $derived.by(() => {
		const n = data.entries.length;
		if (!data.tracked) return `${n} ${n === 1 ? 'post' : 'posts'} on disk.`;
		if (!counts.changed) return `${n} ${n === 1 ? 'post' : 'posts'}, all of them committed.`;
		return `${n} ${n === 1 ? 'post' : 'posts'}. ${counts.changed === 1 ? 'One has' : `${counts.changed} have`} never left this machine.`;
	});
</script>

<Seo title="Devlog — RazerGhost" description="Private devlog editor." path="/admin/devlog" noindex />

<main class="page">
	<div class="flex flex-wrap items-end justify-between gap-6">
		<div>
			<h1 class="h-page">Devlog</h1>
			<p class="lead mt-2">{lede}</p>
		</div>
		<a href="/admin/devlog/new" class="btn btn--accent link">Write a new one</a>
	</div>

	<div class="mt-8 flex flex-wrap items-center gap-5">
		<label for="devlog-filter" class="sr-only">Filter posts</label>
		<input
			id="devlog-filter"
			type="search"
			bind:value={query}
			placeholder="Filter by title, tag or series…"
			class="input max-w-sm flex-1"
		/>
		<div class="flex items-center gap-2">
			{#each [['all', 'All'], ['drafts', 'Drafts'], ['changed', 'Uncommitted']] as const as [key, label]}
				{#if key !== 'changed' || data.tracked}
					<button
						type="button"
						class="chip"
						class:chip--active={filter === key}
						onclick={() => (filter = key)}
					>
						{label}
						<span class="chip__count" class:text-warn={key === 'changed' && counts.changed > 0}>
							{counts[key]}
						</span>
					</button>
				{/if}
			{/each}
		</div>
	</div>

	<div class="rule mt-7">
		{#each filtered as entry (entry.slug)}
			<a href="/admin/devlog/{entry.slug}" class="entry stream-row stream-row--state">
				<span
					class="stream-row__dot"
					class:stream-row__dot--changed={entry.changed}
					class:stream-row__dot--draft={!entry.changed && entry.draft}
					aria-hidden="true"
				></span>
				<span class="mono">{formatDate(entry.date)}</span>
				<span class="mono stream-row__len">{entry.readingTime} min</span>
				<span class="min-w-0">
					<span class="stream-row__title entry__title block">
						{entry.title}
						{#if entry.draft}<span class="label ml-2.5">Draft</span>{/if}
					</span>
					{#if entry.series}
						<span class="mono mono--accent mt-1 block">{entry.series}</span>
					{/if}
				</span>
				<span class="mono stream-row__tags truncate text-right">{entry.tags.join('  ')}</span>
			</a>
		{:else}
			<p class="meta py-6">Nothing matches.</p>
		{/each}
	</div>

	<p class="meta mt-6">
		{#if data.tracked}
			An amber dot means the file on disk is ahead of the last commit. Deleting a post lives inside
			it, not out here.
		{:else}
			This build is not a git checkout, so nothing here can tell you what is committed.
		{/if}
	</p>
</main>
