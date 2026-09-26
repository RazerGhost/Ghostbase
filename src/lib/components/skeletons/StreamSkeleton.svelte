<script lang="ts">
	/**
	 * A list page — the devlog, projects, or a tag of either — before its
	 * entries. The heading is passed in because it is known from the route;
	 * the rows are the real .entry hairlines with the text missing.
	 */
	let { title }: { title?: string } = $props();
</script>

<p class="sr-only" role="status">Loading{title ? ` ${title}` : ''}…</p>
<div aria-hidden="true">
	{#if title}
		<p class="h-page">{title}</p>
	{:else}
		<p class="h-page"><span class="skel skel--text" style:width="7ch"></span></p>
	{/if}
	<p class="lead mt-3"><span class="skel skel--text" style:width="26ch"></span></p>
	<p class="meta mt-4"><span class="skel skel--text" style:width="24ch"></span></p>

	<div class="rule mt-8 pt-5">
		<span class="skel h-[38px] w-full"></span>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each [5, 7, 4, 6] as width}
				<span class="chip"><span class="skel skel--text" style:width="{width}ch"></span></span>
			{/each}
		</div>
	</div>

	<div class="rule mt-10">
		{#each [30, 22, 34, 26, 18, 28] as width}
			<div class="entry py-4">
				<p class="mono"><span class="skel skel--text" style:width="11ch"></span></p>
				<p class="h-card-lg mt-2"><span class="skel skel--text" style:width="{width}ch"></span></p>
			</div>
		{/each}
	</div>
</div>
