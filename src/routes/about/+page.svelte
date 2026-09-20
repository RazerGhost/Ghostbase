<script lang="ts">
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import User from '@lucide/svelte/icons/user';
	import Code from '@lucide/svelte/icons/code';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import { socialLinks } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };
</script>

<Seo
	title="About — RazerGhost"
	description="Who's behind RazerGhost, what building in public means here, and how it connects to RG Digital."
	path="/about"
/>

<main class="page">
	<div data-hero-reveal="0">
		<p class="label label--icon">
			<User size={12} aria-hidden="true" /> About
		</p>
		<h1 class="h-page mt-4 max-w-[26ch]">
			RazerGhost is a handle I&rsquo;ve used for years. It stuck.
		</h1>
	</div>

	<div class="rule mt-10 grid gap-12 pt-9 md:grid-cols-[1.45fr_1fr] md:gap-16" data-hero-reveal="1">
		<div class="flex flex-col gap-7">
			<div>
				<p class="label label--icon">
					<User size={12} aria-hidden="true" /> Who&rsquo;s behind this
				</p>
				<p class="mt-3 leading-[1.75] text-gray">
					I&rsquo;m Dimitri de Jong. By day I run
					<a
						href="https://rg-digital.dev"
						target="_blank"
						rel="noopener noreferrer"
						class="link">RG Digital</a
					>, building web apps and sites for clients. This site is everything that
					<em class="font-serif text-[19px] italic text-white">isn&rsquo;t</em> client
					work — a link hub instead of a dozen separate profiles, plus a running devlog of whatever
					random thing I&rsquo;m building at the moment.
				</p>
			</div>

			<div>
				<p class="label label--icon">
					<Code size={12} aria-hidden="true" /> Building in public
				</p>
				<p class="mt-3 leading-[1.75] text-gray">
					Most of what ends up on <a href="/devlog" class="link">the devlog</a> is small and
					unglamorous: a rate limiter, a Docker build trick, a dashboard widget that took longer
					than it should have. None of it is written to impress anyone — it&rsquo;s closer to
					notes-to-self that happen to be public. This site is the biggest running example, and
					<a href="/projects/razerghost-site" class="link">its own project page</a> explains how it&rsquo;s
					built.
				</p>
			</div>

			<blockquote class="border-l-2 border-primary pl-5">
				<p class="h-card-lg leading-[1.4]">Same person, different reason for existing.</p>
			</blockquote>

			<div>
				<p class="label label--icon">
					<GitBranch size={12} aria-hidden="true" /> RazerGhost vs. RG Digital
				</p>
				<p class="mt-3 leading-[1.75] text-gray">
					RG Digital is the client-facing side — production work, built for other people&rsquo;s
					businesses. RazerGhost is mine: no case studies, no pitch, just
					<a href="/projects" class="link">side projects</a>, a
					<a href="/watchlist" class="link">watchlist</a>,
					<a href="/listens" class="link">listening history</a>, and the
					<a href="/gear" class="link">gear</a> I actually use day to day.
				</p>
			</div>
		</div>

		<div class="md:border-l md:border-border md:pl-10">
			<p class="label">By the numbers</p>
			<div class="mt-5 grid gap-5">
				<div class="rule pt-5 first:border-t-0 first:pt-0">
					<p class="num num-sm">{data.postCount}</p>
					<p class="meta mt-2">devlog posts since the rebuild</p>
				</div>
				<div class="rule pt-5">
					<p class="num num-sm">{data.projectCount}</p>
					<p class="meta mt-2">{data.projectCount === 1 ? 'project' : 'projects'} written up</p>
				</div>
				<div class="rule pt-5">
					<p class="num num-sm">{data.currentStreak ?? 0}</p>
					<p class="meta mt-2">day listening streak</p>
				</div>
			</div>

			<div class="mt-8">
				<DiscordPresence compact />
			</div>

			<ul class="mt-6 flex flex-wrap gap-5">
				{#each socialLinks as link}
					{@const Icon = icons[link.icon]}
					<li>
						<a href={link.href} class="ulink">
							<Icon size={14} aria-hidden="true" />
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<p class="meta rule mt-14 pt-6 text-center">
		General questions, or just want to say hi? The links above all work.
	</p>
</main>
