# Design — Ghostbase (razerghost.xyz)

The design charter for this site. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

RG Digital has its own locked system (`RG-Digital/Site/design.md`). **This file
is deliberately not a port of it.** Where the two disagree, that is on purpose;
see *Divergence* below. Established 2026-09-20, during the role-layer extraction.

## Status

The **structure** below (roles, elevation, numeral register, motion stance, what
not to inherit) is settled and enforced in `src/lib/styles/roles.css`. The
**surface** decisions still open — typeface, whether cyan stays the accent, how
far the instrument register goes — are listed under *Open* at the bottom and get
settled in the running site, not on an artboard.

## Genre

instrument panel (dev-tool register, dark-first)

A read-out of one person's actual data — what's playing, what's been watched,
what shipped this week. Not a portfolio, not a brochure. The numbers are the
content; the chrome gets out of their way.

## Divergence — what NOT to inherit from RG Digital

Ghostbase started as a recolour of pre-redesign RG Digital (cyan swapped for
lime) and inherited furniture that never had a job here. Removed, and not to
come back:

- **No agency furniture.** No CTA band, no services/FAQ card archetypes, no
  ambient glow-pulse band. One pointer to RG Digital per page, as a quiet link
  — never the same sentence twice on one page, and never a closing sales band.
  (The home page carried both: a hero pill and a `.cta-band` repeating its exact
  words. The band is gone; the pill stays.)
- **No borrowed motion.** RG Digital's scroll-reveal was ported here and left
  half the home page invisible on load. Gone (see *Motion*).
- **No dead vocabulary.** 36 of 83 tokens and 7 named classes were never
  referenced outside the file defining them. Orphaned aliases and imported
  component classes get deleted, not kept "for later". The exception is a
  member of a complete scale (a weight, an easing, a tracking step) — those
  stay so the scale is whole.

Where RG Digital went whitespace-first (no rules between items, generous,
composed), Ghostbase goes the other way on purpose: **dense, ruled, gridded,
instrumented.** Two rooms, same person. That contrast is the point — it is what
keeps this site from reading as a second copy of the client-facing one.

## Personality without a face

There are no photographs of me on this site and there will not be. The personal
signal comes from three places instead, and every design decision should be
asked against them:

1. **The numbers.** Days spent watching, plays logged, listen streak, episode
   counts, commit activity, live presence. This is the portrait. It should be
   the biggest thing on the page, not 12px grey text in a card.
2. **The ghost.** The mark is the only figure the site gets. It is allowed to be
   large, and allowed to show up in empty states and errors.
3. **The voice.** The devlog copy already sounds like a person. The chrome
   should too — empty states, 404s, and labels are written, not templated.

## Theme — project-locked

Canonical token source: `src/lib/styles/tokens.css` `:root`. Do not fork values,
do not hardcode colours in components.

- Paper: `--bg` #0a0a0a dark / #ffffff light
- Surfaces: three levels, see *Elevation*
- Ink: `--white` · `--gray` · `--dim`
- Accent, two tiers — this distinction is real here and must be honoured:
  - `--color-primary` #22d3ee — **at rest.** Links, focus rings, chrome,
    borders, anything on screen when nothing is happening.
  - `--color-action` #00e5ff — **something just fired.** A track changed,
    presence flipped, a scrobble landed. Live-data moments only. This site has
    live data; that is what earns the second tier.
- Rules: `--border`

## Elevation

Exactly three levels. The old system had one, which is the single biggest reason
the site read as flat.

| Level | Token | Used for |
|---|---|---|
| 0 | `--bg` | the page |
| 1 | `--surface` | cards, panels — the default block |
| 2 | `--surface-2` | something lifted *out of* a level-1 block: a hovered row, an active filter, a code block |

**A card never contains another card.** `.card .card` is flattened in CSS — it
drops its border and fill and keeps only its padding. Nesting the same surface
inside itself is what made the home page read as one grey field.

