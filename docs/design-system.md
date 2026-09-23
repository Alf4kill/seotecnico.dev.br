# Design system — "Swiss retro-futurism"

The visual system of seotecnico.dev.br since September 2026. It replaced the
Inter / blue / rounded look. The public explanation of *why* lives on the site
at `/design` (the colophon page); this document is the implementation
reference: tokens, measurements, components, rules, and the performance cost
that was accepted.

The source design was delivered as an HTML bundle of boards. The first eight
(graphic system, blog index, article, category archive, two 390px boards,
manifesto, manifesto 390) shipped on 2026-09-21 as a dark-only system. Four
more (light-theme system, light index, light article, background study) and a
folder of 16 art SVGs added the light theme and the art layer (§3.1, §10).
Neither the bundle nor the SVGs are in the repository; everything needed to
build from them is recorded here.

## 1. Principles

| School | What it contributes | Where it shows up |
|---|---|---|
| International Typographic Style | 12-column grid, flush-left text, no justification, bounded measure (62–72 ch) | every layout, article body, footer |
| Swiss school | hierarchy by scale, never by decoration; thin rules between blocks | large section numbers, article index, dividers |
| Bauhaus | circle, square and triangle as the only "icons" | category markers, tool markers, favicon, OG card |
| De Stijl | right angles only; asymmetric balance; primaries used as state | no border-radius anywhere, top stripes, red = regression, blue = reference |

Atmosphere reference: instrument panels in a remote station — short
uppercase labels, identification codes, corner marks framing important
information. Only that functional vocabulary is borrowed; no graphic element
is copied from anywhere.

## 2. Rules (enforced)

| Rule | Enforced by |
|---|---|
| YES two themes, one system — dark is the base (and the no-JS theme), light is `[data-theme='light']` only | `design-tokens.test.ts` (both palettes, one light block), `contrast.spec.ts` (first-frame theme, toggle, every role in both themes), `design-rules.test.ts` (`data-theme` / `prefers-color-scheme` only in their owners, no `dark:` utilities) |
| NO rounded corners (only `rounded-full` for the circle shape) | `tailwind.config.js` replaces `borderRadius`; `design-rules.test.ts` fails on any `rounded-*` |
| NO decorative shadow or gradient (the hazard stripe is a stripe, not a gradient) | `tailwind.config.js` replaces `boxShadow`; `design-rules.test.ts` |
| NO colour outside the tokens (no hex, no `text-white`, no `gray-500`) | `design-rules.test.ts` (hex only in `design-tokens.ts`, `globals.css`, `icon.svg`) |
| NO emoji or illustrative icon | review; functional status icons in the tools are the only lucide icons left. The registered art (§10) is the one exception, and it is decoration |
| YES art is `aria-hidden`, inline SVG, token colours only; at most one scene and one central mark per page, never inside the article body | `design-rules.test.ts` (art files), `design.spec.ts` (every sitemap route) |
| YES body text above 4.5:1 | `design-tokens.test.ts` (palette pairs), `contrast.spec.ts` (rendered elements on 7 routes), `shiki-theme.test.ts` (code tokens), `design.spec.ts` (diagram labels) |
| YES a measured number only with its source and date next to it | review; the mock numbers of the source boards (`[N]`, `[+X%]`, "Fig. 01") were never shipped — counts are computed at build time from `/content` |

## 3. Colour tokens

Single source: `src/app/globals.css` (channel triplets consumed by Tailwind as
`rgb(var(--x) / <alpha-value>)`). Hex mirror for Satori, favicon and the
`/design` contrast table: `src/lib/design-tokens.ts`. `design-tokens.test.ts`
fails if the two diverge.

Contrast ratios (WCAG 2.x) against the three surfaces:

