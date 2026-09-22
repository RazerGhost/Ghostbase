import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
	readEntryFile,
	addHeadingAnchors,
	isValidSlug,
	applyFootnotes,
	renderFootnotesSection,
	type TocEntry
} from './content';

/**
 * Standing prose pages — About, and whatever joins it.
 *
 * These were hardcoded in their `.svelte` route, so changing a sentence meant
 * editing code and pushing. They are markdown now, on the same pipeline as the
 * devlog: same renderer, same footnotes, same heading anchors, and the same
 * editor at /admin/pages.
 *
 * Deliberately thinner than devlog.ts. A page has no date, no tags, no series
 * and no reading time — it is not a log entry, and giving it those fields
 * would only invite them onto the page.
 *
 * The live parts of a page (the numbers, presence, social links) stay in the
 * route. Markdown is for the copy; data that changes on its own is not copy.
 */

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/pages');

export interface PageMeta {
	slug: string;
	title: string;
	/** The h1. Separate from `title`, which is the browser/SEO one. */
	heading: string;
	description: string;
}

export interface PageEntry extends PageMeta {
	html: string;
	toc: TocEntry[];
	body: string;
}

function toMeta(slug: string, meta: Record<string, unknown>): PageMeta {
	return {
		slug,
		title: String(meta.title ?? slug),
		heading: String(meta.heading ?? meta.title ?? slug),
		description: String(meta.description ?? '')
	};
}

// Keyed by mtime like devlog.ts, so an edit from /admin shows up on the next
// request without a restart.
const cache = new Map<string, { mtimeMs: number; entry: PageEntry }>();

export function getPage(slug: string): PageEntry | null {
	if (!isValidSlug(slug)) return null;
	const filename = `${slug}.md`;

	let mtimeMs: number;
	try {
		mtimeMs = fs.statSync(path.join(CONTENT_DIR, filename)).mtimeMs;
	} catch {
		cache.delete(slug);
		return null;
	}

	const cached = cache.get(slug);
	if (cached && cached.mtimeMs === mtimeMs) return cached.entry;

	const { meta, body } = readEntryFile(CONTENT_DIR, filename);
	const { body: withRefs, footnotes } = applyFootnotes(body);
	const rawHtml = marked.parse(withRefs, { async: false }) as string;
	const { html: withAnchors, toc } = addHeadingAnchors(rawHtml);
	const html = footnotes.length ? withAnchors + renderFootnotesSection(footnotes) : withAnchors;

	const entry: PageEntry = { ...toMeta(slug, meta), html, toc, body };
	cache.set(slug, { mtimeMs, entry });
	return entry;
}

export function listPages(): PageMeta[] {
	if (!fs.existsSync(CONTENT_DIR)) return [];
	return fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((f) => f.replace(/\.md$/, ''))
		.map((slug) => getPage(slug))
		.filter((p): p is PageEntry => p !== null)
		.map(({ slug, title, heading, description }) => ({ slug, title, heading, description }))
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function pagesDir(): string {
	return CONTENT_DIR;
}
