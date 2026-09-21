<script lang="ts">
	/**
	 * Lives in the dock (design.md § Chrome) — it acts on the page you are
	 * already on, so it sits with search rather than in the footer. Wears
	 * `.dock__cell` because the dock is the only place it appears.
	 */
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';

	function currentTheme(): 'light' | 'dark' {
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') return stored;
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	}

	let theme = $state<'light' | 'dark'>('dark');

	$effect(() => {
		theme = currentTheme();
	});

	function toggle() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('theme', theme);
	}

	const next = $derived(theme === 'light' ? 'Dark' : 'Light');
</script>

<button
	type="button"
	onclick={toggle}
	class="dock__cell"
	aria-label="Switch to {next.toLowerCase()} mode"
>
	{#if theme === 'light'}
		<Moon size={16} aria-hidden="true" />
	{:else}
		<Sun size={16} aria-hidden="true" />
	{/if}
	<span class="dock__label label" aria-hidden="true">{next}</span>
</button>
