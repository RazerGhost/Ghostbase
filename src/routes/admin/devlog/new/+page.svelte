<script lang="ts">
	/**
	 * A new post. The same surface as editing one, minus the things that only
	 * exist once a file does: the publish state, the social card and delete.
	 */
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import MediaPicker from '$lib/components/MediaPicker.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import UnsavedGuard from '$lib/components/admin/UnsavedGuard.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const today = new Date().toISOString().slice(0, 10);

	let title = $state(untrack(() => form?.title ?? ''));
	let date = $state(untrack(() => form?.date ?? today));
	let series = $state(untrack(() => form?.series ?? ''));
	let tags = $state(untrack(() => form?.tags ?? ''));
	let cover = $state(untrack(() => form?.cover ?? ''));
	let excerpt = $state(untrack(() => form?.excerpt ?? ''));
	let draft = $state(untrack(() => form?.draft ?? true));
	let body = $state(untrack(() => form?.body ?? ''));

	let saving = $state(false);
	let coverPickerOpen = $state(false);

	const dirty = $derived(Boolean(title.trim() || body.trim() || excerpt.trim()));
	const excerptLength = $derived(excerpt.trim().length);
</script>

<Seo title="New post — RazerGhost" description="Private devlog editor." path="/admin/devlog/new" noindex />

<UnsavedGuard {dirty} />

<main class="page">
	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		{#if form?.error}
			<p class="mb-5 text-sm text-danger-text">{form.error}</p>
		{/if}

		<label for="post-title" class="label block">Title</label>
		<input
			id="post-title"
			type="text"
			name="title"
			bind:value={title}
			required
			placeholder="What is it called?"
			class="title-input mt-2"
		/>
		<p class="meta mt-4">
			The file will be <span class="mono">src/content/devlog/{date}-…md</span> — the date and title
			make the slug, so changing either later renames it.
		</p>

		<div class="editor rule mt-8 pt-8">
			<div class="editor__rail">
				<div class="flex gap-4">
					<div class="field flex-1">
						<label for="f-date" class="label">Date</label>
						<input id="f-date" type="date" name="date" bind:value={date} required class="input" />
					</div>
					<div class="field flex-1">
						<label for="f-series" class="label">Series</label>
						<input
							id="f-series"
							type="text"
							name="series"
							bind:value={series}
							placeholder="none"
							class="input"
						/>
					</div>
				</div>

				<div class="field">
					<label for="f-tags" class="label">Tags</label>
					<input
						id="f-tags"
						type="text"
						name="tags"
						bind:value={tags}
						placeholder="comma separated"
						class="input"
					/>
				</div>

				<div class="field">
					<label for="f-excerpt" class="label">Excerpt</label>
					<textarea id="f-excerpt" name="excerpt" rows="4" bind:value={excerpt} class="input"
					></textarea>
					<p class="meta">
						{#if excerptLength}
							{excerptLength} characters · used in the list, RSS and the social card
						{:else}
							Used in the list, RSS and the social card.
						{/if}
					</p>
				</div>

				<div class="field">
					<label for="f-cover" class="label">Cover</label>
					<div class="flex gap-2">
						<input id="f-cover" type="text" name="cover" bind:value={cover} class="input flex-1" />
						<button
							type="button"
							onclick={() => (coverPickerOpen = true)}
							class="btn btn--sq link shrink-0">Browse…</button
						>
					</div>
				</div>

				<div class="field">
					<span class="label">Visibility</span>
					<label class="flex items-start gap-2.5 text-sm text-white">
						<input type="checkbox" name="draft" bind:checked={draft} class="mt-1 accent-primary" />
						<span>
							Draft
							<span class="meta mt-0.5 block"
								>Hidden from the list, RSS and the sitemap. Still open by direct link.</span
							>
						</span>
					</label>
				</div>
			</div>

			<div class="min-w-0">
				<MarkdownEditor bind:value={body} required />
			</div>
		</div>

		<div class="rule mt-10 flex flex-wrap items-center gap-4 pt-6">
			<button type="submit" disabled={saving} class="btn btn--accent link disabled:opacity-50">
				{saving ? 'Creating…' : 'Create'}
			</button>
			<a href="/admin/devlog" class="link text-sm">Back to the list</a>
		</div>
	</form>
</main>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
