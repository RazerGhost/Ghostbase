<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initialItems = untrack(() => (form?.items ?? data.items.join('\n')) as string);

	let saving = $state(false);
	let saved = $state(false);
	let savedTimeout: ReturnType<typeof setTimeout> | undefined;
</script>

<Seo title="Status editor — RazerGhost" description="Private status editor." path="/admin/status" noindex />

<main class="page page--narrow">
	<h1 class="h-page">Edit status</h1>
	<p class="mt-2 text-sm text-dim">Shown in the "Right now" card on the <a href="/" class="link text-primary hover:underline">homepage</a>.</p>

	<form
		method="POST"
		class="mt-8 flex flex-col gap-4"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				await update();
				saving = false;
				if (result.type === 'redirect') {
					saved = true;
					clearTimeout(savedTimeout);
					savedTimeout = setTimeout(() => (saved = false), 3000);
				}
			};
		}}
	>
		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}
		{#if saved}
			<p class="text-sm text-primary">Saved.</p>
		{/if}

		<label class="flex flex-col gap-1 text-sm text-gray">
			Last updated
			<input
				type="text"
				name="updated"
				placeholder="e.g. July 16, 2026"
				value={form?.updated ?? data.updated}
				required
				class="input"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm text-gray">
			Status items (one per line)
			<textarea
				name="items"
				rows="8"
				required
				class="input"
				>{initialItems}</textarea
			>
		</label>

		<div class="flex gap-3">
			<button
				type="submit"
				disabled={saving}
				class="btn btn--accent link disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save'}
			</button>
			<a
				href="/"
				target="_blank"
				class="btn link"
			>
				View live
			</a>
		</div>
	</form>
</main>
