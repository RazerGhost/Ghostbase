<script lang="ts">
	/**
	 * The dock — the only fixed element on the site (design.md § Chrome).
	 *
	 * A right-edge rail above 900px, a bottom bar below it; `.dock` in
	 * roles.css does that switch, so this file only decides what earns a
	 * cell. The rule is in the charter: where you navigate to lives here,
	 * where you leave the site for lives in the footer. Search and the theme
	 * toggle are here because they act on the page you are already on.
	 *
	 * Icons are presentation, so they are mapped here rather than added to
	 * `navLinks` in config.ts, which stays a list of destinations.
	 */
	import { page } from '$app/state';
	import { navLinks } from '$lib/config';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import NotebookText from '@lucide/svelte/icons/notebook-text';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Tv from '@lucide/svelte/icons/tv';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import type { Component } from 'svelte';

	const icons: Record<string, Component> = {
		'/about': User,
		'/projects': FolderGit2,
		'/devlog': NotebookText,
		'/gear': Wrench,
		'/watchlist': Tv,
		'/listens': AudioLines
	};

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
</script>

<nav class="dock" aria-label="Pages">
	{#each navLinks as link}
		{@const Icon = icons[link.href]}
		{@const active = page.url.pathname.startsWith(link.href)}
		<a
			href={link.href}
			class="dock__cell"
			aria-label={link.label}
			aria-current={active ? 'page' : undefined}
		>
			<Icon size={17} aria-hidden="true" />
			<span class="dock__label label" aria-hidden="true">{link.label}</span>
		</a>
	{/each}

	<span class="dock__rule" aria-hidden="true"></span>

	<button
		type="button"
		class="dock__cell"
		onclick={() => (commandPalette.open = true)}
		aria-label="Search"
	>
		<Search size={16} aria-hidden="true" />
		<span class="dock__label label" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</span>
	</button>

	<ThemeToggle />
</nav>
