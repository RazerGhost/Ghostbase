<script lang="ts">
	/**
	 * Disk → Commit → Push: what "publish" actually needs, and where you are.
	 *
	 * Content is baked into the Docker image at build time, so saving a post
	 * writes it to your disk and nothing else. The editor used to say
	 * "commit + push to publish" as a fixed sentence whether or not you had
	 * done either, which is the one thing a static string cannot tell you.
	 *
	 * Each step is a dot plus a count. Filled means done; an amber outline
	 * means this is the step waiting on you; a grey outline means a step you
	 * cannot reach yet. Accent is a colour pointing at something rather than
	 * a fill (design.md § Theme), which is the same rule the plots follow.
	 */
	let {
		tracked,
		changed,
		ahead,
		savedAt
	}: {
		/** False when this build is not a git checkout — production. */
		tracked: boolean;
		/** This file differs from the last commit. */
		changed: boolean;
		/** Local commits the remote has not got. Null with no upstream. */
		ahead: number | null;
		/** Set after a save in this session, so "on disk" can say when. */
		savedAt?: Date | null;
	} = $props();

	const committed = $derived(!changed);
	const pushed = $derived(committed && ahead === 0);

	function when(at: Date): string {
		const mins = Math.round((Date.now() - at.getTime()) / 60000);
		if (mins < 1) return 'just now';
		return mins === 1 ? 'a minute ago' : `${mins} min ago`;
	}
</script>

{#if !tracked}
	<p class="meta">
		Saving writes to <span class="mono">src/content</span> on this machine. This build is not a git
		checkout, so nothing here can tell you what has been committed.
	</p>
{:else}
	<div class="publish">
		<span class="publish__step">
			<span class="publish__dot publish__dot--done" aria-hidden="true"></span>
			<span class="label text-gray">On disk</span>
			{#if savedAt}<span class="label">saved {when(savedAt)}</span>{/if}
		</span>

		<span class="publish__arrow" aria-hidden="true">→</span>

		<span class="publish__step">
			<span
				class="publish__dot"
				class:publish__dot--done={committed}
				class:publish__dot--next={!committed}
				aria-hidden="true"
			></span>
			<span class="label text-gray">Committed</span>
			{#if !committed}<span class="label text-warn">this file has changes</span>{/if}
		</span>

		<span class="publish__arrow" aria-hidden="true">→</span>

		<span class="publish__step">
			<span
				class="publish__dot"
				class:publish__dot--done={pushed}
				class:publish__dot--next={committed && !pushed}
				aria-hidden="true"
			></span>
			<span class="label" class:text-gray={pushed || committed}>Pushed</span>
			{#if ahead === null}
				<span class="label">no upstream</span>
			{:else if ahead > 0}
				<span class="label" class:text-warn={committed}>
					{ahead} ahead
				</span>
			{/if}
		</span>

		<span class="publish__note meta">
			{#if pushed}
				Live — a push deploys in about a minute.
			{:else if committed}
				Committed. The push is the deploy.
			{:else}
				Written here only. Nobody else can see this yet.
			{/if}
		</span>
	</div>
{/if}
