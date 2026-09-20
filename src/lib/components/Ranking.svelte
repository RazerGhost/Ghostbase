<script lang="ts">
	/**
	 * A top-five set as type (design.md § Lists): a serif numeral, the name, a
	 * line of context, the count. No bars and no artwork — the ordering is the
	 * numeral's job and the magnitude is the count's, which is what separates
	 * this from the chart-style list it replaced.
	 *
	 * A row is a link when it has an href, a button when it has an onpick, and
	 * plain text otherwise. `expanded` renders the snippet underneath — the
	 * artists list uses it to drop its tracks in.
	 */
	import type { Snippet } from 'svelte';

	export type RankItem = {
		key: string;
		title: string;
		sub?: string;
		value: string;
		valueLabel?: string;
		href?: string | null;
		onpick?: () => void;
		expanded?: boolean;
	};

	let {
		items,
		expandedContent
	}: { items: RankItem[]; expandedContent?: Snippet<[RankItem]> } = $props();
</script>

<div>
	{#each items as item, i (item.key)}
		{@const n = String(i + 1).padStart(2, '0')}
		<div class="rank-wrap">
			{#if item.onpick}
				<button type="button" class="rank w-full text-left" onclick={item.onpick}>
					<span class="rank__n">{n}</span>
					<span class="min-w-0 flex-1">
						<span class="h-card-lg entry__title block">{item.title}</span>
						{#if item.sub}<span class="meta mt-1.5 block">{item.sub}</span>{/if}
					</span>
					<span class="shrink-0 text-right">
						<span class="num num-sm block">{item.value}</span>
						{#if item.valueLabel}<span class="label mt-1.5 block">{item.valueLabel}</span>{/if}
					</span>
				</button>
			{:else if item.href}
				<a
					href={item.href}
					target="_blank"
					rel="noreferrer"
					class="rank"
				>
					<span class="rank__n">{n}</span>
					<span class="min-w-0 flex-1">
						<span class="h-card-lg entry__title block">{item.title}</span>
						{#if item.sub}<span class="meta mt-1.5 block">{item.sub}</span>{/if}
					</span>
					<span class="shrink-0 text-right">
						<span class="num num-sm block">{item.value}</span>
						{#if item.valueLabel}<span class="label mt-1.5 block">{item.valueLabel}</span>{/if}
					</span>
				</a>
			{:else}
				<div class="rank">
					<span class="rank__n">{n}</span>
					<span class="min-w-0 flex-1">
						<span class="h-card-lg block">{item.title}</span>
						{#if item.sub}<span class="meta mt-1.5 block">{item.sub}</span>{/if}
					</span>
					<span class="shrink-0 text-right">
						<span class="num num-sm block">{item.value}</span>
						{#if item.valueLabel}<span class="label mt-1.5 block">{item.valueLabel}</span>{/if}
					</span>
				</div>
			{/if}

			{#if item.expanded && expandedContent}
				<div class="pb-5 pl-[86px]">
					{@render expandedContent(item)}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	/* The hover signal belongs to the whole row, and .rank is the element that
	   carries the hairline — so the wrapper only exists to keep an expanded
	   panel inside the same hover group. */
	.rank-wrap:hover :global(.entry__title) {
		color: var(--accent);
	}
</style>
