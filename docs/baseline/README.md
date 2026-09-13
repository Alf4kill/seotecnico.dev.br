# Baseline snapshots — SEO Técnico

> CLAUDE.md §11, Phase 2 item 8. A baseline is the *before* half of every
> experiment in [`../experiment-log.md`](../experiment-log.md). Without a dated,
> versioned snapshot of the site's state, a later "it improved" claim has
> nothing to be measured against — and this repo's whole premise (§2) is that
> the improvements are measured, not asserted.

Each capture lives in its own dated folder, so two snapshots can be diffed
directly:

```
docs/baseline/
  README.md              ← this file
  2026-07-20/
    crawl.md             ← page inventory, link graph, findings (generated)
    crawl.json           ← same data, machine-readable (generated)
    lighthouse.md        ← lab Core Web Vitals per URL (generated)
    search-console.md    ← GSC state at capture time (owner-run)
    crux.md              ← field/CrUX state at capture time (owner-run)
```

## What each file is

| File | Source | Automated? |
|---|---|---|
| `crawl.md` / `crawl.json` | `scripts/baseline-crawl.mjs` against production | yes |
| `lighthouse.md` | `scripts/baseline-lighthouse.mjs` against production | yes |
| `search-console.md` | Google Search Console (Performance + Pages reports) | no — owner |
| `crux.md` | CrUX API / PageSpeed Insights field data | no — owner |

The two owner-run files need credentials that, per CLAUDE.md §14, never enter
this repo. Their templates carry the exact steps and the exact numbers to
record, so the capture is mechanical.

## How to capture a new baseline

```bash
# 1. Crawl + on-page signals (~30s). Writes docs/baseline/<today>/crawl.{md,json}
npm run baseline:crawl

# 2. Lab Core Web Vitals for every sitemap URL (~6min, needs Chrome).
#    Writes docs/baseline/<today>/lighthouse.md
npm run baseline:lighthouse

# 3. Fill search-console.md and crux.md by hand — steps are inside each file.
```

A captured baseline is a historical record, so both scripts **refuse to
overwrite** a folder that already holds a capture. To re-check production after
shipping a fix — which is a verification, not a new baseline — send it
somewhere else:

```bash
node scripts/baseline-crawl.mjs --out /tmp/verify
```

Pass `--force` only when replacing a capture is genuinely the intent.

Both scripts accept `--base` (default `https://seotecnico.dev.br`) and `--out`
(default `docs/baseline/<today>`), so a local build can be snapshotted the same
way:

```bash
npm run build && npm start &
node scripts/baseline-crawl.mjs --base http://localhost:3000 --out /tmp/local
```

## Captures taken so far

| Date | Crawl | Lighthouse | Search Console | CrUX | Notes |
|---|---|---|---|---|---|
| [`2026-07-20`](2026-07-20/) | ✅ | ✅ | ❌ never filled | ❌ never filled | Phase 2 baseline. The two owner-run halves were left as `_pending_` templates and never captured, so the project had no "before" row for O1/O2. |
| [`2026-09-11`](2026-09-11/) | ✅ | ✅ | ⚠️ partial | ⚠️ partial | First real GSC capture, 56 days after the first article. Sitemaps, Enhancements and Links still missing; CrUX confirmed still absent from the dataset. Source for the 14 verdicts resolved in the experiment log on that date. |

## When to capture

- **Phase 2 baseline (2026-07-20):** the reference point for every Phase 3
  experiment — captured for the automated halves only.
- Before and after any deliberate SEO change big enough to earn an
  experiment-log row (schema changes, IA changes, performance work).
- Monthly, as the running time series that feeds `experimento.py`.

## Reading the crawl findings

`crawl.md` ends with a findings table produced by applying the CLAUDE.md §6
rules to the crawled HTML. Severities:

- **error** — breaks a §6 non-negotiable (missing canonical, not exactly one
  `<h1>`, unparseable JSON-LD, orphan page, sitemap URL blocked in robots.txt).
  The Playwright suite already blocks most of these at merge time; an error here
  means something slipped past the gate or broke in production only.
- **warn** — a real defect that does not break a hard rule (title over 60 chars,
  duplicate `robots` meta, `noindex` on a path that robots.txt also disallows).

A baseline that reports zero findings on a site this young usually means the
crawler is not looking hard enough. The 2026-07-20 capture found two; both are
recorded in the experiment log with their fixes.

The 2026-09-11 capture reported **zero** findings — and that caution turned out
to be the right one to apply to it. The same session found two real defects by
hand that this crawler does not look for, because both live outside the sitemap:

- the 404 template emits **two conflicting `robots` meta tags** (`noindex` from
  the route, then `index, follow` from the root layout). Google takes the most
  restrictive, and the page is a 404 anyway, so nothing is at risk — but it is a
  defect, and neither this crawler nor the Playwright suite covers the 404 route.
- `/en` and `/en/guide` return **404**. They are path segments with no page, so
  any external link to `/en` is a dead end.

Both are worth adding to the crawler's off-sitemap checks rather than relying on
someone repeating the manual pass.
