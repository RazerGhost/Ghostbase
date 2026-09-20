<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';

	const messages: Record<string, string> = {
		'not-owner': "That GitHub account isn't authorized for this area.",
		state: 'The login attempt could not be verified — try again.',
		error: 'GitHub login failed — try again.'
	};

	const reason = $derived(page.url.searchParams.get('reason') ?? '');
	const message = $derived(messages[reason] ?? 'Access denied.');
</script>

<Seo title="Access denied — RazerGhost" description="Access denied." path="/auth/denied" noindex />

<main class="page page--narrow">
	<section class="flex flex-col items-center py-16 text-center">
		<h1 class="h-page">Access denied</h1>
		<p class="mt-3 max-w-sm text-gray">{message}</p>

		<div class="mt-8">
			<a
				href="/"
				class="btn link"
			>
				Back home
			</a>
		</div>
	</section>
</main>
