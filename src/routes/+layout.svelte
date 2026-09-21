<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { isAdminPath } from '$lib/config';
	import RunningHead from '$lib/components/RunningHead.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// The private side supplies its own head and dock (see admin/+layout.svelte):
	// a dock whose cells are the public pages is the wrong set of destinations
	// while you are editing, and the footer's RSS and social links have no job
	// there at all. The ground, the fonts and the command palette stay shared.
	const admin = $derived(isAdminPath(page.url.pathname));
</script>

<!-- No ambient glow behind the page: Editorial's ground is flat paper-dark,
     and a radial gradient under everything is the one piece of marketing
     furniture that survived the first pass (design.md § Divergence).

     The order here is the design: the head and the footer are part of the
     document and scroll with it, and only the dock is fixed on top of it
     (design.md § Chrome). `.dock-clear` gives the page its height back under
     the bottom bar on a phone. -->
<div class="dock-clear relative flex min-h-screen flex-col bg-bg text-white">
	{#if !admin}
		<RunningHead />
	{/if}
	<div class="relative flex-1">
		{@render children()}
	</div>
	{#if !admin}
		<Footer />
		<Dock />
	{/if}
	<CommandPalette entries={data.commandPaletteEntries} />
</div>