## Typography

- One family for now (`--font`), weight-based hierarchy 400–800.
- **Numeral/label register: `--font-mono` with `tabular-nums`.** Stat values,
  counters, dates, durations, play counts, episode counts. This register is ONE
  role — do not spread mono into body copy. It is the instrument-panel signal
  and it is what the `/watchlist` counter already does well.
- **Use the display end of the scale.** The type scale defined `--fs-hero`,
  `--fs-display` and `--fs-section` and used none of them; 78% of the site sat
  at 12–14px. Every page gets one thing that is genuinely large, and on the data
  pages that thing is a number.
- Roles, not sizes: `.h-page` / `.h-section` / `.h-card` / `.label` / `.meta` /
  `.num`. Reach for a role; only reach for a raw size utility when no role fits,
  and when that happens twice, add a role.

## Spacing & layout

4-pt scale (`--space-1`…`--space-16`). `.page` is the standard container; width
comes from a modifier (`.page--narrow` for prose, default for content, `--wide`
for the data pages). No page sets its own `mx-auto max-w-* px-* py-*`.

## Rules & dividers

Unlike RG Digital, **rules are allowed and wanted** — they are the instrument
register. Hairlines between rows, around panels, under section headers and as
grid lines all belong here. What is not allowed:

- Rules doing a job whitespace already did (a bordered card inside a bordered
  card with a rule between them).
- Rules at more than one weight. One `--border`, one hairline.

## Motion

- **Stance: instrument, not theatre.** Content is present on load. No
  scroll-reveal, anywhere. (`use:reveal` was removed; the action is gone.)
- One orchestrated entrance per page, on the hero only (`data-hero-reveal`).
- **Live events animate; chrome does not.** When a Lanyard/Spotify/GitHub value
  actually changes, that element gets a `--color-action` flash (`.flash-in`).
  This is the only ambient-ish motion on the site and it is always tied to a
  real event, never a loop.
- Animate transform/opacity/colour only. Instant focus rings.
- Everything above respects `prefers-reduced-motion`.

## Microinteractions

- One hover signal per interactive element (colour OR movement, not both).
- Silent success; surface failures.
- Empty states are written, not blank — they are one of the three places the
  voice shows up.

## CTA voice

There is no sales CTA on this site. Links are links: underlined text (`.link`)
or a bordered pill (`.btn`, with `.btn--accent` for the affirmative one in a
pair). The RG Digital pointer reads as a footnote, not a pitch — one per page,
never repeated on the same page.

## Chrome

- Nav: wordmark + ghost left, links right, command palette + theme toggle at the
  far right. Sticky, hairline bottom edge.
- Footer: copyright, feeds, socials.
- Icons: `@lucide/svelte` for general, `@icons-pack/svelte-simple-icons` for
  brands. Nothing else.

## What pages MUST share

Token consumption from `tokens.css` (no inline colours, no raw hex in
components), the role classes in `roles.css`, the mono numeral register, the
three-level elevation model, the no-reveal stance, `.page` containers.

## What pages MAY differ on

Hero shape; whether the body is a card grid, a table, or typographic rows; how
much of the page the primary number takes. The data pages (`/watchlist`,
`/listens`) are allowed to be denser than the reading pages (`/devlog`,
`/about`).

## Open — settle these in the browser, not on an artboard

- **Typeface.** Inter is currently loaded from the Google CDN. Candidates worth
  trying in the running site: keeping Inter, or a sturdier display face over a
  quieter body face the way RG Digital does. Self-hosting is wanted either way.
- **Accent.** Cyan was chosen as "lime, but not lime". Worth confirming it is
  actually the colour this site wants rather than just the not-RG-Digital one.
- **How far the instrument register goes** — whether the home page becomes a
  genuine dashboard read-out or stays a set of panels.
- **Light mode.** Currently a neutral inversion. The dark register is the real
  one; light needs a pass of its own.
