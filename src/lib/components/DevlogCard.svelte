<script lang="ts">
	/**
	 * A single devlog post as an editorial entry row — mono meta line, serif
	 * title, excerpt, tags, separated from its neighbours by a hairline rather
	 * than boxed in a card (design.md § Rules).
	 *
	 * The index and the tag pages use DevlogStream instead; this is for the
	 * places that show a handful of posts in a column, like "related" at the
	 * foot of a post.
	 */
	import type { DevlogMeta } from '$lib/server/devlog';

	let {
		entry,
		seriesInfo
	}: { entry: DevlogMeta; seriesInfo?: { part: number; total: number } } = $props();

	const formattedDate = $derived(
		new Date(entry.date).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		})
	);
</script>

<a href={`/devlog/${entry.slug}`} class="entry block px-3 py-5 -mx-3">
	<p class="mono">{formattedDate} · {entry.readingTime} min</p>
	{#if entry.series && seriesInfo}
		<p class="mono mono--accent mt-1">
			{entry.series} · part {seriesInfo.part} of {seriesInfo.total}
		</p>
	{/if}
	<h3 class="h-card-lg entry__title mt-2">{entry.title}</h3>
	<p class="mt-2 text-[15px] leading-relaxed text-gray">{entry.excerpt}</p>

	{#if entry.tags.length}
		<p class="mono mt-3">{entry.tags.join('  ')}</p>
	{/if}
</a>
