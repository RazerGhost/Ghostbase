import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPage, listPages } from './pages';

/**
 * These run against the real src/content/pages, because the thing worth
 * guarding is not the renderer — devlog.ts already proves that — but the
 * contract between a page file and the route that renders it. /about errors
 * outright if about.md goes missing or loses its heading, and that is a
 * 500 on a public page, so it should fail here first.
 */
describe('pages', () => {
	it('reads about.md with the frontmatter its route needs', () => {
		const about = getPage('about');
		expect(about).not.toBeNull();
		expect(about!.heading).toBeTruthy();
		expect(about!.title).toBeTruthy();
		expect(about!.description).toBeTruthy();
	});

	it('renders the body to html with heading anchors', () => {
		const about = getPage('about')!;
		expect(about.html).toContain('<p>');
		// The contents list the devlog builds — a page gets the same treatment,
		// which is what lets the admin outline work on both.
		expect(about.toc.length).toBeGreaterThan(0);
		expect(about.html).toMatch(/<h2[^>]*id="/);
	});

	it('returns null rather than throwing for a page that does not exist', () => {
		expect(getPage('not-a-page')).toBeNull();
	});

	it('rejects a traversal slug', () => {
		expect(getPage('../devlog/2026-09-21-dropping-link-hub')).toBeNull();
	});

	it('lists every markdown file in the pages directory', () => {
		const onDisk = fs
			.readdirSync(path.resolve(process.cwd(), 'src/content/pages'))
			.filter((f) => f.endsWith('.md')).length;
		expect(listPages()).toHaveLength(onDisk);
	});
});
