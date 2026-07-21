# CLAUDE.md — Project Reference

> This file is the single source of truth for this project. Read it fully before
> writing or modifying any code. Every implementation decision should be checked
> against the objectives and conventions defined here.

---

## 1. What this project is

A **live, public technical SEO laboratory**: a Portuguese-first content site +
free web tools focused on **technical SEO for Next.js developers**, built to
rank organically on Google and to serve as a verifiable portfolio piece for
Technical SEO Specialist job applications.

The site itself is the experiment. The repository, the measurement plan, and
the documented before/after results are the portfolio artifact.

**Name / domain:** **SEO Técnico** — `seotecnico.dev.br`
**Niche:** Technical SEO for Next.js developers (Portuguese-first, with
selected pages in English under `/en` using hreflang).

**Branding rules:**
- Display brand: "SEO Técnico" (with accent, title case) — used in logo, OG
  images, and `WebSite` JSON-LD `name`. The bare `seotecnico` form is used
  only for handles/repo names.
- English-facing pages (`/en/*`) and the GitHub README lead with the author's
  personal name ("by Nalpi — technical SEO engineer" style), since the brand
  name is Portuguese. Author byline + `Person` schema on every article (E-E-A-T).
- Note on exact-match domain: it gives no ranking bonus, only a small CTR
  advantage — and it raises the quality bar. Thin content on an exact-match
  domain pattern-matches to spam. Never publish filler articles.

---

## 2. Why this project exists (the reason)

- Certifications (GA4, GTM) prove theory. This project proves **execution**:
  a real domain, real Google Search Console data, real analytics implementation.
- The owner is a web developer (PHP, Next.js, Python) transitioning into
  Technical SEO roles. The strongest possible narrative is:
  *"developer who implements his own SEO fixes and measures them with
  statistical rigor."*
- Existing personal tooling (`local-seo-toolkit`, `gsc-monitor`,
  `ai-search-monitor`, `nextjs-cwv-toolkit`, `experimento.py`) needs a live
  target to be dogfooded against. This site is that target.

---

## 3. Objectives (measurable)

| # | Objective | How it's measured | Target window |
|---|-----------|-------------------|---------------|
| O1 | Get the site indexed and appearing in Google | GSC: pages indexed, first impressions | Week 1–2 |
| O2 | Rank for long-tail Portuguese queries (positions 1–20) | GSC queries report; own GSC Monitor | Month 2–4 |
| O3 | Fully working GTM → GA4 pipeline with documented events | DebugView validation + measurement plan doc | Week 1 |
| O4 | Perfect technical SEO baseline (CWV green, valid structured data, clean crawl) | Lighthouse CI, Rich Results Test, Screaming Frog crawl | Week 1–2 |
| O5 | At least one free tool page attracting usage + backlinks | GA4 key events; Ahrefs/GSC links report | Month 1–3 |
| O6 | Documented before/after SEO experiment with confidence tiers | `experimento.py` methodology, published case study | Month 3+ |
| O7 | AEO/GEO: get cited by at least one AI search engine | `ai-search-monitor` tracking | Month 3+ |

If a proposed feature does not serve one of these objectives, do not build it.

---

## 4. Tech stack & infrastructure

- **Framework:** Next.js (App Router, latest stable), TypeScript.
- **Styling:** Tailwind CSS.
- **Content:** MDX files committed to the repo (`/content`). No CMS.
- **Hosting:** Vercel (Hobby plan). Deploys from `main` via Git.
- **Domain:** `seotecnico.dev.br` (registered at registro.br). DNS pointed to
  Vercel; GSC verified via DNS record at the domain-property level (covers
  all subdomains/protocols).
- **Analytics:** GA4 via GTM (web container). Consent Mode v2 + LGPD banner.
- **Testing:** Vitest (unit), Playwright (SEO regression), Lighthouse CI (performance budgets in GitHub Actions).
- **Repo:** Public on GitHub. README in English telling the full story.

Total recurring cost target: domain only (~R$40/year).

---

## 5. Site architecture

### 5.1 Route map

