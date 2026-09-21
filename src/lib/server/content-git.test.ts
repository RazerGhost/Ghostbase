import { describe, expect, it } from 'vitest';
import { fileGitState, type ContentGitState } from './content-git';

// getContentGitState() shells out to the real repo, so the tests that matter
// are about the pure half: what the pages do with the answer. The "no state"
// case is the production one — the runtime image is not a checkout — and it
// must degrade to "unknown" rather than to "clean", which would quietly tell
// you a post was committed when nothing had been checked at all.
const state: ContentGitState = {
	branch: 'main',
	ahead: 2,
	behind: 0,
	changed: ['src/content/devlog/2026-09-21-a-post.md']
};

describe('fileGitState', () => {
	it('reports a file git listed as changed', () => {
		expect(fileGitState(state, 'src/content/devlog/2026-09-21-a-post.md')).toBe('changed');
	});

	it('reports a file git did not list as clean', () => {
		expect(fileGitState(state, 'src/content/devlog/2026-09-20-another.md')).toBe('clean');
	});

	it('is unknown, never clean, when there is no git state at all', () => {
		expect(fileGitState(null, 'src/content/devlog/2026-09-21-a-post.md')).toBe('unknown');
	});

	it('matches an absolute path against git output, which is repo-relative', () => {
		const abs = `${process.cwd()}/src/content/devlog/2026-09-21-a-post.md`;
		expect(fileGitState(state, abs)).toBe('changed');
	});
});
