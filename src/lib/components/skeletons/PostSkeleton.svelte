<script lang="ts">
	/**
	 * A devlog post or a project page before its entry: the back link, the
	 * meta line, the title and the opening paragraphs, on the post's measure.
	 */
</script>

<p class="sr-only" role="status">Loading…</p>
<div class="measure" aria-hidden="true">
	<p class="text-sm"><span class="skel skel--text" style:width="7ch"></span></p>
	<div class="mt-4">
		<p class="meta"><span class="skel skel--text" style:width="20ch"></span></p>
		<p class="h-page mt-2"><span class="skel skel--text" style:width="80%"></span></p>
		<p class="h-page"><span class="skel skel--text" style:width="45%"></span></p>
		<div class="mt-4 flex gap-2">
			{#each [6, 8, 5] as width}
				<span class="chip"><span class="skel skel--text" style:width="{width}ch"></span></span>
			{/each}
		</div>
		<div class="mt-8 grid gap-3">
			{#each ['100%', '96%', '100%', '88%', '52%'] as width}
				<p class="leading-relaxed"><span class="skel skel--text" style:width></span></p>
			{/each}
		</div>
	</div>
</div>
