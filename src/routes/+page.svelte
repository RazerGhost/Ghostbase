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
	import LoadFailed from '$lib/components/LoadFailed.svelte';
	import { socialLinks, site } from '$lib/config';
	import type { PageData } from './$types';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<!-- A band figure whose value is still on its way: the unit stays, since it
     is known, and the caption keeps its line so the band holds its height. -->
{#snippet pendingStat(caption: string)}
	<p class="num num-lg mt-3">
		<span class="skel skel--text" style:width="1.6ch"></span><span class="num-unit">days</span>
	</p>
	<p class="meta mt-2 leading-relaxed">{caption}</p>
{/snippet}

{#snippet failedStat(caption: string)}
	<p class="num num-lg mt-3 text-dim">—</p>
	<p class="meta mt-2 leading-relaxed">{caption}</p>
{/snippet}

<Seo title={site.name} description={site.description} path="/" />

<main class="page">
	<div class="grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16">
		<div class="flex flex-col" data-hero-reveal="0">
			<h1 class="h-hero">{site.name}</h1>
			<p class="lead mt-4">{site.tagline}</p>
			<!-- No paragraph of prose here, deliberately. This column used to
			     carry a line introducing me, which did two things wrong once
			     About became a real page: it introduced me a second time, in
			     nearly the same words, and it named RG Digital on the one page
			     § CTA voice had decided carries no pointer to it.

			     § Personality without a face says the numbers are the portrait.
			     The band directly below this is three of them, "Right now" is
			     beside it, and the devlog is under that — the first screen says
			     plenty about who is typing without a sentence claiming to. -->
			<!-- mt-auto, not a margin: with the paragraph gone this column is
			     shorter than the "Right now" card beside it, and the grid
			     stretches the row to the taller one either way. Pushing the
			     links to the bottom turns that slack into the gap between the
			     tagline and the links, and lands them on the same baseline as
			     the card — a hole at the end of a column reads as something
			     missing; the same space in the middle reads as room. -->
			<ul class="mt-auto flex flex-wrap items-center gap-5 pt-10">
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
			{#await data.listening}
				{@render pendingStat('listening streak, on plays logged')}
			{:then listening}
				<p class="num num-lg mt-3">
					{listening.currentStreak ?? 0}<span class="num-unit">days</span>
				</p>
				<p class="meta mt-2 leading-relaxed">
					listening streak, on {listening.totalPlays.toLocaleString()} plays logged
				</p>
			{:catch}
				{@render failedStat('listening streak — the history didn’t load')}
			{/await}
		</div>
		<div>
			<Clapperboard size={15} aria-hidden="true" class="text-dim" />
			{#await data.watch}
				{@render pendingStat('spent watching, across everything tracked')}
			{:then watch}
				{#if watch.ok}
					<p class="num num-lg mt-3">
						{watch.daysWatched}<span class="num-unit">days</span>
					</p>
					<p class="meta mt-2 leading-relaxed">spent watching, across everything tracked</p>
				{:else}
					{@render failedStat('spent watching — Simkl didn’t answer')}
				{/if}
			{:catch}
				{@render failedStat('spent watching — Simkl didn’t answer')}
			{/await}
		</div>
		<div>
			<PenLine size={15} aria-hidden="true" class="text-dim" />
			<p class="num num-lg mt-3">
				{data.postCount}<span class="num-unit">posts</span>
			</p>
			<p class="meta mt-2 leading-relaxed">written here since the rebuild began</p>
		</div>
	</div>

	<div class="mt-12 grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-16">
		<div>
			<div class="flex items-baseline justify-between">
				<h2 class="h-section">Latest</h2>
				<a href="/devlog" class="link inline-flex items-center gap-1.5 text-[14px]">
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
			{#await data.watch}
				<!-- Held open at the card's height while Simkl answers, so the
				     projects under it do not jump when it lands. -->
				<p class="label label--icon">
					<Clapperboard size={12} aria-hidden="true" /> Watching
				</p>
				<div class="mt-4">
					<p class="h-card-lg"><span class="skel skel--text" style:width="14ch"></span></p>
					<p class="meta mt-2"><span class="skel skel--text" style:width="22ch"></span></p>
					<span class="mt-3 block h-px bg-border"></span>
				</div>
			{:then watch}
				{#if watch.watching}
					{@const watching = watch.watching}
					<p class="label label--icon">
						<Clapperboard size={12} aria-hidden="true" /> Watching
					</p>
					<a href="/watchlist" class="mt-4 block">
						<p class="h-card-lg">{watching.title}</p>
						<p class="meta mt-2">
							{#if watching.totalEpisodes}
								Episode {watching.watchedEpisodes} of {watching.totalEpisodes}
							{/if}
							{#if watching.nextToWatch}
								· up next {watching.nextToWatch}
							{/if}
						</p>
						{#if watching.totalEpisodes}
							<span class="mt-3 block h-px bg-border">
								<span
									class="block h-px bg-primary"
									style:width="{Math.round(
										(watching.watchedEpisodes / watching.totalEpisodes) * 100
									)}%"
								></span>
							</span>
						{/if}
					</a>
				{:else if !watch.ok}
					<p class="label label--icon">
						<Clapperboard size={12} aria-hidden="true" /> Watching
					</p>
					<LoadFailed class="mt-4" message="Simkl didn’t answer, so this is missing for now." />
				{/if}
			{:catch}
				<p class="label label--icon">
					<Clapperboard size={12} aria-hidden="true" /> Watching
				</p>
				<LoadFailed class="mt-4" message="This didn’t finish loading." />
			{/await}

			{#if data.projects.length}
				<!-- first:, not a flag on the Watching card: that card is now one
				     of four states, and only three of them render anything. -->
				<p class="label label--icon mt-9 first:mt-0">
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
</main>
