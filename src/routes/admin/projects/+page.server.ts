import path from 'node:path';
import { listRawEntries } from '$lib/server/content-editor';
import { toDateString } from '$lib/server/content';
import { getContentGitState } from '$lib/server/content-git';
import type { PageServerLoad } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/projects');

export const load: PageServerLoad = async () => {
	const git = await getContentGitState();
	const changed = new Set(git?.changed ?? []);

	const entries = listRawEntries(CONTENT_DIR)
		.map((e) => ({
			slug: e.slug,
			name: String(e.meta.name ?? e.slug),
			date: toDateString(e.meta.date),
			draft: e.meta.draft === true,
			status: e.meta.status ? String(e.meta.status) : 'active',
			stack: Array.isArray(e.meta.stack) ? e.meta.stack.map(String) : [],
			changed: changed.has(`src/content/projects/${e.slug}.md`)
		}))
		.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : a.slug.localeCompare(b.slug)));

	return { entries, tracked: git !== null };
};
