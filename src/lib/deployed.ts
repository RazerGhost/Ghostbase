/**
 * When this build was made — the "Last deployed" line in the footer.
 *
 * `__BUILD_TIME__` is replaced at build time by Vite (see vite.config.ts).
 * That is the image build, and Coolify replaces the container from the image
 * on every deploy, so the two are the same day; a restart that rebuilds
 * nothing correctly leaves the date where it was. In `pnpm dev` it is when
 * the dev server started.
 *
 * Formatted here, once, at module scope: the value is a fixed constant and
 * the formatter is pinned to en-GB and UTC, so the server and the browser
 * cannot disagree and produce a hydration mismatch.
 */
const formatter = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC'
});

export const deployedAt = new Date(__BUILD_TIME__);
export const deployedOn = formatter.format(deployedAt);
