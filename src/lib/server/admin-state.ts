import path from 'node:path';
import { listRawEntries } from '$lib/server/content-editor';
import { listPages } from '$lib/server/pages';
import { listMediaFiles } from '$lib/server/media';
import { listAllDetails } from '$lib/server/simkl-cache';
import { getListeningStats } from '$lib/server/spotify-history';
import { getContentGitState, type ContentGitState } from '$lib/server/content-git';
import { backupConfigured, getLastBackupInfo } from '$lib/server/backup';

/**
 * What the admin dashboard knows about the site it administers.
 *
 * The dashboard used to list seven tools and say nothing about any of them —
 * you opened each one to find out whether it needed you. Every number here is
 * already computed somewhere in this codebase for a public page; the dashboard
 * just never asked.
 */
export type AdminState = {
	devlog: { total: number; drafts: number; changed: number; latest: string | null };
	projects: { total: number; changed: number };
	pages: { total: number; changed: number };
	media: { files: number };
	cache: { rows: number; missingRuntime: number; oldestFetch: string | null };
	listens: { plays: number; lastPlayedAt: string | null };
	backup: { configured: boolean; last: { timestamp: string; message: string } | null };
	git: ContentGitState | null;
};

const DEVLOG_DIR = path.resolve(process.cwd(), 'src/content/devlog');
const PROJECTS_DIR = path.resolve(process.cwd(), 'src/content/projects');

function countChanged(git: ContentGitState | null, dir: string): number {
	if (!git) return 0;
	return git.changed.filter((p) => p.startsWith(dir)).length;
}

export async function getAdminState(): Promise<AdminState> {
	const git = await getContentGitState();

	const devlogEntries = listRawEntries(DEVLOG_DIR);
	const projectEntries = listRawEntries(PROJECTS_DIR);

	// Every one of these can fail independently — an empty media dir, a Simkl
	// cache that has never been written, a listens DB with no import yet — and
	// none of them should cost the dashboard the rest of its numbers.
	let mediaFiles = 0;
	try {
		mediaFiles = listMediaFiles().length;
	} catch {
		/* no media dir yet */
	}

	let rows = 0;
	let missingRuntime = 0;
	let oldestFetch: string | null = null;
	try {
		const details = listAllDetails();
		rows = details.length;
		missingRuntime = details.filter((d) => !d.runtime).length;
		oldestFetch = details.reduce<string | null>(
			(min, d) => (min === null || d.fetchedAt < min ? d.fetchedAt : min),
			null
		);
	} catch {
		/* no cache DB yet */
	}

	let plays = 0;
	let lastPlayedAt: string | null = null;
	try {
		const stats = getListeningStats();
		plays = stats.totalPlays;
		lastPlayedAt = stats.lastPlayedAt;
	} catch {
		/* no history DB yet */
	}

	const configured = backupConfigured();
	let last: { timestamp: string; message: string } | null = null;
	if (configured) {
		try {
			last = await getLastBackupInfo();
		} catch {
			/* remote unreachable */
		}
	}

	const dates = devlogEntries
		.map((e) => (e.meta.date ? String(e.meta.date).slice(0, 10) : ''))
		.filter(Boolean)
		.sort();

	return {
		devlog: {
			total: devlogEntries.length,
			drafts: devlogEntries.filter((e) => e.meta.draft === true).length,
			changed: countChanged(git, 'src/content/devlog'),
			latest: dates.at(-1) ?? null
		},
		projects: {
			total: projectEntries.length,
			changed: countChanged(git, 'src/content/projects')
		},
		pages: {
			total: listPages().length,
			changed: countChanged(git, 'src/content/pages')
		},
		media: { files: mediaFiles },
		cache: { rows, missingRuntime, oldestFetch },
		listens: { plays, lastPlayedAt },
		backup: { configured, last },
		git
	};
}
