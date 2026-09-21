<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import ListeningNowCard from '$lib/components/ListeningNowCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Clock from '@lucide/svelte/icons/clock';
	import Music from '@lucide/svelte/icons/music';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import Code from '@lucide/svelte/icons/code';
	import { socialLinks, site } from '$lib/config';
	import type { PageData } from './$types';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<Seo title={site.name} description={site.description} path="/" />

<main class="page">
	<div class="grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16">
		<div data-hero-reveal="0">
			<h1 class="h-hero">{site.name}</h1>
			<p class="lead mt-4">{site.tagline}</p>
			<!-- The masthead column was a name, a tagline and then dead space to
			     the rule. design.md § Personality without a face: with no
			     photograph anywhere, the voice has to do this work, so the first
			     screen says who is typing rather than leaving a gap. -->
			<p class="measure mt-6 leading-[1.8] text-gray">
				I&rsquo;m Dimitri de Jong. I run
				<a href="https://rg-digital.dev" class="link">RG Digital</a> by day; this is where
				everything else ends up &mdash; what I&rsquo;m building, what I&rsquo;m watching, and what
				I have had on repeat since 2015.
			</p>
			<ul class="mt-7 flex flex-wrap items-center gap-5">
				{#each socialLinks as link}
					{@const Icon = icons[link.icon]}
					<li>
						<a href={link.href} class="ulink">
							<Icon size={14} aria-hidden="true" />
							{link.label}
						</a>
					</li>
				{/each}
				<li><DiscordPresence compact /></li>
			</ul>
		</div>

		<div class="md:border-l md:border-border md:pl-10" data-hero-reveal="1">
			<p class="label label--icon">
				<Clock size={12} aria-hidden="true" /> Right now
			</p>
			<ul class="mt-4 grid gap-3">
				{#each data.statusItems as item}
					<li class="text-[15px] leading-relaxed text-gray">{item}</li>
				{/each}
			</ul>

			<div class="rule mt-7 pt-6">
				<p class="label label--icon">
					<Music size={12} aria-hidden="true" /> Now playing
				</p>
				<div class="mt-4">
					<ListeningNowCard bare>
						{#snippet fallback()}
							<p class="meta">Nothing playing right now.</p>
						{/snippet}
					</ListeningNowCard>
				</div>
			</div>
		</div>
	</div>

	<div class="rule mt-14 grid gap-10 border-b border-border py-9 sm:grid-cols-3">
		<div>
			<Music size={15} aria-hidden="true" class="text-dim" />
			<p class="num num-lg mt-3">
				{data.currentStreak ?? 0}<span class="num-unit"> days</span>
			</p>
			<p class="meta mt-2 leading-relaxed">
				listening streak, on {data.totalPlays.toLocaleString()} plays logged
			</p>
		</div>
		<div>
			<Clapperboard size={15} aria-hidden="true" class="text-dim" />
			<p class="num num-lg mt-3">
				{data.daysWatched}<span class="num-unit"> days</span>
			</p>
			<p class="meta mt-2 leading-relaxed">spent watching, across everything tracked</p>
		</div>
		<div>
			<PenLine size={15} aria-hidden="true" class="text-dim" />
			<p class="num num-lg mt-3">
				{data.postCount}<span class="num-unit"> posts</span>
			</p>
			<p class="meta mt-2 leading-relaxed">written here since the rebuild began</p>
		</div>
	</div>

	<div class="mt-12 grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16">
		<div>
			<div class="flex items-baseline justify-between">
				<h2 class="h-section">Latest</h2>
				<a href="/devlog" class="link inline-flex items-center gap-1.5 text-[13px]">
					View all <ArrowRight size={13} aria-hidden="true" />
				</a>
			</div>
			<div class="mt-5">
				{#each data.latest as entry (entry.slug)}
					<a href={`/devlog/${entry.slug}`} class="entry -mx-3 block px-3 py-4">
						<p class="mono">{formatDate(entry.date)} · {entry.readingTime} min</p>
						<p class="h-card-lg entry__title mt-2">{entry.title}</p>
					</a>
				{:else}
					<p class="meta">No devlog entries yet.</p>
				{/each}
			</div>
		</div>

		<div class="md:border-l md:border-border md:pl-10">
			{#if data.watching}
				<p class="label label--icon">
					<Clapperboard size={12} aria-hidden="true" /> Watching
				</p>
				<a href="/watchlist" class="mt-4 block">
					<p class="h-card-lg">{data.watching.title}</p>
					<p class="meta mt-2">
						{#if data.watching.totalEpisodes}
							Episode {data.watching.watchedEpisodes} of {data.watching.totalEpisodes}
						{/if}
						{#if data.watching.nextToWatch}
							· up next {data.watching.nextToWatch}
						{/if}
					</p>
					{#if data.watching.totalEpisodes}
						<span class="mt-3 block h-px bg-border">
							<span
								class="block h-px bg-primary"
								style:width="{Math.round(
									(data.watching.watchedEpisodes / data.watching.totalEpisodes) * 100
								)}%"
							></span>
						</span>
					{/if}
				</a>
			{/if}

			{#if data.projects.length}
				<p class="label label--icon" class:mt-9={!!data.watching}>
					<Code size={12} aria-hidden="true" /> Projects
				</p>
				<div class="mt-4 grid gap-5">
					{#each data.projects as project (project.slug)}
						<a href={`/projects/${project.slug}`} class="entry block border-t-0 pt-0">
							<p class="h-card-lg entry__title">{project.name}</p>
							<p class="meta mt-2 leading-relaxed">{project.description}</p>
							{#if project.stack.length}
								<p class="mono mt-2">{project.stack.join(' · ')}</p>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- The one RG Digital pointer. Placement is deliberate — after the projects
	     and the devlog, not in the first 200 pixels next to the name — and the
	     styling is a line of text, not a CTA band (design.md § CTA voice). -->
	<p class="meta rule mt-16 pt-6 text-center">
		Client work lives elsewhere —
		<a
			href="https://rg-digital.dev/about"
			target="_blank"
			rel="noopener noreferrer"
			class="link inline-flex items-center gap-1"
		>
			see it at RG Digital <ArrowRight size={13} aria-hidden="true" />
		</a>
	</p>
</main>
