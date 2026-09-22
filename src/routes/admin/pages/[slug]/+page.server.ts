import { error, fail, redirect } from '@sveltejs/kit';
import { getRawEntry, writeEntry } from '$lib/server/content-editor';
import { pagesDir } from '$lib/server/pages';
import { getContentGitState, fileGitState } from '$lib/server/content-git';
import type { Actions, PageServerLoad } from './$types';

const CONTENT_DIR = pagesDir();

export const load: PageServerLoad = async ({ params }) => {
	const entry = getRawEntry(CONTENT_DIR, params.slug);
	if (!entry) error(404, 'Page not found');

	const git = await getContentGitState();
	const state = fileGitState(git, `src/content/pages/${params.slug}.md`);

	return {
		// The slug, not the heading: a page's h1 is a whole sentence here
		// ("RazerGhost is a handle I've used for years. It stuck."), and a trail
		// is a place, not a summary.
		adminCrumb: params.slug[0].toUpperCase() + params.slug.slice(1),
		git: {
			tracked: git !== null,
			changed: state === 'changed',
			ahead: git?.ahead ?? null
		},
		slug: params.slug,
		title: String(entry.meta.title ?? ''),
		heading: String(entry.meta.heading ?? ''),
		description: String(entry.meta.description ?? ''),
		body: entry.body
	};
};

export const actions: Actions = {
	// No rename and no delete: a page's slug is its route, and deleting the
	// file would leave that route erroring. Both are code changes.
	default: async ({ request, params }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const heading = String(data.get('heading') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const body = String(data.get('body') ?? '');

		if (!heading) {
			return fail(400, { title, heading, description, body, error: 'A heading is required.' });
		}

		writeEntry(CONTENT_DIR, params.slug, { title, heading, description }, body);
		redirect(303, `/admin/pages/${params.slug}`);
	}
};
