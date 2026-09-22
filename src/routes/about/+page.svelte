<script lang="ts">
	/**
	 * About. The prose lives in src/content/pages/about.md and is edited at
	 * /admin/pages/about; this file is the frame around it plus the parts that
	 * are data rather than copy — the numbers, presence, and the links.
	 *
	 * The mark sits where a portrait would. design.md § Personality without a
	 * face: there are no photographs of me on this site and there will not be,
	 * and the ghost is the only figure the site gets. This is the one page
	 * that is actually about a person, so it is the one place that absence is
	 * conspicuous.
	 */
	import DiscordPresence from '$lib/components/DiscordPresence.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import User from '@lucide/svelte/icons/user';
	import { socialLinks } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	const nf = new Intl.NumberFormat('en-GB');
	const since = $derived(data.firstPlayedAt ? new Date(data.firstPlayedAt).getUTCFullYear() : null);
</script>

<Seo title={data.page.title} description={data.page.description} path="/about" />

<main class="page">
	<div data-hero-reveal="0">
		<p class="label label--icon">
			<User size={12} aria-hidden="true" /> About
		</p>
		<h1 class="h-page mt-4 max-w-[26ch]">{data.page.heading}</h1>
	</div>

	<div class="rule mt-10 grid gap-12 pt-9 md:grid-cols-[1.45fr_1fr] md:gap-16" data-hero-reveal="1">
		<!-- The rendered markdown wears the same class the devlog posts do, so
		     a paragraph reads identically whichever side of the site it is on. -->
		<div class="devlog-content measure">
			{@html data.page.html}
		</div>

		<div class="md:border-l md:border-border md:pl-10">
			<img
				src="/brand/ghost-outline.svg"
				width="56"
				height="56"
				alt=""
				class="opacity-40"
			/>

			<p class="label mt-8">By the numbers</p>
			<div class="mt-5 grid gap-5">
				{#if since}
					<div class="rule pt-5 first:border-t-0 first:pt-0">
						<p class="num num-sm">{since}</p>
						<p class="meta mt-2">first play on record — the handle is about that old</p>
					</div>
				{/if}
				<div class="rule pt-5">
					<p class="num num-sm">{nf.format(data.artists)}</p>
					<p class="meta mt-2">artists listened to since</p>
				</div>
				<div class="rule pt-5">
					<p class="num num-sm">{data.postCount}</p>
					<p class="meta mt-2">devlog posts since the rebuild</p>
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
</main>
