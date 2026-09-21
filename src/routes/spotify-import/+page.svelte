<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<Seo title="Import Spotify history — RazerGhost" description="Private import tool." path="/spotify-import" noindex />

<main class="page page--narrow">
	<h1 class="h-page">Import Spotify history</h1>
	<p class="lead mt-2">The back catalogue the live API cannot give you.</p>

	<!-- The same numeral register the listens page sets its own totals in. -->
	<div class="rule mt-9 grid grid-cols-2 gap-8 border-b border-border py-7 sm:grid-cols-4">
		<div>
			<p class="num num-sm">{data.totalPlays.toLocaleString()}</p>
			<p class="meta mt-2">plays held</p>
		</div>
		<div>
			<p class="num num-sm">{formatDate(data.firstPlayedAt)}</p>
			<p class="meta mt-2">earliest</p>
		</div>
		<div>
			<p class="num num-sm">{formatDate(data.lastPlayedAt)}</p>
			<p class="meta mt-2">latest</p>
		</div>
		<div>
			<p class="num num-sm">{data.pendingScrobbles.toLocaleString()}</p>
			<p class="meta mt-2">scrobbled, not yet exported</p>
		</div>
	</div>
	{#if data.pendingScrobbles > 0}
		<p class="meta mt-2">
			{data.pendingScrobbles} row{data.pendingScrobbles === 1 ? '' : 's'} came from the live scrobbler
			with estimated play length — importing an export covering that date range replaces them with
			real data.
		</p>
	{/if}

	<p class="measure mt-7 text-gray">
		Upload the JSON files from Spotify's
		<a
			href="https://support.spotify.com/us/article/understanding-your-data/"
			target="_blank"
			rel="noreferrer"
			class="link"
		>
			extended streaming history export
		</a>
		 — <code class="meta">Streaming_History_Audio_*.json</code> (or older
		<code class="meta">endsong_*.json</code>). Re-uploading the same files is safe;
		duplicate plays are skipped automatically.
	</p>

	<form method="POST" enctype="multipart/form-data" class="mt-8 flex flex-col gap-4">
		{#if form && 'error' in form && form.error}
			<p class="text-sm text-danger-text">{form.error}</p>
		{/if}

		<input
			type="file"
			name="files"
			accept="application/json"
			multiple
			required
			class="input file:mr-3 file:rounded-full file:border file:border-border file:bg-transparent file:px-3 file:py-1 file:text-[13px] file:text-gray"
		/>

		<button
			type="submit"
			class="btn btn--accent link self-start"
		>
			Import
		</button>
	</form>

	{#if form?.results}
		{@const results = form.results}
		<div class="card mt-8 text-sm">
			<p class="h-card">
				{form.totalInserted} new play{form.totalInserted === 1 ? '' : 's'} added
				({form.totalParsed} parsed across {results.length} file{results.length === 1 ? '' : 's'}).
			</p>
			{#if form.totalReplacedScrobbles > 0}
				<p class="meta mt-1">
					Replaced {form.totalReplacedScrobbles} live-scrobbled play{form.totalReplacedScrobbles === 1
						? ''
						: 's'} with real data from this export.
				</p>
			{/if}
			<ul class="meta mt-3 flex flex-col gap-1">
				{#each results as result}
					<li>
						{result.name} —
						{#if result.error}
							<span class="text-danger-text">{result.error}</span>
						{:else}
							{result.inserted}/{result.parsed} new
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<p class="mt-8 text-sm">
		<a href="/listens" class="link">View the Listens page →</a>
	</p>
</main>
