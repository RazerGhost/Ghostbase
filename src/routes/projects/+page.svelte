<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Rss from '@lucide/svelte/icons/rss';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import type { ProjectStatus } from '$lib/server/projects';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const initialParams = page.url.searchParams;

	let selectedTag = $state<string | null>(initialParams.get('tag'));
	let selectedStatus = $state<ProjectStatus | null>(
		initialParams.get('status') as ProjectStatus | null
	);
	let query = $state(initialParams.get('q') ?? '');
	let sort = $state<'newest' | 'oldest' | 'name'>('newest');

	// Keep the URL in sync with filters so a filtered view is reload-safe and
	// shareable — replaceState only, same approach as /devlog's list page.
	$effect(() => {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (selectedTag) params.set('tag', selectedTag);
		if (selectedStatus) params.set('status', selectedStatus);
		const qs = params.toString();
		const search = qs ? `?${qs}` : '';
		// Skip when it's already correct (true on mount, since the filters are seeded
		// from the URL) — calling replaceState this early can throw "router is not
		// initialized yet" on a hard reload/direct load, which would otherwise permanently
		// kill this effect since an uncaught error stops it from ever re-running.
		if (search === location.search) return;
		try {
			replaceState(`${location.pathname}${search}`, {});
		} catch {
			// router not ready yet — safe to ignore, see above
		}
	});

	const tagCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const project of data.projects) {
			for (const tag of project.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
		return counts;
	});
	const tags = $derived([...tagCounts.keys()].sort());

	const statuses: ProjectStatus[] = ['active', 'paused', 'archived'];
	const statusCounts = $derived.by(() => {
		const counts = new Map<ProjectStatus, number>();
		for (const project of data.projects) counts.set(project.status, (counts.get(project.status) ?? 0) + 1);
		return counts;
	});

	const latestDate = $derived(
		data.projects.reduce<string | null>((max, p) => (!max || p.date > max ? p.date : max), null)
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const featuredProject = $derived(data.projects.find((p) => p.featured) ?? null);

	const filtered = $derived.by(() => {
		const tag = selectedTag;
		const status = selectedStatus;
		const q = query.trim().toLowerCase();
		const list = data.projects.filter((p) => {
			if (featuredProject && p.slug === featuredProject.slug) return false;
			const matchesTag = !tag || p.tags.includes(tag);
			const matchesStatus = !status || p.status === status;
			const matchesQuery =
				!q ||
				p.name.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				p.searchText.includes(q);
			return matchesTag && matchesStatus && matchesQuery;
		});

		return list.toSorted((a, b) => {
			if (sort === 'name') return a.name.localeCompare(b.name);
			if (sort === 'oldest') return a.date > b.date ? 1 : -1;
			return a.date > b.date ? -1 : 1;
		});
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}

	function toggleStatus(status: ProjectStatus) {
		selectedStatus = selectedStatus === status ? null : status;
	}
</script>

<Seo title="Projects — RazerGhost" description="Things I've built." path="/projects" />

<main class="page">
	<div class="flex flex-wrap items-end justify-between gap-6" data-hero-reveal="0">
		<div>
			<h1 class="h-page">Projects</h1>
			<p class="lead mt-3">Things I've built, in progress or otherwise.</p>
		</div>
		<div class="flex items-center gap-6">
			<span class="meta">
				{data.projects.length}
				{data.projects.length === 1 ? 'project' : 'projects'} · {tags.length} tags{#if latestDate}
					· last {formatDate(latestDate)}{/if}
			</span>
			<a href="/projects/rss.xml" data-sveltekit-reload class="ulink">
				<Rss size={13} aria-hidden="true" /> RSS
			</a>
		</div>
	</div>


	{#if featuredProject}
		<div class="mt-6">
			<p class="label label--strong">Featured</p>
			<div class="mt-2">
				<ProjectCard project={featuredProject} featured />
			</div>
		</div>
	{/if}

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<input
			type="search"
			bind:value={query}
			placeholder="Search projects…"
			aria-label="Search projects"
			class="input flex-1"
		/>
		<select
			bind:value={sort}
			aria-label="Sort projects"
			class="input"
		>
			<option value="newest">Newest first</option>
			<option value="oldest">Oldest first</option>
			<option value="name">Name</option>
		</select>
	</div>

	{#if tags.length}
		<ul class="mt-6 flex flex-wrap gap-2">
			<li>
				<button
					type="button"
					class="chip {selectedTag === null ? 'chip--active' : ''}"
					onclick={() => (selectedTag = null)}
				>
					All <span class="chip__count">{data.projects.length}</span>
				</button>
			</li>
			{#each tags as tag}
				<li>
					<button
						type="button"
						class="chip {selectedTag === tag ? 'chip--active' : ''}"
						onclick={() => toggleTag(tag)}
					>
						{tag} <span class="chip__count">{tagCounts.get(tag)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if statusCounts.size > 1}
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each statuses as status}
				{#if statusCounts.get(status)}
					<li>
						<button
							type="button"
							class="chip capitalize {selectedStatus === status ? 'chip--active' : ''}"
							onclick={() => toggleStatus(status)}
						>
							{status} <span class="chip__count">{statusCounts.get(status)}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}

	{#if data.projects.length - (featuredProject ? 1 : 0) > 0}
		<div class="rule mt-10">
			{#each filtered as project (project.slug)}
				<ProjectCard {project} />
			{:else}
				<p class="meta py-6">Nothing matches your search.</p>
			{/each}
		</div>
	{/if}

	<p class="meta rule mt-12 pt-6">More coming as I build things worth sharing.</p>
</main>
