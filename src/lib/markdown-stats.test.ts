import { describe, expect, it } from 'vitest';
import { analyse } from './markdown-stats';
import { estimateReadingTime } from './server/content';

describe('analyse', () => {
	it('counts words the same way the published post does', () => {
		const body = Array.from({ length: 450 }, (_, i) => `word${i}`).join(' ');
		expect(analyse(body).words).toBe(450);
		// The editor showing "3 min" over a post that publishes as "2 min"
		// would be worse than showing nothing, so the two share a constant.
		expect(analyse(body).readingTime).toBe(estimateReadingTime(body));
	});

	it('lists h2 and h3 in document order', () => {
		const body = '## First\n\nsome text\n\n### Nested\n\n## Second\n';
		expect(analyse(body).headings.map((h) => h.text)).toEqual(['First', 'Nested', 'Second']);
		expect(analyse(body).headings.map((h) => h.level)).toEqual([2, 3, 2]);
	});

	it('ignores a hash inside a fenced block', () => {
		const body = '## Real\n\n```sh\n# not a heading\n```\n';
		expect(analyse(body).headings.map((h) => h.text)).toEqual(['Real']);
	});

	it('flags a skipped heading level', () => {
		const clean = analyse('## One\n\n### Two\n');
		expect(clean.levelSkips).toEqual([]);

		const skipped = analyse('## One\n\n#### Three\n');
		expect(skipped.levelSkips).toHaveLength(1);
	});

	it('counts links and images separately', () => {
		const body = 'See [the post](/devlog/a) and ![a shot](/media/b.png) and [more](/c).';
		const stats = analyse(body);
		expect(stats.images).toBe(1);
		// The image must not also be counted as a link — its markdown differs
		// by one leading "!", which a naive link regex matches anyway.
		expect(stats.links).toBe(2);
	});

	it('never reports a negative link count for an image-only body', () => {
		expect(analyse('![one](/a.png) ![two](/b.png)').links).toBe(0);
	});
});
