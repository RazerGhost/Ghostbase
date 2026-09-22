<script lang="ts">
	/**
	 * The private side's chrome — head, trail and dock.
	 *
	 * It used to be a bordered strip holding one "← Admin" link, sitting under
	 * the site's own running head and beside the site's own dock: three pieces
	 * of chrome, one of which existed to undo the other two pointing at the
	 * wrong place. The rule from design.md § Chrome still holds here — the page
	 * is printed and only the dock follows you — so admin wears the same head
	 * and the same dock with the cells pointed at the private side, and the
	 * root layout stands down for these paths (see routes/+layout.svelte).
	 *
	 * Lives here rather than in admin/+layout.svelte because /spotify-import is
	 * behind the same gate but outside that route folder, and would otherwise
	 * be the one private page with no chrome at all.
	 */
	import { page } from '$app/state';
	import { adminLinks } from '$lib/config';
	import RunningHead from '$lib/components/RunningHead.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import NotebookText from '@lucide/svelte/icons/notebook-text';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import Activity from '@lucide/svelte/icons/activity';
	import FileText from '@lucide/svelte/icons/file-text';
	import Image from '@lucide/svelte/icons/image';
	import Music from '@lucide/svelte/icons/music';
	import Database from '@lucide/svelte/icons/database';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import type { Component, Snippet } from 'svelte';

	let { user, children }: { user?: { username: string } | null; children: Snippet } = $props();

	const icons: Record<string, Component> = {
		'/admin/devlog': NotebookText,
		'/admin/projects': FolderGit2,
		'/admin/pages': FileText,
		'/admin/status': Activity,
		'/admin/media': Image,
		'/spotify-import': Music,
		'/admin/watchlist-cache': Database,
		'/admin/backups': ArchiveRestore
	};

	// The trail is built from the path rather than declared per page, so a new
	// tool gets its breadcrumb by existing. The leaf of an editor route is the
	// thing being edited, which only that page knows — it returns `adminCrumb`
	// from its own load and this picks it up.
	const crumbs = $derived.by(() => {
		if (page.url.pathname === '/admin') return [{ label: 'Admin' }];

		const trail: { label: string; href?: string }[] = [{ label: 'Admin', href: '/admin' }];
		const tool = adminLinks.find((l) => page.url.pathname.startsWith(l.href));
		if (!tool) return trail;

		const leaf = (page.data as { adminCrumb?: string }).adminCrumb;
		trail.push(leaf ? { label: tool.label, href: tool.href } : { label: tool.label });
		if (leaf) trail.push({ label: leaf });
		return trail;
	});
</script>

<RunningHead {crumbs}>
	{#snippet trailing()}
		<span class="label">Signed in as {user?.username ?? 'you'}</span>
	{/snippet}
</RunningHead>

{@render children()}

<!-- No exit cell: the wordmark in the running head already links to "/", so a
     "back to the site" cell was the same link twice — and the bar has one more
     destination than the public one, so a duplicate is the first thing to cut.
     Measured at 375px: ten cells give 35.9x44, eleven gave 32.6. Neither
     reaches the public dock's 40x44 (design.md § Chrome) because admin has
     more destinations than the public side and no search cell to drop; it
     clears the AA 24x24 minimum, and these editors are a desktop tool by
     design. Cutting the duplicate was still the right first move. -->
<Dock
	links={adminLinks}
	home={{ href: '/admin', label: 'Admin' }}
	{icons}
	showSearch={false}
	ariaLabel="Admin tools"
/>
