// One-time helper: runs Simkl's AUTH V2 device (PIN) flow and prints a
// SIMKL_REFRESH_TOKEN. Not part of the running app — run it by hand, copy the
// token into the deployment's env, then forget about it. The app refreshes
// its own 7-day access tokens from it (src/lib/server/simkl-auth.ts), and
// each refresh slides the refresh token's 180-day window forward, so this
// only needs re-running if the app sits unused for six months or the grant
// is revoked (see docs/environment.md).
//
//   node scripts/simkl-token.mjs <client_id>
//
// Run it once per environment (prod, local dev) — two processes refreshing
// the same grant keep invalidating each other's access tokens.

const [clientId] = process.argv.slice(2);
if (!clientId) {
	console.error('usage: node simkl-token.mjs <client_id>');
	process.exit(1);
}

const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ghostbase/1.0' };
const post = (url, params) =>
	fetch(url, { method: 'POST', headers, body: new URLSearchParams(params) }).then(async (r) => ({
		status: r.status,
		body: await r.json().catch(() => ({}))
	}));

// No `scope`: Simkl defaults to media:read, which is all /watchlist needs.
const device = await post('https://api.simkl.com/oauth2/device', { client_id: clientId });
if (device.status !== 200 || !device.body.device_code) {
	console.error(`Couldn't get a device code (${device.status}):`, device.body.error ?? device.body);
	if (device.status === 401) console.error('That client_id is not an AUTH V2 app, or is mistyped.');
	process.exit(1);
}

const { device_code, user_code, verification_uri, verification_uri_complete } = device.body;
console.log(`Go to ${verification_uri} and enter: ${user_code}`);
console.log(`(or open ${verification_uri_complete})\n`);

// Simkl never reports a denial — a "no" just keeps returning
// authorization_pending — so our own deadline is what ends the loop.
const deadline = Date.now() + Math.min(device.body.expires_in ?? 900, 600) * 1000;
let interval = (device.body.interval ?? 5) * 1000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

while (Date.now() < deadline) {
	await wait(interval);
	const res = await post('https://api.simkl.com/oauth2/token', {
		grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
		client_id: clientId,
		device_code
	});

	if (res.status === 200 && res.body.refresh_token) {
		console.log('SIMKL_REFRESH_TOKEN=' + res.body.refresh_token);
		console.log('\ngranted scope:', res.body.scope);
		console.log('Keep this out of git — Simkl revokes tokens it finds on GitHub.');
		process.exit(0);
	}

	const error = res.body.error;
	if (error === 'authorization_pending') continue;
	// The poll timer resets on every attempt, rejected ones included — back
	// off before polling again or it stays locked out.
	if (error === 'slow_down') {
		interval += 5000;
		continue;
	}
	console.error(`Stopped (${res.status}): ${error ?? JSON.stringify(res.body)}`);
	process.exit(1);
}

console.error('Timed out waiting for approval. Run the script again for a fresh code.');
process.exit(1);
