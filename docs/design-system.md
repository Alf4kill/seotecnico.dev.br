# Design system — "Swiss retro-futurism"

The visual system of seotecnico.dev.br since September 2026. It replaced the
Inter / blue / rounded / light-and-dark look. The public explanation of *why*
lives on the site at `/design` (the colophon page); this document is the
implementation reference: tokens, measurements, components, rules, and the
performance cost that was accepted.

The source design was delivered as an 8-board HTML bundle (graphic system,
blog index, article, category archive, two 390px boards, manifesto, manifesto
390). It stays outside the repository; everything needed to build from it is
recorded here.

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
| NO large light surfaces — the site has one theme, dark | `contrast.spec.ts` (light system preference changes nothing), `design-rules.test.ts` (no `data-theme`, no light media query) |
| NO rounded corners (only `rounded-full` for the circle shape) | `tailwind.config.js` replaces `borderRadius`; `design-rules.test.ts` fails on any `rounded-*` |
| NO decorative shadow or gradient (the hazard stripe is a stripe, not a gradient) | `tailwind.config.js` replaces `boxShadow`; `design-rules.test.ts` |
| NO colour outside the tokens (no hex, no `text-white`, no `gray-500`) | `design-rules.test.ts` (hex only in `design-tokens.ts`, `globals.css`, `icon.svg`) |
| NO emoji or illustrative icon | review; functional status icons in the tools are the only lucide icons left |
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

## 9. Change process

1. Colour change → edit `globals.css` and `design-tokens.ts` together; the
   tests say whether the pair still passes.
2. New component → tokens only; if a class is not in the Tailwind config it
   does not exist (and `design-rules.test.ts` says so for the forbidden ones).
3. New diagram → use the diagram tokens, never a hex fill for text;
   `design.spec.ts` measures every `<text>` against the shape behind it.
4. Any change that moves lab LCP/TBT → re-measure with the table in §8 and
   update it.
