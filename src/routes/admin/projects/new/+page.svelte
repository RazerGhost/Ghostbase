<script lang="ts">
	/**
	 * A new project. The editing surface minus what only exists once a file
	 * does: the publish state and delete.
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

	let name = $state(untrack(() => form?.name ?? ''));
	let description = $state(untrack(() => form?.description ?? ''));
	let href = $state(untrack(() => form?.href ?? ''));
	let live = $state(untrack(() => form?.live ?? ''));
	let date = $state(untrack(() => form?.date ?? today));
	let tags = $state(untrack(() => form?.tags ?? ''));
	let stack = $state(untrack(() => form?.stack ?? ''));
	let cover = $state(untrack(() => form?.cover ?? ''));
	let images = $state(untrack(() => form?.images ?? ''));
	let status = $state(untrack(() => form?.status ?? 'active'));
	let featured = $state(untrack(() => form?.featured ?? false));
	let draft = $state(untrack(() => form?.draft ?? true));
	let body = $state(untrack(() => form?.body ?? ''));

	let saving = $state(false);
	let coverPickerOpen = $state(false);
	let galleryPickerOpen = $state(false);

	const dirty = $derived(Boolean(name.trim() || description.trim() || body.trim()));

	function addGalleryImages(urls: string[]) {
		if (urls.length === 0) return;
		images = images ? `${images}, ${urls.join(', ')}` : urls.join(', ');
	}
</script>

<Seo
	title="New project — RazerGhost"
	description="Private projects editor."
	path="/admin/projects/new"
	noindex
/>

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

		<label for="project-name" class="label block">Name</label>
		<input
			id="project-name"
			type="text"
			name="name"
			bind:value={name}
			required
			placeholder="What is it called?"
			class="title-input mt-2"
		/>

		<div class="editor rule mt-8 pt-8">
			<div class="editor__rail">
				<div class="field">
					<label for="f-description" class="label">Short description</label>
					<textarea
						id="f-description"
						name="description"
						rows="3"
						bind:value={description}
						required
						class="input"
					></textarea>
					<p class="meta">The one line the projects list shows.</p>
				</div>

				<div class="field">
					<label for="f-href" class="label">Repo</label>
					<input id="f-href" type="url" name="href" bind:value={href} placeholder="https://…" class="input" />
				</div>

				<div class="field">
					<label for="f-live" class="label">Live</label>
					<input id="f-live" type="url" name="live" bind:value={live} placeholder="https://…" class="input" />
				</div>

				<div class="flex gap-4">
					<div class="field flex-1">
						<label for="f-date" class="label">Date</label>
						<input id="f-date" type="date" name="date" bind:value={date} required class="input" />
					</div>
					<div class="field flex-1">
						<label for="f-status" class="label">Status</label>
						<select id="f-status" name="status" bind:value={status} class="input">
							<option value="active">Active</option>
							<option value="paused">Paused</option>
							<option value="archived">Archived</option>
						</select>
					</div>
				</div>

				<div class="field">
					<label for="f-tags" class="label">Tags</label>
					<input id="f-tags" type="text" name="tags" bind:value={tags} placeholder="comma separated" class="input" />
				</div>

				<div class="field">
					<label for="f-stack" class="label">Stack</label>
					<input id="f-stack" type="text" name="stack" bind:value={stack} placeholder="comma separated" class="input" />
				</div>

				<div class="field">
					<label for="f-cover" class="label">Cover</label>
					<div class="flex gap-2">
						<input id="f-cover" type="text" name="cover" bind:value={cover} class="input flex-1" />
						<button type="button" onclick={() => (coverPickerOpen = true)} class="btn btn--sq link shrink-0"
							>Browse…</button
						>
					</div>
				</div>

				<div class="field">
					<label for="f-images" class="label">Gallery</label>
					<div class="flex gap-2">
						<input id="f-images" type="text" name="images" bind:value={images} class="input flex-1" />
						<button type="button" onclick={() => (galleryPickerOpen = true)} class="btn btn--sq link shrink-0"
							>Add…</button
						>
					</div>
				</div>

				<div class="field">
					<span class="label">Visibility</span>
					<label class="flex items-start gap-2.5 text-sm text-white">
						<input type="checkbox" name="featured" bind:checked={featured} class="mt-1 accent-primary" />
						<span>
							Featured
							<span class="meta mt-0.5 block">Pulled to the top of the projects page.</span>
						</span>
					</label>
					<label class="mt-2 flex items-start gap-2.5 text-sm text-white">
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
				<MarkdownEditor bind:value={body} />
			</div>
		</div>

		<div class="rule mt-10 flex flex-wrap items-center gap-4 pt-6">
			<button type="submit" disabled={saving} class="btn btn--accent link disabled:opacity-50">
				{saving ? 'Creating…' : 'Create'}
			</button>
			<a href="/admin/projects" class="link text-sm">Back to the list</a>
		</div>
	</form>
</main>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
<MediaPicker bind:open={galleryPickerOpen} onselectMultiple={addGalleryImages} />
