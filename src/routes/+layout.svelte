<script lang="ts">
	import '../app.css';
	import RunningHead from '$lib/components/RunningHead.svelte';
	import Dock from '$lib/components/Dock.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<!-- No ambient glow behind the page: Editorial's ground is flat paper-dark,
     and a radial gradient under everything is the one piece of marketing
     furniture that survived the first pass (design.md § Divergence).

     The order here is the design: the head and the footer are part of the
     document and scroll with it, and only the dock is fixed on top of it
     (design.md § Chrome). `.dock-clear` gives the page its height back under
     the bottom bar on a phone. -->
<div class="dock-clear relative flex min-h-screen flex-col bg-bg text-white">
	<RunningHead />
	<div class="relative flex-1">
		{@render children()}
	</div>
	<Footer />
	<Dock />
	<CommandPalette entries={data.commandPaletteEntries} />
</div>