```
/                               → Home (positioning + latest content + tools)
/blog                           → Article index
/blog/[slug]                    → Articles (MDX)
/guia/seo-tecnico-nextjs        → PILLAR PAGE (the cornerstone)
/ferramentas                    → Tools index
/ferramentas/gerador-json-ld    → Tool 1: JSON-LD generator
/ferramentas/validador-meta-tags→ Tool 2: meta tag preview/validator
/ferramentas/checador-cwv       → Tool 3: CWV quick check (CrUX API)
/sobre                          → About / credentials / contact
/en/...                         → Selected English versions (hreflang pairs)
sitemap.xml                     → via app/sitemap.ts (dynamic)
robots.txt                      → via app/robots.ts
```

### 5.2 Topic cluster (pillar + spokes)

**Pillar:** *Guia completo de SEO técnico para Next.js* — long, canonical,
internally links to every spoke; every spoke links back to it.

**Spoke articles (initial batch, one long-tail query each):**

1. Metadata API do Next.js: guia prático (title, canonical, OG)
2. Como implementar JSON-LD no Next.js (App Router)
3. sitemap.ts e robots.ts: sitemaps dinâmicos no Next.js
4. SSR vs SSG vs ISR: o que o Googlebot enxerga
5. Core Web Vitals no Next.js: otimizando LCP
6. INP no Next.js: como diagnosticar e corrigir
7. next/image e SEO: boas práticas
8. Hreflang no Next.js: site bilíngue passo a passo
9. Redirects e canonicals no Next.js (next.config vs middleware)
10. Como rastrear SPA/Next.js no GTM (history change, virtual pageviews)

Rule: each spoke targets ONE primary query, answers it directly in the first
paragraph (AEO pattern), and includes at least one original statistic, code
sample, or measurement.

**Original-data content (link magnets, produced later):**
- Benchmark: Core Web Vitals de N e-commerces brasileiros (CrUX API batch)
- Estado do SEO técnico em sites Next.js brasileiros

### 5.3 Tools (conversion drivers + link magnets)

Each tool page = client component for the tool UI + server-rendered
explanatory content below it (the content is what ranks; the tool is what
gets linked and used).

| Tool | Source of logic | GA4 key event |
|------|-----------------|---------------|
| Gerador de JSON-LD | new (form → schema.org output) | `tool_generate_jsonld` |
| Validador de meta tags | port from Python toolkit | `tool_validate_meta` |
| Checador de CWV | CrUX API (free, key required — free quota) | `tool_check_cwv` |

Tools must work without login. No stored user data (LGPD simplicity).

---

## 6. SEO requirements (non-negotiable, apply to EVERY page)

- Unique `<title>` (≤60 chars) and meta description (≤155 chars) via Metadata API.
- Self-referencing canonical on every page.
- Exactly one `<h1>`; logical heading hierarchy.
- JSON-LD on every page type:
  - Articles → `Article` + `BreadcrumbList` (+ `FAQPage` when applicable)
  - Tools → `SoftwareApplication` + `BreadcrumbList`
  - Home → `WebSite` + `Person` (author entity)
- `hreflang` pairs for PT/EN pages (including `x-default`).
- OG image per page via `next/og` (dynamic generation).
- All pages statically generated (SSG/ISR) unless a tool requires otherwise.
- Internal links: every spoke ↔ pillar; every article links to ≥1 tool.
- Images: `next/image`, explicit dimensions, descriptive `alt` in page language.
- No orphan pages: everything reachable within 3 clicks from home.

**Performance budgets (enforced by Lighthouse CI):**
- Performance ≥ 95, LCP < 2.0s, CLS < 0.05, INP < 200ms (lab TBT proxy).
- Build fails if budgets regress.
- These are **lab** budgets, deliberately stricter than Google's **field**
  thresholds (LCP 2.5s / INP 200ms / CLS 0.1 at p75 of CrUX). Lab runs one
  emulated device on one emulated network; the field p75 includes the slow
  tail. The gap is headroom, not a disagreement with the published threshold —
  a page at 2.4s in lab has no margin left for real users. Never "relax" a lab
  budget to match a field threshold: the published articles teach 2.5s as the
  field number, and that stays correct.

---

## 7. Analytics & measurement plan

### 7.1 Stack

GTM web container → GA4. All tags fire through GTM; **no hardcoded gtag**.
Consent Mode v2: default denied; banner grants `analytics_storage`.
LGPD-compliant: banner in Portuguese, reject as easy as accept.

