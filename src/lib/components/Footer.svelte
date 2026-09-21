<script lang="ts">
	/**
	 * One line (design.md § Chrome).
	 *
	 * It can be this short only because the dock carries the navigation —
	 * the four-column colophon this replaces was a sitemap, and the site now
	 * has one on the right edge of every page. What is left is the part a
	 * dock cannot hold: the links that leave the site, and the one date
	 * worth printing.
	 */
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';
	import { socialLinks, site } from '$lib/config';
	import { deployedOn } from '$lib/deployed';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	const feeds = [
		{ label: 'Devlog RSS', href: '/devlog/rss.xml' },
		{ label: 'Projects RSS', href: '/projects/rss.xml' }
	];
</script>

<footer class="mt-auto border-t border-border">
	<div class="shell footline">
		<div class="flex flex-wrap items-center gap-x-6 gap-y-3">
			<p class="label">&copy; {new Date().getFullYear()} {site.name}</p>

			{#each socialLinks as link}
				{@const Icon = icons[link.icon]}
				<a href={link.href} class="label label--icon transition-colors hover:text-primary">
					<Icon size={12} aria-hidden="true" />
					{link.label}
				</a>
			{/each}

			{#each feeds as feed}
				<a
					href={feed.href}
					data-sveltekit-reload
					class="label label--icon transition-colors hover:text-primary"
				>
					<Rss size={12} aria-hidden="true" />
					{feed.label}
				</a>
			{/each}
		</div>

		<!-- A fact, not a live signal, so it gets no dot (design.md § Chrome). -->
		<p class="label">Last deployed {deployedOn}</p>
	</div>
</footer>
