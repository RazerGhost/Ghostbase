import { describe, expect, it } from 'vitest';
import { skeletonFor } from './navigation-skeleton';

function at(path: string, id: string | null, params: Record<string, string> = {}) {
	return { url: new URL(path, 'https://razerghost.xyz'), params, route: { id } };
}

describe('skeletonFor', () => {
	it('picks the destination page, not the one being left', () => {
		expect(skeletonFor({ from: at('/', '/'), to: at('/watchlist', '/watchlist'), type: 'link' })).toEqual({
			kind: 'watchlist'
		});
		expect(skeletonFor({ from: at('/watchlist', '/watchlist'), to: at('/', '/'), type: 'popstate' })).toEqual({
			kind: 'home'
		});
	});

	it('carries a heading it already knows', () => {
		expect(skeletonFor({ from: at('/', '/'), to: at('/devlog', '/devlog'), type: 'link' })).toEqual({
			kind: 'stream',
			title: 'Devlog'
		});
		expect(
			skeletonFor({
				from: at('/devlog', '/devlog'),
				to: at('/projects/tags/svelte', '/projects/tags/[tag]', { tag: 'svelte' }),
				type: 'link'
			})
		).toEqual({ kind: 'stream', title: '#svelte', narrow: true });
	});

	it('shows one between two posts, since the path changes', () => {
		expect(
			skeletonFor({
				from: at('/devlog/a', '/devlog/[slug]', { slug: 'a' }),
				to: at('/devlog/b', '/devlog/[slug]', { slug: 'b' }),
				type: 'link'
			})
		).toEqual({ kind: 'post' });
	});

	it('leaves a query-only change to the page itself', () => {
		expect(
			skeletonFor({ from: at('/listens', '/listens'), to: at('/listens?year=2023', '/listens'), type: 'goto' })
		).toBeNull();
	});

	it('stays out of form posts, the admin area and unknown routes', () => {
		expect(skeletonFor({ from: at('/a', '/about'), to: at('/b', '/'), type: 'form' })).toBeNull();
		expect(skeletonFor({ from: at('/', '/'), to: at('/admin/devlog', '/admin/devlog'), type: 'link' })).toBeNull();
		expect(skeletonFor({ from: at('/', '/'), to: at('/nope', null), type: 'link' })).toBeNull();
		expect(skeletonFor({ from: at('/', '/'), to: null, type: null })).toBeNull();
	});

	it('falls back to a generic skeleton for a page without its own', () => {
		expect(skeletonFor({ from: at('/', '/'), to: at('/gear', '/gear'), type: 'link' })).toEqual({ kind: 'generic' });
	});
});
