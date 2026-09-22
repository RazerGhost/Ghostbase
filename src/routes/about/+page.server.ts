import { error } from '@sveltejs/kit';
import { getPage } from '$lib/server/pages';
import { getAllDevlogEntries } from '$lib/server/devlog';
import { getListeningStats, getDistinctArtistCount } from '$lib/server/spotify-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const page = getPage('about');
	if (!page) error(500, 'about.md is missing from src/content/pages');

	// The numbers are deliberately not the home page's three. That band already
	// says streak / days watched / posts; repeating it here would make About a
	// second home page. These are about depth instead — how far back the record
	// goes, and how wide it got.
	const listening = getListeningStats();

	return {
		page: { heading: page.heading, title: page.title, description: page.description, html: page.html },
		postCount: getAllDevlogEntries().length,
		plays: listening.totalPlays,
		artists: getDistinctArtistCount(),
		firstPlayedAt: listening.firstPlayedAt
	};
};
