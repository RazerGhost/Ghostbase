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
- **No dead vocabulary.** 30 of the 82 tokens declared before the role layer
  were never referenced through `var()` anywhere in the codebase — a whole
  weight scale, a line-height scale, an easing and a nav blur, all declared
  and none used. Orphaned aliases and imported
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
    #22d3ee on dark, **#0d6d87 on light**: the same hue deepened, because the
    dark-mode cyan is 1.8:1 on a near-white ground and unreadable as text.
  - `--accent-action` — **something just fired.** A track changed, presence
    flipped, a scrobble landed. Live-data moments only, via `.flash-in`.

**Cyan is settled.** Not because it was chosen well — it was picked as "lime,
but not lime", which is a derivation and not a decision — but because
everything since has converged on it:

- **The semantic palette forces a cool accent.** `--danger` and `--warn` are
  red and amber. Measured as RGB distance, an amber accent lands 15 units from
  `--warn` and an oxblood one 34 from `--danger` — indistinguishable in use, so
  a link would read as a warning. Cyan sits 302 and 288 away. That rules out
  the entire warm half of the wheel, which is where the most tempting
  alternatives were.
- **It is the mark's colour, in eight files.** `ghost-mark`, `ghost-mark-light`,
  `ghost-outline`, `logo-icon`, both wordmark lockups, `favicon.svg` and
  `apple-touch-icon.svg` all carry #22d3ee, as does `og.ts`. Changing the
  accent is a rebrand, not a token edit.
