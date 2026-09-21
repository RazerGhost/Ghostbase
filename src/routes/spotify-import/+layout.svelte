<script lang="ts">
	import AdminChrome from '$lib/components/AdminChrome.svelte';

	let { data, children } = $props();
</script>

<AdminChrome user={data.user}>
	{@render children()}
</AdminChrome>
