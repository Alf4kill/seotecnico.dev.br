# Search Console baseline — 2026-09-11

> **Status: captured (partial).** Sections 2, 6 and 7 were **not captured**:
> they are separate Search Console screens, not part of the Performance and
> Coverage exports, and on 2026-09-13 the owner confirmed there are no further
> exports from this date. They stay open rather than filled in later with
> numbers from another day. Everything else is real data, exported by the owner
> from the domain property on 2026-09-11.
>
> Property: `seotecnico.dev.br` (domain property, DNS-verified — covers every
> subdomain and protocol).
> Source: GSC "Performance on Search" export (search type Web, last 3 months)
> and the Coverage export, both dated 2026-09-11.

## Why this snapshot matters

The [2026-07-20 baseline](../2026-07-20/search-console.md) was never captured —
its `_pending_` markers stand as the record that the "before" row was missed.
This is therefore the **first real GSC capture of the project**, taken 56 days
after the first article was published (2026-07-17) and 47 days after the last
deploy (2026-07-26).

That gap is itself the useful property of this snapshot: the site has been
frozen since 2026-07-26, so everything below is Google's response to a *static*
corpus. No publishing activity confounds it.

## 1. Coverage — Pages report

| Metric | Value |
|---|---|
| Indexed pages | **21** |
| Not indexed pages | **2** |
| Total known URLs | **23** |

| Not-indexed reason | Source | URLs | Expected? |
|---|---|---|---|
| Page with redirect | Site | 2 | **yes — by design** |
| Discovered, currently not indexed | Google systems | **0** | — |
| Crawled, currently not indexed | Google systems | **0** | — |
| Non-critical issues | — | **0** | — |

**21 indexed = every URL in the sitemap.** Google knows exactly 23 URLs and
nothing else: no parameters, no duplicates, no stale 404s, no accidentally
discovered orphans.

The two zeros are the most important numbers in this capture. "Discovered,
currently not indexed" and "Crawled, currently not indexed" are the queues where
a new domain without backlinks normally stalls, and both are empty with
validation passed. **This site has no indexing problem.** Its constraint is
ranking, not inclusion.

### The two "page with redirect" URLs are not a defect

`next.config.ts` declares no redirects and no content slug was ever renamed
(verified against git history on 2026-09-11). The only redirects on the domain
are infrastructural:

```
http://seotecnico.dev.br/       → 308 → https://seotecnico.dev.br/
http://www.seotecnico.dev.br/   → 308 → https://www.seotecnico.dev.br/
https://www.seotecnico.dev.br/  → 308 → https://seotecnico.dev.br/
```

A **domain property** covers http, https and every subdomain, so those variants
live inside the property and GSC reports them as "page with redirect". The
destination is indexed; the report is informational.

This is why the validation shows **Failed**: a validation was requested for
something intentional. The URLs still redirect — and must — so the validation
will fail every time it is run. The correct action is to leave the item alone.

> Fixed on 2026-09-11 while taking this capture: `https://www.` → apex was
> answering **307** (temporary) and now answers **308** (permanent). It does not
> change the report above, and was not expected to.

## 1b. Indexation timeline

| Date | Indexed | Not indexed |
|---|---|---|
| 2026-07-23 | 13 | 5 |
| 2026-07-24 | 19 | 3 |
| 2026-08-05 | 19 | 4 |
| **2026-08-10** | **21** | 2 |
| 2026-08-10 → 2026-09-03 | 21 | 2 (flat) |

Full indexation was reached on **2026-08-10** and has been stable for a month.
The last two pages (Tool 3 and the hreflang spoke, both published 2026-07-26)
took roughly two weeks to index — normal for a new domain.

## 2. Sitemap status

_Search Console → Indexing → Sitemaps. Not captured (see status)._

| Field | Value |
|---|---|
| `sitemap.xml` submitted on | _not captured_ |
| Last read | _not captured_ |
| Status | _not captured_ |
| Discovered URLs | _not captured_ |

## 3. Performance totals

Both windows are recorded because the export covers 3 months while the template
asks for 28 days. Compare like with like in future captures.

