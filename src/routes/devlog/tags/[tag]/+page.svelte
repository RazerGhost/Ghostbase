<script lang="ts">
	import DevlogStream from '$lib/components/DevlogStream.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="#{data.tag} — Devlog — RazerGhost"
	description="Devlog posts tagged {data.tag}."
	path="/devlog/tags/{data.tag}"
/>

<main class="page">
	<a href="/devlog" class="ulink">
		<ArrowLeft size={13} aria-hidden="true" /> Devlog
	</a>

	<h1 class="h-page mt-6">#{data.tag}</h1>
	<p class="lead mt-3">
		{data.entries.length}
		{data.entries.length === 1 ? 'post' : 'posts'} tagged &ldquo;{data.tag}&rdquo;.
	</p>

	{#if data.allTags.length > 1}
		<ul class="mt-6 flex flex-wrap gap-2">
			{#each data.allTags as tag}
				<li>
					<a href="/devlog/tags/{tag}" class="chip {tag === data.tag ? 'chip--active' : ''}">
						{tag}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-10">
		<DevlogStream
			entries={data.entries}
			seriesInfo={data.seriesInfo}
			empty="No entries with this tag."
		/>
	</div>
</main>
