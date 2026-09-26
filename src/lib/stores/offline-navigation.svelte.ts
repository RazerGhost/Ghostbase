// A navigation that was held back because the device is offline (see
// +layout.svelte). Shared the same way as command-palette.svelte.ts, so the
// dock and the running head can mark the page that was asked for — the same
// thing they do for a navigation that is still loading.
export const offlineNavigation = $state<{ target: URL | null }>({ target: null });
