<script lang="ts">
	/**
	 * The post editor.
	 *
	 * It was a single narrow column of eight identical bordered boxes, every
	 * one of them placeholder-only — so the moment you typed, the field
	 * stopped saying what it was, and a screen reader never knew. The title of
	 * the post carried the same weight as the path to its cover image.
	 *
	 * Now: the title is edited in the face it publishes in, the frontmatter
	 * sits in a rail beside the body rather than stacked on top of it, every
	 * field has a real <label>, and the things the published page already
	 * knows about a post — its length, its contents list, its social card —
	 * are shown to the person writing it.
	 */
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import MediaPicker from '$lib/components/MediaPicker.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import PublishState from '$lib/components/admin/PublishState.svelte';
	import UnsavedGuard from '$lib/components/admin/UnsavedGuard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initial = untrack(() => ({
		title: form?.title ?? data.title,
		date: form?.date ?? data.date,
		series: form?.series ?? data.series,
		tags: form?.tags ?? data.tags,
		cover: form?.cover ?? data.cover,
		excerpt: form?.excerpt ?? data.excerpt,
		draft: form?.draft ?? data.draft,
		body: form?.body ?? data.body
	}));

	let title = $state(initial.title);
	let date = $state(initial.date);
	let series = $state(initial.series);
	let tags = $state(initial.tags);
	let cover = $state(initial.cover);
	let excerpt = $state(initial.excerpt);
	let draft = $state(initial.draft);
	let body = $state(initial.body);

	let saving = $state(false);
	let savedAt = $state<Date | null>(null);
	let confirmingDelete = $state(false);
	let coverPickerOpen = $state(false);

	// What the guard watches. Compared against what the page loaded with, so
	// typing a character and deleting it again leaves you free to navigate.
	const dirty = $derived(
		title !== initial.title ||
			date !== initial.date ||
			series !== initial.series ||
			tags !== initial.tags ||
			cover !== initial.cover ||
			excerpt !== initial.excerpt ||
			draft !== initial.draft ||
			body !== initial.body
	);

	const excerptLength = $derived(excerpt.trim().length);
</script>

<Seo
	title="Edit {data.title} — RazerGhost"
	description="Private devlog editor."
	path="/admin/devlog/{data.slug}"
	noindex
/>

<UnsavedGuard {dirty} />

<main class="page">
	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				await update();
				saving = false;
				if (result.type === 'redirect') savedAt = new Date();
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
			class="title-input mt-2"
		/>

		<div class="mt-5">
			<PublishState
				tracked={data.git.tracked}
				changed={data.git.changed || dirty}
				ahead={data.git.ahead}
				{savedAt}
			/>
		</div>

		<div class="editor rule mt-8 pt-8">
			<!-- ── Frontmatter ─────────────────────────────────────────── -->
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
							Empty — the list, RSS and the social card will have nothing to show.
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

				<!-- The card this post will be shared as. og.ts renders one per
				     post and the editor never showed it, so the first time you
				     saw a bad line break was on someone else's timeline. -->
				<div class="field rule pt-6">
					<span class="label">Social card</span>
					<img
						src="/devlog/{data.slug}/og.png"
						width="1200"
						height="630"
						alt="The social card generated for this post"
						class="w-full rounded-md border border-border"
						loading="lazy"
					/>
					<p class="meta">Regenerated from the saved post — save to see an edit here.</p>
				</div>
			</div>

			<!-- ── Body ────────────────────────────────────────────────── -->
			<div class="min-w-0">
				<MarkdownEditor bind:value={body} required />
			</div>
		</div>

		<div class="rule mt-10 flex flex-wrap items-center gap-4 pt-6">
			<button type="submit" disabled={saving} class="btn btn--accent link disabled:opacity-50">
				{saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
			</button>
			<a href="/devlog/{data.slug}" target="_blank" rel="noreferrer" class="btn link">View live</a>
			<a href="/admin/devlog" class="link text-sm">Back to the list</a>
			<span class="flex-1"></span>
			<button
				type="button"
				onclick={() => (confirmingDelete = true)}
				class="link text-sm text-dim transition-colors hover:text-danger-text"
			>
				Delete this post
			</button>
		</div>
	</form>

	<form method="POST" action="?/delete" id="delete-form"></form>
</main>

<ConfirmDialog
	bind:open={confirmingDelete}
	title={`Delete "${data.title}"?`}
	onconfirm={() => (document.getElementById('delete-form') as HTMLFormElement).requestSubmit()}
/>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
