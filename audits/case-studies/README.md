# Outside-in audit toolkit

Five scripts that measure a website from the outside: no Search Console, no
analytics, no access of any kind — only what the server hands to anyone who
asks. They were written for the case studies behind five published articles,
and they take any domain.

Everything here is `.mjs` on Node's standard library (`node:https`, `node:fs`,
`node:zlib`, `node:crypto`). No npm dependency, except `raw-vs-rendered`, which
imports `playwright` to drive Chromium — it arrives with `@playwright/test`,
the suite's dev dependency, and the import is lazy, so the other four run in a
checkout with nothing installed.

## The five scripts

| Script | Command | What it measures |
|---|---|---|
| [`sitemap-audit.mjs`](../../scripts/sitemap-audit.mjs) | `npm run audit:sitemap` | What the sitemap promises against what each `<loc>` actually answers: status, canonical, noindex, `lastmod` that moves in bulk, files not declared in robots.txt, pages linked but missing from the sitemap |
| [`soft404-probe.mjs`](../../scripts/soft404-probe.mjs) | `npm run audit:soft404` | Asks for a URL that cannot exist, with `Accept: text/html` and with `*/*`, and records the redirect chain, final status, `<title>`, meta robots, canonical, and whether the body is just the home page (an SPA shell) |
| [`template-anatomy.mjs`](../../scripts/template-anatomy.mjs) | `npm run audit:template` | On raw HTML only: title × H1 × alt × description identity across a generated set, the weight of a repeated block in bytes and in text, literal similarity (Jaccard over word 5-grams) and vocabulary similarity with the nearest neighbour, sentences repeated across pages |
| [`raw-vs-rendered.mjs`](../../scripts/raw-vs-rendered.mjs) | `npm run audit:raw-rendered` | The served HTML against the DOM after JavaScript runs, extracted by the *same* function on both sides: title, description, canonical, robots, lang, H1, structured-data types, link count |
| [`index-inventory.mjs`](../../scripts/index-inventory.mjs) | `npm run audit:index-inventory` | What a site offers for indexing, type by type, and how much of each page's text is its own rather than boilerplate; plus taxonomy files, field data and sibling hosts |

Each takes `--targets <file.json>`, and most separate collection from analysis,
so a run can be re-analysed without asking the site for anything again:

```bash
npm run audit:index-inventory -- fetch   --targets audits/case-studies/index-inventory.local.json
npm run audit:index-inventory -- crux    --targets audits/case-studies/index-inventory.local.json
npm run audit:index-inventory -- probe   --targets audits/case-studies/index-inventory.local.json
npm run audit:index-inventory -- analyze --targets audits/case-studies/index-inventory.local.json
```

`template-anatomy` has `fetch` and `analyze`; `sitemap-audit` and
`raw-vs-rendered` collect in one pass and re-aggregate with `--summarize --out
<folder>`; `soft404-probe` is a single pass. `--out <folder>` chooses where a
run lands, and every script but `soft404-probe` takes `--only <code>` to work
on a single target.

## Pointing it at your own targets

Every script reads a JSON array of targets. The committed `*.example.json`
files show each shape with `example.com`; the real ones are
`*.local.json`, which [`.gitignore`](../../.gitignore) keeps out of the
repository along with all raw HTML. Copy an example, replace the targets, and
set three environment variables so a run does not claim this site:

```bash
AUDIT_UA_TOKEN=your-tool-name \
AUDIT_UA_CONTACT=https://your-site.example/bot \
AUDIT_OUT_DIR=audits/your-folder \
npm run audit:sitemap -- --targets your-targets.local.json
```

| Variable | Default | What it changes |
|---|---|---|
| `AUDIT_UA_TOKEN` | `seotecnico-<script>` | The token in the User-Agent, which is also the name a `robots.txt` group has to address to give the crawl its own rules |
| `AUDIT_UA_CONTACT` | `https://seotecnico.dev.br` | The contact URL in the `(+…)` part of the User-Agent |
| `AUDIT_OUT_DIR` | `audits/case-studies` | The folder runs are written under |
| `AUDIT_CWV_ENDPOINT` | this site's `/api/checador-cwv` | Only `index-inventory`, `crux` phase — see the limit below |

The defaults are unchanged from the runs already recorded here, so those stay
reproducible.

**One tie to this site is left, and it is in the `crux` phase of
`index-inventory`.** Field data is read through this site's own public endpoint,
which returns CrUX already parsed into `{inDataset, period, metrics[]}` — the
shape the `analyze` phase expects. The CrUX API answers in a different shape,
so `AUDIT_CWV_ENDPOINT` has to point at an endpoint that answers in the same
one. The endpoint needs no API key. Every other phase of every script talks
only to the target.

## How the crawl behaves

Not negotiable, and the reason these scripts are not in CI:

- `robots.txt` is read first, for every origin, and a blocked path is never
  requested. A `robots.txt` that is not `text/plain` carries no rules, so it
  blocks nothing.
- One request at a time, with a pause between them: 1 s, and 1.5 s in
  `raw-vs-rendered`, which also waits 5 s after `load` before reading the DOM.
- `node:https`, not `fetch`. Node's `fetch` (undici) adds
  `sec-fetch-mode: cors` to every request, which is the defect measured in
  PR #95: the headers here are exactly the ones declared in each script and
  nothing else.
- No search engine is ever queried. The only hosts touched are the origins in
  the targets file.

## What gets written, and what may be published

Each run writes two kinds of file:

- `raw.json` / `raw-<code>.json`, `html/`, `detail-*.json` — everything,
  including hosts and paths. **Gitignored, stays local.**
- `summary.json` — committable. Third-party targets appear only as a code
  (`S1`…`S5`) and a generic label. Counts are rounded, and each file carries
  the rule it used in a `rounding` field.

The rounding is code, not discipline: see `makeRound()` in
[`index-inventory.mjs`](../../scripts/index-inventory.mjs), which turns totals
into tens (hundreds from a thousand up), small counts into bands (`1-4`,
`5-9`), and CrUX p75 values into 500 ms steps (50 ms for INP, 0.05 for CLS). A
target marked `"public": true` — this site, as its own control — is exempt and
keeps exact values and its paths.

The publication rules are in
[`docs/proposals/case-studies-content.md`](../../docs/proposals/case-studies-content.md)
§3–§4. Never published: domains, sibling domains and subdomains, platform or
agency names, URL paths taken from a site, verbatim template sentences,
screenshots of a site or of its results, and any combination that points at one
company (sector + stack + exact scale + topic). Always published: the
collection date, that it was collected from outside with no Search Console
access, and the evidence level of each finding.

## The runs recorded here

| Folder | Date | Became |
|---|---|---|
| `soft404-2026-11-09` | 2026-11-09 | [Soft 404](https://seotecnico.dev.br/en/blog/soft-404) |
| `template-anatomy-2026-11-10` | 2026-11-10 | [One page per keyword](https://seotecnico.dev.br/en/blog/one-page-per-keyword) |
| `sitemap-audit-2026-11-11` | 2026-11-11 | [Sitemap audit](https://seotecnico.dev.br/en/blog/sitemap-audit) |
| `raw-vs-rendered-2026-11-13` | 2026-11-13 | [Raw vs rendered HTML](https://seotecnico.dev.br/en/blog/raw-vs-rendered-html) |
| `index-inventory-2026-11-17` | 2026-11-17 | [Index bloat](https://seotecnico.dev.br/en/blog/index-bloat) |

Five sites were measured. None of them is a client or an employer, and none is
named anywhere on the site.
