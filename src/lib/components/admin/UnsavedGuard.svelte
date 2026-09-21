<script lang="ts">
	/**
	 * Leaving an editor with unsaved work used to lose it silently — no
	 * prompt, no draft kept anywhere. This catches both ways out: a link
	 * inside the app (beforeNavigate, which can be cancelled and resumed, so
	 * it gets the site's own dialog) and closing the tab (beforeunload, where
	 * the browser insists on its own wording and we only get to ask).
	 */
	import { beforeNavigate, goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { dirty }: { dirty: boolean } = $props();

	let open = $state(false);
	let target = $state<string | null>(null);
	// Set while we replay the navigation the dialog just approved, so the
	// guard does not catch its own goto and ask again.
	let leaving = $state(false);

	beforeNavigate((nav) => {
		if (!dirty || leaving || !nav.to) return;
		// A full page unload is beforeunload's job; cancelling it here would
		// do nothing useful.
		if (nav.type === 'leave') return;
		nav.cancel();
		target = nav.to.url.pathname + nav.to.url.search;
		open = true;
	});

	$effect(() => {
		if (!dirty) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});
</script>

<ConfirmDialog
	bind:open
	title="Leave without saving? The edits since your last save are only in this tab."
	confirmLabel="Leave"
	onconfirm={() => {
		leaving = true;
		if (target) goto(target);
	}}
/>
