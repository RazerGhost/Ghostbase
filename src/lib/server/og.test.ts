import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { renderOgImage } from './og';

/**
 * satori has no stylesheet and no system fonts: if a face fails to load, or
 * ships in a format it can't parse (woff2), it doesn't throw — it renders
 * tofu, or silently drops to a fallback. These tests are the only thing
 * standing between that and a month of wrong social previews.
 *
 * The timeout is deliberate. The first render in this file pays the whole
 * cold start — three font files parsed by satori, then rasterised by resvg —
 * and the rest hit renderOgImage's cache and finish in about 30ms. That first
 * one takes ~800ms on a warm dev machine and was measured at 6.9s on a cold
 * CI runner, which is over vitest's 5s default: the suite failed on a PR that
 * had not touched this code. Real work that is genuinely slow needs a budget
 * that says so, rather than a rerun until the runner is fast enough.
 */
describe('renderOgImage', () => {
	const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

	it('renders a real PNG', async () => {
		const png = await renderOgImage({ title: 'A post', tags: ['svelte'], eyebrow: 'Devlog' });
		expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
		// 1200x630 of type on a dark ground compresses small, but not this small.
		expect(png.byteLength).toBeGreaterThan(5_000);
	}, 30_000);

	it('renders every face it asks for, and the punctuation the titles use', async () => {
		// Serif title, mono labels, and curly quotes / em dashes — all outside
		// basic ASCII, and all in the latin subset these files were cut from.
		await expect(
			renderOgImage({
				title: 'What I\u2019d do differently \u2014 a retrospective',
				tags: ['post-mortem', 'sveltekit'],
				eyebrow: 'Devlog'
			})
		).resolves.toBeInstanceOf(Buffer);
	});

	it('caches on the exact inputs', async () => {
		const options = { title: 'Cached', tags: ['a'], eyebrow: 'Devlog' };
		const first = await renderOgImage(options);
		const second = await renderOgImage({ ...options });
		expect(second).toBe(first);

		const different = await renderOgImage({ ...options, title: 'Not cached' });
		expect(different).not.toBe(first);
	});

	it('takes a long title without overflowing the card', async () => {
		const png = await renderOgImage({
			title: 'A title long enough to force the smallest step of the scale and then some more',
			tags: [],
		});
		expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
	});

	if (process.env.OG_DUMP) {
		it('dumps a sample for eyeballing', async () => {
			const png = await renderOgImage({
				title: 'Rebuilding the listens page around one number',
				tags: ['sveltekit', 'spotify', 'sqlite'],
				eyebrow: 'Devlog'
			});
			fs.writeFileSync(process.env.OG_DUMP!, png);
		});
	}
});
