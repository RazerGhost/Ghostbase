<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let running = $state(false);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const age = $derived.by(() => {
		if (!data.last) return null;
		const ms = Date.now() - new Date(data.last.timestamp).getTime();
		const days = Math.floor(ms / 86_400_000);
		if (days >= 1) return { value: days, unit: days === 1 ? 'day' : 'days', stale: days >= 2 };
		const hours = Math.floor(ms / 3_600_000);
		return { value: hours, unit: hours === 1 ? 'hour' : 'hours', stale: false };
	});
</script>

<Seo title="Backups — RazerGhost" description="Private backup status." path="/admin/backups" noindex />

<main class="page page--narrow">
	<h1 class="h-page">Backups</h1>
	<p class="lead mt-2">
		Three databases and the media library, dumped to SQL so they diff.
	</p>

	{#if !data.configured}
		<p class="rule mt-9 pt-8 text-[15px] leading-relaxed text-gray">
			<span class="mono">BACKUP_GIT_REMOTE</span> is not set, so nothing is being backed up. Losing
			<span class="mono">spotify-history.db</span> loses real content — it can only be rebuilt by
			re-requesting the Spotify export and importing it again.
		</p>
	{:else}
		<div class="rule mt-9 pt-8">
			{#if age}
				<p class="num num-lg">
					{age.value}<span class="num-unit">{age.unit}</span>
				</p>
				<p class="mt-2.5 text-[15px] leading-relaxed" class:text-warn={age.stale} class:text-gray={!age.stale}>
					since the last one ran, at {formatDate(data.last!.timestamp)}.
				</p>
				{#if data.last?.message}
					<p class="meta mt-1.5">{data.last.message}</p>
				{/if}
			{:else}
				<p class="num num-lg">Never</p>
				<p class="mt-2.5 text-[15px] leading-relaxed text-warn">
					No backup commit found — either none has run, or the remote is unreachable from here.
				</p>
			{/if}
		</div>

		<div class="rule mt-8 pt-8">
			<p class="label">What goes</p>
			<div class="ledger mt-3">
				<div class="ledger__row">
					<span class="h-card ledger__name">spotify-history.db</span>
					<span class="meta ledger__val">listening history — not rebuildable</span>
				</div>
				<div class="ledger__row">
					<span class="h-card ledger__name">simkl-cache.db</span>
					<span class="meta ledger__val">re-warms itself over a few page loads</span>
				</div>
				<div class="ledger__row">
					<span class="h-card ledger__name">status.db</span>
					<span class="meta ledger__val">falls back to the built-in lines</span>
				</div>
				<div class="ledger__row">
					<span class="h-card ledger__name">media/</span>
					<span class="meta ledger__val">every uploaded image</span>
				</div>
			</div>
		</div>

		<form
			method="POST"
			class="mt-8"
			use:enhance={() => {
				running = true;
				return async ({ update }) => {
					await update();
					running = false;
				};
			}}
		>
			<button type="submit" disabled={running} class="btn btn--accent link disabled:opacity-50">
				{running ? 'Running…' : 'Run one now'}
			</button>
		</form>

		{#if form && 'error' in form && form.error}
			<p class="mt-5 text-sm text-danger-text">{form.error}</p>
		{/if}
		{#if form && 'result' in form && form.result}
			{#if form.result.committed}
				<p class="mt-5 text-sm text-primary">
					Backed up {form.result.dbs.join(', ') || 'nothing new'} at {formatDate(
						form.result.timestamp
					)}.
				</p>
			{:else}
				<p class="meta mt-5">{form.result.message}</p>
			{/if}
		{/if}

		<p class="meta mt-8 measure">
			A 56 MB push can outlive the proxy timeout, so this button reporting a failure does not mean
			the backup failed — check the backup repo for a new commit before running it again.
		</p>
	{/if}
</main>
