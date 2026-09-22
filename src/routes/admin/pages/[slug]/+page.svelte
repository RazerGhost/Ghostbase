<script lang="ts">
	/**
	 * A standing page, edited with the same surface as a post. Fewer fields:
	 * no date, no tags, no draft — a page is live because its route exists.
	 */
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import PublishState from '$lib/components/admin/PublishState.svelte';
	import UnsavedGuard from '$lib/components/admin/UnsavedGuard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initial = untrack(() => ({
		title: form?.title ?? data.title,
		heading: form?.heading ?? data.heading,
		description: form?.description ?? data.description,
		body: form?.body ?? data.body
	}));

	let title = $state(initial.title);
	let heading = $state(initial.heading);
	let description = $state(initial.description);
	let body = $state(initial.body);

	let saving = $state(false);
	let savedAt = $state<Date | null>(null);

	const dirty = $derived(
		title !== initial.title ||
			heading !== initial.heading ||
			description !== initial.description ||
			body !== initial.body
	);

	const descriptionLength = $derived(description.trim().length);
</script>

<Seo
	title="Edit {data.heading} — RazerGhost"
	description="Private page editor."
	path="/admin/pages/{data.slug}"
	noindex
/>

<UnsavedGuard {dirty} />

<main class="page">
	<form
		method="POST"
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

		<label for="page-heading" class="label block">Heading</label>
		<input
			id="page-heading"
			type="text"
			name="heading"
			bind:value={heading}
			required
			class="title-input mt-2"
		/>
		<p class="meta mt-4">
			The h1 on <span class="mono">/{data.slug}</span>. The route is code, so this page cannot be
			renamed or deleted from here.
		</p>

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
					<label for="f-title" class="label">Browser title</label>
					<input id="f-title" type="text" name="title" bind:value={title} class="input" />
					<p class="meta">The tab, the search result and the social card.</p>
				</div>

				<div class="field">
					<label for="f-description" class="label">Description</label>
					<textarea id="f-description" name="description" rows="4" bind:value={description} class="input"
					></textarea>
					<p class="meta">
						{#if descriptionLength}
							{descriptionLength} characters · the meta description
						{:else}
							Empty — search results will show whatever Google picks out of the page.
						{/if}
					</p>
				</div>

				<div class="field rule pt-6">
					<span class="label">Live parts</span>
					<p class="meta">
						The numbers, the presence line and the social links are not in this markdown — they
						change on their own, so they live in the route.
					</p>
				</div>
			</div>

			<div class="min-w-0">
				<MarkdownEditor bind:value={body} required />
			</div>
		</div>

		<div class="rule mt-10 flex flex-wrap items-center gap-4 pt-6">
			<button type="submit" disabled={saving} class="btn btn--accent link disabled:opacity-50">
				{saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
			</button>
			<a href="/{data.slug}" target="_blank" rel="noreferrer" class="btn link">View live</a>
			<a href="/admin/pages" class="link text-sm">Back to the list</a>
		</div>
	</form>
</main>