### 7.2 Event documentation (measurement plan)

Maintained in `/docs/measurement-plan.md`. Every event MUST be documented
there BEFORE being implemented. Schema per event:

```
| Event name | Description | Trigger (GTM) | Parameters | GA4 key event? |
```

**Initial events:**

| Event | Trigger | Parameters | Key event |
|-------|---------|------------|-----------|
| `page_view` | History change (SPA) | default | no |
| `tool_generate_jsonld` | dataLayer.push on generate | `schema_type` | yes |
| `tool_validate_meta` | dataLayer.push on validate | `issues_found` | yes |
| `tool_check_cwv` | dataLayer.push on check | `lcp_bucket` | yes |
| `article_read` | element visibility (end of article) | `article_slug` | no |
| `outbound_click` | link click (external) | `link_domain` | no |
| `scroll_depth` | 25/50/75/90% | `percent` | no |

All custom events pushed via a typed `dataLayer` helper in
`/lib/analytics.ts` — never raw `window.dataLayer.push` scattered in components.

### 7.3 External measurement (dogfooding own tools)

- `gsc-monitor`: weekly indexing + query snapshots.
- `nextjs-cwv-toolkit`: CrUX/PSI time series into SQLite.
- `experimento.py`: before/after deltas with confidence tiers for every
  deliberate SEO change. Changes are logged in `/docs/experiment-log.md`
  (date, change, hypothesis, result).
- `ai-search-monitor`: monthly AEO citation checks.

---

## 8. Testing requirements

- **Vitest:** unit tests for `/lib` utilities (analytics helper, schema builders, content parsing).
- **Playwright (SEO regression suite)** — for every route, assert:
  - exactly one `<h1>`
  - `<title>` and meta description present and within length limits
  - self-referencing canonical present
  - JSON-LD present and parses as valid JSON with expected `@type`
  - hreflang pairs consistent (PT ↔ EN both directions)
- **Lighthouse CI:** runs in GitHub Actions on every PR; fails on budget regression.

CI blocks merge on any failure. This is a headline feature of the project:
*"my CI blocks deploys that break SEO."*

---

## 9. Layout & responsiveness conventions

Use the standard container proportions (applied via Tailwind):

- `.container` → 80% width, max 1280px (`w-4/5 max-w-screen-xl mx-auto`)
- `.container-wide` → 80% width, max 1600px
- `.container-xl` → 90% width, max 1600px
- Mobile: 90% width below 768px, 95% below 350px

Keep the design clean, fast, and content-first. No heavy JS libraries for
presentation. Dark/light respect `prefers-color-scheme` if implemented at all.

**Diagram palette (inline SVGs in articles)** — CSS custom properties defined
in `globals.css`, shared by every cluster's diagrams and screenshot
annotations. Use these tokens (English names, per §10) instead of hardcoded
colors:

- `--color-accent: #F59E0B` — highlight phases / annotation boxes and arrows
- `--color-diagram-phase-a: #DBEAFE` — neutral phase fill (blue)
- `--color-diagram-phase-b: #D1FAE5` — neutral phase fill (green)
- `--color-diagram-axis: #9CA3AF` — axes, connector lines
- Text inside diagrams uses `--foreground`; diagrams are inline SVG in MDX
  (real `<text>` labels, crawlable/citable), each with a textual mirror
  (table or paragraph) next to it.

---

## 10. Content conventions

- Site content: Portuguese (pt-BR) primary; English versions for pillar +
  selected spokes under `/en` with hreflang.
- Code identifiers, commits, README, and `/docs`: **English**.
- MDX frontmatter schema (enforced):

```yaml
title:          # ≤60 chars, contains primary query
description:    # ≤155 chars
slug:
datePublished:
dateModified:
primaryQuery:   # the ONE query this page targets
lang: pt-BR | en
translationOf:  # slug of hreflang pair, optional
faq:            # optional array → renders FAQPage JSON-LD
```

- First paragraph must directly answer `primaryQuery` (AEO pattern).
- Every article: ≥1 code sample or original measurement, internal links to
  pillar + ≥1 tool, descriptive anchor text (never "clique aqui").

---

## 11. Build phases (roadmap)

