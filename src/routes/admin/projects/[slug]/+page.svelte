<script lang="ts">
	/**
	 * The project editor — the post editor's shape with a project's
	 * frontmatter. Projects follow the devlog on the public site
	 * (design.md § Lists), so they follow it here too.
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
		name: form?.name ?? data.name,
		description: form?.description ?? data.description,
		href: form?.href ?? data.href,
		live: form?.live ?? data.live,
		date: form?.date ?? data.date,
		tags: form?.tags ?? data.tags,
		stack: form?.stack ?? data.stack,
		cover: form?.cover ?? data.cover,
		images: form?.images ?? data.images,
		status: form?.status ?? data.status,
		featured: form?.featured ?? data.featured,
		draft: form?.draft ?? data.draft,
		body: form?.body ?? data.body
	}));

	let name = $state(initial.name);
	let description = $state(initial.description);
	let href = $state(initial.href);
	let live = $state(initial.live);
	let date = $state(initial.date);
	let tags = $state(initial.tags);
	let stack = $state(initial.stack);
	let cover = $state(initial.cover);
	let images = $state(initial.images);
	let status = $state(initial.status);
	let featured = $state(initial.featured);
	let draft = $state(initial.draft);
	let body = $state(initial.body);

	let saving = $state(false);
	let savedAt = $state<Date | null>(null);
	let confirmingDelete = $state(false);
	let coverPickerOpen = $state(false);
	let galleryPickerOpen = $state(false);

	const dirty = $derived(
		name !== initial.name ||
			description !== initial.description ||
			href !== initial.href ||
			live !== initial.live ||
			date !== initial.date ||
			tags !== initial.tags ||
			stack !== initial.stack ||
			cover !== initial.cover ||
			images !== initial.images ||
			status !== initial.status ||
			featured !== initial.featured ||
			draft !== initial.draft ||
			body !== initial.body
	);

	function addGalleryImages(urls: string[]) {
		if (urls.length === 0) return;
		images = images ? `${images}, ${urls.join(', ')}` : urls.join(', ');
	}

	const galleryCount = $derived(images.split(',').map((s) => s.trim()).filter(Boolean).length);
</script>

<Seo
	title="Edit {data.name} — RazerGhost"
	description="Private projects editor."
	path="/admin/projects/{data.slug}"
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

		<label for="project-name" class="label block">Name</label>
		<input
			id="project-name"
			type="text"
			name="name"
			bind:value={name}
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
					<p class="meta">
						{galleryCount}
						{galleryCount === 1 ? 'image' : 'images'}
					</p>
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
				{saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
			</button>
			<a href="/projects/{data.slug}" target="_blank" rel="noreferrer" class="btn link">View live</a>
			<a href="/admin/projects" class="link text-sm">Back to the list</a>
			<span class="flex-1"></span>
			<button
				type="button"
				onclick={() => (confirmingDelete = true)}
				class="link text-sm text-dim transition-colors hover:text-danger-text"
			>
				Delete this project
			</button>
		</div>
	</form>

	<form method="POST" action="?/delete" id="delete-form"></form>
</main>

<ConfirmDialog
	bind:open={confirmingDelete}
	title={`Delete "${data.name}"?`}
	onconfirm={() => (document.getElementById('delete-form') as HTMLFormElement).requestSubmit()}
/>

<MediaPicker bind:open={coverPickerOpen} onselect={(url) => (cover = url)} />
<MediaPicker bind:open={galleryPickerOpen} onselectMultiple={addGalleryImages} />
