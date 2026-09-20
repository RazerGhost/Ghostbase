<script lang="ts">
	/**
	 * The devlog index as a log stream (design.md § Lists): one line per post —
	 * date, length, title, tags. Dense enough that the whole log fits on a
	 * screen, and it stays that way past fifty posts, which a card grid does
	 * not. Shared by /devlog and /devlog/tags/[tag].
	 *
	 * The row shape lives in roles.css as .stream-row; below 1100px it folds to
	 * two columns and drops the length and tags.
	 */
	import type { DevlogMeta } from '$lib/server/devlog';

	let {
		entries,
		seriesInfo = {},
		empty = 'No entries here yet.'
	}: {
		entries: DevlogMeta[];
		seriesInfo?: Record<string, { part: number; total: number }>;
		empty?: string;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="rule">
	{#each entries as entry (entry.slug)}
		{@const series = seriesInfo[entry.slug]}
		<a href={`/devlog/${entry.slug}`} class="entry stream-row">
			<span class="mono">{formatDate(entry.date)}</span>
			<span class="mono stream-row__len">{entry.readingTime} min</span>
			<span class="min-w-0">
				<span class="stream-row__title entry__title block">{entry.title}</span>
				{#if series}
					<span class="mono mono--accent mt-1 block">
						{entry.series} · part {series.part} of {series.total}
					</span>
				{/if}
			</span>
			<span class="mono stream-row__tags truncate text-right">
				{entry.tags.join('  ')}
			</span>
		</a>
	{:else}
		<p class="meta py-6">{empty}</p>
	{/each}
</div>
