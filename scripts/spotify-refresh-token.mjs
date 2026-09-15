// One-time helper: runs the Spotify authorization-code flow locally and prints
// a SPOTIFY_REFRESH_TOKEN. Not part of the running app — run it by hand, copy
// the token into the deployment's env, then forget about it until the app's
// credentials are rebuilt (see docs/environment.md).
//
//   node scripts/spotify-refresh-token.mjs <client_id> <client_secret>
//
// The redirect URI below must be registered on the Spotify app first
// (dashboard -> your app -> Settings -> Redirect URIs). Spotify rejects
// `localhost` in redirect URIs; the loopback IP is the documented exception to
// its HTTPS-only rule, so this uses 127.0.0.1.

import http from 'node:http';

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
	console.error('usage: node spotify-refresh-token.mjs <client_id> <client_secret>');
	process.exit(1);
}

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
// Both scopes matter: the recently-played history section hides itself if the
// token only carries user-read-currently-playing.
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const state = Math.random().toString(36).slice(2);

const authorizeUrl =
	'https://accounts.spotify.com/authorize?' +
	new URLSearchParams({
		response_type: 'code',
		client_id: clientId,
		scope: SCOPES,
		redirect_uri: REDIRECT_URI,
		state
	});

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
	if (url.pathname !== '/callback') {
		res.writeHead(404).end();
		return;
	}

	const finish = (status, message) => {
		res.writeHead(status, { 'Content-Type': 'text/plain' }).end(message);
		server.close();
	};

	if (url.searchParams.get('error')) {
		console.error('Spotify returned an error:', url.searchParams.get('error'));
		finish(400, 'Authorization denied. Check the terminal.');
		return;
	}
	if (url.searchParams.get('state') !== state) {
		console.error('State mismatch — ignoring this callback.');
		finish(400, 'State mismatch. Check the terminal.');
		return;
	}

	const token = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: url.searchParams.get('code'),
			redirect_uri: REDIRECT_URI
		})
	}).then((r) => r.json());

	if (!token.refresh_token) {
		console.error('No refresh token in the response:', token);
		finish(500, 'Token exchange failed. Check the terminal.');
		return;
	}

	console.log('\nSPOTIFY_REFRESH_TOKEN=' + token.refresh_token);
	console.log('\ngranted scopes:', token.scope);
	finish(200, 'Done — the refresh token is in your terminal. You can close this tab.');
});

server.listen(PORT, '127.0.0.1', () => {
	console.log('Open this URL in your browser and approve:\n');
	console.log(authorizeUrl + '\n');
	console.log(`Waiting for the callback on ${REDIRECT_URI} ...`);
});
