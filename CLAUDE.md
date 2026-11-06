# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RazerGhost's personal site: a devlog plus pages for projects, gear, watchlist and listening history, built with SvelteKit (Svelte 5), Tailwind CSS 4, and mdsvex. Deployed via Docker (adapter-node) behind Coolify/Traefik. Licensed under [PolyForm Noncommercial 1.0.0](LICENSE) — forkable/self-hostable, not resellable as a paid hosted service.

This file is a high-level orientation. For implementation-level detail on any one subsystem (auth, watchlist, listens, backups, deployment, every env var), see [docs/](docs/README.md) — those docs go deeper than what's summarized below. [README.md](README.md) is the human-facing overview.

## Commands

Package manager is pnpm (`packageManager: pnpm@11.3.0`).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — production build (adapter-node, outputs to `build/`)
- `pnpm preview` — preview the production build
- `pnpm check` — `svelte-kit sync` + `svelte-check` (type checking; no separate lint script)
- `node build/index.js` — run the built server (what the Docker image's `CMD` does)

- `pnpm test` — runs the Vitest suite (`src/**/*.test.ts`)

## Architecture

**Devlog + projects content pipeline**: Both are markdown files with frontmatter, read off disk at request time (not bundled by Vite) — devlog posts in `src/content/devlog/*.md` (named `YYYY-MM-DD-slug.md`), project entries in `src/content/projects/*.md`. [content.ts](src/lib/server/content.ts) holds the shared file-reading/date-normalization helpers used by both [devlog.ts](src/lib/server/devlog.ts) and `projects.ts`, which independently render + compute reading time/TOC/footnotes (devlog) or name/href/live status (projects). `src/routes/devlog/+page.server.ts` / `[slug]/+page.server.ts` call into `devlog.ts`; there's also RSS (`devlog/rss.xml`, `projects/rss.xml`), a sitemap, and per-post/per-project OG image generation ([og.ts](src/lib/server/og.ts), via `satori`+`resvg`, needing real font bytes from `src/lib/server/fonts/`). Content and fonts are copied into the Docker runtime image separately from the compiled app (see Dockerfile) since they're read from disk, not bundled. See [docs/content-pipeline.md](docs/content-pipeline.md) for the full detail.

**Devlog embeds**: Markdown posts can embed interactive Svelte components via `<div data-embed="Name"></div>`. Available components are registered by name in [src/lib/components/devlog-embeds/registry.ts](src/lib/components/devlog-embeds/registry.ts); [src/lib/actions/mount-embeds.ts](src/lib/actions/mount-embeds.ts) is a Svelte action that scans rendered post HTML and mounts the matching component into each placeholder. Add new embeddable components to both the registry and the `devlog-embeds/` folder.

**External integrations** (all optional; each degrades gracefully when its env vars are unset): Spotify recently-played and `/listens` scrobbling, live "now playing" and Discord presence through one shared Lanyard connection, and GitHub widgets proxied through `src/routes/api/github/*` with a cache. Details in [docs/integrations.md](docs/integrations.md).

**Listens page**: built from Spotify's extended-history export uploaded at `/spotify-import` into `spotify-history.db`, plus live scrobbles between exports. See [docs/listens.md](docs/listens.md).

**Site-wide config**: [src/lib/config.ts](src/lib/config.ts) centralizes site metadata, social links, and nav links — check here before hardcoding any of that elsewhere.

**SEO**: [Seo.svelte](src/lib/components/Seo.svelte) is used per-page to set meta tags; pass `title`, `description`, `path`.

**Styling**: Tailwind CSS 4 via `@tailwindcss/vite` (no separate Tailwind config file — v4 style). Three files, in order: [design.md](design.md) is the design charter — read it before changing anything visual; [tokens.css](src/lib/styles/tokens.css) holds the tokens and the base reset and nothing else; [roles.css](src/lib/styles/roles.css) holds the role classes (`.page`, `.card`, `.h-page`/`.h-section`/`.h-card`, `.label`, `.meta`, `.num`, `.btn`, `.chip`, `.input`) and is the file to edit when a design decision changes. Markup asks for a role by name rather than repeating utility strings — reach for a role first, and if you need a raw utility twice, add a role instead. roles.css is wrapped in `@layer components` deliberately, so a utility can still override one value of a role (`class="card p-4"` renders at 16px); unlayered it would silently win over every utility stacked on it. Both light and dark mode are supported ([ThemeToggle.svelte](src/lib/components/ThemeToggle.svelte)).

**Deployment and data** ([docs/deployment.md](docs/deployment.md), [docs/environment.md](docs/environment.md), [docs/backups.md](docs/backups.md)):
- Docker (adapter-node) behind Coolify. Set `ORIGIN` in Coolify's environment, never in a committed `.env`.
- `data/` holds three SQLite files and `media/`. It needs a persistent Coolify volume at `/app/data`, or a redeploy loses it. Losing `spotify-history.db` loses real content.
- Content and fonts are read from disk at request time and copied into the image separately; they aren't bundled.
- `/admin/devlog` and `/admin/projects` write markdown straight to disk: use them against `pnpm dev`, then commit and push to publish.
- Backups (`/api/backup`, secret-gated) dump `data/` as SQL into a private git repo; the scrobble endpoint is secret-gated the same way.

**Service worker**: only answers failed page loads with an offline page and caches nothing. `pnpm preview` registers it on `localhost:4173`, so a stopped preview shows the offline page. See [docs/service-worker.md](docs/service-worker.md).

**Rate limiting**: `checkRateLimit()` in [rate-limit.ts](src/lib/server/rate-limit.ts), in-memory per process, on auth and the secret-gated endpoints.

## Testing gated pages locally

`/admin` and `/spotify-import` redirect/401 anyone without a valid session cookie — including a local dev browser that isn't logged in via GitHub OAuth. When verifying a change to one of these pages in a browser preview, it's fine to temporarily disable the gate to test without going through the OAuth flow — but **always restore it before committing**.

**There are three gates, not one**, and disabling only the first still redirects:

- [src/hooks.server.ts](src/hooks.server.ts) — `PROTECTED_PREFIXES`, the outer gate for both prefixes.
- [src/routes/admin/+layout.server.ts](src/routes/admin/+layout.server.ts) — its own `redirect(303, '/auth/login…')`.
- [src/routes/spotify-import/+layout.server.ts](src/routes/spotify-import/+layout.server.ts) — the same, for that route.

Diff all three as part of pre-commit review to make sure none was left disabled. `git checkout -- <the three paths>` is the cleanest restore, since none of them should ever be part of a feature change.

## Icons

Two icon packages are used: `@lucide/svelte` (general icons) and `@icons-pack/svelte-simple-icons` (brand icons). Both ship raw `.svelte` source rather than pre-compiled output, so they're added to `ssr.noExternal` in [vite.config.ts](vite.config.ts) — keep that in mind if adding another icon package that behaves the same way.
