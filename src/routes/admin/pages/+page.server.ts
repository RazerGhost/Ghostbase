import { listPages } from '$lib/server/pages';
import { getContentGitState } from '$lib/server/content-git';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const git = await getContentGitState();
	const changed = new Set(git?.changed ?? []);

	return {
		pages: listPages().map((p) => ({
			...p,
			changed: changed.has(`src/content/pages/${p.slug}.md`)
		})),
		tracked: git !== null
	};
};
