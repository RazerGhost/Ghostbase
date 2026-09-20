<script lang="ts">
	/**
	 * A project as an editorial entry row (design.md § Lists — projects follow
	 * the devlog): mono status line, serif name, description, stack. Separated
	 * by a hairline rather than boxed.
	 *
	 * `featured` marks the one project that leads the page — it gets the accent
	 * rule rather than a different shape.
	 */
	import type { ProjectMeta } from '$lib/server/projects';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';

	let { project, featured = false }: { project: ProjectMeta; featured?: boolean } = $props();

	const badges = $derived(project.stack.length ? project.stack : project.tags);
</script>

<a
	href={`/projects/${project.slug}`}
	class="entry -mx-3 block px-3 py-5"
	class:border-primary={featured}
>
	<div class="flex items-baseline justify-between gap-4">
		<p class="mono">
			{#if featured}<span class="mono--accent">Featured · </span>{/if}{project.status}
		</p>
		<ArrowUpRight size={14} class="shrink-0 text-dim" aria-hidden="true" />
	</div>

	<h2 class="h-card-lg entry__title mt-2">{project.name}</h2>
	<p class="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray">{project.description}</p>

	<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
		{#if badges.length}
			<p class="mono">{badges.join(' · ')}</p>
		{/if}
		{#if project.href}
			<p class="mono inline-flex items-center gap-1.5">
				<GithubIcon size={12} aria-hidden="true" />
				{project.href.replace('https://github.com/', '')}
			</p>
		{/if}
	</div>
</a>