| Metric | Last 28 days (08-13 → 09-09) | Last 3 months (07-11 → 09-09) |
|---|---|---|
| Total clicks | 2 | **4** |
| Total impressions | 1168 | **1469** |
| Average CTR | 0.17 % | **0.27 %** |
| Average position | 62.2 | **57.0** |

### The totals are an artefact of segmentation

Read alone, those rows say the site is failing. Segmented, they say something
else:

| Segment | Impressions | Clicks | CTR | Position |
|---|---|---|---|---|
| **Total** | 1469 | 4 | 0.27 % | 57.0 |
| Brazil | 288 (20 %) | **4** | 1.39 % | 33.9 |
| Rest of world | 1181 (80 %) | 0 | 0 % | ~67 |
| Desktop | 1445 | 3 | 0.21 % | 57.8 |
| Mobile | 24 | 1 | **4.17 %** | **7.42** |

80 % of impressions are international, produce zero clicks, and sit around
position 67. They drag every average. Every click the site has ever had came
from Brazil.

**CTR is not a title/description problem.** Where position is good, CTR appears:
mobile at position 7.42 converts at 4.17 %, and `/blog/inp-nextjs` at position
5.2 converts at 20 %. The constraint is position, not snippet attractiveness —
so this capture is explicitly *not* a reason to rewrite titles.

## 4. Queries with impressions

Named queries account for 300 of 1469 impressions; the remaining **80 % sit
below GSC's anonymity threshold**, which is expected for a new site spread over
many unique long-tail queries.

| Query | Impressions | Clicks | Avg. position |
|---|---|---|---|
| next seo | 167 | 0 | 55.88 |
| seotecnico.dev.br | 32 | 0 | 33.22 |
| crawl nextjs site | 28 | 0 | 55.04 |
| seo com next js | 19 | 0 | 45.79 |
| seo next | 10 | 0 | 73.30 |
| next js seo | 6 | 0 | 80.33 |
| nextjs noindex | 3 | 0 | 59.00 |
| next-seo | 3 | 0 | 68.67 |
| nextjs canonical url | 3 | 0 | 69.33 |
| next-seo documentation | 3 | 0 | 75.00 |
| next js canonical url | 2 | 0 | 53.00 |
| next-seo app router | 2 | 0 | 70.00 |
| next js robots | 2 | 0 | 73.50 |
| next js seo skill | 2 | 0 | 77.00 |
| programmatic seo in next js | 2 | 0 | 81.00 |
| _14 further queries at 1 impression each_ | 14 | 0 | 51–86 |
| `keyword_test_022` | 2 | 0 | 56.00 |
| `keyword_test_038` | 1 | 0 | 51.00 |

**The query set is the diagnosis.** `next seo`, `next-seo`, `next-seo
documentation`, `next-seo npm` and `next-seo app router` are navigational
queries for the **`next-seo` npm package** — an unrelated library. Google is
matching this site lexically ("next" + "seo" + the domain name), not topically,
and placing it around page 7. The country profile confirms it: Vietnam 175,
India 145, United States 129, Philippines 120, Indonesia 96, Bangladesh 61.

Two observations flagged for follow-up, not resolved here:

- `seotecnico.dev.br` — an exact navigational query for the site's own domain —
  averages **position 33.22** over 32 impressions with zero clicks. For a
  brand/domain query that is anomalous and deserves a cross-filter in GSC
  (filter the query, then read the Pages tab).
- `keyword_test_022` and `keyword_test_038` are not human queries. Some
  automated tool is issuing them against Google with this site in the result
  set. Recorded, not explained.

The primary queries the published pages target, for reference:

| Page | `primaryQuery` |
|---|---|
| `/guia/seo-tecnico-nextjs` | seo técnico next.js |
| `/blog/melhorar-lcp-nextjs` | melhorar lcp next.js |
| `/blog/lcp-alto-next-js` | lcp alto next.js |
| `/blog/json-ld-nextjs` | json-ld next.js |

None of them appears in the named-query list yet. They are either inside the
anonymised 80 % or not yet being served.

## 5. Pages with impressions

All 21 indexed pages received impressions. Sorted by average position.

