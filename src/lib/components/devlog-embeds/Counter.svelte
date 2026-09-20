<script lang="ts">
	let count = $state(0);
</script>

<div class="card flex items-center gap-4 p-4">
	<button
		class="btn rounded-md border border-border px-3 py-1.5 text-sm text-white"
		onclick={() => (count += 1)}
	>
		Clicked {count} {count === 1 ? 'time' : 'times'}
	</button>
	<span class="meta">a live Svelte component, embedded in this markdown post</span>
</div>
