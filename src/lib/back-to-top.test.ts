import { describe, expect, it } from 'vitest';
import { shouldShowBackToTop } from './back-to-top';

/**
 * The cases are the site's real pages, measured in a 1440x900 frame, because
 * the rule is only meaningful against the lengths it actually has to judge.
 * Re-tune the rule and these say immediately which pages changed sides.
 */
const VH = 900;
const PAGES = {
	'/': 1031,
	'/about': 977,
	'/gear': 900,
	'/projects': 900,
	'/devlog': 1147,
	'/watchlist': 2285,
	'/listens': 3331,
	'/devlog/<post>': 2151
} as const;

const SHORT = ['/', '/about', '/gear', '/projects', '/devlog'] as const;
const LONG = ['/watchlist', '/listens', '/devlog/<post>'] as const;

describe('shouldShowBackToTop', () => {
	it('never offers it on a page you can see most of', () => {
		for (const page of SHORT) {
			const height = PAGES[page];
			// Scrolled as far as the page allows, which is the best case for
			// showing it — and it still should not.
			expect(shouldShowBackToTop(height - VH, VH, height), page).toBe(false);
		}
	});

	it('offers it on a long page, once you are a screen in', () => {
		for (const page of LONG) {
			const height = PAGES[page];
			expect(shouldShowBackToTop(VH + 1, VH, height), page).toBe(true);
		}
	});

	it('holds it back until a full screen has gone by', () => {
		const height = PAGES['/listens'];
		expect(shouldShowBackToTop(0, VH, height)).toBe(false);
		expect(shouldShowBackToTop(VH - 1, VH, height)).toBe(false);
		expect(shouldShowBackToTop(VH + 1, VH, height)).toBe(true);
	});

	// The regression this replaced: a proportional threshold made the least
	// useful pages the quickest to offer it. 39px on /about, 66px on home.
	it('is not proportional — a short page cannot qualify by being scrolled at all', () => {
		expect(shouldShowBackToTop(39, VH, PAGES['/about'])).toBe(false);
		expect(shouldShowBackToTop(66, VH, PAGES['/'])).toBe(false);
	});

	it('handles a page with nothing to scroll', () => {
		expect(shouldShowBackToTop(0, VH, VH)).toBe(false);
	});
});
