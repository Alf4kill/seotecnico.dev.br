# Search Console baseline — 2026-07-20

> **Status: awaiting capture (owner-run).** GSC access needs credentials that
> never enter this repo (CLAUDE.md §14), so this file is filled by hand. Fill
> every `_pending_` below, then change this line to `Status: captured`.
>
> Property: `seotecnico.dev.br` (domain property, DNS-verified — covers every
> subdomain and protocol).

## Why this snapshot matters

The site published its first article on 2026-07-17 and its first tool on
2026-07-18. Everything indexed after this date is attributable to Phase 2/3
work; without the numbers below recorded on the day, the attribution is a
guess. This is the "before" row for objectives **O1** (indexed and appearing)
and **O2** (long-tail positions 1–20).

## 1. Coverage — Pages report

_Search Console → Indexing → Pages. Record the totals, then the reason
breakdown for anything not indexed._

| Metric | Value |
|---|---|
| Indexed pages | _pending_ |
| Not indexed pages | _pending_ |
| Total known URLs | _pending_ |

| Not-indexed reason | URLs | Expected? |
|---|---|---|
| _pending_ | | |

Expected at this date: 10 indexable URLs (see [`crawl.md`](crawl.md)). `/busca`
and the 404 template are `noindex` by design and should appear as excluded, not
as errors.

## 2. Sitemap status

_Search Console → Indexing → Sitemaps._

| Field | Value |
|---|---|
| `sitemap.xml` submitted on | _pending_ |
| Last read | _pending_ |
| Status | _pending_ |
| Discovered URLs | _pending_ |

## 3. Performance — last 28 days

_Search Console → Performance → Search results. Set the range to the last 28
days and record the totals for the whole property._

| Metric | Value |
|---|---|
| Total clicks | _pending_ |
| Total impressions | _pending_ |
| Average CTR | _pending_ |
| Average position | _pending_ |

## 4. Queries with impressions

_Performance → Queries tab, sorted by impressions. Record every query with ≥ 1
impression — at this stage the list is short and the individual queries are the
data point._

| Query | Impressions | Clicks | Avg. position | Target page |
|---|---|---|---|---|
| _pending_ | | | | |

The four primary queries the published pages target, for reference:

| Page | `primaryQuery` |
|---|---|
| `/guia/seo-tecnico-nextjs` | seo técnico next.js |
| `/blog/melhorar-lcp-nextjs` | melhorar lcp next.js |
| `/blog/lcp-alto-next-js` | lcp alto next.js |
| `/blog/json-ld-nextjs` | json-ld next.js |

## 5. Pages with impressions

_Performance → Pages tab._

| Page | Impressions | Clicks | Avg. position |
|---|---|---|---|
| _pending_ | | | |

## 6. Enhancements / structured data

_Search Console → Enhancements. Record which item types GSC has detected. Note
that Breadcrumbs is the report that matters most here: FAQ rich results stopped
being shown on 2026-05-07, so a missing FAQ report is expected, not a defect._

| Report | Valid | Invalid | Warnings |
|---|---|---|---|
| Breadcrumbs | _pending_ | | |
| Articles (if present) | _pending_ | | |

## 7. Links

_Search Console → Links. Baseline for objective O5 (the tool as a link magnet)._

| Metric | Value |
|---|---|
| External links total | _pending_ |
| Top linking sites | _pending_ |
| Top linked pages | _pending_ |

## Capture checklist

- [ ] Coverage totals recorded
- [ ] Sitemap status recorded
- [ ] 28-day performance totals recorded
- [ ] Query list recorded (or "no queries yet" stated explicitly)
- [ ] Enhancements recorded
- [ ] Links recorded
- [ ] Status line at the top flipped to `captured`
- [ ] Row added to [`../../experiment-log.md`](../../experiment-log.md) noting the baseline date

> "No data yet" is a valid and useful capture. Write it down explicitly rather
> than leaving the section empty — an empty section is indistinguishable from a
> section nobody filled.