- **The runner-up was indigo**, the only other cool hue that stays clear of the
  semantic colours. It holds its hue across themes better (69% of its luminance
  against cyan's 53%) but is markedly weaker on the dark ground — 6.48:1
  against cyan's 10.82:1 — and would cost that rebrand to gain little.

The cost is real and worth naming: cyan is intrinsically light at full chroma,
so it loses nearly half its luminance going to the light theme. That is why the
light value is a much deeper teal than the dark one, and why it had to be
re-picked twice to clear AA on every surface. **A new colour is checked against
`--danger` and `--warn` as well as against the three surfaces.**

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
admin area, the panel the now-playing line opens.

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
- **OG images carry the same three faces.** satori has no stylesheet and reads
  ttf/otf/woff but not woff2, so `src/lib/server/fonts/` holds static copies cut
  from the exact `@fontsource` files the site serves — Instrument Serif's own
  `.woff`, and Archivo + JetBrains Mono instanced at wght 400. A face that
  fails to load there renders tofu silently; `og.test.ts` is what catches it.

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
| (side lists) | **ledger** — a name and a figure on one hairline, no numeral | `.ledger` |
| Gear | **written** — prose paragraphs where every tool is a link | `.hang` |
| Projects | follows the devlog | `.entry` |

## Plots — ink, with the accent spent on the peak

The listens page carries four small charts. They were filled, rounded blocks of
`--accent`, which breaks two rules at once: rules are the structure here rather
than filled blocks, and the accent belongs to links and to the thing that just
fired. A 7x24 field of it made the heatmaps the loudest element on a page whose
own numbers are set as quiet type.

- **Bars and cells are ink** (`--white` at a fixed alpha), never the accent.
  A bar is a graphical object you need in order to read the chart, so it is
  held to WCAG 1.4.11's 3:1 — 46% clears it in both themes; 22% measured
  1.83:1 on dark.
- **The accent marks the single maximum**, and only that. The chart then names
  its own peak instead of signalling "chart".
- **A heatmap's empty cell is `--border`**, and the ramp starts far enough
  above it (20%) that "no plays" and "the quietest day" are told apart. The
  middle steps of a five-level ramp cannot all clear 3:1 — that is inherent —
  so every cell carries a `title` and the ramp carries a Less/More legend.
- **A plot is as wide as its series**, via `--plot-cols`: twelve months across
  the full page draws 100px slabs, and 139 months in a fixed measure draws 3px
  slivers. Neither is a chart.
- No rounded corners, and a hairline baseline so a zero sits flat on the rule
  instead of drawing a stub.

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
**The RG Digital pointer lives on About, and nowhere else.** At most one per
page and never repeated — but no page is obliged to carry one, and after
trying it the home page carries none. It closed that page as a line under a
rule, which is a CTA band however quietly it is written; centred it was
obvious, and left-aligned it was still the last thing you read on a personal
site, pointing at the business. This site is not the funnel for that one.
Someone who wants the client work reaches About, and About has the link.

## Chrome

**The page is printed; only the dock follows you.** Nothing else is sticky —
no bar hovering over the page, no blurred backdrop. The earlier masthead was
`sticky top-0` with a backdrop blur, which is a screen convention: a panel
floating above the document. A paper register does not have one.

- **Running head.** Ghost mark, wordmark, and where you are, in the mono
  label register; the live line at the far right. Type on the ground — no
  fill, no border, no rule beneath it. It scrolls away with the page, and
  that is what earns it the room to say more than a status dot would.
- **Dock.** The only fixed element on the site. The ghost mark first, as
  home; six destinations; a rule; then search, the theme toggle, and "back to
  top" once you have scrolled — nothing else earns a cell. A right-edge rail
  above 900px, a bottom bar below it, always under the reader's thumb.
  Icon-only at rest, each name revealed on hover and on focus.

  **Nothing else floats.** A second fixed object in the opposite corner is
  the exact furniture this design removes, so the old back-to-top button was
  folded in rather than left beside the dock. The bar cannot hold it — nine
  cells already divide a 375px phone into 40px each — so it is rail-only.

  **The bar's cells are 40×44, not 44×44**, and that is a decision rather
  than an oversight. Nine cells at a fixed 44 overflow a 375px phone, so the
  choices were a narrower cell or a shorter dock. Keeping the dock's contents
  identical across breakpoints is worth more than 4px: 40×44 clears the WCAG
  AA target minimum comfortably and misses only the 44-square a platform
  would prefer. If that ever stops being the trade, the cheapest cut is the
  theme toggle, which puts the bar back to eight cells at a full 44.
- **Footer.** One line. Copyright and the outbound links on the left, the
  last deploy date on the right. It stays this short only because the dock
  carries the navigation.

The boundary between dock and footer, so it still holds when a seventh page
arrives: **where you navigate to is in the dock; where you leave the site for
is in the footer.** Search and the theme toggle sit in the dock because they
act on the page you are already standing on.

**One live dot.** Cyan, and only on something that is genuinely changing —
the now-playing line. A deploy date is a fact, not a signal, and does not get
one. Two dots would have made them look like the same kind of thing.

## The private side

`/admin/*` and `/spotify-import` are the same site, not a second one. They
were furnished before the redesign and kept RG Digital's tiles, circled
accent icons and `text-red-400` long after the public pages stopped.

- **The same chrome, pointed elsewhere.** One fixed element is the whole rule,
  so admin does not get a second bar: it gets the same running head with a
  breadcrumb trail, and the same dock with its cells aimed at the tools plus
  one cell back to the site. The old `← Admin` strip is what you end up
  building when the dock points at the wrong place.
- **Cards are allowed here** (§ Elevation) — this is the controls-and-chrome
  half of the site. Content still sits on the ground, separated by rules.
- **A list is the same list from both sides.** The admin devlog index is the
  public `.stream-row`, plus one column: a dot for whether the file on disk is
  ahead of the last commit. Two shapes for the same content would be two
  things to keep in agreement.
- **Every field has a `<label>`.** Placeholder-only inputs stop saying what
  they are the moment you type, and never said it to a screen reader.
- **The admin bar is denser than the public one**, and knowingly: ten cells at
  375px measure 35.9x44 against the public dock's 40x44. Admin has more
  destinations and no search cell to drop. It clears the AA 24x24 minimum, and
  the editors are a desktop tool by design. The first cut was the duplicate —
  a "back to the site" cell, when the wordmark beside it already links there.
- **Prose that has no date is content, not markup.** Standing pages live in
  `src/content/pages/*.md` on the devlog's renderer and are edited at
  `/admin/pages`. What stays in the route is anything that changes on its own:
  numbers, presence, links. Markdown is for the copy.
- **Say the state, do not assert it.** Content is baked into the image at
  build time, so saving is the first of three steps. `Disk → Commit → Push`
  reads the repo. Where it cannot — production is not a checkout — the pages
  say that, and a file's state is `unknown`, never `clean`.
- **The editor shows what the published page computes.** Reading time, the
  contents list, the social card and the embed registry all existed and were
  shown to everyone except the person writing. Where a number appears in both
  places it comes from one constant, so the two cannot drift.

## What pages MUST share

Token consumption from `tokens.css` (no inline colours, no raw hex in
components), the role classes in `roles.css`, the three-face register, the
three-level elevation model, the no-reveal stance, `.page` containers.

## What pages MAY differ on

Hero shape; whether the body is a stream, a shelf, a ranking or prose; how much
of the page the primary number takes. The data pages may be denser than the
reading pages.

## Light mode

Not a second theme file: every theme-varying token is one
`light-dark(light, dark)` declaration in `tokens.css`, and `color-scheme`
decides which half is used. The values used to be written three times — once
dark, then the light set repeated under `[data-theme='light']` and again under
the `prefers-color-scheme` query — which is the mechanism by which a second
theme rots, and it had already rotted:

- `--danger` and `--warn` were never given light values at all, so the
  dark-mode red and amber were being painted onto near-white at 3.06:1 and
  1.93:1. Both are text colours.
- `--accent` was chosen against `--bg` alone at 5.09:1 and measured 4.26:1 on
  `--surface-2`, which is where an accent link sits inside a code block or an
  active filter.
- `--accent-action` — the "something just fired" colour — was *lighter* than
  the resting accent on a light ground, so the site's only flash was quieter
  than an ordinary link.
- `--shadow-card-hover` was 35% black in both themes: right over a dark
  ground, a bruise over a light one.

Every ink token is now measured against all three surfaces in both themes.
The floor is AA (4.5:1) for text; the worst pair is 4.96 dark and 4.70 light.
**Check a new colour against `--surface-2`, not just `--bg`** — every failure
above came from checking one surface and assuming the rest.

The cost is a browser floor: `light-dark()` needs Chrome 123, Safari 17.5 or
Firefox 120, and below that the page loses its colours rather than degrading.

## Open

Nothing outstanding. The accent was the last entry here; see *Theme* for why
it is settled and *Light mode* for what the second theme costs.
