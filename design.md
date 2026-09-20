# Design — Ghostbase (razerghost.xyz)

The design charter for this site. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

RG Digital has its own locked system (`RG-Digital/Site/design.md`). **This file
is deliberately not a port of it.** Where the two disagree, that is on purpose;
see *Divergence* below.

Established 2026-09-20 during the role-layer extraction. Direction chosen the
same day, from three built alternatives — Readout, Editorial and Ghost — after
seeing all six pages in each.

## Genre

editorial (personal journal, dark-first)

A written site that happens to be full of data. The numbers are the content,
but they are **set as type, not as instruments**: a serif figure in a sentence,
not a digit in a read-out. Not a portfolio, not a dashboard, not a brochure.

## Divergence — what NOT to inherit from RG Digital

Ghostbase started as a recolour of pre-redesign RG Digital (cyan swapped for
lime) and inherited furniture that never had a job here. Removed, and not to
come back:

- **No agency furniture.** No CTA band, no services/FAQ card archetypes, no
  ambient glow behind the page. One pointer to RG Digital per page, as a quiet
  link — never the same sentence twice on one page, never a closing sales band.
- **No borrowed motion.** RG Digital's scroll-reveal was ported here and left
  half the home page invisible on load. Gone (see *Motion*).
- **No dead vocabulary.** 36 of 83 tokens and 7 named classes were once never
  referenced outside the file defining them. Orphaned aliases and imported
  component classes get deleted, not kept "for later". The exception is a
  member of a complete scale (a weight, an easing, a tracking step).

Both sites are now quiet and typographic, so the separation is carried by the
face and the rules rather than by density:

| | RG Digital | Ghostbase |
|---|---|---|
| Display | Archivo (grotesque) | **Instrument Serif** |
| Separators | whitespace only, no rules between items | **hairline rules are the structure** |
| Accent | lime | cyan |
| Register | client-facing, composed | personal, written |

The serif is the load-bearing difference. RG Digital has no serif anywhere; a
page here should be identifiable as Ghostbase from the first heading.

## Personality without a face

There are no photographs of me on this site and there will not be. The personal
signal comes from three places instead, and every design decision should be
asked against them:

1. **The numbers.** Days spent watching, plays logged, listen streak, episode
   counts, commit activity, live presence. This is the portrait — set in the
   display serif, in a sentence where possible.
2. **The ghost.** The mark is the only figure the site gets. It is allowed to
   show up in empty states and errors.
3. **The voice.** The devlog copy already sounds like a person. The chrome
   should too — empty states, 404s and labels are written, not templated. The
   Gear page is the furthest expression of this: prose, not a list.

## Theme — project-locked

Canonical token source: `src/lib/styles/tokens.css` `:root`. Do not fork values,
do not hardcode colours in components.

- Ground: `--bg` #0c0c0d dark / #faf9f6 light. Every neutral carries a slight
  warm tint — paper in the dark, never zero-chroma grey, never pure `#fff` ink.
- Surfaces: three levels, see *Elevation*.
- Ink: `--white` (primary) · `--gray` (body) · `--dim` (muted, AA-checked on all
  three surfaces in both themes).
- Accent, two tiers:
  - `--accent` — **at rest.** Links, focus rings, chrome, rules that matter.
    #22d3ee on dark, **#0e7490 on light**: the same hue deepened, because the
    dark-mode cyan is 1.8:1 on a near-white ground and unreadable as text.
  - `--accent-action` — **something just fired.** A track changed, presence
    flipped, a scrobble landed. Live-data moments only, via `.flash-in`.

The accent is named `--accent`, not `--color-primary`, so that `app.css` can map
it into Tailwind's theme with `var()`. Under the colliding name the mapping had
to be a literal hex, which silently pinned `text-primary` to the dark-mode cyan
in light mode.

## Elevation

Exactly three levels.

| Level | Token | Used for |
|---|---|---|
| 0 | `--bg` | the page — where most content actually sits |
| 1 | `--surface` | cards, panels, hovered rows |
| 2 | `--surface-2` | something lifted out of a level-1 block: a code block, an active filter |

**A card never contains another card.** `.card .card` is flattened in CSS. And
in this register content mostly does not sit in a card at all — it sits on the
ground, separated by rules. Cards are for controls and chrome: dialogs, the
admin area, the floating widget.

## Typography

Three faces, three roles, all self-hosted. No third-party font CDN.

