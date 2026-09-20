<script lang="ts">
	import GithubIcon from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import LinkedinIcon from '$lib/components/icons/LinkedinIcon.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';
	import { socialLinks, site, navLinks } from '$lib/config';

	const icons = { github: GithubIcon, linkedin: LinkedinIcon, mail: MailIcon };

	const feeds = [
		{ label: 'Devlog', href: '/devlog/rss.xml' },
		{ label: 'Projects', href: '/projects/rss.xml' }
	];
</script>

<!-- Editorial colophon rather than a centred strip of links: the wordmark and
     tagline on the left, then columns. On .shell, so it starts on the same
     left edge as the nav and every page heading. -->
<footer class="mt-auto border-t border-border">
	<div class="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
		<div>
			<p class="font-serif text-[21px] tracking-[-0.015em] text-white">{site.name}</p>
			<p class="lead mt-2 text-[15px]">{site.tagline}</p>
		</div>

		<nav aria-label="Pages">
			<p class="label">Pages</p>
			<ul class="mt-4 flex flex-col gap-2.5">
				{#each navLinks as link}
					<li>
						<a href={link.href} class="text-[14px] text-dim transition-colors hover:text-primary">
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<nav aria-label="Feeds">
			<p class="label">Feeds</p>
			<ul class="mt-4 flex flex-col gap-2.5">
				{#each feeds as feed}
					<li>
						<a
							href={feed.href}
							data-sveltekit-reload
							class="inline-flex items-center gap-2 text-[14px] text-dim transition-colors hover:text-primary"
						>
							<Rss size={12} aria-hidden="true" />
							{feed.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<nav aria-label="Elsewhere">
			<p class="label">Elsewhere</p>
			<ul class="mt-4 flex flex-col gap-2.5">
				{#each socialLinks as link}
					{@const Icon = icons[link.icon]}
					<li>
						<a
							href={link.href}
							class="inline-flex items-center gap-2 text-[14px] text-dim transition-colors hover:text-primary"
						>
							<Icon size={13} aria-hidden="true" />
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>

	<div class="shell border-t border-border py-6">
		<p class="mono">© {new Date().getFullYear()} {site.name}</p>
	</div>
</footer>
