<script lang="ts">
	/**
	 * Shown in place of a page that could not be opened because the device is
	 * offline (design.md § Loading).
	 *
	 * This cannot be left to +error.svelte. When a navigation's data request
	 * fails to reach the server at all, SvelteKit gives up on the client-side
	 * route and falls back to a full page load — which, offline, is the
	 * browser's own "No internet" page, with the site gone from under the
	 * reader. So the layout catches the navigation before it starts and
	 * renders this instead, keeping the site (and the dock) on screen.
	 */
	import { tick } from 'svelte';
	import { offlineNavigation } from '$lib/stores/offline-navigation.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let { target }: { target: URL } = $props();

	let retrying = $state(false);

	// A full page load, not goto(). The tap that got here also fired
	// SvelteKit's preload on touchstart, and offline that preload failed to
	// fetch the page's code — which the browser then remembers: every later
	// client-side navigation to the page rejects with "Failed to fetch
	// dynamically imported module", connection or not. A fresh document
	// has no such memory.
	//
	// Always allowed, even while the device reports itself offline.
	// navigator.onLine can be wrong, and a button that waits on it would then
	// be a dead end; still offline, the load just ends on the service
	// worker's offline page.
	function retry() {
		retrying = true;
		location.assign(target.href);
	}

	async function back() {
		const y = offlineNavigation.scrollY;
		offlineNavigation.target = null;
		// The page underneath was never unmounted, only hidden, so it comes
		// back as it was once it is visible again — scroll position aside.
		await tick();
		// Instant, not the root's smooth scroll: this is putting the page
		// back where it was, not moving through it.
		window.scrollTo({ top: y, behavior: 'instant' });
	}

	// Coming back online retries by itself: the reader is most likely still
	// looking at this, waiting for exactly that.
	$effect(() => {
		const reconnect = () => retry();
		window.addEventListener('online', reconnect);
		return () => window.removeEventListener('online', reconnect);
	});
</script>

<main class="page page--narrow">
	<section class="flex flex-col items-center py-16 text-center" role="alert">
		<!-- Inline, not <Logo>: that is an <img> of /brand/ghost-mark.svg,
		     which a page that is only ever shown offline cannot fetch. Same
		     outline as the dock's home cell. -->
		<svg
			class="text-primary"
			width="56"
			height="72"
			viewBox="17 7 66 86"
			fill="none"
			stroke="currentColor"
			stroke-width="4"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path
				d="M20 81.688 L20 41.169 C20 24.07 33.542 10 50 10 C66.458 10 80 24.07 80 41.169 L80 81.688 L70 90 L60 81.688 L50 90 L40 81.688 L30 90 Z"
			/>
			<circle cx="40" cy="43.249" r="4" fill="currentColor" stroke="none" />
			<circle cx="60" cy="43.249" r="4" fill="currentColor" stroke="none" />
		</svg>

		<p class="label label--strong mt-6">No connection</p>
		<h1 class="h-page mt-2">You're offline</h1>
		<p class="mt-3 max-w-sm text-gray">
			That page needs the connection to load. It'll open by itself as soon as you're back online.
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<button type="button" class="btn btn--accent" onclick={retry} disabled={retrying}>
				<RefreshCw size={15} class={retrying ? 'animate-spin' : ''} aria-hidden="true" />
				{retrying ? 'Opening…' : 'Try again'}
			</button>
			<!-- The page they tapped away from never went anywhere; it is still
			     loaded, just not rendered. -->
			<button type="button" class="btn" onclick={back}>
				<ArrowLeft size={15} aria-hidden="true" /> Back to where I was
			</button>
		</div>
	</section>
</main>