| Token | Face | Role |
|---|---|---|
| `--font-display` | Instrument Serif 400 | page titles, section headings, entry titles, **stat values** |
| `--font` | Archivo | body copy and UI |
| `--font-mono` | JetBrains Mono | the label register only — uppercase markers, dates, hashes, tag lists |

- **Display type is never bolded.** The face carries the hierarchy; weight 400
  everywhere, tracked a hair negative.
- **The mono register is ONE role.** Labels, dates, hashes, read times. It never
  becomes body copy and it never becomes a stat value.
- **Numbers are serif.** `.num` is the display face with tabular figures. The
  earlier draft of this system set them in mono; Editorial reversed that.
- **Restraint at the display end.** Instrument Serif has far more presence per
  pixel than a grotesque. The scale tops out at 58px on the home page and 38px
  everywhere else, against 108px in the first draft. Nothing shouts.
- Roles, not sizes: `.h-hero` / `.h-page` / `.h-section` / `.h-card-lg` /
  `.h-card` / `.lead` / `.label` / `.mono` / `.meta` / `.num`.

## Icons

Icons are part of the register, not decoration — the first Editorial pass had
none and read cold. `@lucide/svelte` for general, `@icons-pack/svelte-simple-icons`
for brands. Nothing else.

Where they belong: leading every `.label`, on social links, on stat blocks, and
hanging in the left margin of a prose block (`.hang`). Sizes 12–16px, never
larger than the text they sit beside.

## Spacing & layout

4-pt scale. `.page` is the standard container — an 88px gutter on desktop,
24px below 900px, 1280px of content. Width is a modifier (`--narrow` for
reading, `--wide` for the data pages). No page sets its own container.

## Rules & dividers

Unlike RG Digital, **rules are the structure here.** Hairlines between list
items, under section headers, and between the columns of a split. What is not
allowed:

- Rules at more than one weight. One `--border` hairline, plus `.rule--ink`
  for the single heavy rule that opens a contents list.
- Rules doing a job a card already did — if it has a border, it does not also
  need internal dividers.

## Lists — settled per page

The list is the most repeated element on the site, so each page's shape is a
decision, not a default:

| Page | Shape | Role |
|---|---|---|
| Devlog | **log stream** — hash, date, length, title, tags on one line | `.stream-row` |
| Watchlist | **shelves** — a horizontal row of posters per status | `.shelf` |
| Listens | **ranking as type** — serif numeral, name, a written line, the count | `.rank` |
| Gear | **written** — prose paragraphs where every tool is a link | `.hang` |
| Projects | follows the devlog | `.entry` |

## Motion

- **Content is present on load.** No scroll-reveal, anywhere.
- One orchestrated entrance per page, on the hero only (`data-hero-reveal`).
- **Live events animate; chrome does not.** When a Lanyard/Spotify/GitHub value
  actually changes, that element flashes in `--accent-action` (`.flash-in`) —
  never on load, never on a loop.
- Animate transform/opacity/colour only. Instant focus rings.
- Everything respects `prefers-reduced-motion`.

## Microinteractions

- One hover signal per interactive element (colour OR movement, not both).
- Silent success; surface failures.
- Empty states are written, not blank.

## CTA voice

No sales CTA. Links are links: underlined text (`.ulink`, `.link`) or a
bordered pill (`.btn`, with `.btn--accent` for the affirmative one in a pair).
The RG Digital pointer reads as a footnote — one per page, never repeated.

## Chrome

- Nav: ghost mark + wordmark left, links right, command palette and theme
  toggle at the far right. Sticky, hairline bottom edge.
- Footer: copyright, feeds, socials.

## What pages MUST share

Token consumption from `tokens.css` (no inline colours, no raw hex in
components), the role classes in `roles.css`, the three-face register, the
three-level elevation model, the no-reveal stance, `.page` containers.

## What pages MAY differ on

Hero shape; whether the body is a stream, a shelf, a ranking or prose; how much
of the page the primary number takes. The data pages may be denser than the
reading pages.

## Open

- **OG images** still render in Inter (`src/lib/server/og.ts` reads .woff files
  from `src/lib/server/fonts/`). satori cannot use the woff2 that `@fontsource`
  ships, so moving them onto Instrument Serif + Archivo needs .ttf/.woff copies
  added to that directory. Until then the social previews are off-register.
- **The accent itself.** Cyan was originally chosen as "lime, but not lime". It
  now has a readable light-mode counterpart, but whether cyan is the colour this
  site wants — rather than the not-RG-Digital one — is still unsettled.
- **Light mode** is a neutral inversion of a register designed dark. It is
  legible and AA-clean, but it has not had a pass of its own.
