import type { LibraryItem } from '$lib/server/simkl';

/** The watchlist's two tabs: everything else, and anime. */
export type Group = 'tv' | 'anime';

export function hasAnime(lists: LibraryItem[][]): boolean {
	return lists.some((list) => list.some((item) => item.mediaType === 'anime'));
}
