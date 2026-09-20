<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import SpotifyWidget from '$lib/components/SpotifyWidget.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<!-- No ambient glow behind the page: Editorial's ground is flat paper-dark,
     and a radial gradient under everything is the one piece of marketing
     furniture that survived the first pass (design.md § Divergence). -->
<div class="relative flex min-h-screen flex-col bg-bg text-white">
	<Nav />
	<div class="relative flex-1">
		{@render children()}
	</div>
	<Footer />
	<BackToTop />
	<SpotifyWidget />
	<CommandPalette entries={data.commandPaletteEntries} />
</div>
