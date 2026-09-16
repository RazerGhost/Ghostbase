// Calls one of this app's own secret-gated endpoints from inside the running
// container — the shape Coolify's Scheduled Tasks need, since they exec into
// the container rather than calling in over the network.
//
//   node scripts/hit-endpoint.mjs /api/backup BACKUP_SECRET
//
// The secret is named, not passed: the value is read from the container's
// environment, so rotating the env var doesn't mean editing the task too.
//
// Exists because the runtime image is node:22-slim plus git — no curl, no
// wget (same reason the Dockerfile's HEALTHCHECK shells out to node). Writing
// the equivalent `node -e "..."` inline makes for an unwieldy task command.
//
// Talks to the app directly, bypassing the reverse proxy: a backup run
// pushing tens of MB outlives a typical proxy read timeout, which otherwise
// looks like a failure even though the work completed. Uses `localhost`
// rather than a literal 127.0.0.1 so it also works against a dev server bound
// only to ::1.

const [path, secretVar] = process.argv.slice(2);

if (!path) {
	console.error('usage: node scripts/hit-endpoint.mjs <path> [SECRET_ENV_VAR]');
	process.exit(1);
}

const secret = secretVar ? process.env[secretVar] : undefined;
if (secretVar && !secret) {
	console.error(`${secretVar} is not set in this environment`);
	process.exit(1);
}

const url = `http://localhost:${process.env.PORT || 3000}${path}`;

try {
	const res = await fetch(url, {
		headers: secret ? { Authorization: `Bearer ${secret}` } : {}
	});
	const body = (await res.text()).slice(0, 500);
	console.log(res.status, body);
	// Non-zero on failure so a scheduler reports the run as failed rather than
	// silently succeeding on a 401/503.
	process.exit(res.ok ? 0 : 1);
} catch (err) {
	console.error(`request to ${url} failed:`, err.message);
	process.exit(1);
}
