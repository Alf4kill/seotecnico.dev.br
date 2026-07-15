# SEO Metadata Hardening — SEO Técnico

> Record of the metadata/OG/feed fixes shipped in
> [PR #4](https://github.com/Alf4kill/seotecnico.dev.br/pull/4) and
> [PR #5](https://github.com/Alf4kill/seotecnico.dev.br/pull/5) (2026-07-14),
> triggered by an external review of the production site. Documents what was
> broken, why it was broken (two non-obvious Next.js Metadata API behaviors),
> what changed, and what the update is expected to do. Written before the
> first blog posts were published, so every future post inherits the fixed
> pipeline from day one.

---

## 1. Why this work happened

An external review (2026-07-14, fetched from production as rendered HTML)
reported seven findings. Each was verified against both the live HTML and the
source before anything was fixed:

| # | Finding | Verdict |
|---|---------|---------|
| 1 | No `og:image` / `twitter:image` anywhere, despite `twitter:card=summary_large_image` | **Real (HIGH)** — every social share rendered a blank card |
| 2 | `og:url` pointed to the homepage on every subpage | **Real** — static `openGraph.url` in the root layout was inherited by all routes |
| 3 | Guide page missing `og:url` / `og:locale` / `og:site_name` | **Real, and it also affected the blog post template** (same root cause) |
| 4 | "Could not confirm JSON-LD renders" | **Mostly false positive** — the reviewer's fetcher stripped `<script>` tags. JSON-LD was live on home/guide/about; the real gap was `/blog` and `/ferramentas` with zero structured data |
| 5 | Thin site (empty blog, tools "em breve") | Factually true, but matches the phased roadmap — not a defect |
| 6 | No RSS feed | **Real** — `/feed.xml` returned 404 |
| 7 | Sitemap/robots unverified | Both were fine; verification found one extra nit: `lastmod` was `new Date()` on every build |

Fixing items 1–3 **before** publishing content mattered most: the blog post
template carried the same metadata bug, so every post published earlier would
have shipped broken OG tags and needed re-crawling after the fix.

## 2. Root cause: how Next.js merges metadata

Two behaviors of the App Router Metadata API caused all of items 1–3. They
are not obvious from the docs and are worth remembering (and blogging about):

1. **`openGraph` (and `alternates`) are replaced, not deep-merged.** When a
   page defines its own `openGraph` object, the parent layout's object is
   discarded entirely. That is how the guide and post template lost
   `og:locale`/`og:site_name`, and why any value set once in the root layout
   (like `og:url` or a default image) silently disappears on pages that
   customize anything inside `openGraph`.
2. **File-convention OG images don't behave like config metadata.**
   Empirically (Next 16.2.6): `app/opengraph-image.tsx` does **not** cascade
   to nested routes, and a page's config `openGraph.images` **overrides** a
   sibling `opengraph-image.tsx` file in the same segment.

Consequence: per-page metadata cannot be assembled ad hoc. It must go through
one helper that always emits the complete set.

## 3. What changed

### PR #4 — `buildMetadata()` + Open Graph images

- **`src/lib/metadata.ts` — `buildMetadata()`**, now the only way pages build
  metadata. Guarantees on every route:
  - self-referencing canonical and a **matching `og:url`**;
  - `og:site_name`, `og:locale`, `og:type` always present
    (`article` + `published_time`/`modified_time` when article dates are passed);
  - RSS autodiscovery link (added in PR #5, see below);
  - build-time validation: rendered title ≤ 60 chars (template suffix
    included) and description ≤ 155 chars **throw and fail the build** —
    same policy as the frontmatter validation in `src/lib/content.ts`.
- **OG images via `next/og`** (`components/seo/OgCard.tsx` is the shared
  1200×630 Satori layout):
  - `app/opengraph-image.tsx` — static brand card, prerendered at build,
    default `og:image` for all routes (emitted by the helper, since file
    images don't cascade);
  - `app/blog/[slug]/opengraph-image.tsx` — per-post card (title + publish
    date from frontmatter). Routes with their own image file pass
    `fileOgImage: true` so the helper suppresses the brand default and the
    file convention (with its cache-busting hash) wins;
  - `twitter:image` mirrors `og:image` automatically — no duplicate routes.

### PR #5 — feed, breadcrumbs, sitemap dates

- **RSS feed** — `src/lib/feed.ts` (RSS 2.0 from post frontmatter,
  XML-escaped, unit-tested) served by `app/feed.xml/route.ts` as a static
  route: generated at build, zero runtime cost, new posts arrive via commit →
  redeploy. Autodiscovery `<link rel="alternate" type="application/rss+xml">`
  on every page through `buildMetadata()`.
- **`BreadcrumbList` JSON-LD** on `/blog`, `/ferramentas`, `/sobre` and
  `/politica-de-privacidade` (CLAUDE.md §6 requires JSON-LD on every page
  type; the first two had none at all).
- **Sitemap `lastmod` from content dates** (`app/sitemap.ts`): guide → its
  frontmatter `dateModified`, home → newest content date, `/blog` → newest
  post, posts → their own dates; pages with no derivable date omit `lastmod`.
  Previously every URL was stamped `new Date()` per build — a churning
  `lastmod` is a signal Google learns to distrust.

## 4. What this update is expected to do

- **Social distribution works.** Shares on LinkedIn/X/WhatsApp now render a
  branded card (per-post cards for articles) instead of a blank one — this
  was directly blocking the link-building strategy (objective O5).
- **Crawlers get consistent signals.** `og:url` matches the canonical on
  every route; article pages expose machine-readable publish/modification
  timestamps — which also supports first-indexed attribution against
  scrapers (CLAUDE.md §14).
- **Structured data coverage is complete** for the current page types,
  supporting rich results and the AEO/GEO citability goals (O7).
- **The feed opens distribution channels**: dev.to cross-post canonical
  workflow, RSS readers, newsletter aggregators, and LLM crawlers.
- **Honest `lastmod`** keeps the sitemap a trustworthy freshness signal once
  posts start shipping.
- **Regressions fail the build**: metadata invariants are unit-tested
  (32 tests) and title/description limits throw at build time — the CI
  "blocks deploys that break SEO" story now covers metadata, not just lint.

## 5. Verification performed (2026-07-14)

- Unit suite, ESLint, `tsc`, `next build` green on both PRs; all routes
  static/SSG; `/opengraph-image` and `/feed.xml` prerendered at build.
- Every route checked on the dev server: `og:url` === canonical;
  `site_name`/`locale` everywhere; article timestamps kept on the guide;
  `og:image`/`twitter:image` present with correct dimensions and alt.
- Per-post OG card and feed items validated with a temporary MDX post
  (removed before commit); both PNGs visually inspected; feed empty-state
  (no posts) renders a valid empty channel.
- CI + Vercel preview deploys passed on both PRs; merged to `main`.

Pending post-deploy spot-checks (production): share a URL in a card
validator (LinkedIn Post Inspector / opengraph.xyz), validate a page in the
Rich Results Test, and confirm `/feed.xml` + `sitemap.xml` on the live domain.

## 6. Still open (backlog from the review)

- `llms.txt` at the root (AEO/GEO positioning).
- Bing Webmaster Tools submission (feeds ChatGPT/Copilot answers).
- Per-chapter OG images for the guide (infrastructure now exists).
- Playwright SEO regression suite (CLAUDE.md §8) — would have caught items
  2–3 automatically; should assert `og:url` === canonical and `og:image`
  presence per route.
