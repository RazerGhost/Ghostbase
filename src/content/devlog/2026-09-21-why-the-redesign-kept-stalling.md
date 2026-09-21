---
title: The redesign kept stalling, and it wasn't about taste
date: 2026-09-21
tags: [design, ui, meta]
excerpt: This site felt flat for months and every attempt to fix it died halfway. The problem wasn't the look — it was that the look wasn't written down anywhere except in 1,040 class attributes.
---

In July I wrote that I
[didn't want to invent a new visual language just for a link hub](/devlog/2026-07-10-second-post),
so this site borrowed RG Digital's near-black surfaces, spacing scale, radii
and motion timing wholesale. The only deliberate change was swapping the
accent from lime to cyan.

That was the right call for what the site was then and the wrong one for what
it became. RG Digital is client-facing and composed. This is a personal site
that keeps a running count of everything I listen to. Dressing one in the
other's clothes gave me a page that was perfectly tidy and read like nothing
in particular.

## "Flat" turned out to be measurable

Every time I sat down to fix it I got a few components in and lost the thread.
I assumed that was indecision. It wasn't.

The design didn't exist anywhere. It was spread across 55 components as
**1,040 separate class attributes**, and the same recipes were retyped over
and over:

| Recipe | Uses | Files |
|---|---|---|
| `rounded-lg border-border bg-surface` | 29 | 15 |
| `text-xl font-bold text-white` | 31 | 6 |
| `rounded-lg border border-border bg-transparent py-2` | 48 | 13 |
| `rounded-lg border-border` (any panel at all) | 111 | 32 |

So "make the cards quieter" wasn't a decision, it was a find-and-replace
across 32 files where every instance had drifted slightly from every other.
Of course it stalled. There was nothing to change — only hundreds of copies of
a thing to change one at a time.

The tokens were no better: **30 of the 82** declared were never referenced
through `var()` anywhere. A whole font-weight scale, a line-height scale, an
easing, a nav blur — all declared, none used. A vocabulary nobody spoke.

## Extracting the layer before touching the look

So the first commit of the redesign changed nothing visible. It pulled every
repeated recipe into `roles.css` as a named role — `.card`, `.h-page`,
`.label`, `.meta`, `.entry`, `.num` — and rewrote the markup to ask for roles
by name. One rule: reach for a role; if you need a raw utility twice, add a
role instead.

One thing bit immediately. Written plainly, `.card` beat every utility stacked
on it — `class="card p-4"` still rendered at `p-6`. Unlayered CSS wins over
layered CSS regardless of specificity, and Tailwind's utilities live in a
layer. Wrapping `roles.css` in `@layer components` fixed it: the role sets the
default, a utility can still override one value.

After that, changing the design meant editing one file.

## Three directions, drawn at full size

Not component sketches — three complete alternatives, every page of the site,
at real width, filled with the actual content. That last part matters more
than it sounds. A comp with four tidy list items and round numbers will
validate anything; the real devlog has a 76-character title in it, and the
listens page has a five-digit play count that has to sit in a sentence
without looking like a receipt.

- **Readout** — instrument panel taken seriously. Mono numerals, hairline
  grid, square corners.
- **Editorial** — a written site that happens to be full of data.
- **Ghost** — the handle becomes the design. Big floating mark, glow,
  translucent panels.

Editorial won, and the reason was the numbers. This site is mostly counts:
days watched, plays logged, listening streak, episode totals. Readout set them
as instruments and the whole page read like a status dashboard for a person.
Editorial sets the same numbers **as type** — a serif figure inside a
sentence rather than a digit in a read-out — and suddenly they read as a
portrait instead of telemetry.

The load-bearing difference from RG Digital ended up being a typeface. RG
Digital has no serif anywhere; here the display face is Instrument Serif, and
a page should be identifiable as this site from the first heading. Hairline
rules became the structure rather than whitespace. Same restraint, different
register.

## Deciding the lists one at a time

The list is the most repeated element on the site, so I stopped letting it
default. Each page got a shape chosen for what it holds:

- **Devlog** — a log stream: date, length, title, tags on one line.
- **Watchlist** — shelves, a row of posters per status.
- **Listens** — ranking as type, a serif numeral leading each row.
- **Gear** — prose. No list at all; every tool is a link inside a sentence.

Gear is the one I'd defend hardest. It was a table of 32 things nobody would
ever read. Now it's four paragraphs, and the page has a voice.

## What it actually cost

Every page came out as a single commit touching one or two files: about, one
file; watchlist, two; gear, two; projects, three. The only commit that touched
eight was the type system itself. That is the entire argument, visible in a
diffstat — the register changed in one place, and each page then asked for it
by name. Before `roles.css`, the same change meant editing the card treatment
in fifteen files at once and hoping they came out matching.

The totals barely moved either: **1,421 lines added against 1,339 removed**
across 22 files. The new design replaced the old one close to line for line
instead of piling on top of it, which is what it looks like when the thing
you're changing actually exists somewhere.

What took real time was everything that produced no screenshot — writing down
what the site was supposed to be, pulling the recipes into roles, and drawing
three directions far enough apart to choose between. The visible rebuild came
last and was the smallest part of it.

That's the part worth keeping. **A design you can't change in one place isn't
a design, it's an accumulation.** I'd assumed for months that I didn't know
what I wanted. I knew roughly what I wanted the whole time — I just had
nowhere to put it.
