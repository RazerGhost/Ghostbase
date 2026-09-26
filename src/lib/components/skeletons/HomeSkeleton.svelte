<script lang="ts">
	/**
	 * The home page before its data: the heading and tagline are config, so
	 * they are real; the "Right now" items, the band's figures and the latest
	 * entries are not. Mirrors the grid in src/routes/+page.svelte.
	 */
	import { site } from '$lib/config';
</script>

<p class="sr-only" role="status">Loading…</p>
<div aria-hidden="true">
	<div class="grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16">
		<div class="flex flex-col">
			<p class="h-hero">{site.name}</p>
			<p class="lead mt-4">{site.tagline}</p>
		</div>
		<div class="md:border-l md:border-border md:pl-10">
			<p class="label">Right now</p>
			<div class="mt-4 grid gap-3">
				{#each ['88%', '72%', '80%'] as width}
					<p class="text-[15px] leading-relaxed"><span class="skel skel--text" style:width></span></p>
				{/each}
			</div>
		</div>
	</div>

	<div class="rule mt-14 grid gap-10 border-b border-border py-9 sm:grid-cols-3">
		{#each ['listening streak', 'spent watching', 'written here'] as caption}
			<div>
				<span class="block h-[15px]"></span>
				<p class="num num-lg mt-3"><span class="skel skel--text" style:width="2.2ch"></span></p>
				<p class="meta mt-2 leading-relaxed">{caption}</p>
			</div>
		{/each}
	</div>

	<div class="mt-12">
		<p class="h-section">Latest</p>
		<div class="mt-5">
			{#each [26, 20, 30] as width}
				<div class="entry -mx-3 px-3 py-4">
					<p class="mono"><span class="skel skel--text" style:width="16ch"></span></p>
					<p class="h-card-lg mt-2"><span class="skel skel--text" style:width="{width}ch"></span></p>
				</div>
			{/each}
		</div>
	</div>
</div>
