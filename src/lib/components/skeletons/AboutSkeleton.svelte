<script lang="ts">
	/** /about before its data — the frame of src/routes/about/+page.svelte. */
</script>

<p class="sr-only" role="status">Loading…</p>
<div aria-hidden="true">
	<p class="label">About</p>
	<p class="h-page mt-4"><span class="skel skel--text" style:width="18ch"></span></p>

	<div class="rule mt-10 grid gap-12 pt-9 md:grid-cols-[1.45fr_1fr] md:gap-16">
		<div class="measure grid gap-3">
			{#each ['100%', '94%', '97%', '60%', '0', '100%', '90%', '72%'] as width}
				{#if width === '0'}
					<span class="h-3"></span>
				{:else}
					<p class="leading-relaxed"><span class="skel skel--text" style:width></span></p>
				{/if}
			{/each}
		</div>
		<div class="md:border-l md:border-border md:pl-10">
			<img src="/brand/ghost-outline.svg" width="56" height="56" alt="" class="opacity-40" />
			<p class="label mt-8">By the numbers</p>
		</div>
	</div>
</div>