| Token | Hex | Role | on `background` #0E1116 | on `surface` #151A21 | on `surface-2` #1B222B |
|---|---|---|---|---|---|
| foreground | #E8ECF1 | headings, emphasis | 15.94 | 14.73 | 13.51 |
| body | #C6D0DB | long-form reading | 12.11 | 11.19 | 10.26 |
| muted | #97A3B2 | support text, summaries | 7.38 | 6.82 | 6.26 |
| label | #7A8798 | mono labels | 5.17 | 4.78 | **4.39 ✗** |
| label-code | #8593A4 | labels on code blocks | 6.04 | — | 5.12 |
| primary | #3ED8C8 | accent, links, solid buttons | 10.68 | 9.87 | 9.05 |
| accent | #E89B3C | secondary accent, "in measurement" | 8.27 | 7.64 | 7.01 |
| danger (text) | #E5625A | "regression", "NO" | 5.61 | 5.18 | 4.75 |
| danger-shape | #D0483C | De Stijl red, **shapes only** | 4.21 ✗ as text | | |
| reference | #2F5BD0 | De Stijl blue, **shapes only** | 3.18 | | |

Three deviations from the source boards, all measured:

1. The board used #7A8798 for labels on the code surface (4.39:1). Labels on
   code use `label-code` #8593A4 (5.12:1).
2. The board used #D0483C as text ("REGRESSÃO", "NÃO"). Red text uses
   #E5625A (5.61:1); #D0483C stays for triangles and blocks.
3. The board drew input borders with the 1px rule #262F3A (1.40:1). Form
   controls use `control` #606B7A (3.50:1 on background, 3.23:1 on surface —
   WCAG 1.4.11 asks 3:1). The 1px rules stay decorative.