| Page | Impressions | Clicks | Avg. position |
|---|---|---|---|
| `/sobre` | 27 | 0 | **3.30** |
| `/blog/inp-nextjs` | 10 | **2** | **5.20** |
| `/blog/next-image-seo` | 6 | 0 | **6.67** |
| `/blog/ssr-ssg-isr-nextjs` | 22 | 0 | **10.09** |
| `/politica-de-privacidade` | 7 | 0 | 11.14 |
| `/` | 38 | 0 | 11.21 |
| `/blog` | 28 | 0 | 11.96 |
| `/blog/sitemap-dinamico-nextjs` | 37 | 0 | 12.08 |
| `/blog/lcp-alto-next-js` | 16 | 0 | 14.06 |
| `/blog/gtm-nextjs` | 18 | 0 | 19.17 |
| `/blog/json-ld-nextjs` | 14 | 0 | 19.21 |
| `/ferramentas/gerador-json-ld` | 9 | 0 | 22.89 |
| `/blog/melhorar-lcp-nextjs` | 36 | 0 | 24.00 |
| `/blog/redirects-canonicals-nextjs` | 41 | 0 | 30.76 |
| `/ferramentas` | 9 | 0 | 30.78 |
| `/blog/metadata-api-nextjs` | 40 | 0 | 34.85 |
| `/ferramentas/validador-meta-tags` | 3 | 0 | 54.33 |
| `/guia/seo-tecnico-nextjs` | 305 | **2** | 55.69 |
| `/ferramentas/checador-cwv` | 3 | 0 | 64.67 |
| `/blog/hreflang-nextjs` | 14 | 0 | 65.64 |
| `/en/guide/technical-seo-nextjs` | **876** | 0 | 67.88 |

**11 of 21 pages average position ≤ 20.** CLAUDE.md §3 targets positions 1–20
for objective **O2** in month 2–4; this capture is month 2. O2 is partially met,
ahead of its window.

Two pages carry almost all the noise:

- `/en/guide/technical-seo-nextjs` — 876 impressions (60 % of the site total),
  zero clicks, position 67.88. It is the page absorbing the `next-seo` query
  set. English technical-SEO content is a saturated space and this domain has no
  authority in it; the page is being matched lexically, not competitively.
- `/guia/seo-tecnico-nextjs` — the pillar, the most important page on the site,
  at position 55.69. It is the second most contaminated by English queries.

## 6. Enhancements / structured data

_Search Console → Enhancements. Not captured (see status)._

Breadcrumbs is the report that matters here: FAQ rich results stopped being
shown on 2026-05-07, so a missing FAQ report is expected, not a defect.

| Report | Valid | Invalid | Warnings |
|---|---|---|---|
| Breadcrumbs | _not captured_ | | |
| Articles (if present) | _not captured_ | | |

## 7. Links

_Search Console → Links. Not captured (see status). Baseline for
objective **O5** (the tool as a link magnet)._

| Metric | Value |
|---|---|
| External links total | _not captured_ |
| Top linking sites | _not captured_ |
| Top linked pages | _not captured_ |

Working assumption until captured: **zero external links.** The tools that §5.3
designed as link magnets have never been distributed, and their impression
counts (9, 3 and 3) are consistent with nobody knowing they exist.

## What this baseline establishes

| Objective | Status at 2026-09-11 |
|---|---|
| **O1** — indexed and appearing in Google | **met.** 21/21 indexed, stable since 2026-08-10, every page receiving impressions |
| **O2** — long-tail PT queries in positions 1–20 | **partially met, ahead of window.** 11 pages average ≤ 20 in month 2 of a 2–4 month target |
| **O5** — a tool attracting usage and backlinks | **not started.** Tools live, never distributed |

The bottleneck is no longer technical. Crawling, indexing, structured data and
on-page signals are all clean (see [`crawl.md`](crawl.md): 0 errors, 0
warnings). What the site lacks is authority, and authority is links.

## Capture checklist

- [x] Coverage totals recorded
- [ ] Sitemap status recorded
- [x] 28-day performance totals recorded (plus the 3-month window)
- [x] Query list recorded
- [x] Page list recorded
- [ ] Enhancements recorded
- [ ] Links recorded
- [x] Status line at the top set to `captured (partial)`
- [x] Row added to [`../../experiment-log.md`](../../experiment-log.md)
