/**
 * What a post measures, computed in the browser as you type.
 *
 * The editor used to show none of this — not the length, not the outline, not
 * whether a heading level had been skipped — while the published page computed
 * all of it server-side and showed it to everyone else. These are the same
 * numbers, so the editor and the post agree: WORDS_PER_MINUTE matches
 * estimateReadingTime() in server/content.ts, and the heading list is the same
 * h2/h3 set that becomes the post's contents.
 *
 * Client-side on purpose: it has to update on a keystroke, and that rules out
 * asking the server.
 */

const WORDS_PER_MINUTE = 200;

export type Heading = { level: number; text: string; line: number };

export type MarkdownStats = {
	words: number;
	readingTime: number;
	headings: Heading[];
	links: number;
	images: number;
	/** Heading levels that jump by more than one — h2 straight to h4. */
	levelSkips: number[];
};

/**
 * Fenced code is stripped before anything is counted. A 40-line code sample is
 * not 40 words of reading, and a `# comment` inside one is not a heading — the
 * published renderer does not treat it as one either.
 */
function stripFences(body: string): string {
	return body.replace(/^```[\s\S]*?^```/gm, '');
}

export function analyse(body: string): MarkdownStats {
	const prose = stripFences(body);

	const headings: Heading[] = [];
	prose.split('\n').forEach((line, i) => {
		const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
		if (m) headings.push({ level: m[1].length, text: m[2], line: i + 1 });
	});

	const levelSkips: number[] = [];
	let previous = 0;
	for (const h of headings) {
		if (previous && h.level > previous + 1) levelSkips.push(h.line);
		previous = h.level;
	}

	const images = (prose.match(/!\[[^\]]*]\([^)]*\)/g) ?? []).length;
	// Images are links as far as this regex is concerned, so they come off the
	// total rather than being matched around.
	const links = (prose.match(/\[[^\]]*]\([^)]*\)/g) ?? []).length - images;

	const words = body.trim().split(/\s+/).filter(Boolean).length;

	return {
		words,
		readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
		headings,
		links: Math.max(0, links),
		images,
		levelSkips
	};
}