Solid buttons carry `on-primary` (#0E1116) text: 10.68:1 on cyan, 8.27:1 on
amber. This inverts the old rule "primary-solid always carries white text".

Diagram tokens (inline SVGs in articles, consumed as colours, not channels):
`--color-accent` #E89B3C, `--color-diagram-phase-a` #1E3A5F,
`--color-diagram-phase-b` #14432F, `--color-diagram-axis` #7A8798,
`--foreground`, `--background`. Foreground on the phases measures 9.69 / 9.45.
Two more since the light theme: `--color-diagram-on-accent` (#0E1116 in both
themes — a label ON an amber box) and `--color-diagram-accent-text` (#E89B3C
dark / #8A4E0B light — a label IN amber). `--color-accent` is a literal
#E89B3C in both themes: it is a fill; amber as text is `--accent-rgb`.

### 3.1 Light theme — "warm paper, cold metal"

Not the dark theme inverted: the same system in another material. No pure
white anywhere. The bright accents become fills only; as text they turn into
ink. The code block stays a dark screen (see *dark island* below).

| Token | Dark | Light | Light on paper #F2EDE3 / card #EAE4D8 / metal #E4E6E8 |
|---|---|---|---|
| background | #0E1116 | #F2EDE3 paper | — |
| surface | #151A21 | #EAE4D8 card | — |
| surface-2 | #1B222B | #E4E6E8 metal | — |
| surface-alt | #12161C | #ECE6DA | — |
| surface-chrome (header, footer) | = background | #E4E6E8 metal | — |
| foreground | #E8ECF1 | #16181C | 15.23 / 14.04 / 14.20 |
| body | #C6D0DB | #3A3C42 | 9.45 / 8.71 / 8.81 |
| muted | #97A3B2 | #5A5C60 | 5.74 / 5.29 / 5.35 |
| label | #7A8798 | #67635A | 5.13 / 4.73 / 4.78 |
| primary (text AND button surface) | #3ED8C8 | #0A5F59 | 6.44 / 5.94 / 6.01 |
| on-primary | #0E1116 | #F2EDE3 | 6.44 on primary, 5.67 on accent |
| accent (text) | #E89B3C | #8A4E0B | 5.67 / 5.22 / 5.29 |
| danger (text and shape) | #E5625A / #D0483C | #B3322A | 5.28 / 4.87 / 4.93 |
| reference | #2F5BD0 | #23409B | 7.90 (shape) |
| control | #606B7A | #7A7E84 | 3.50 / 3.22 / 3.26 (≥3:1) |
| rule / rule-strong | #262F3A / #35404E | #DCD5C6 / #A8ADB4 | decorative |

Deviations from the light boards, all measured: the board's label #6E6A60
fails on card and metal (4.26 / 4.31) and was darkened to #67635A; the board
drew input borders with #A8ADB4 (1.94:1) — form controls use #7A7E84; the
board's table claims ink-on-cyan buttons but its components render the teal
ink #0A5F59 with paper text, which is what shipped (one token for text and
surface, like dark, so no `bg-primary` had to be audited).

**Mechanism.** `ThemeScript` (an inline `<script>` in `<head>`, ~500 bytes)
reads the saved choice (`localStorage['seotecnico:theme']`), falls back to
`prefers-color-scheme`, and writes `data-theme` on `<html>` before the first
paint; it also rewrites `<meta name="theme-color">` so the mobile bar follows
an explicit choice. There is no `@media (prefers-color-scheme)` copy of the
light block: without JavaScript the base dark theme applies. `ThemeToggle` is
a circle glyph (a primary shape, not an icon) whose filled half is decided in
CSS from the same attribute, so the first frame is right before hydration. On
mobile it lives inside the menu: a fourth 44px button does not fit the bar at
390px.

**Dark island.** `:root, .theme-dark-island, .rich-text
figure[data-rehype-pretty-code-figure]` declare the dark tokens. A declaration
on the element beats the value inherited from `<html>`, so a code block (and
the JSON-LD generator output) keeps cyan, controls and labels of the dark
theme on a light page. The Shiki theme is unchanged.

**Components that change.** Instrument corners become printer's registration
marks (`.instrument-corner` + `data-corner`, CSS only). Header and footer
paint `surface-chrome`. Nothing else is theme-specific: every utility reads
tokens.

## 4. Typography

| Family | Use | Loaded as |
|---|---|---|
| Space Grotesk (variable) | display: h1–h3, big numbers, brand | `--font-display` |
| IBM Plex Sans (variable) | body and UI text | `--font-sans` |
| IBM Plex Mono 400 / 600 | labels, meta lines, buttons, code | `--font-mono` |

All three via `next/font/google`, `subsets: ['latin']`, `display: 'optional'`,
**no preload** (see §8). Mono is static, so only two weights; 500 in the
boards resolves to 400.

Scale (fluid with `clamp()` so 390px and 1440px share one rule):

| Element | Size | Line height | Tracking |
|---|---|---|---|
| Manifesto hero | up to 176px | 0.84 | −4.5% |
| Listing h1 | clamp(2.5rem → 4.75rem) | 0.98 | −2.5% |
| Article h1 | clamp(2.25rem → 4.25rem) | 1.02 | −2.5% |
| Article h2 | clamp(1.5rem → 2.125rem) | 1.12 | −2% |
| Body (article) | 18px (17px mobile) | 1.75 | — |
| Label (`.eyebrow`) | 11px mono uppercase | 1.5 | +14% |

Article h2s get a two-digit index (01, 02…) from a CSS counter — no MDX file
had to change.

## 5. Grid and layout

- 12 columns, 24px gutter. Pages use `.container-xl` (90%, max 1600px):
  ≈72px margin at 1440px (boards: 80px) and ≈20px at 390px (boards: 20px) —
  the board proportions without breaking the container convention of
  CLAUDE.md §9.
- Article: 3 (index) / 7 (body, max 68ch) / 2 (margin) on `lg`; one column
  below, in the order index → body → margin.
- Listing rows: number (80px) / title + summary / axis + state (200px).

## 6. Components

| Component | File | Notes |
|---|---|---|
| Buttons (solid / outline / link) | `components/ui/Button.tsx` | mono uppercase, 44–48px targets |
| Category mark + chip, status label | `components/ui/CategoryMark.tsx` | shape per axis, `aria-hidden` (label always beside it) |
| Instrument frame (corner marks) | `components/ui/InstrumentFrame.tsx` | replaces the coloured left bar; used for TL;DR and article state |
| Instrument strip | same file | label/value pairs between two rules |
| Article layout | `components/article/ArticleLayout.tsx` | breadcrumb, meta strip, index, margin, author box, related; keeps `footer#article-end` (GTM trigger) |
| Code copy | `components/article/CodeCopy.tsx` | one client island per article, event delegation — blocks stay static HTML |
| Post row | `components/blog/PostRow.tsx` | `data-category` feeds the /blog filter |
| Tools strip | `components/sections/ToolsStrip.tsx` | "from the article to practice" band |
| Reading progress | `.reading-progress` in `globals.css` | CSS scroll-driven animation, zero JS, hidden without support or with reduced motion |
| Category filter | `.category-filter` in `globals.css` | radio inputs + `:has()`, works without JavaScript, creates no URL |
| Skip link | `.skip-link` in `globals.css` | first focusable element on every page |
| Code theme | `lib/shiki-theme.ts` | built from the palette; worst token 5.12:1 |
| Theme script / toggle | `components/layout/ThemeScript.tsx`, `ThemeToggle.tsx` | see §3.1 |
| Scenes, emblems | `components/art/Art.tsx` (+ `generated.tsx`) | see §10 |
| Background marks | `components/art/Marks.tsx` | see §10 |

## 7. Categories (taxonomy without URLs)

`src/lib/categories.ts`. Frontmatter `category` is required on blog posts;
`status` is optional (`em-medicao`, `fechado`, `regressao`, `referencia`) and
only set when true.

| Slug | Label | Shape | Posts (2026-09) |
|---|---|---|---|
| `cwv` | Core Web Vitals | amber square | 4 |
| `indexacao` | Rastreio e indexação | blue square | 4 |
| `dados-estruturados` | Metadados e dados estruturados | red triangle | 2 |
| `medicao` | Medição | cyan circle | 2 |

No category archive pages: with 12 posts over 4 axes each archive would be a
list of two to four links — thin pages on an exact-match domain (CLAUDE.md §1).
Revisit when an axis has enough posts to be a page in its own right.

## 8. Performance cost (measured, accepted)

Local LHCI, devtools throttling, same machine, median of 3–5 runs, LCP in ms:

| Build | `/` | `/blog` | article | guide | Font bytes |
|---|---|---|---|---|---|
| Before (Inter) | 961 | 981 | 1055 | 1026 | 48.7 KB |
| Fonts only, old markup | 909 | 938 | 1061 | 1091 | 63–74 KB |
| Same, Space Grotesk preloaded | 1051 | 1037 | 1345 | 1242 | — |
| Full redesign | 1162 | 1146 | 1177 | 1106 | 83.9 KB |
| Full redesign, fonts disabled | 976 | 968 | — | — | 0 |

- Preload rejected: it moves the woff2 into the critical path (+140–290 ms).
- With the full redesign the three families add ~190 ms of Style & Layout
  before first paint on this machine. It is not the download (the document
  ends at 760 ms either way) nor the block period (`swap` measures the same
  and adds CLS 0.053 on articles) nor the metric-adjusted fallbacks
  (`adjustFontFallback: false` measures the same). Accepted: lab LCP stays
  near 1.2 s against the 2.0 s budget with Performance 100 on `/` and `/blog`.
  Next cut if the budget tightens: IBM Plex Mono.
- Article TBT: `display: grid` on code lines (a rehype-pretty-code habit) cost
  ~150 ms of layout on long articles and was removed; the remaining overhead
  over the old layout is ~50–70 ms locally.
- Inline CSS (`experimental.inlineCss`): 37.3 KB raw / 8.4 KB gzip per page,
  up from ~22 KB / ~5 KB. Font-face rules are 6.3 KB of it.

### 8.1 Light theme + art (2026-09-23)

Local LHCI, devtools throttling, same machine, 9 runs, medians, branch vs
`main` built the same way:

| Route | Main-thread total | Style & Layout | FCP | TBT |
|---|---|---|---|---|
| `/blog` (main → branch) | 1770 → 1723 ms | 589 → 577 ms | — | 163 → 428 ms |
| newest article (main → branch) | 2080 → 2096 ms | 893 → 944 ms | ~1080 → ~750 ms | 430 → 737 ms |

The work did not grow; the page paints earlier. On `main` the first
parse/style long task (≈660 → 1060 ms) ends *before* FCP, and TBT only counts
tasks after FCP. With the branch FCP arrives first and the same task lands
after it. Bisecting by commit, FCP moves in steps (tokens ~975 ms, theme
script ~760–860 ms) and removing the head script or the `color-scheme` meta
does not bring it back — it is how Chrome splits the parse, not one feature.

Caveat recorded with the numbers: on this machine that day `main` itself
failed the article budget (TBT 430 > 200, Performance 88–90), so the local run
is not the gate; the CI runner is. If CI fails the budget, the lever is the
size of that parse/style task on long articles (DOM of the code blocks), not
the theme.

## 9. Change process

1. Colour change → edit `globals.css` and `design-tokens.ts` together; the
   tests say whether the pair still passes.
2. New component → tokens only; if a class is not in the Tailwind config it
   does not exist (and `design-rules.test.ts` says so for the forbidden ones).
3. New diagram → use the diagram tokens, never a hex fill for text;
   `design.spec.ts` measures every `<text>` against the shape behind it.
4. Any change that moves lab LCP/TBT → re-measure with the table in §8 and
   update it.
5. Colour change → measure it in BOTH themes; `design-tokens.test.ts` tests
   the dark and light palettes separately.
6. New art → `node scripts/art-import.mjs <folder>`; a colour without a token
   fails the import. Give it a `--art-*` token (dark and light) first, then
   register the work in `lib/art.ts`.

## 10. Art

Three families, all inline SVG (`aria-hidden`, no request, no raster, no
gradient — an inline SVG is not an LCP candidate). Every colour is a token
class, so the same drawing changes material with the theme.

**Scenes** (360×280, `components/art/generated.tsx`). Twelve works in four
trios, one trio per blog axis. `lib/art.ts` maps them: an article inherits its
axis's scene (a stable hash of the slug picks one of the three), and
`SCENE_BY_SLUG` pins a scene only where the drawing tells the subject. A new
article never requires editing that file.

| Axis | Trio | Pinned |
|---|---|---|
| `cwv` | light column, piercing beam, broken vault | LCP articles → column / beam, INP → vault |
| `indexacao` | arrival at the void, twin moons, vertical void | hreflang → twin moons, sitemap → arrival, SSR/SSG → vertical void |
| `dados-estruturados` | the only one, window, contemplation | metadata → the only one, JSON-LD → window |
| `medicao` | guardian eye, vigil, field of tombstones | AI crawlers → guardian eye, GTM → vigil |

Fixed pages: `/sobre` and `/en/about` → contemplation; 404 → field of
tombstones. The scene sits in the article header's right column from `lg`
up and is not rendered in the flow below it.

**Emblems** (96×96): dynamo → JSON-LD generator, circuit → meta tag
validator, staircase → CWV checker, closed loop → tools index. They appear in
each tool's header, on the tools index cards and in the tools strip.

**Background marks** (from the background-study board). Family A, central:
A1 beam (home, `/en`), A2 axonometric volume (tools index), A3 Bauhaus arcs
(pillar guide). Family B, corner: B1 bleeding arc (`/blog`), plus B2 dot grid,
B3 gutter ruler, B4 ghost numeral, B5 registration mark, B6 cut stripe
available in `Marks.tsx`. Opacity is a token per theme — tinted ink on paper
weighs more than light ink on graphite:

| Token | Dark | Light |
|---|---|---|
| `--mark-central-opacity` | 0.07 | 0.08 |
| `--mark-corner-opacity` | 0.20 | 0.24 |

**Art ramp** (`--art-*-rgb`; shape only, never text). The scene's void and ink
are `--background` and `--foreground`.

| Token | Dark (as drawn) | Light |
|---|---|---|
| line | #7A7F86 | #8C8A84 |
| mass | #3A444C | #B9BEC4 |
| earth | #5B3A22 | #C9A27E |
| olive | #4A4128 | #B8AD86 |
| deep | #1C3B39 | #9FC3BD |
| leaf | #3F9B7A | #2E7A5F |
| brass | #B8893C | #A8691A |
| signal | #C4553B | #B3322A |

Rules: one scene and one central mark per page at most (`/design` is the
catalogue and the only exception); a central mark only behind the header of a
ceremonial page, never behind running text; a corner mark is always cut by
the edge of its block.

**OG cards** (`components/seo/OgCard.tsx`) repeat the header of the page they
stand for, so a shared link and the page it opens read as the same thing: an
article card carries that article's scene (same `sceneForPost` pick) and its
axis shape; the brand cards (`/`, `/en`) carry the A1 beam mark behind the
title; the colophon cards carry the `/design` poster. The art is the same SVG
the site renders: `lib/og-art.ts` swaps each token class for the dark hex
(`artColors` in `design-tokens.ts`, tested against `globals.css`) and throws on
a class with no token. Cards are always dark. The mark sits at 0.14 opacity on
the card, double the page token: a preview is seen at ~500px, where 0.07
vanishes.
