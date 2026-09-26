<script lang="ts">
	/**
	 * The dock — the only fixed element on the site (design.md § Chrome).
	 *
	 * A right-edge rail above 900px, a bottom bar below it; `.dock` in
	 * roles.css does that switch, so this file only decides what earns a
	 * cell. The rule is in the charter: where you navigate to lives here,
	 * where you leave the site for lives in the footer. Search, the theme
	 * toggle and "back to top" are here because they act on the page you are
	 * already on — and because a second fixed object floating in the corner
	 * would contradict the one rule this design has.
	 *
	 * Icons are presentation, so they are mapped here rather than added to
	 * `navLinks` in config.ts, which stays a list of destinations.
	 *
	 * The admin area wears the same dock with a different set of cells: one
	 * fixed element is the whole rule (design.md § Chrome), so admin gets
	 * these cells pointed somewhere else rather than a second bar of its own.
	 * `links`, `home` and `exit` are what differ; everything below is shared.
	 */
	import { page, navigating } from '$app/state';
	import { offlineNavigation } from '$lib/stores/offline-navigation.svelte';
	import { navLinks } from '$lib/config';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import { shouldShowBackToTop } from '$lib/back-to-top';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import User from '@lucide/svelte/icons/user';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import NotebookText from '@lucide/svelte/icons/notebook-text';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Tv from '@lucide/svelte/icons/tv';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import type { Component } from 'svelte';

	type DockLink = { label: string; href: string };

	let {
		links = navLinks,
		home = { href: '/', label: 'Home' },
		icons: iconOverrides,
		exit,
		showSearch = true,
		ariaLabel = 'Pages'
	}: {
		links?: DockLink[];
		home?: DockLink;
		icons?: Record<string, Component>;
		exit?: { href: string; label: string; icon: Component };
		showSearch?: boolean;
		ariaLabel?: string;
	} = $props();

	const defaultIcons: Record<string, Component> = {
		'/about': User,
		'/projects': FolderGit2,
		'/devlog': NotebookText,
		'/gear': Wrench,
		'/watchlist': Tv,
		'/listens': AudioLines
	};
	const icons = $derived(iconOverrides ?? defaultIcons);

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

	// Where the reader is going, not where they were. On a phone the tap is
	// where loading starts (there is no hover to preload on), so the load
	// can take long enough to notice — and a dock still marking the previous
	// page over the next page's skeleton reads as the tap not having landed.
	const path = $derived(
		navigating.to?.url.pathname ?? offlineNavigation.target?.pathname ?? page.url.pathname
	);

	// The home cell is matched exactly: every path starts with "/", so the
	// prefix test the other cells use would mark "/" current everywhere. The
	// admin dashboard has the same problem against its own children.
	const atHome = $derived(path === home.href);

	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => {
			// The rule itself is in back-to-top.ts, with the measurements that
			// produced it — it has been wrong in both directions already, and
			// it is not the sort of thing to keep re-deciding inside a scroll
			// handler.
			scrolled = shouldShowBackToTop(
				window.scrollY,
				window.innerHeight,
				document.documentElement.scrollHeight
			);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<nav class="dock" aria-label={ariaLabel}>
	<!-- Home is the mark itself, first. Drawn inline rather than loaded from
	     static/brand/ so it takes currentColor and behaves like every other
	     cell — dim at rest, accent when current or hovered. -->
	<a
		href={home.href}
		class="dock__cell"
		aria-label={home.label}
		aria-current={atHome ? 'page' : undefined}
	>
		<svg
			width="14"
			height="18"
			viewBox="17 7 66 86"
			fill="none"
			stroke="currentColor"
			stroke-width="6"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path
				d="M20 81.688 L20 41.169 C20 24.07 33.542 10 50 10 C66.458 10 80 24.07 80 41.169 L80 81.688 L70 90 L60 81.688 L50 90 L40 81.688 L30 90 Z"
			/>
			<circle cx="40" cy="43.249" r="4" fill="currentColor" stroke="none" />
			<circle cx="60" cy="43.249" r="4" fill="currentColor" stroke="none" />
		</svg>
		<span class="dock__label label" aria-hidden="true">{home.label}</span>
	</a>

	{#each links as link}
		{@const Icon = icons[link.href]}
		{@const active = path.startsWith(link.href)}
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

	{#if exit}
		<a href={exit.href} class="dock__cell" aria-label={exit.label}>
			<exit.icon size={16} aria-hidden="true" />
			<span class="dock__label label" aria-hidden="true">{exit.label}</span>
		</a>
	{/if}

	{#if showSearch}
		<button
			type="button"
			class="dock__cell"
			onclick={() => (commandPalette.open = true)}
			aria-label="Search"
		>
			<Search size={16} aria-hidden="true" />
			<span class="dock__label label" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</span>
		</button>
	{/if}

	<ThemeToggle />

	{#if scrolled}
		<!-- Rail only (see roles.css): on the bar, nine cells already divide a
		     360px phone and a tenth would make each one too small to hit. -->
		<button
			type="button"
			class="dock__cell dock__cell--top"
			onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			aria-label="Back to top"
		>
			<ArrowUp size={16} aria-hidden="true" />
			<span class="dock__label label" aria-hidden="true">Top</span>
		</button>
	{/if}
</nav>
