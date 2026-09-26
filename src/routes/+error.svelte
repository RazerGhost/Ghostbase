<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	const isNotFound = $derived(page.status === 404);

	// A navigation that is offline before it starts is caught in the layout
	// (OfflineNotice.svelte). One whose connection drops partway can still
	// end up here, as a 500 with SvelteKit's generic "Internal Error" — on a
	// phone that is a dropped connection, not a broken page, and the fix is
	// on the reader's side. So it gets its own words.
	let offline = $state(false);
	$effect(() => {
		const update = () => (offline = !navigator.onLine);
		update();
		// Coming back online retries by itself: the reader is most likely
		// still looking at this page waiting for exactly that.
		const reconnect = () => {
			update();
			if (!isNotFound) retry();
		};
		window.addEventListener('online', reconnect);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', reconnect);
			window.removeEventListener('offline', update);
		};
	});

	let retrying = $state(false);

	// A second attempt at the URL that failed — the URL on an error page is
	// still the one that was asked for. A full page load rather than goto():
	// if what failed was fetching the page's code, the browser remembers that
	// failed import and a client-side retry would fail the same way forever
	// (see OfflineNotice.svelte).
	function retry() {
		retrying = true;
		location.assign(page.url.href);
	}

	const heading = $derived(
		isNotFound ? "There's nothing here" : offline ? "You're offline" : 'Something broke'
	);
	const message = $derived(
		isNotFound
			? 'The ghost moved on, or this link never existed. Try the command palette, or head back home.'
			: offline
				? "This page didn't load because the connection dropped. It'll try again as soon as you're back online."
				: page.status >= 500
					? "The page didn't finish loading. It may just have been a bad moment — trying again usually works."
					: (page.error?.message ?? 'An unexpected error occurred.')
	);
</script>

<Seo
	title="{isNotFound ? 'Page not found' : `Error ${page.status}`} — RazerGhost"
	description="This page doesn't exist."
	path={page.url.pathname}
	noindex
/>

<main class="page page--narrow">
	<section class="flex flex-col items-center py-16 text-center">
		<div class="relative flex h-24 w-24 items-center justify-center" data-hero-reveal="0">
			<div class="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true"></div>
			<Logo variant="mark" size={96} />
		</div>

		<p class="label label--strong mt-6" data-hero-reveal="1">
			{offline && !isNotFound ? 'No connection' : `Error ${page.status}`}
		</p>
		<h1 class="h-page mt-2" data-hero-reveal="2">
			{heading}
		</h1>
		<p class="mt-3 max-w-sm text-gray" data-hero-reveal="3">
			{message}
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3" data-hero-reveal="3">
			{#if !isNotFound && (offline || page.status >= 500)}
				<button type="button" class="btn btn--accent" onclick={retry} disabled={retrying}>
					<RefreshCw size={15} class={retrying ? 'animate-spin' : ''} aria-hidden="true" />
					{retrying ? 'Trying again…' : 'Try again'}
				</button>
			{/if}
			<a
				href="/"
				class="btn link flex items-center gap-1.5"
			>
				<ArrowLeft size={15} aria-hidden="true" /> Back home
			</a>
			<a
				href="/devlog"
				class="btn link flex items-center gap-1.5"
			>
				Devlog
			</a>
		</div>
	</section>
</main>
