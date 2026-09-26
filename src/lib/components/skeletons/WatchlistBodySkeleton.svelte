<script lang="ts">
	/**
	 * The watchlist below its header, before Simkl has answered. Drawn from
	 * the same roles and grid as WatchlistLibrary.svelte, so the figures,
	 * the controls row and the first shelf land where the real ones will —
	 * the poster frames are the real .shelf__art, just empty.
	 *
	 * Used twice: in place while the page's streamed library resolves, and
	 * inside WatchlistSkeleton while a navigation to the page is pending.
	 */
</script>

{#snippet figure(width: string, caption: string)}
	<div>
		<p class="num num-sm"><span class="skel skel--text" style:width={width}></span></p>
		<p class="meta mt-0.5">{caption}</p>
	</div>
{/snippet}

<p class="sr-only" role="status">Loading the watchlist…</p>
<div aria-hidden="true">
	<div
		class="rule mt-8 grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16"
	>
		<div>
			<p class="label">Spent watching</p>
			<p class="num num-xl mt-3"><span class="skel skel--text" style:width="5.5ch"></span></p>
			<div class="rule mt-7 grid grid-cols-3 gap-6 pt-6">
				{@render figure('2ch', 'Completed')}
				{@render figure('3ch', 'Episodes watched')}
				{@render figure('1.5ch', 'Completed this year')}
			</div>
			<div class="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
				{@render figure('3ch', 'Peak year')}
				{@render figure('2ch', 'Most active day')}
				{@render figure('2ch', 'Avg rating')}
			</div>
			<div class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center">
				{@render figure('4ch', 'Backlog to clear')}
				{@render figure('2.5ch', 'Completion rate')}
			</div>
		</div>

		<div class="lg:border-l lg:border-border lg:pl-16">
			<p class="label">Top genres</p>
			<ul class="mt-5 flex flex-col gap-4">
				{#each [9, 7, 11, 6, 8] as width}
					<li>
						<span class="skel skel--text text-[15px]" style:width="{width}ch"></span>
						<div class="mt-2 h-[3px] bg-surface-2"></div>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
		<span class="skel h-[38px] w-full sm:ml-auto sm:max-w-sm"></span>
		<span class="skel h-[38px] w-40"></span>
	</div>

	{#each ['Watching', 'Completed'] as heading, i}
		<section class={i === 0 ? 'mt-10' : 'mt-14'}>
			<h2 class="text-lg font-semibold text-white">{heading}</h2>
			<div class="shelf mt-5 overflow-hidden">
				{#each Array(7) as _}
					<div class="shelf__item">
						<span class="shelf__art"></span>
						<span class="shelf__title mt-3 block"><span class="skel skel--text" style:width="80%"></span></span>
						<span class="meta mt-1 block"><span class="skel skel--text" style:width="55%"></span></span>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
