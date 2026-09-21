<script lang="ts">
	import { parseLines } from './parse-lines';

	interface Props {
		lines?: string[] | string;
	}

	let { lines: rawLines = ['graph TD', 'A[Write markdown] --> B[Embed a diagram]'] }: Props =
		$props();

	const source = $derived(parseLines(rawLines).join('\n'));

	let container: HTMLDivElement | undefined = $state();
	let error = $state('');

	function currentTheme(): 'dark' | 'default' {
		const stored = localStorage.getItem('theme');
		if (stored === 'light') return 'default';
		if (stored === 'dark') return 'dark';
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'default' : 'dark';
	}

	/**
	 * mermaid takes plain strings, not CSS, so it cannot read tokens.css —
	 * read the tokens back off the document instead of restating them here.
	 * The previous literal was the DARK accent, painted into diagrams in both
	 * themes: #22d3ee measures 1.8:1 on the light ground, which is the exact
	 * failure --accent exists to avoid. The font was Inter, which this site
	 * stopped using entirely.
	 */
	function token(name: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}

	let counter = 0;
	// Bumped when the theme changes, purely to re-run the render effect.
	let themeTick = $state(0);

	$effect(() => {
		// A diagram rendered under one theme keeps that theme's colours baked
		// into its SVG, so it has to be drawn again when the theme changes —
		// from the toggle (which sets data-theme) or from the OS.
		const observer = new MutationObserver(() => themeTick++);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		const media = window.matchMedia('(prefers-color-scheme: light)');
		const onScheme = () => themeTick++;
		media.addEventListener('change', onScheme);

		return () => {
			observer.disconnect();
			media.removeEventListener('change', onScheme);
		};
	});

	$effect(() => {
		error = '';
		const target = container;
		const id = `mermaid-embed-${counter++}`;
		// Read so the effect re-runs on a theme change.
		themeTick;

		import('mermaid').then(async ({ default: mermaid }) => {
			mermaid.initialize({
				startOnLoad: false,
				theme: currentTheme(),
				fontFamily: token('--font') || 'system-ui, sans-serif',
				themeVariables: {
					primaryColor: token('--surface-2'),
					primaryTextColor: token('--white'),
					primaryBorderColor: token('--accent'),
					lineColor: token('--border-strong'),
					secondaryColor: token('--surface'),
					tertiaryColor: token('--bg'),
					background: token('--bg')
				}
			});

			try {
				const { svg } = await mermaid.render(id, source);
				if (target) target.innerHTML = svg;
			} catch {
				error = "Couldn't render this diagram.";
			}
		});
	});
</script>

<div class="card p-4">
	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{:else}
		<div bind:this={container} class="flex justify-center overflow-x-auto"></div>
	{/if}
</div>
