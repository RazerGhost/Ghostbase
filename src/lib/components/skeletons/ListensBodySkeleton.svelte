<script lang="ts">
	/**
	 * /listens below its search box, before the history has arrived: the
	 * "spent listening" figure, the row of figures under it, and the first
	 * pair of rankings — drawn from the same grid as ListensHistory.svelte.
	 * The plots further down are left out; they sit well below a phone's
	 * first screen, and a skeleton that runs on past the fold only adds
	 * scroll to something nobody is looking at yet.
	 */
</script>

<p class="sr-only" role="status">Loading the listening history…</p>
<div aria-hidden="true">
	<div class="rule mt-8 pt-8">
		<p class="label">Spent listening</p>
		<p class="mt-2 text-4xl sm:text-5xl">
			<span class="skel skel--text" style:width="5ch"></span>
		</p>

		<div
			class="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-center sm:grid-cols-3 lg:grid-cols-5"
		>
			{#each ['Total plays', 'Peak year', 'Most active day', 'Earliest play', 'Most recent play'] as caption}
				<div>
					<p class="h-section"><span class="skel skel--text" style:width="4ch"></span></p>
					<p class="meta mt-0.5">{caption}</p>
				</div>
			{/each}
		</div>

		<div class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center sm:grid-cols-4">
			{#each ['Skip rate', 'Shuffle plays', 'Longest streak', 'Current streak'] as caption}
				<div>
					<p class="h-section"><span class="skel skel--text" style:width="3ch"></span></p>
					<p class="meta mt-0.5">{caption}</p>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each ['Top artists', 'Top tracks'] as heading}
			<div>
				<p class="label">{heading}</p>
				<div class="mt-3">
					{#each [1, 2, 3, 4, 5] as n}
						<div class="rank">
							<span class="rank__n">{n}</span>
							<span class="min-w-0 flex-1">
								<span class="h-card-lg block"><span class="skel skel--text" style:width="{14 - n}ch"></span></span>
								<span class="meta mt-1.5 block"><span class="skel skel--text" style:width="9ch"></span></span>
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
