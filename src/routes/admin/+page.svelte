<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { adminLinks } from '$lib/config';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const s = $derived(data.state);

	function ago(iso: string | null): string | null {
		if (!iso) return null;
		const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
		if (days <= 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 30) return `${days} days ago`;
		const months = Math.round(days / 30);
		return months === 1 ? 'a month ago' : `${months} months ago`;
	}

	const nf = new Intl.NumberFormat('en-GB');

	// The right-hand note on each tool row: what that tool would tell you if
	// you opened it. `tone` is what earns the warn colour — "you have work
	// sitting here", never just "this number is large".
	const notes = $derived<Record<string, { note: string; tone?: 'warn' }>>({
		'/admin/devlog': s.devlog.changed
			? { note: `${s.devlog.changed} uncommitted`, tone: 'warn' }
			: { note: `${s.devlog.total} posts` },
		'/admin/projects': s.projects.changed
			? { note: `${s.projects.changed} uncommitted`, tone: 'warn' }
			: { note: `${s.projects.total} ${s.projects.total === 1 ? 'entry' : 'entries'}` },
		'/admin/pages': s.pages.changed
			? { note: `${s.pages.changed} uncommitted`, tone: 'warn' }
			: { note: `${s.pages.total} ${s.pages.total === 1 ? 'page' : 'pages'}` },
		'/admin/status': { note: 'home page' },
		'/admin/media': { note: `${s.media.files} files` },
		'/spotify-import': { note: s.listens.plays ? `${nf.format(s.listens.plays)} plays` : 'nothing yet' },
		'/admin/watchlist-cache': s.cache.missingRuntime
			? { note: `${s.cache.missingRuntime} incomplete`, tone: 'warn' }
			: { note: `${s.cache.rows} rows` },
		'/admin/backups': !s.backup.configured
			? { note: 'not configured', tone: 'warn' }
			: s.backup.last
				? { note: ago(s.backup.last.timestamp) ?? '—' }
				: { note: 'never run', tone: 'warn' }
	});

	const descriptions: Record<string, string> = {
		'/admin/devlog': 'Posts in src/content/devlog',
		'/admin/projects': 'Entries in src/content/projects',
		'/admin/pages': 'About, and whatever joins it',
		'/admin/status': 'The "Right now" card on the home page',
		'/admin/media': 'Covers, galleries and body images',
		'/spotify-import': 'Backfill from an extended history export',
		'/admin/watchlist-cache': 'Simkl genres, synopses and runtimes',
		'/admin/backups': 'Three databases and the media folder'
	};

	// Written, not badged (design.md § Microinteractions — empty states are
	// written). Only things you could act on today get a sentence.
	const attention = $derived.by(() => {
		const items: string[] = [];
		const changed = s.devlog.changed + s.projects.changed + s.pages.changed;
		if (changed) {
			items.push(
				changed === 1
					? 'one file is written but not committed'
					: `${changed} files are written but not committed`
			);
		}
		if (s.git && s.git.ahead) {
			items.push(`${s.git.ahead} ${s.git.ahead === 1 ? 'commit' : 'commits'} have not been pushed`);
		}
		if (s.backup.configured && !s.backup.last) items.push('no backup has ever run');
		else if (s.backup.last) {
			const days = Math.floor((Date.now() - new Date(s.backup.last.timestamp).getTime()) / 86_400_000);
			if (days >= 2) items.push(`the last backup ran ${ago(s.backup.last.timestamp)}`);
		}
		if (s.cache.missingRuntime) {
			items.push(
				`${s.cache.missingRuntime} cached ${s.cache.missingRuntime === 1 ? 'title has' : 'titles have'} no runtime`
			);
		}
		return items;
	});

	function sentence(items: string[]): string {
		if (items.length === 1) return `${items[0]}.`;
		return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}.`;
	}
</script>

<Seo title="Admin — RazerGhost" description="Private admin dashboard." path="/admin" noindex />

<main class="page">
	<h1 class="h-page">Admin</h1>
	<p class="lead mt-2">Everything private, and what state it is all in.</p>

	<!-- The numbers, in the register the home page uses for its own. -->
	<div class="rule mt-9 grid grid-cols-2 gap-8 border-b border-border py-7 lg:grid-cols-4">
		<div>
			<p class="num num-lg">
				{s.devlog.total}<span class="num-unit">{s.devlog.total === 1 ? 'post' : 'posts'}</span>
			</p>
			<p class="meta mt-2 leading-relaxed">
				{#if s.devlog.drafts}
					{s.devlog.drafts} still {s.devlog.drafts === 1 ? 'a draft' : 'drafts'}
				{:else}
					nothing left in draft
				{/if}
			</p>
		</div>
		<div>
			<p class="num num-lg">
				{s.projects.total}<span class="num-unit"
					>{s.projects.total === 1 ? 'project' : 'projects'}</span
				>
			</p>
			<p class="meta mt-2 leading-relaxed">
				{s.media.files}
				{s.media.files === 1 ? 'image' : 'images'} in the library
			</p>
		</div>
		<div>
			<p class="num num-lg">
				{nf.format(s.listens.plays)}<span class="num-unit">plays</span>
			</p>
			<p class="meta mt-2 leading-relaxed">
				{#if s.listens.lastPlayedAt}
					last scrobble {ago(s.listens.lastPlayedAt)}
				{:else}
					nothing imported yet
				{/if}
			</p>
		</div>
		<div>
			<p class="num num-lg">
				{s.cache.rows}<span class="num-unit">cached</span>
			</p>
			<p class="meta mt-2 leading-relaxed">
				Simkl rows behind the watchlist
			</p>
		</div>
	</div>

	{#if attention.length}
		<p class="mt-6 flex items-start gap-3.5 text-[15px] leading-relaxed text-gray">
			<span class="mt-[7px] block size-[7px] shrink-0 rounded-full bg-warn" aria-hidden="true"
			></span>
			<span class="measure">{sentence(attention)}</span>
		</p>
	{:else}
		<p class="mt-6 flex items-start gap-3.5 text-[15px] leading-relaxed text-gray">
			<span class="mt-[7px] block size-[7px] shrink-0 rounded-full bg-primary" aria-hidden="true"
			></span>
			<span class="measure">Nothing wants you. Everything is committed, pushed and backed up.</span>
		</p>
	{/if}

	<p class="label mt-10">Tools</p>
	<div class="mt-1 grid grid-cols-1 gap-x-14 md:grid-cols-2">
		{#each adminLinks as link (link.href)}
			{@const note = notes[link.href]}
			<a href={link.href} class="entry flex items-baseline gap-5 py-4">
				<span class="min-w-0 flex-1">
					<span class="h-card-lg entry__title block">{link.label}</span>
					<span class="meta mt-1.5 block">{descriptions[link.href]}</span>
				</span>
				<span class="label shrink-0" class:text-warn={note?.tone === 'warn'}>{note?.note}</span>
			</a>
		{/each}
	</div>

	<p class="meta mt-8">
		{#if s.git}
			On <span class="mono">{s.git.branch}</span>. Content is baked into the image at build time, so
			a post is live once it is pushed — about a minute later.
		{:else}
			This build is not a git checkout, so nothing here can tell you what is committed. The editors
			are meant for <span class="mono">pnpm dev</span> on your own machine.
		{/if}
	</p>
</main>
