import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Where a piece of content has got to on its way to being published.
 *
 * The editors write straight to `src/content` on disk, and that content is
 * baked into the Docker image at build time — so saving a post is only the
 * first of three steps, and the other two happen in a terminal. Until now the
 * editor said so as a sentence ("commit + push to publish") whether or not you
 * had done either, which is the one thing a static string cannot tell you.
 *
 * In production this returns `null`: the runtime image is not a git checkout,
 * which is also why the editors are documented as a local-dev tool. Callers
 * render the sentence again in that case rather than an error.
 */
export type ContentGitState = {
	branch: string;
	/** Commits on the local branch that the remote has not got. `null` with no upstream. */
	ahead: number | null;
	behind: number | null;
	/** Paths under the content roots that differ from HEAD, repo-relative. */
	changed: string[];
};

export type FileGitState = 'clean' | 'changed' | 'untracked' | 'unknown';

const CONTENT_DIRS = ['src/content/devlog', 'src/content/projects'];

// A page can ask about the repo once and then about a dozen files, and each
// answer is the same `git status` read. Shelling out a dozen times for one
// render is the cost this cache exists to avoid; it is short enough that a
// commit made in a terminal shows up on the next reload.
const TTL_MS = 3000;
let cached: { at: number; value: ContentGitState | null } | null = null;

async function git(args: string[]): Promise<string> {
	const { stdout } = await run('git', args, {
		cwd: process.cwd(),
		env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
	});
	return stdout.trim();
}

async function read(): Promise<ContentGitState | null> {
	let branch: string;
	try {
		branch = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
	} catch {
		// Not a checkout, or no git binary — the production case.
		return null;
	}

	// Separate try: a branch with no upstream is normal (a fresh local branch),
	// and it should not cost us the rest of the answer.
	let ahead: number | null = null;
	let behind: number | null = null;
	try {
		const counts = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
		const [a, b] = counts.split(/\s+/).map(Number);
		if (Number.isFinite(a) && Number.isFinite(b)) {
			ahead = a;
			behind = b;
		}
	} catch {
		/* no upstream */
	}

	let changed: string[] = [];
	try {
		const status = await git(['status', '--porcelain', '--', ...CONTENT_DIRS]);
		changed = status
			.split('\n')
			.filter(Boolean)
			// Porcelain v1 is "XY <path>", and a rename is "R  old -> new". We
			// only ever want the path as it stands now.
			.map((line) => line.slice(3).trim().split(' -> ').pop() ?? '')
			.filter(Boolean)
			.map((p) => p.replace(/^"|"$/g, ''));
	} catch {
		/* leave empty */
	}

	return { branch, ahead, behind, changed };
}

export async function getContentGitState(): Promise<ContentGitState | null> {
	if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
	const value = await read();
	cached = { at: Date.now(), value };
	return value;
}

/** Only for tests — the TTL would otherwise leak state between cases. */
export function __clearContentGitCache(): void {
	cached = null;
}

/**
 * Where one content file stands. `filePath` is absolute or repo-relative; git
 * reports POSIX separators, so a Windows path is normalised before comparing.
 */
export function fileGitState(state: ContentGitState | null, filePath: string): FileGitState {
	if (!state) return 'unknown';
	const rel = path.relative(process.cwd(), path.resolve(process.cwd(), filePath)).split(path.sep).join('/');
	return state.changed.includes(rel) ? 'changed' : 'clean';
}
