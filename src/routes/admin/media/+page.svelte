<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import MediaLibrary from '$lib/components/MediaLibrary.svelte';
</script>

<Seo title="Media library — RazerGhost" description="Private media library." path="/admin/media" noindex />

<main class="page page--prose">
	<h1 class="h-page">Media library</h1>
	<p class="mt-2 text-sm text-dim">
		Uploads live on the persistent data volume and are served publicly at <code>/media/&lt;file&gt;</code>
		 — click a thumbnail's copy icon to grab its URL for a cover image, gallery, or post body.
	</p>

	<div class="mt-8">
		<MediaLibrary />
	</div>
</main>
