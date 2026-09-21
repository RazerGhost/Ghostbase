---
title: Dropping "link hub"
date: 2026-09-21
tags: [meta, design]
excerpt: The name was accurate in June and stopped being accurate somewhere around the Spotify import. Renamed in seven places, left alone in two.
---

When this site started in June it really was a link hub — a page with my
profiles on it and a devlog bolted to the side. I said exactly that in the
[first post](/devlog/2026-06-01-hello-world).

Then `/listens` landed, built out of a Spotify data export rather than the
API. Then `/watchlist`, off Simkl. Then `/gear` and `/projects`. Between them
they're most of what's here now, and the links are the smallest part of the
page that gave the whole site its name.

## Where the name was hiding

Seven places, and one of them mattered more than the other six:

- `site.description` in `config.ts` — which is the meta description, so every
  search result for this domain described it as a links page.
- The About page, the README, `CLAUDE.md`, the project entry for this site,
  and the fallback status line on the home page.

They all say what the site *is* now instead of what category it belongs to:
"Personal site — devlog, projects, watchlist, and listening history." Not a
clever name. It stops being wrong the moment I add another page, which the
old one couldn't manage.

## What I left alone

The first post and the [design post](/devlog/2026-07-10-second-post) both use
"link hub", and both stay as written. They were true when I wrote them, and
editing an old post so it agrees with the current name is just quietly
rewriting the record. The name changed. What I said in June didn't.

That's the same reason this is its own entry rather than a silent find and
replace.
