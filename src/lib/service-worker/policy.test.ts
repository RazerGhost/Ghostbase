import { describe, expect, it } from 'vitest';
import { fallbackAllowed, pickFonts } from './policy';
import { offlinePage } from './offline-page';

const BUILD = [
	'/_app/immutable/entry/start.abc.js',
	'/_app/immutable/assets/archivo-latin-wght-normal.E0tuGl4L.woff2',
	'/_app/immutable/assets/archivo-latin-wght-italic.C1arb59o.woff2',
	'/_app/immutable/assets/archivo-latin-ext-wght-normal.Zz.woff2',
	'/_app/immutable/assets/instrument-serif-latin-400-normal.DnYpCC2O.woff2',
	'/_app/immutable/assets/instrument-serif-latin-400-normal.DnYpCC2O.woff',
	'/_app/immutable/assets/jetbrains-mono-latin-wght-normal.B9CIFXIH.woff2'
];

describe('pickFonts', () => {
	it('finds the latin woff2 of each face, not the italic, ext or woff siblings', () => {
		expect(pickFonts(BUILD)).toEqual({
			display: '/_app/immutable/assets/instrument-serif-latin-400-normal.DnYpCC2O.woff2',
			body: '/_app/immutable/assets/archivo-latin-wght-normal.E0tuGl4L.woff2',
			mono: '/_app/immutable/assets/jetbrains-mono-latin-wght-normal.B9CIFXIH.woff2'
		});
	});

	it('leaves a face out rather than failing when a file is renamed', () => {
		expect(pickFonts(['/_app/immutable/entry/start.abc.js'])).toEqual({
			display: undefined,
			body: undefined,
			mono: undefined
		});
	});
});

describe('fallbackAllowed', () => {
	const at = (path: string) => new URL(path, 'https://razerghost.xyz');

	it('covers ordinary pages', () => {
		expect(fallbackAllowed(at('/'))).toBe(true);
		expect(fallbackAllowed(at('/listens?year=all'))).toBe(true);
		expect(fallbackAllowed(at('/admin/devlog'))).toBe(true);
	});

	it('leaves the OAuth flow to the browser, so a spent code is never replayed', () => {
		expect(fallbackAllowed(at('/auth/callback?code=x&state=y'))).toBe(false);
		expect(fallbackAllowed(at('/auth/login'))).toBe(false);
	});
});

describe('offlinePage', () => {
	it('uses the cached fonts when it has them', () => {
		const html = offlinePage(pickFonts(BUILD));
		expect(html).toContain("url('/_app/immutable/assets/instrument-serif-latin-400-normal.DnYpCC2O.woff2')");
	});

	it('still renders, in system fonts, without them', () => {
		const html = offlinePage({});
		expect(html).not.toContain('@font-face');
		expect(html).toContain("You're offline");
	});

	it('links to nothing it would need the network for, beyond the fonts', () => {
		const html = offlinePage({});
		expect(html).not.toMatch(/<link\b/);
		expect(html).not.toMatch(/<img\b/);
		expect(html).not.toMatch(/<script\s+src/);
	});

	it('retries by itself when the connection comes back', () => {
		expect(offlinePage({})).toMatch(/addEventListener\('online'/);
	});
});
