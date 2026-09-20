<script lang="ts">
	import { page } from '$app/state';
	import { navLinks, site } from '$lib/config';
	import { commandPalette } from '$lib/stores/command-palette.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

	let mobileMenuOpen = $state(false);

	function closeMenu() {
		mobileMenuOpen = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeMenu();
	}
</script>

<svelte:window onkeydown={mobileMenuOpen ? onKeydown : undefined} />

<!-- Editorial masthead: the wordmark in the display serif, sitting on the same
     left edge as every page's h1 because both use .shell. The old nav had its
     own max-width, so it lined up with nothing. -->
<header class="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
	<nav class="shell flex h-[var(--nav-h)] items-center justify-between gap-8">
		<a
			href="/"
			onclick={closeMenu}
			class="flex shrink-0 items-baseline gap-2.5 transition-opacity hover:opacity-80"
		>
			<img src="/brand/ghost-outline.svg" width="17" height="17" alt="" class="translate-y-0.5" />
			<span class="font-serif text-[19px] tracking-[-0.015em] text-white">{site.name}</span>
		</a>

		<div class="flex items-center gap-7">
			<ul class="hidden items-center gap-7 md:flex">
				{#each navLinks as link}
					{@const active = page.url.pathname.startsWith(link.href)}
					<li>
						<a
							href={link.href}
							aria-current={active ? 'page' : undefined}
							class="border-b pb-0.5 text-[13px] transition-colors {active
								? 'border-primary text-primary'
								: 'border-transparent text-dim hover:text-white'}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>

			<div class="flex items-center gap-4">
				<button
					type="button"
					onclick={() => (commandPalette.open = true)}
					aria-label="Open command palette"
					class="hidden items-center gap-2 text-dim transition-colors hover:text-primary sm:flex"
				>
					<Search size={14} aria-hidden="true" />
					<kbd class="mono">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
				</button>
				<ThemeToggle />
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
					aria-expanded={mobileMenuOpen}
					class="flex items-center text-dim transition-colors hover:text-primary md:hidden"
				>
					{#if mobileMenuOpen}
						<X size={18} aria-hidden="true" />
					{:else}
						<Menu size={18} aria-hidden="true" />
					{/if}
				</button>
			</div>
		</div>
	</nav>

	{#if mobileMenuOpen}
		<div class="shell border-t border-border py-5 md:hidden">
			<ul class="flex flex-col gap-4">
				{#each navLinks as link}
					{@const active = page.url.pathname.startsWith(link.href)}
					<li>
						<a
							href={link.href}
							onclick={closeMenu}
							aria-current={active ? 'page' : undefined}
							class="font-serif text-[20px] transition-colors {active
								? 'text-primary'
								: 'text-white'}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>
