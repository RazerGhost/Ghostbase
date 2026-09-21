<script lang="ts">
	/**
	 * The projects index, private side. Projects follow the devlog on the
	 * public site (design.md § Lists), so they follow it here too — same
	 * stream, same state dot.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');

	const filtered = $derived(
		data.entries.filter((entry) => {
			if (!query.trim()) return true;
			const q = query.trim().toLowerCase();
			return entry.name.toLowerCase().includes(q) || entry.stack.some((t) => t.toLowerCase().includes(q));
		})
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	const changed = $derived(data.entries.filter((e) => e.changed).length);
	const lede = $derived.by(() => {
		const n = data.entries.length;
		const noun = n === 1 ? 'entry' : 'entries';
		if (!data.tracked) return `${n} ${noun} on disk.`;
		if (!changed) return `${n} ${noun}, all of them committed.`;
		return `${n} ${noun}. ${changed === 1 ? 'One is' : `${changed} are`} ahead of the last commit.`;
	});
</script>

<Seo title="Projects — RazerGhost" description="Private projects editor." path="/admin/projects" noindex />

<main class="page">
	<div class="flex flex-wrap items-end justify-between gap-6">
		<div>
			<h1 class="h-page">Projects</h1>
			<p class="lead mt-2">{lede}</p>
		</div>
		<a href="/admin/projects/new" class="btn btn--accent link">Add one</a>
	</div>

	<div class="mt-8">
		<label for="projects-filter" class="sr-only">Filter projects</label>
		<input
			id="projects-filter"
			type="search"
			bind:value={query}
			placeholder="Filter by name or stack…"
			class="input max-w-sm"
		/>
	</div>

	<div class="rule mt-7">
		{#each filtered as entry (entry.slug)}
			<a href="/admin/projects/{entry.slug}" class="entry stream-row stream-row--state">
				<span
					class="stream-row__dot"
					class:stream-row__dot--changed={entry.changed}
					class:stream-row__dot--draft={!entry.changed && entry.draft}
					aria-hidden="true"
				></span>
				<span class="mono">{formatDate(entry.date)}</span>
				<span class="mono stream-row__len">{entry.status}</span>
				<span class="min-w-0">
					<span class="stream-row__title entry__title block">
						{entry.name}
						{#if entry.draft}<span class="label ml-2.5">Draft</span>{/if}
					</span>
				</span>
				<span class="mono stream-row__tags truncate text-right">{entry.stack.join('  ')}</span>
			</a>
		{:else}
			<p class="meta py-6">Nothing matches.</p>
		{/each}
	</div>

	<p class="meta mt-6">
		{#if data.tracked}
			An amber dot means the file on disk is ahead of the last commit.
		{:else}
			This build is not a git checkout, so nothing here can tell you what is committed.
		{/if}
	</p>
</main>
