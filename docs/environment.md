# Environment variables

One-time setup steps for every variable in [.env.example](../.env.example), grouped into the same sections as that file. That file itself stays a clean list of names — this doc is where the "how do I actually get one of these" detail lives.

Every integration here is optional and degrades gracefully: the site runs fine with an empty `.env`, just with the affected widget/page showing a "not connected" state instead of data.

## Core

### `ORIGIN`

**Required in production.** adapter-node needs this to build absolute URLs and validate incoming request origins when running behind a reverse proxy (Coolify's Traefik) — without it, adapter-node falls back to guessing from request headers, which can misbehave behind a proxy. Set in Coolify's environment variables UI, not in a committed `.env`. Example: `https://razerghost.xyz`.

### `SESSION_SECRET`

Signs the session cookie ([session.ts](../src/lib/server/session.ts)) via HMAC — not a GitHub value. Generate a random secret once:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Rotating this value invalidates all existing sessions.

### `BODY_SIZE_LIMIT`

Extended streaming history exports can be tens of MB across many files. adapter-node's default request body limit (512kb) will reject uploads above that at `/spotify-import` — raise it in Coolify's environment UI if your export is large. Accepts a byte count with an optional K/M/G suffix (e.g. `200M`) — **not** `0`, which SvelteKit treats as a 0-byte limit rather than "unlimited". Use the literal string `Infinity` to fully disable the limit. See [SvelteKit's adapter-node docs](https://svelte.dev/docs/kit/adapter-node#Environment-variables-BODY_SIZE_LIMIT).

## GitHub login gate (`/admin`, `/spotify-import`)

### `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

Restricted to a single GitHub account — the one matching `site.githubUsername` in [config.ts](../src/lib/config.ts). Any other GitHub account is explicitly rejected at `/auth/callback`; no session is issued.

1. Create an OAuth App at https://github.com/settings/developers
   - Homepage URL: your production URL
   - Authorization callback URL: `<your production URL>/auth/callback`
   - Register a *second* OAuth App for local dev, with callback URL `http://localhost:5173/auth/callback` — GitHub requires an exact match and one OAuth App can't have two callback URLs.
2. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` come from that app.

See [auth.md](auth.md) for the full login flow.

These same two values are also reused (as Basic Auth, not part of the login flow) to raise the GitHub REST API's unauthenticated rate limit from 60/hour to 5,000/hour for the GitHub activity/repo-stats widgets — see [integrations.md](integrations.md). If they're unset, those widgets still work, just capped at the lower unauthenticated limit.

## Spotify "now playing" + listening history

### `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REFRESH_TOKEN`

Powers the recently-played history section of [SpotifyWidget.svelte](../src/lib/components/SpotifyWidget.svelte) and `/listens` live scrobbling — not the live "now playing" track itself, which comes from Lanyard/Discord presence instead (see [integrations.md](integrations.md)). Shows "Spotify not connected" (recently-played section hidden) if unset.

1. Create an app at https://developer.spotify.com/dashboard.
2. `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` come from that app.
3. `SPOTIFY_REFRESH_TOKEN` requires a one-time OAuth authorization-code flow with the `user-read-currently-playing user-read-recently-played` scopes, exchanged for a refresh token — a manual step done once, not part of the app itself. The recently-played history section of the widget silently hides itself if the token only has `user-read-currently-playing`.

   [scripts/spotify-refresh-token.mjs](../scripts/spotify-refresh-token.mjs) does the whole flow: it serves the callback on `http://127.0.0.1:8888/callback` (register that exact URI on the Spotify app first — Spotify rejects `localhost`, and loopback-IP URIs are the documented exception to its HTTPS-only rule), prints an authorize URL to open, and prints the resulting token plus its granted scopes.

   ```
   node scripts/spotify-refresh-token.mjs <client_id> <client_secret>
   ```

See [integrations.md](integrations.md) for how the token is used at runtime.

### `SPOTIFY_HISTORY_DB_PATH` / Listens page

Powers `/listens`, built from Spotify's own "extended streaming history" data export (request it at https://support.spotify.com/us/article/understanding-your-data/, can take up to 30 days to arrive), not the live API. Upload the export's JSON files at `/spotify-import`, gated behind the same GitHub login as `/admin` — no separate credentials needed.

Optional — path to the SQLite file backing this page ([spotify-history-db.ts](../src/lib/server/spotify-history-db.ts)). Defaults to `./data/spotify-history.db` if unset. This file is not trivially rebuildable if lost: the export is a one-time historical dump, so make sure this points inside the same persistent Coolify volume as the other `*_DB_PATH` vars.

See [listens.md](listens.md) for the import/parsing details.

### `SPOTIFY_SCROBBLE_SECRET`

Optional — enables live scrobbling into `spotify-history.db` between manual exports ([+server.ts](../src/routes/api/spotify/scrobble/+server.ts)). Requires the Spotify vars above with the `user-read-recently-played` scope.

Nothing issues this value — it's a shared secret you invent, like `SESSION_SECRET` and `BACKUP_SECRET`, and the only requirement is that the scheduler sends the same string this var holds:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If set, hit `GET /api/spotify/scrobble` with an `Authorization: Bearer <this value>` header on a schedule (every 15-30 min — Spotify's recently-played endpoint only returns the last 50 plays, so longer gaps lose history). From a Coolify Scheduled Task, which runs inside the container (no `curl` there), that's:

```
node scripts/hit-endpoint.mjs /api/spotify/scrobble SPOTIFY_SCROBBLE_SECRET
```

An external scheduler hits the public URL with `curl` instead. `?secret=<this value>` also works, but the header is preferred — query strings tend to end up in proxy/access logs. Leave unset to disable the endpoint (it 503s without this).

## Simkl (watching/watchlist)

### `SIMKL_CLIENT_ID` / `SIMKL_REFRESH_TOKEN`

Powers `/watchlist` ([simkl.ts](../src/lib/server/simkl.ts)). Shows "Simkl not connected" if unset. Uses Simkl's **AUTH V2**: access tokens only last 7 days, so the app keeps just the refresh token in env and mints access tokens from it itself ([simkl-auth.ts](../src/lib/server/simkl-auth.ts)).

1. Register an AUTH V2 app at https://simkl.com/settings/developer/ with the app type **TV, devices & command line** (no client secret, no redirect URL). Its `client_id` is public and safe to commit; Ghostbase's is `767808ee648e75daad56ea303fa9a3379212740a8f119d20b6a468a5d8288ecc`.
2. Get `SIMKL_REFRESH_TOKEN` via the device (PIN) flow:
   ```
   node scripts/simkl-token.mjs <client_id>
   ```
   Go to simkl.com/pin, enter the code it shows, approve, and it prints `SIMKL_REFRESH_TOKEN=...`. It asks for no scope, so the token is read-only (`media:read`), which is all this page needs.

Things to know about the refresh token:

- **Never commit it anywhere, including the backup repo.** Simkl automatically revokes tokens it finds on GitHub, private repos included, and revoking either token kills the whole grant. That's why the access token is only held in memory, not in `data/` (which [backups](backups.md) push to git).
- **Use one grant per environment.** Refreshing invalidates the previous access token right away, so prod and a local `pnpm dev` sharing one refresh token would keep cutting each other off. Run the script once for Coolify and again for your local `.env`.
- **It lasts 180 days, and the window resets on every refresh.** The 24h background loop ([simkl-refresh.ts](../src/lib/server/simkl-refresh.ts)) refreshes about once a week, so it only expires if the app is down for six months. It also dies if you revoke the app under Simkl's Connected Apps. Either way the logs show `Simkl token refresh failed: 400 invalid_grant`, `/watchlist` keeps serving its last snapshot, and the fix is to re-run the script.

**Legacy `SIMKL_ACCESS_TOKEN`:** the old AUTH V1 long-lived token (V1 PIN flow, 5-year expiry) is still honoured when `SIMKL_REFRESH_TOKEN` is unset, so existing deployments keep working. Simkl retires V1 around April 2027. It must be paired with the old V1 `SIMKL_CLIENT_ID`; a V1 token doesn't work with a V2 client ID and can't be converted. Once `SIMKL_REFRESH_TOKEN` is set, remove `SIMKL_ACCESS_TOKEN`.

See [watchlist.md](watchlist.md) for caching/enrichment details.

### `SIMKL_CACHE_DB_PATH`

Optional — path to the SQLite cache backing the Watching page's genre/synopsis enrichment ([simkl-cache.ts](../src/lib/server/simkl-cache.ts)). Defaults to `./data/simkl-cache.db` if unset. Losing this file isn't destructive — it just goes cold and re-warms itself over the next several page loads — but pointing it at the same Coolify persistent volume as the other `*_DB_PATH` vars (i.e. leaving them all unset, so they share `./data`) avoids that cold start on every redeploy.

## Media library

### `MEDIA_DIR`

Optional, directory holding images uploaded through the `/admin/media` library ([media.ts](../src/lib/server/media.ts)), used for devlog/project cover images, galleries, and post bodies. Defaults to `./data/media` if unset. Files here are served publicly (no login required) since they appear on public devlog/project pages — only uploading and deleting are admin-gated. Point this at the same persistent Coolify volume as the other `data/*` paths — losing it breaks any published post/project referencing an uploaded image.

## Homepage "Right now" card

### `STATUS_DB_PATH`

Optional — path to the SQLite file backing the homepage's "Right now" status card, edited at `/admin/status` ([status-db.ts](../src/lib/server/status-db.ts)). Defaults to `./data/status.db` if unset. Losing this is non-destructive — it just reverts to the hardcoded fallback in `status-db.ts`.

## Backups

### `BACKUP_SECRET` / `BACKUP_GIT_REMOTE` / `BACKUP_GIT_BRANCH` / `BACKUP_GIT_USER_NAME` / `BACKUP_GIT_USER_EMAIL`

Backs up the SQLite DBs to a private git repo. See [backups.md](backups.md) for full one-time setup (creating the backup repo, minting a scoped PAT, scheduling the endpoint) — that doc covers this in more depth than fits here.
