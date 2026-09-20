---
title: Ankerd Con — a restyle, trip-shaped navigation, and two security audits
date: 2026-09-19
tags: [react, fastapi, supabase, security, design, side-project]
excerpt: Coming late to the event app my own convention crew uses (React + FastAPI + Supabase), rebuilding its navigation around trips, restyling every screen by remapping Tailwind palettes, and closing two rounds of security findings.
draft: true
---

Ankerd Con is the private PWA our convention crew uses for its trips:
rides, meals, hotel rooms, shared expenses and the event calendar. It's
React 18 + Vite + Tailwind on the front, FastAPI on the back, with Supabase
for Postgres and Discord OAuth. [Gavin](https://github.com/Gavin132) started it and
[Ayoub](https://ayoublfatmi.nl/#home) wrote most of it. I'm one of Ankerd's
original members, so I'm one of its users too; I came to the code in September,
when the app already had real users and real data. It's open at
[Gavin132/ankerdcon](https://github.com/Gavin132/ankerdcon). Here's what I did
in the week that followed.

## Proposal first

Gavin's complaint was that on desktop it looked like a generic AI-built
app: a `max-w-2xl` column, a bottom tab bar, and slate/sky/glass/Inter. I
wrote the proposal as a standalone HTML page with mock-ups of the key
screens, so the crew could react to it before any real code changed. The
feedback settled the direction quickly:

- The look comes from the anchor mascot: ink outlines, one brand fill, and
  status colours only for status.
- Flat. 3D bottom edges were tried, then cards that lift on hover, and both
  were rejected ("the hover lift looks a bit weird"). Only primary buttons
  keep a small hard shadow and press in on click.
- The first mock-up was "too busy", so no avatar stacks or buttons on every
  row.

## Navigation around trips

The old tabs (Transport, Eten, Financiën, Meer) split the app by feature,
so two upcoming cons meant one list of rides for both. The new tabs are
**Hub · Event · Agenda · Financiën · Crew**. Event opens one trip, meaning
the days that share a `multi_day_id` or a single standalone day, with
sub-tabs for Overzicht, Vervoer, Eten, Kamers, Cosplay and Foto's. Trip
logic lives in `utils/trips.ts` (`buildTrips`, `tripImage`), sign-ups are
shared between Agenda and Event through `useTripRsvp`, and every old path
(`/transport`, `/food`, `/more`, `/events/:id`, …) redirects through
`routes.legacy`.

Two follow-ups made it feel finished:

- **Overzicht as a ticket.** The trip's image, its days, who's going and a
  countdown stub, then one tile per part of the trip in trip order. Each
  tile shows the answer and opens the page where you change it. Tap a day
  on the ticket to sign up for it or drop it.
- **Agenda as a ticket stack plus a Recap view.** Upcoming trips are
  swipeable tickets where "Ik ga mee" signs you up for every day at once.
  Past trips become a month view built for looking back: each day shows its
  latest story photo, and a past trip opens a look-back with the photos per
  day, the rides and the dinners.

## Restyling 149 files without rewriting 149 files

The codebase was full of `bg-slate-800` and `text-sky-500`. Rather than
touching every class, `tailwind.config.ts` redefines `slate` and `sky`
themselves, so every existing class picks up the new greys and brand
colour. On top of that sit semantic tokens (`ink`, `paper`, `surface`,
`sunken`, `line`, `outline`, `brand`) backed by CSS variables in
`index.css`, so light and dark mode share one set of names. New screens use
the semantic tokens, and old ones are moved over as they're touched.
`docs/design-system.md` records the rules.

Desktop got a sidebar with the next trip drawn as a wristband, and tablets
get an icon rail. A few days later the brand colour moved from anchor cyan
to `#48A0E5`, which was a twelve-file change thanks to the remap.

## Two security audits

I ran an audit, fixed it, then audited the fixed version. The findings
worth writing down:

- **Identity from `user_metadata`.** Supabase lets users edit their own
  `user_metadata`, and part of the login flow read identity from it. That's
  an account takeover. Users are now identified only by the token's `sub`
  and the identities Supabase itself verified.
- **Acting for others.** Every endpoint that takes a name now goes through
  `act_as(current_user, requested)`. You can act as yourself or one of your
  own former names, and only admins can act for someone else.
  `useActingPermissions()` mirrors the rule on the front end, so name
  pickers only offer names the API will accept. The choice is written up in
  `docs/acting-for-others.md`.
- **Direct database access.** Migration v2.22 removes the browser's direct
  table and storage access. Uploads for covers and badges go through the
  backend now.
- **Uploads.** `clean_image()` decodes the bytes instead of trusting the
  content type, caps images at 60 MP against decompression bombs, and
  re-encodes stills without EXIF/GPS after applying the EXIF rotation.
- **Round two:** an old `on_auth_user_created` trigger was still creating a
  profile for every login *before* the whitelist check (migration v2.23
  drops it). Other fixes in that round: logout ends impersonation, login
  uses PKCE, `python-jose` is replaced with PyJWT, the container runs as
  non-root with `.env` kept out by `.dockerignore`, and forwarded IPs are
  only trusted from the proxy.

All uploaded images also moved out of three Supabase Storage buckets into
one MinIO bucket with a folder per kind. Banners get a fresh key per
upload, which removes the cache-busting query string.

## Testing without OAuth

Locally, login needs the backend plus Discord OAuth, which is a lot of
setup just to look at a screen. For visual checks I loaded a mock in the
browser that swaps `apiClient.defaults.adapter` for canned responses and
puts a fake JWT in the auth store. Every screen can then be rendered
without a real session.
