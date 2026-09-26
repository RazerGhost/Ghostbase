// A navigation that was held back because the device is offline (see
// +layout.svelte). Shared the same way as command-palette.svelte.ts, so the
// dock and the running head can mark the page that was asked for — the same
// thing they do for a navigation that is still loading.
//
// `scrollY` is where the reader was on the page they tried to leave. That
// page stays mounted (hidden) under the notice, so going back to it only has
// to put the scroll position back.
export const offlineNavigation = $state<{ target: URL | null; scrollY: number }>({
	target: null,
	scrollY: 0
});

/**
 * Hosts where "the device is offline" does not mean "the server is out of
 * reach": a dev or preview server on the same machine answers with no
 * network at all.
 */
export function isLocalHost(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
