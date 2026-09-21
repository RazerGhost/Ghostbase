<script lang="ts">
	/**
	 * The Simkl cache, sorted by what needs work.
	 *
	 * It was a six-column sortable table, which is a shape for browsing data
	 * you do not know yet. This page only ever answers one question — what is
	 * missing or stale — so the rows lead with that, and the genres and
	 * synopsis sit behind each row instead of in two truncated columns.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Anything fetched longer ago than this is worth refreshing, but nothing
	// breaks if it is not — Simkl's genres and runtimes rarely change.
	const STALE_DAYS = 180;

	let bulkRefreshing = $state(false);
	let query = $state('');
	let openKey = $state<string | null>(null);

	function daysOld(iso: string): number {
		return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
	}

	function formatAge(iso: string): string {
		const days = daysOld(iso);
		if (days <= 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 30) return `${days} days old`;
		const months = Math.round(days / 30);
		return months < 12 ? `${months} months old` : `${Math.round(months / 12)} years old`;
	}

	const rows = $derived(
		data.entries
			.map((e) => ({
				...e,
				key: `${e.simklId}:${e.mediaType}`,
				missing: e.runtime == null,
				stale: daysOld(e.fetchedAt) >= STALE_DAYS
			}))
			.filter((e) => !query.trim() || e.title.toLowerCase().includes(query.trim().toLowerCase()))
			// Incomplete first, then stale, then the rest by title — the order
			// you would sort them into by hand every time.
			.sort((a, b) => {
				const rank = (r: typeof a) => (r.missing ? 0 : r.stale ? 1 : 2);
				return rank(a) - rank(b) || a.title.localeCompare(b.title);
			})
	);

	const missingCount = $derived(data.entries.filter((e) => e.runtime == null).length);
	const staleCount = $derived(data.entries.filter((e) => daysOld(e.fetchedAt) >= STALE_DAYS).length);
</script>

<Seo
	title="Watchlist cache — RazerGhost"
	description="Private Simkl cache inspector."
	path="/admin/watchlist-cache"
	noindex
/>

<main class="page">
	<h1 class="h-page">Watchlist cache</h1>
	<p class="lead mt-2">Genres, synopses and runtimes behind the watchlist.</p>

	{#if !data.configured}
		<p class="mt-5 text-sm text-danger-text">
			Simkl is not configured, so refreshing will fail.
		</p>
	{/if}

	<div class="rule mt-9 flex flex-wrap items-baseline gap-10 border-b border-border py-7">
		<span class="flex items-baseline gap-2.5">
			<span class="num num-sm">{data.entries.length}</span>
			<span class="label">rows</span>
		</span>
		<span class="flex items-baseline gap-2.5">
			<span class="num num-sm" class:text-warn={missingCount > 0}>{missingCount}</span>
			<span class="label">no runtime</span>
		</span>
		<span class="flex items-baseline gap-2.5">
			<span class="num num-sm">{staleCount}</span>
			<span class="label">over six months old</span>
		</span>
	</div>

	<div class="mt-7 flex flex-wrap items-center gap-5">
		<label for="cache-filter" class="sr-only">Filter by title</label>
		<input
			id="cache-filter"
			type="search"
			bind:value={query}
			placeholder="Filter by title…"
			class="input max-w-sm flex-1"
		/>
		<form
			method="POST"
			action="?/refreshMissing"
			use:enhance={() => {
				bulkRefreshing = true;
				return async ({ update }) => {
					await update();
					bulkRefreshing = false;
				};
			}}
		>
			<button
				type="submit"
				disabled={bulkRefreshing || missingCount === 0 || !data.configured}
				class="btn link disabled:opacity-50"
			>
				{bulkRefreshing ? 'Refreshing…' : `Refresh the ${missingCount} missing`}
			</button>
		</form>
	</div>

	{#if form?.bulk}
		<p class="meta mt-4 measure">
			{form.filled} of {form.total} now have a runtime.
			{#if form.stillMissing}
				{form.stillMissing} still have none — Simkl itself has no runtime for
				{form.stillMissing === 1 ? 'that title' : 'those titles'}.
			{/if}
			{#if form.failed}
				{form.failed} fetch{form.failed === 1 ? '' : 'es'} failed.
			{/if}
		</p>
	{/if}

	<div class="ledger mt-7 max-w-none">
		{#each rows as row (row.key)}
			<div class="ledger__row">
				<button
					type="button"
					class="entry__title h-card min-w-0 flex-1 truncate text-left"
					onclick={() => (openKey = openKey === row.key ? null : row.key)}
					aria-expanded={openKey === row.key}
				>
					{row.title}
				</button>
				<span class="meta shrink-0">{row.mediaType}</span>
				<span class="label shrink-0 text-right" class:text-warn={row.missing}>
					{#if row.missing}
						no runtime
					{:else}
						{row.runtime}m · {formatAge(row.fetchedAt)}
					{/if}
				</span>
				<form method="POST" action="?/refresh" class="shrink-0">
					<input type="hidden" name="simklId" value={row.simklId} />
					<input type="hidden" name="mediaType" value={row.mediaType} />
					<button type="submit" class="link text-[13px] text-primary">Refresh</button>
				</form>
			</div>
			{#if openKey === row.key}
				<div class="pb-5 text-sm leading-relaxed text-gray">
					<p class="mono">{row.genres.join('  ') || 'no genres'}</p>
					<p class="measure mt-2">{row.overview || 'No synopsis cached.'}</p>
				</div>
			{/if}
		{:else}
			<p class="meta py-6">Nothing matches.</p>
		{/each}
	</div>
</main>
