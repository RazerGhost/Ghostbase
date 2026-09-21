<script lang="ts">
	/**
	 * The "Right now" card, edited as the list it is.
	 *
	 * It was one textarea, newline-separated, so reordering two lines meant
	 * cutting and pasting them and adding one meant remembering the format.
	 * The rows below are the same data — they still post as a newline-joined
	 * string, so the server action is untouched.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let items = $state<string[]>(
		untrack(() => {
			const raw = (form?.items as string | undefined) ?? data.items.join('\n');
			const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
			return lines.length ? lines : [''];
		})
	);
	let updated = $state(untrack(() => (form?.updated as string | undefined) ?? data.updated));

	let saving = $state(false);
	let saved = $state(false);
	let savedTimeout: ReturnType<typeof setTimeout> | undefined;
	let dragging = $state<number | null>(null);

	const serialised = $derived(items.map((l) => l.trim()).filter(Boolean).join('\n'));
	const live = $derived(items.map((l) => l.trim()).filter(Boolean));

	function move(from: number, to: number) {
		if (to < 0 || to >= items.length || from === to) return;
		const next = items.slice();
		const [row] = next.splice(from, 1);
		next.splice(to, 0, row);
		items = next;
	}
</script>

<Seo title="Right now — RazerGhost" description="Private status editor." path="/admin/status" noindex />

<main class="page page--narrow">
	<h1 class="h-page">Right now</h1>
	<p class="lead mt-2">The card on the home page. Saves to the volume — no commit needed.</p>

	<form
		method="POST"
		class="mt-9"
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
			<p class="mb-5 text-sm text-danger-text">{form.error}</p>
		{/if}
		{#if saved}
			<p class="mb-5 text-sm text-primary">Saved. The home page has it already.</p>
		{/if}

		<!-- The server action still reads one newline-joined field. -->
		<input type="hidden" name="items" value={serialised} />

		<p class="label">Lines</p>
		<ul class="rule mt-2">
			{#each items as _, i (i)}
				<li
					class="flex items-start gap-3.5 py-3.5"
					class:opacity-50={dragging === i}
					draggable="true"
					ondragstart={() => (dragging = i)}
					ondragend={() => (dragging = null)}
					ondragover={(e) => e.preventDefault()}
					ondrop={(e) => {
						e.preventDefault();
						if (dragging !== null) move(dragging, i);
						dragging = null;
					}}
				>
					<span class="mt-2.5 shrink-0 cursor-grab text-dim" aria-hidden="true">
						<GripVertical size={15} />
					</span>
					<label class="sr-only" for="status-line-{i}">Status line {i + 1}</label>
					<textarea
						id="status-line-{i}"
						rows="2"
						bind:value={items[i]}
						placeholder="What you are doing…"
						class="input min-w-0 flex-1 resize-none"
					></textarea>
					<!-- Dragging is the quick way and the keyboard way is these:
					     a drag handle alone would put reordering out of reach
					     for anyone not using a mouse. -->
					<div class="flex shrink-0 items-center gap-0.5">
						<button
							type="button"
							class="flex size-7 items-center justify-center rounded text-dim transition-colors hover:text-white disabled:opacity-25"
							onclick={() => move(i, i - 1)}
							disabled={i === 0}
							aria-label="Move line {i + 1} up"
						>
							<ChevronUp size={15} />
						</button>
						<button
							type="button"
							class="flex size-7 items-center justify-center rounded text-dim transition-colors hover:text-white disabled:opacity-25"
							onclick={() => move(i, i + 1)}
							disabled={i === items.length - 1}
							aria-label="Move line {i + 1} down"
						>
							<ChevronDown size={15} />
						</button>
						<button
							type="button"
							class="flex size-7 items-center justify-center rounded text-dim transition-colors hover:text-danger-text"
							onclick={() => (items = items.filter((__, j) => j !== i))}
							aria-label="Remove line {i + 1}"
						>
							<X size={14} />
						</button>
					</div>
				</li>
			{/each}
		</ul>

		<button
			type="button"
			class="btn mt-5 inline-flex items-center gap-2 border-dashed"
			onclick={() => (items = [...items, ''])}
		>
			<Plus size={13} aria-hidden="true" /> Add a line
		</button>

		<div class="mt-9 max-w-xs">
			<label for="status-updated" class="label block">Last updated</label>
			<input
				id="status-updated"
				type="text"
				name="updated"
				bind:value={updated}
				placeholder="e.g. 21 September 2026"
				required
				class="input mt-2"
			/>
		</div>

		<div class="mt-9 flex items-center gap-4">
			<button type="submit" disabled={saving} class="btn btn--accent link disabled:opacity-50">
				{saving ? 'Saving…' : 'Save'}
			</button>
			<a href="/" target="_blank" rel="noreferrer" class="link text-sm">See it on the home page</a>
		</div>
	</form>

	<!-- Not a mockup: the same roles the home page's card uses. -->
	<div class="rule mt-12 pt-8">
		<p class="label">As the home page reads it</p>
		<div class="card mt-4">
			<p class="label">Right now</p>
			{#each live as line}
				<p class="mt-3 text-[15px] leading-relaxed text-gray">{line}</p>
			{:else}
				<p class="meta mt-3">Nothing set — the home page falls back to its built-in lines.</p>
			{/each}
		</div>
		<p class="meta mt-3">Updated {updated || '—'}</p>
	</div>
</main>
