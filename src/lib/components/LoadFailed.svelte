<script lang="ts">
	/**
	 * A section whose data did not arrive (design.md § Loading). Silent success,
	 * surfaced failure (§ Microinteractions): a written line saying what is
	 * missing, and a retry that re-runs the page's load in place.
	 *
	 * Retry is invalidateAll(), so a streamed section drops back to its
	 * skeleton while it tries again — the button does not need its own
	 * spinner once that happens, only until the new load starts.
	 */
	import { invalidateAll } from '$app/navigation';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let { message, class: className = '' }: { message: string; class?: string } = $props();

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<div class="flex flex-wrap items-center gap-3 {className}" role="alert">
	<p class="meta">{message}</p>
	<button type="button" class="btn" onclick={retry} disabled={retrying}>
		<RefreshCw size={12} class={retrying ? 'animate-spin' : ''} aria-hidden="true" />
		{retrying ? 'Retrying…' : 'Retry'}
	</button>
</div>
