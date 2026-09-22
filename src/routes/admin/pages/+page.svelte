<script lang="ts">
	/**
	 * The standing prose pages. There is no "new page" button on purpose: a
	 * page needs a route to live at, so adding one is a code change and the
	 * markdown file follows it, not the other way round.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const changed = $derived(data.pages.filter((p) => p.changed).length);
</script>

<Seo title="Pages — RazerGhost" description="Private page editor." path="/admin/pages" noindex />

<main class="page">
	<h1 class="h-page">Pages</h1>
	<p class="lead mt-2">
		The prose that does not belong to a date. It used to live in the route files.
	</p>

	<div class="rule mt-8">
		{#each data.pages as p (p.slug)}
			<a href="/admin/pages/{p.slug}" class="entry flex items-baseline gap-5 py-4">
				<span
					class="stream-row__dot"
					class:stream-row__dot--changed={p.changed}
					aria-hidden="true"
				></span>
				<span class="min-w-0 flex-1">
					<span class="h-card-lg entry__title block">{p.heading}</span>
					<span class="meta mt-1.5 block">{p.description}</span>
				</span>
				<span class="mono shrink-0">/{p.slug}</span>
			</a>
		{:else}
			<p class="meta py-6">No pages in src/content/pages yet.</p>
		{/each}
	</div>

	<p class="meta mt-6">
		{#if data.tracked && changed}
			An amber dot means the file on disk is ahead of the last commit.
		{:else if data.tracked}
			All committed.
		{:else}
			This build is not a git checkout, so nothing here can tell you what is committed.
		{/if}
	</p>
</main>
