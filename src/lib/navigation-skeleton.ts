import { isAdminPath } from '$lib/config';

/**
 * Which skeleton a pending navigation should show, if any (design.md §
 * Loading).
 *
 * The layout swaps the page for a skeleton of its destination while a
 * navigation's data is still loading. On a desktop the data is usually in
 * hand before the click (data-sveltekit-preload-data="hover" in app.html),
 * but a phone has no hover: SvelteKit only starts on touchstart, around 100ms
 * before the tap lands. So on mobile this is the common case, not the edge
 * case, and it is where the delay below earns its keep — it is what stops a
 * cached devlog page from flashing a skeleton for one frame.
 */
export const SKELETON_DELAY_MS = 150;

export type SkeletonKind =
	| 'home'
	| 'about'
	| 'stream'
	| 'post'
	| 'watchlist'
	| 'listens'
	| 'generic';

export type Skeleton = {
	kind: SkeletonKind;
	/** The page's own heading, when it is known before the data is. */
	title?: string;
	/** The page wears .page--narrow. */
	narrow?: boolean;
};

type NavTarget = {
	url: URL;
	params: Record<string, string> | null;
	route: { id: string | null };
} | null;

type Nav = {
	from: NavTarget;
	to: NavTarget;
	type: string | null;
};

export function skeletonFor(nav: Nav): Skeleton | null {
	const { from, to, type } = nav;
	if (!to || !to.route.id) return null;
	// A form submission stays on the page it was posted from.
	if (type === 'form') return null;
	// Same document, different query (the listens year switch) or hash: the
	// page stays up and handles its own pending state. Blanking it would
	// throw away the scroll position the switch deliberately keeps.
	if (from && from.url.pathname === to.url.pathname) return null;
	// The admin editors run against `pnpm dev` and have their own chrome.
	if (isAdminPath(to.url.pathname)) return null;

	const tag = to.params?.tag;
	switch (to.route.id) {
		case '/':
			return { kind: 'home' };
		case '/about':
			return { kind: 'about' };
		case '/devlog':
			return { kind: 'stream', title: 'Devlog' };
		case '/projects':
			return { kind: 'stream', title: 'Projects' };
		case '/devlog/tags/[tag]':
			return { kind: 'stream', title: tag ? `#${tag}` : undefined };
		case '/projects/tags/[tag]':
			return { kind: 'stream', title: tag ? `#${tag}` : undefined, narrow: true };
		case '/devlog/[slug]':
		case '/projects/[slug]':
			return { kind: 'post' };
		case '/watchlist':
			return { kind: 'watchlist' };
		case '/listens':
			return { kind: 'listens' };
		default:
			return { kind: 'generic' };
	}
}