**Phase 0 — Account/property setup (before any code):**
0. Register `seotecnico.dev.br`; claim matching GitHub repo name; create GTM
   container + GA4 property with the final URL; verify domain property in GSC
   via DNS record (do this even before the site exists — history starts now).

**Phase 1 — Foundation (get indexed fast):**
1. Scaffold Next.js + TypeScript + Tailwind + MDX pipeline.
2. Layout, home, `/sobre`, sitemap.ts, robots.ts, metadata defaults.
3. GTM container + Consent Mode v2 + GA4 property + banner.
4. Deploy to Vercel, connect domain, submit to GSC + Bing, request indexing.
5. Playwright SEO suite + Lighthouse CI wired into GitHub Actions.

**Phase 2 — Core content + first tool:**
6. Pillar page + first 4 spoke articles.
7. Tool 1 (JSON-LD generator) + its key event, validated in DebugView.
8. Baseline snapshot: GSC state, CrUX state, full Screaming Frog crawl saved
   to `/docs/baseline/`.

**Phase 3 — Expansion + measurement:**
9. Remaining spokes (2/week), Tools 2–3, English versions + hreflang.
10. Weekly monitoring via own toolkits; log everything in experiment-log.
11. First deliberate experiment (e.g., FAQ schema on half the articles →
    measure CTR delta with confidence tiers).

**Phase 4 — Authority + case study:**
12. Original-data benchmark article (link magnet).
13. Public case study in repo README + LinkedIn articles.
14. AEO citation tracking report.

Work strictly in phase order. Do not start Phase N+1 features while Phase N
acceptance criteria are unmet.

---

## 12. Definition of done (per page/feature)

A page or feature is DONE only when:
- [ ] Playwright SEO assertions pass for its route
- [ ] Lighthouse CI budgets pass
- [ ] JSON-LD validates in Rich Results Test (spot-check)
- [ ] Any new event is documented in measurement-plan.md AND visible in GA4 DebugView
- [ ] Content follows frontmatter schema and AEO first-paragraph rule
- [ ] Committed with a descriptive English commit message

---

## 13. Out of scope (do NOT build)

- User accounts, logins, databases with personal data
- Paid services of any kind beyond the domain
- CMS integrations
- Content outside the niche (general marketing SEO, news commentary)
- Anything that doesn't map to an objective in section 3

---

## 14. Repository, secrets & content protection (decisions)

**Repository visibility: PUBLIC — by design.** The public repo is the
portfolio artifact (§2). Public means read-only for the world: nobody can
commit without being added as a collaborator; external changes arrive only as
pull requests that the owner reviews and merges manually. If a collaborator
is ever added, enable branch protection on `main` (require PR review).

**Secrets hygiene (non-negotiable):**
- Secrets and API keys live ONLY in Vercel environment variables — never in
  code, never in the repo. `.gitignore` blocks `.env*`; `.env.example`
  documents variable NAMES only.
- Enable GitHub push protection / secret scanning on the repo.
- If a secret ever lands in a commit: rotate the key immediately; do not rely
  on history rewriting.
- No personal email in repo or site. Author contact uses a dedicated site
  email (to be created), set in `site.ts` → `author.email` (rendered only
  when non-empty).

**Licensing (split):**
- Code → MIT (`/LICENSE`).
- Content (`/content`, images, original data visualizations) → all rights
  reserved (`/content/LICENSE.md`). Explicitly NOT covered by MIT.
- Every article/guide page renders a copyright line; the site footer states
  the split.

**Content copy protection — win attribution, don't block copying:**
- NEVER add right-click blockers, copy-disabling JS, or text-as-images: they
  hurt accessibility and SEO and stop nobody.
- The defenses that work: self-referencing canonicals, `Article` JSON-LD with
  `datePublished`/`dateModified`, `Person` author schema, byline and internal
  links inside the content itself, and requesting indexing in GSC immediately
  on publish (first-indexed wins attribution).
- Original charts and OG images carry the domain/brand inside the image.
  Publish aggregated results, not raw datasets.
- Enforcement against scrapers/republishers: DMCA takedown to the copy's
  hosting provider + Google's DMCA form (removes the copy from search).
- Monitoring: Google Alert with a distinctive exact phrase per published
  article; periodic GSC checks for scraped copies.
