import { getLibraryWithFallback, simklConfigured } from '$lib/server/simkl';
import { streamOnNavigation } from '$lib/server/stream';
import type { PageServerLoad } from './$types';

/**
 * The library, or `error` when Simkl is unreachable and there is no snapshot
 * to fall back on. Resolves either way rather than rejecting, so a full page
 * load renders the failure in place instead of the error page.
 */
async function loadLibrary() {
	try {
		const { library, stale, staleSince } = await getLibraryWithFallback();
		return { error: false as const, ...library, stale, staleSince };
	} catch {
		return { error: true as const };
	}
}

export type LoadedLibrary = Extract<Awaited<ReturnType<typeof loadLibrary>>, { error: false }>;

export const load: PageServerLoad = async ({ isDataRequest }) => {
	if (!simklConfigured()) return { configured: false as const };

	// Simkl is a network call whenever the snapshot is more than fifteen
	// minutes old, so on navigation the page renders straight away with its
	// shelves pending (see stream.ts).
	return {
		configured: true as const,
		...(await streamOnNavigation(isDataRequest, { library: loadLibrary() }))
	};
};
