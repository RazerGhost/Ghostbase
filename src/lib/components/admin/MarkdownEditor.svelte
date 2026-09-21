<script lang="ts">
	/**
	 * The writing surface, shared by both editors.
	 *
	 * What it adds over the textarea it replaces:
	 *  - a toolbar and shortcuts, so you are not typing raw syntax blind;
	 *  - Split, so Write and Preview stop being an either/or on a wide screen;
	 *  - the outline, which is the same contents list the published post
	 *    builds — so a skipped heading level shows up before it ships;
	 *  - the measure (words, reading time, links, images), live;
	 *  - an embed picker fed by the registry, instead of hand-typing
	 *    <div data-embed="Name"> and hoping the name matches something.
	 *
	 * Paste- and drop-to-upload came from the old editor and are kept.
	 */
	import { marked } from 'marked';
	import { analyse } from '$lib/markdown-stats';
	import { embedRegistry } from '$lib/components/devlog-embeds/registry';
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import Heading2 from '@lucide/svelte/icons/heading-2';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Code from '@lucide/svelte/icons/code';
	import Quote from '@lucide/svelte/icons/quote';
	import List from '@lucide/svelte/icons/list';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Puzzle from '@lucide/svelte/icons/puzzle';

	let {
		value = $bindable(''),
		name = 'body',
		required = false
	}: { value?: string; name?: string; required?: boolean } = $props();

	type Mode = 'write' | 'split' | 'preview';
	let mode = $state<Mode>('write');
	let el: HTMLTextAreaElement | undefined = $state();
	let embedsOpen = $state(false);

	const stats = $derived(analyse(value));
	const previewHtml = $derived(marked.parse(value, { async: false }) as string);

	// One line each, because a bare list of seven component names tells you
	// nothing about which one you want.
	const EMBED_NOTES: Record<string, string> = {
		Counter: 'A number that counts up when it scrolls into view',
		Terminal: 'A static shell transcript',
		TerminalReplay: 'The same, typed out on a timer',
		BeforeAfter: 'Two images behind a slider',
		Callout: 'An aside, set apart from the prose',
		CodeDiff: 'Before and after, as a patch',
		Mermaid: 'A diagram, themed off the tokens'
	};
	const embeds = Object.keys(embedRegistry);

	/**
	 * Wrap the selection, or drop a snippet in at the caret. Keeping the
	 * selection afterwards is the difference between a toolbar you can use
	 * twice in a row and one you cannot.
	 */
	function surround(before: string, after = before, placeholder = '') {
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const selected = value.slice(start, end) || placeholder;
		value = value.slice(0, start) + before + selected + after + value.slice(end);
		const caret = start + before.length;
		queueMicrotask(() => {
			el?.focus();
			el?.setSelectionRange(caret, caret + selected.length);
		});
	}

	/** Prefix every line the selection touches — headings, quotes, lists. */
	function prefixLines(prefix: string) {
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const from = value.lastIndexOf('\n', start - 1) + 1;
		const to = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
		const block = value
			.slice(from, to)
			.split('\n')
			.map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : prefix + line))
			.join('\n');
		value = value.slice(0, from) + block + value.slice(to);
		queueMicrotask(() => {
			el?.focus();
			el?.setSelectionRange(from, from + block.length);
		});
	}

	function insert(text: string) {
		if (!el) {
			value += text;
			return;
		}
		const start = el.selectionStart;
		const end = el.selectionEnd;
		value = value.slice(0, start) + text + value.slice(end);
		const caret = start + text.length;
		queueMicrotask(() => {
			el?.focus();
			el?.setSelectionRange(caret, caret);
		});
	}

	function onKeydown(e: KeyboardEvent) {
		if (!(e.ctrlKey || e.metaKey)) return;
		const key = e.key.toLowerCase();
		const actions: Record<string, () => void> = {
			b: () => surround('**', '**', 'bold'),
			i: () => surround('_', '_', 'italic'),
			e: () => surround('`', '`', 'code'),
			k: () => surround('[', '](url)', 'text'),
			'\\': () => (mode = mode === 'write' ? 'split' : mode === 'split' ? 'preview' : 'write')
		};
		const run = actions[key];
		if (!run) return;
		e.preventDefault();
		run();
	}

	async function upload(file: File) {
		const fd = new FormData();
		fd.set('file', file);
		const res = await fetch('/api/media', { method: 'POST', body: fd });
		if (!res.ok) return;
		const { url } = await res.json();
		insert(`![](${url})`);
	}

	function onPaste(e: ClipboardEvent) {
		const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
		if (!item) return;
		e.preventDefault();
		const file = item.getAsFile();
		if (file) upload(file);
	}

	function onDrop(e: DragEvent) {
		const file = [...(e.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
		if (!file) return;
		e.preventDefault();
		upload(file);
	}

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
	const mod = $derived(isMac ? '⌘' : 'Ctrl ');
</script>

<svelte:window
	onclick={(e) => {
		if (embedsOpen && !(e.target as HTMLElement).closest('[data-embed-menu]')) embedsOpen = false;
	}}
/>

<div>
	<div class="md-bar">
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => surround('**', '**', 'bold')}
			title="Bold ({mod}B)"
			aria-label="Bold"><Bold size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => surround('_', '_', 'italic')}
			title="Italic ({mod}I)"
			aria-label="Italic"><Italic size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => prefixLines('## ')}
			title="Heading"
			aria-label="Heading"><Heading2 size={15} /></button
		>
		<span class="md-bar__sep" aria-hidden="true"></span>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => surround('[', '](url)', 'text')}
			title="Link ({mod}K)"
			aria-label="Link"><Link2 size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => surround('`', '`', 'code')}
			title="Code ({mod}E)"
			aria-label="Code"><Code size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => prefixLines('> ')}
			title="Quote"
			aria-label="Quote"><Quote size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => prefixLines('- ')}
			title="List"
			aria-label="Bulleted list"><List size={15} /></button
		>
		<button
			type="button"
			class="md-bar__btn"
			onclick={() => insert('![](/media/)')}
			title="Image — or just paste or drop one"
			aria-label="Image"><ImageIcon size={15} /></button
		>

		<span class="md-bar__sep" aria-hidden="true"></span>

		<span class="relative" data-embed-menu>
			<button
				type="button"
				class="chip"
				onclick={() => (embedsOpen = !embedsOpen)}
				aria-expanded={embedsOpen}
			>
				<Puzzle size={13} aria-hidden="true" /> Embed
			</button>
			{#if embedsOpen}
				<div
					class="card card--flush absolute top-full left-0 z-20 mt-2 w-72 overflow-hidden p-0"
					role="menu"
				>
					{#each embeds as embedName (embedName)}
						<button
							type="button"
							role="menuitem"
							class="block w-full border-b border-border px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2"
							onclick={() => {
								insert(`\n<div data-embed="${embedName}"></div>\n`);
								embedsOpen = false;
							}}
						>
							<span class="mono block text-primary">{embedName}</span>
							<span class="meta mt-0.5 block">{EMBED_NOTES[embedName] ?? 'An embedded component'}</span>
						</button>
					{/each}
				</div>
			{/if}
		</span>

		<span class="flex-1"></span>

		<span class="flex items-center gap-0.5 rounded-full border border-border p-0.5">
			{#each [['write', 'Write'], ['split', 'Split'], ['preview', 'Preview']] as const as [key, label]}
				<button
					type="button"
					class="rounded-full px-3.5 py-1 text-[13px] transition-colors"
					class:bg-surface-2={mode === key}
					class:text-white={mode === key}
					class:text-dim={mode !== key}
					onclick={() => (mode = key)}
					aria-pressed={mode === key}
				>
					{label}
				</button>
			{/each}
		</span>
	</div>

	<div class="mt-5" class:md-split={mode === 'split'}>
		<label class="sr-only" for="md-body">Body</label>
		<textarea
			id="md-body"
			{name}
			{required}
			bind:this={el}
			bind:value
			onkeydown={onKeydown}
			onpaste={onPaste}
			ondrop={onDrop}
			ondragover={(e) => e.preventDefault()}
			class="md-body"
			class:hidden={mode === 'preview'}
			placeholder="Write it."
		></textarea>

		{#if mode !== 'write'}
			<div class="devlog-content min-w-0">
				{@html previewHtml}
			</div>
		{/if}
	</div>

	<!-- The measure, and the outline it implies. Both are what the published
	     page computes; the editor simply never asked for them. -->
	<div class="rule mt-8 flex flex-wrap items-baseline gap-x-7 gap-y-3 pt-4">
		<span class="label">{stats.words.toLocaleString()} words</span>
		<span class="label">{stats.readingTime} min read</span>
		<span class="label">
			{stats.headings.length}
			{stats.headings.length === 1 ? 'heading' : 'headings'}
		</span>
		<span class="label">{stats.links} {stats.links === 1 ? 'link' : 'links'}</span>
		<span class="label">
			{#if stats.images}
				{stats.images} {stats.images === 1 ? 'image' : 'images'}
			{:else}
				no images
			{/if}
		</span>
		<span class="label ms-auto">{mod}B · {mod}I · {mod}K · {mod}E · {mod}\</span>
	</div>

	{#if stats.headings.length}
		<div class="mt-8">
			<p class="label">Outline</p>
			<div class="mt-3">
				{#each stats.headings as heading (heading.line)}
					<span
						class="outline__item"
						class:outline__item--h3={heading.level >= 3}
						class:outline__item--skip={stats.levelSkips.includes(heading.line)}
					>
						{heading.text}
					</span>
				{/each}
			</div>
			{#if stats.levelSkips.length}
				<p class="meta mt-3 text-warn">
					{stats.levelSkips.length === 1 ? 'One heading skips' : `${stats.levelSkips.length} headings skip`}
					a level. The contents list on the published post is built from these, so it will read as
					though something is missing.
				</p>
			{:else}
				<p class="meta mt-3">This is the contents list the post will publish with.</p>
			{/if}
		</div>
	{/if}
</div>
