<script lang="ts">
	/**
	 * Gear, written out rather than listed (design.md § Lists).
	 *
	 * The names and links still come from `gearGroups` in config.ts — that
	 * stays the single source of truth — but the page is prose, so adding an
	 * item to config no longer makes it appear here on its own. `unmentioned`
	 * below catches exactly that: anything in config the copy hasn't picked up
	 * gets listed at the end instead of silently vanishing.
	 */
	import Seo from '$lib/components/Seo.svelte';
	import { gearGroups } from '$lib/config';
	import Code from '@lucide/svelte/icons/code';
	import Wrench from '@lucide/svelte/icons/wrench';
	import Cpu from '@lucide/svelte/icons/cpu';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';

	const items = gearGroups.flatMap((g) => g.items);
	const byName = new Map(items.map((i) => [i.name, i]));

	/** The href for a config item, by its exact name in config.ts. */
	function g(name: string): string | undefined {
		return byName.get(name)?.href;
	}

	// Every config name the copy below links. Keep in step with the prose.
	const mentioned = [
		'Zed',
		'Claude Code',
		'SvelteKit',
		'TypeScript',
		'Tailwind CSS',
		'Node.js',
		'Zen Browser',
		'Windows',
		'Windows Terminal',
		'Tabby',
		'PowerShell',
		'Figma',
		'Affinity',
		'DaVinci Resolve',
		'Proton Mail',
		'Proton Pass',
		'Proton Drive',
		'Proton VPN',
		'Discord',
		'WhatsApp',
		'AMD Ryzen 7 7800X3D',
		'Gigabyte RTX 3070 Eagle OC',
		'AOC 24G1WG4 (24")',
		'Dell P2414H (24")',
		'Keychron K10 HE Wireless',
		'Keychron M6 8K',
		'Simgot EW300 DSP',
		'Elgato Wave:3 MK.2',
		'MOZA R3 Racing Kit',
		'GameSir G7 Pro (Shadow Ember)',
		'Steam Controller',
		'Elgato Stream Deck MK.1'
	];
	const unmentioned = items.filter((i) => !mentioned.includes(i.name));
</script>

<Seo
	title="Gear — RazerGhost"
	description="The tools, hardware and software in regular rotation."
	path="/gear"
/>

<main class="page">
	<div class="flex flex-wrap items-end justify-between gap-6" data-hero-reveal="0">
		<div>
			<h1 class="h-page">Gear</h1>
			<p class="lead mt-3">Tools and gear in regular rotation.</p>
		</div>
		<span class="meta">{items.length} things, written out</span>
	</div>

	<div class="rule mt-10 flex flex-col gap-12 pt-10" data-hero-reveal="1">
		<div class="spread">
			<p class="label label--icon self-start">
				<Code size={13} aria-hidden="true" /> Editor &amp; stack
			</p>
			<p class="measure text-[17px] leading-[1.8] text-gray">
				I write in <a class="link" href={g('Zed')}>Zed</a> with
				<a class="link" href={g('Claude Code')}>Claude Code</a> alongside it, and almost everything
				here ships as <a class="link" href={g('SvelteKit')}>SvelteKit</a> and
				<a class="link" href={g('TypeScript')}>TypeScript</a>
				with <a class="link" href={g('Tailwind CSS')}>Tailwind CSS</a> on
				<a class="link" href={g('Node.js')}>Node.js</a>.
			</p>
		</div>

		<div class="spread">
			<p class="label label--icon self-start">
				<Wrench size={13} aria-hidden="true" /> Day to day
			</p>
			<p class="measure text-[17px] leading-[1.8] text-gray">
				Day to day that&rsquo;s <a class="link" href={g('Zen Browser')}>Zen Browser</a> on
				<a class="link" href={g('Windows')}>Windows</a>,
				<a class="link" href={g('Windows Terminal')}>Windows Terminal</a> and
				<a class="link" href={g('Tabby')}>Tabby</a> over
				<a class="link" href={g('PowerShell')}>PowerShell</a>,
				<a class="link" href={g('Figma')}>Figma</a> and
				<a class="link" href={g('Affinity')}>Affinity</a> when something needs drawing,
				<a class="link" href={g('DaVinci Resolve')}>DaVinci Resolve</a> when it needs cutting, and
				Proton for <a class="link" href={g('Proton Mail')}>mail</a>,
				<a class="link" href={g('Proton Pass')}>passwords</a>,
				<a class="link" href={g('Proton Drive')}>files</a> and
				<a class="link" href={g('Proton VPN')}>VPN</a>.
				<a class="link" href={g('Discord')}>Discord</a> and
				<a class="link" href={g('WhatsApp')}>WhatsApp</a> handle everyone else.
			</p>
		</div>

		<div class="spread">
			<p class="label label--icon self-start">
				<Cpu size={13} aria-hidden="true" /> The machine
			</p>
			<p class="measure text-[17px] leading-[1.8] text-gray">
				It all runs on a <a class="link" href={g('AMD Ryzen 7 7800X3D')}>Ryzen 7 7800X3D</a> and a
				<a class="link" href={g('Gigabyte RTX 3070 Eagle OC')}>RTX 3070</a>, across an
				<a class="link" href={g('AOC 24G1WG4 (24")')}>AOC 24G1WG4</a> and an older
				<a class="link" href={g('Dell P2414H (24")')}>Dell P2414H</a>. Hands on a
				<a class="link" href={g('Keychron K10 HE Wireless')}>Keychron K10 HE</a> and an
				<a class="link" href={g('Keychron M6 8K')}>M6 8K</a>; ears on
				<a class="link" href={g('Simgot EW300 DSP')}>Simgot EW300</a>; voice through an
				<a class="link" href={g('Elgato Wave:3 MK.2')}>Elgato Wave:3</a>.
			</p>
		</div>

		<div class="spread">
			<p class="label label--icon self-start">
				<Gamepad2 size={13} aria-hidden="true" /> Off the clock
			</p>
			<p class="measure text-[17px] leading-[1.8] text-gray">
				And when I&rsquo;m not working: a <a class="link" href={g('MOZA R3 Racing Kit')}>MOZA R3</a>
				wheel, a <a class="link" href={g('GameSir G7 Pro (Shadow Ember)')}>GameSir G7 Pro</a>, a
				<a class="link" href={g('Steam Controller')}>Steam Controller</a> that refuses to die, and a
				<a class="link" href={g('Elgato Stream Deck MK.1')}>Stream Deck</a> doing far less than it could.
			</p>
		</div>

		{#if unmentioned.length}
			<div class="spread">
				<p class="label self-start">Not yet written in</p>
				<p class="measure text-[17px] leading-[1.8] text-gray">
					Also, not yet worked into the copy above:
					{#each unmentioned as item, i}<a class="link" href={item.href}>{item.name}</a
						>{i < unmentioned.length - 1 ? ', ' : '.'}{/each}
				</p>
			</div>
		{/if}
	</div>

	<p class="meta rule mt-14 pt-6">Every name links out to the thing itself.</p>
</main>
