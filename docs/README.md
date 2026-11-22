# docs/ — index

What each document is for, and the one list of owner actions still open.
Rule since 2026-11-15 (`CLAUDE.md` §7.3): nothing stays pending inside a
document after its PR merges. An owner action a PR cannot finish goes to the
list at the end of this file, and nowhere else.

## Living references (kept current)

| File | What it is |
|---|---|
| [`experiment-log.md`](experiment-log.md) | Every deliberate change, with date, prediction (or "No prediction") and result |
| [`gsc-reading-notes.md`](gsc-reading-notes.md) | How to read the Search Console exports, and the inconsistencies between them |
| [`measurement-plan.md`](measurement-plan.md) | Every analytics event, its trigger and its status. Source of truth for events |
| [`gtm-container-setup.md`](gtm-container-setup.md) | The GTM container spec, its verification and the owner runbook (§9.1) |
| [`design-system.md`](design-system.md) | Tokens, type, grid, components, art rules |
| [`ai-crawler-policy.md`](ai-crawler-policy.md) | Which AI crawlers `robots.txt` allows and why |
| [`detection-experiment.md`](detection-experiment.md) | Method of the crawler detection lab |
| [`lab-control-rounds.md`](lab-control-rounds.md) | Records of the positive-control rounds (H15–H17) |
| [`ai-workflow.md`](ai-workflow.md), [`content-pipeline.md`](content-pipeline.md), [`skills.md`](skills.md) | How the site is built: sources of the `/projeto` entries |
| [`baseline/`](baseline/README.md) | Dated captures (GSC, CrUX, Lighthouse, crawl) |

## Dated records (closed, not edited except for errors)

| File | What it records |
|---|---|
| [`a11y-test-report.md`](a11y-test-report.md) | Component tests and axe suite, 2026-10-23 |
| [`crawl-audit-2026-10.md`](crawl-audit-2026-10.md) | Crawl audit and its fixes, 2026-10-23 |
| [`seo-metadata-hardening.md`](seo-metadata-hardening.md) | Metadata/OG/feed fixes of PRs #4–#5, 2026-07-14 |
| [`testing-analytics-helper.md`](testing-analytics-helper.md) | Why the analytics helper is unit-tested, 2026-07-13 |
| [`research/`](research/) | One note per article or method question; each is the source of a published page |

## Proposals still in use

| File | Why it is not archived |
|---|---|
| [`proposals/case-studies-content.md`](proposals/case-studies-content.md) | Its §3–§4 are the collection and anonymity rules the `scripts/` of the case studies follow |
| [`proposals/portuguese-style.md`](proposals/portuguese-style.md), [`proposals/portuguese-style-history.md`](proposals/portuguese-style-history.md) | Plan and history of the Portuguese style layer; cited by published pages |

## Archive

[`archive/`](archive/) holds proposals and session reports whose work is
done, superseded or parked. Each file opens with a line saying which. Files
cited by published pages are never moved there, so their links keep working.

## Owner actions (the only open list)

Remove a line in the PR that does it.

**Analytics**
- GTM and GA4 for `tool_validate_meta` and `tool_check_cwv`, and the three
  tools as key events: runbook in
  [`gtm-container-setup.md`](gtm-container-setup.md) §9.1. Then confirm one
  hit in DebugView in production (`CLAUDE.md` §12).
- GA4 internal-traffic exclusion (Admin → Data Streams → Configure tag
  settings → Define internal traffic).
- Export the GTM container to `docs/gtm-container-export.json`
  ([`gtm-container-setup.md`](gtm-container-setup.md) §10).

**Exports still needed** (the rest of the closing pass of 2026-11-16 is in
[`experiment-log.md`](experiment-log.md))
- **GA4 crawler property → Explore → Free form**, event `ai_crawler_hit`,
  metric Event count, Export → CSV. A free-form table takes at most 6
  dimensions, so it is two exports. Filters may use a dimension that is not
  in the rows.
  - *H14 (row 2026-09-25):* 2026-09-25 → today, filter `accept_md` = `true`;
    rows Date, `page_path`, `ua_class`, `bot_verified`, `bot_name`, `net_id`.
  - *H14 denominator:* same period, no filter; rows `has_sec_fetch`,
    `ua_class`.

**Vercel storage** (Deployment Storage at 7.79 of 10 GB on 2026-11-22, which
blocks a second project on the Hobby account)
- Project → Settings → Deployment Retention Policy: shortest windows for
  Preview, Canceled and Errored; a short one for Production (the current
  production deployment is kept regardless). Then delete the old preview
  deployments in the Deployments tab. The repository side is already done:
  `vercel.json` skips every non-production build (CI builds on its own and
  never used the previews) and `next.config.ts` drops the server source maps
  (~15 MB of the ~100 MB each deployment held).

**Decisions**
- Demand for `index bloat`, the primary query of `/blog/index-bloat` (PR
  #159): Trends (Brazil, 12 months) against `páginas de tag`, `tags
  wordpress seo` and `páginas finas`, Autocomplete, Keyword Planner. Slug and
  `primaryQuery` stay (§5.2); a near-zero result can change the title and
  description, and the choice of the next queries.
- Redefine or drop the first deliberate experiment (`CLAUDE.md` §11 item 11
  still names the FAQ experiment; options in
  [`research/2026-09-13-page-creation.md`](research/2026-09-13-page-creation.md) §4).
- Content problems found in `lcp-alto-next-js` and `json-ld-nextjs`
  ([`research/2026-11-13-early-pages-style-review.md`](research/2026-11-13-early-pages-style-review.md) §4): fix PT + EN, with the claim review of
  `.claude/skills/content-page/references/claim-proof.md`. The
  `melhorar-lcp-nextjs` items were fixed in its claim review (experiment
  log, 2026-11-18).
- `author.email` in `src/lib/site.ts` (`CLAUDE.md` §14).
- GTM's ~+200 ms TBT (`CLAUDE.md` §6): plan a reduction or accept the cost.
- CLS in the RUM (`src/lib/rum.ts` promises it): add it or drop the promise.
- Accessibility items not covered by axe
  ([`a11y-test-report.md`](a11y-test-report.md), "Open items").
- Remaining case-study themes 02, 01, 06 and 03
  ([`proposals/case-studies-content.md`](proposals/case-studies-content.md) §7): schedule or drop.
