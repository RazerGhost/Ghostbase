<script lang="ts">
	/**
	 * The running head (design.md § Chrome).
	 *
	 * Not a nav bar: nothing here is sticky, there is no fill and no rule
	 * beneath it. It is set on the page and scrolls away like ink on paper —
	 * the dock is the only thing that follows the reader.
	 *
	 * Entirely the mono label register, deliberately: the serif belongs to
	 * the page's own h1, so chrome and content never compete for the same
	 * voice. Wears `.shell`, so the wordmark starts on the same vertical line
	 * as that h1 and as the footer.
	 */
	import { page } from '$app/state';
	import { navLinks, site } from '$lib/config';
	import SpotifyWidget from '$lib/components/SpotifyWidget.svelte';

	// Where you are, in the head's own words. Home gets nothing — the
	// wordmark already said it.
	const here = $derived(navLinks.find((l) => page.url.pathname.startsWith(l.href))?.label);
</script>

<!-- The full-width element is the <header>; .shell goes on the inner div.
     On the outer one it would be a flex item with `margin-inline: auto`,
     which centres it at its content width instead of spanning the page —
     the footer wraps its .shell the same way, for the same reason. -->
<header>
	<div class="shell runhead">
		<div class="flex items-center gap-2.5">
			<!-- alt="" because the wordmark beside it is the accessible name. -->
			<img src="/brand/ghost-outline.svg" width="16" height="16" alt="" />
			<a href="/" class="label text-white transition-colors hover:text-primary">{site.name}</a>
			{#if here}
				<span class="label">/ {here}</span>
			{/if}
		</div>

		<SpotifyWidget />
	</div>
</header>
