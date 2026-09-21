import path from 'node:path';
import { listRawEntries } from '$lib/server/content-editor';
import { toDateString, estimateReadingTime } from '$lib/server/content';
import { getContentGitState } from '$lib/server/content-git';
import type { PageServerLoad } from './$types';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/devlog');

export const load: PageServerLoad = async () => {
	// The same fields the public stream shows, so the two lists read as one
	// list seen from two sides — plus the one thing only this side can say,
	// which is whether the file has been committed yet.
	const git = await getContentGitState();
	const changed = new Set(git?.changed ?? []);

	const entries = listRawEntries(CONTENT_DIR)
		.map((e) => ({
			slug: e.slug,
			title: String(e.meta.title ?? e.slug),
			date: toDateString(e.meta.date),
			draft: e.meta.draft === true,
			series: e.meta.series ? String(e.meta.series) : undefined,
			tags: Array.isArray(e.meta.tags) ? e.meta.tags.map(String) : [],
			readingTime: estimateReadingTime(e.body),
			changed: changed.has(`src/content/devlog/${e.slug}.md`)
		}))
		.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : a.slug.localeCompare(b.slug)));

	return { entries, tracked: git !== null };
};
