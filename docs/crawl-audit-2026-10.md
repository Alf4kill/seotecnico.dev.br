# Crawl audit — 2026-10-23

> Working record of the first full crawl audit of seotecnico.dev.br. It holds the
> method, every finding with its verdict, what was fixed and how, and what was
> kept on purpose. The public case study and `relatorio-auditoria-crawl.md` are
> written from this file once the Search Console join is done (§7).

## 1. Why, and what this audit is not

Job postings for technical SEO name **Screaming Frog** as a daily tool. This
site's own baselines (`docs/baseline/`) used an in-house fetch script
(`scripts/baseline-crawl.mjs`), and CLAUDE.md §3 O4 / §11 item 8 already asked
for a Screaming Frog crawl. This audit closes that gap without a paid licence.

It does **not** repeat the Playwright SEO suite. The suite asserts invariants on
the URLs the sitemap *declares* (one h1, title/description length, canonical,
JSON-LD types, hreflang reciprocity, og:image). A crawler sees the URLs that are
*reachable through links*, plus every link target, external link and response
header. The audit reads only that difference.

## 2. Tools and configuration

| Tool | Role | What it could not do here |
|---|---|---|
| Screaming Frog SEO Spider 24.3, **free** | Reference crawl, issue report, cross-check | The free version is capped at 500 URLs per crawl (68 pages here, so no limit was hit), cannot save crawls, and locks configuration, JavaScript rendering, custom extraction and the GA/GSC integrations (vendor FAQ, read 2026-10-23). User agent and speed are fixed. |
| advertools 0.18.0 (Scrapy) — `audits/scripts/crawl_audit.py` | Configurable crawl: own user agent, `ROBOTSTXT_OBEY`, delay, custom XPath (meta robots, hreflang, `html lang`), link graph, depth, external status, sitemap join | No JavaScript rendering |
| Playwright — `audits/scripts/raw-vs-rendered.mjs` | Each sitemap URL opened with JavaScript off and on; visible text, links, headings, JSON-LD and title compared | — |

Considered and not used: LibreCrawl (active, renders JS, but no tagged
releases, settings kept in browser localStorage, Windows auto-install disabled,
and no value in job screening), SEOnaut (Go + MySQL, no documented JS
rendering), Ahrefs Webmaster Tools Site Audit (crawls production with a
third-party bot; postponed).

User agent of every request this audit sent:
`seotecnico-audit/1.0 (+https://seotecnico.dev.br/sobre)` (Screaming Frog used
its own, which the free version cannot change).

## 3. Protecting the crawler experiment

The proxy reports every document request to the crawler GA4 property
(`detection-experiment.md` §9), and `/llms.txt` links the llms trap. So:

1. **All three crawls ran against a local production build**, not production:
   `SITE_INDEXABLE=true`, `NEXT_PUBLIC_DOMAIN=http://localhost:3000`, and
   `NEXT_PUBLIC_GTM_ID` **empty**. The `.env.local` value is the real container
   (`GTM-N5RB56R9`), not a placeholder. Without `GA4_CRAWLER_*` the proxy sends
   nothing, and without a GTM id there is no pageview. The domain points at
   localhost so that canonicals, hreflang and the sitemap keep every crawler
   on the local host. The launch configuration is `next-start-audit`.
2. Built from `ba2b5af` (main), the commit in production. The production
   sitemap lists the same 68 URLs.
3. No crawler was seeded with `/llms.txt`. All of them start at `/` and follow
   `<a href>` only.
4. Production got a seeded pass only (§5.3), logged in the synthetic-traffic
   register in `measurement-plan.md`: 2026-10-23, 21:25–21:32 UTC.
5. *Pending:* the owner ran Screaming Frog once against production before the
   local run. It reached at most the home page. Its time still has to go into
   the same register.

## 4. Inventory — the three crawlers agree

| | Screaming Frog | advertools | Playwright |
|---|---|---|---|
| HTML pages | 68 | 68 | 68 (sitemap) |
| Other internal URLs | 14 JS chunks, 3 images, 1 feed | 1 feed | — |
| Pages with a different click depth between SF and advertools | 0 | 0 | — |

- **Depth:** 1 page at 0, 15 at 1, 36 at 2, 16 at 3. Max 3 (§6 limit: 3). The
  16 depth-3 pages are English articles, reached from `/` through `/en`.
- **Coverage:** every sitemap URL is linked from somewhere, and every linked
  HTML URL is in the sitemap. No orphans in either direction.
- **Links:** 2,442 internal links, 0 broken, 0 to a redirect. 420 external
  links to 19 domains.
- **Hreflang:** 66 pages in pairs with `x-default`, 0 reciprocity errors. The
  two pages without hreflang (`/en/case-studies`, `/en/case-studies/ai-crawler-detection`)
  have no Portuguese version by design.
- **Raw vs rendered:** on all 68 pages the text, links, headings, JSON-LD and
  title are identical with JavaScript off and on. The only difference is the
  "COPIAR"/"COPY" label of the code-block button, which exists only after
  hydration. The tool pages included: their explanatory content and form markup
  are in the served HTML.

## 5. Findings and verdicts

### 5.1 Fixed in this branch

| # | Finding | Evidence | Fix |
|---|---|---|---|
| F1 | No security header on any URL: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` absent (SF: 86/86 URLs) | SF issues report; `next.config.ts` had no `headers()` | `headers()` in `next.config.ts` for `/:path*`: `nosniff`, `DENY`, `strict-origin-when-cross-origin`. Locked by a Playwright test on `/`, `/robots.txt` and `/feed.xml`. |
| F2 | External link answers through a redirect: `docs.perplexity.ai/guides/bots` → 308 → `/docs/resources/perplexity-crawlers` | advertools external status check (64 distinct URLs, one HEAD each) | Link updated in `ia-nao-consegue-acessar-site` and `chatgpt-cant-access-website`. `dateModified` not bumped: the target of a citation moved, the article did not change. |

### 5.2 Kept on purpose

| Finding | Pages | Why it stays |
|---|---|---|
| Content-Security-Policy missing (83/86) | all HTML | A CSP that protects anything needs a nonce or hashes for GTM, the inline `ThemeScript` and the inline JSON-LD, and a nonce makes every page dynamic. That is a separate decision with a performance cost to measure. The 3 URLs that do carry a CSP are Next's image optimizer responses. |
| External DOI ends in 403 for bots: `doi.org/10.2307/2331986` → 301 → 302 → `academic.oup.com` 403 | `pre-registro-seo`, `seo-testing-pre-registration` | A DOI is the canonical way to cite a paper. The 403 is the publisher's bot wall, and readers get through. |
| Title over 561 px (SF estimate) | `/en` (564 px, 59 chars), `/en/blog/does-chatgpt-read-javascript` (562 px, 60 chars) | 1–3 px over an estimate that Google moves, and both titles are within the 60-character rule. |
| Description over 985 px | `/politica-de-privacidade` (987 px), `/blog/chatgpt-le-javascript` (990 px) | 2–5 px over the same kind of estimate. Both are ≤155 chars. |
| Image alt over 100 chars (3 images) | the LCP articles, PT and EN | Screenshots of PageSpeed Insights whose alt carries the measured values. Shortening them is an accessibility call, open for the owner. |
| Duplicate H2 (4 pages) | `chatgpt-le-javascript` / `quais-ias-executam-javascript` and their EN pairs | Same section names ("Como o teste foi montado") in two articles of one experiment series. |
| H2 over 70 chars (3) | `/design`, `/en/design`, `/en/blog/chatgpt-cant-access-website` | The manifesto line and one numbered heading. |
| Low content (<200 words) | `/ferramentas` (181), `/en/tools` (166) | Index pages of three tools, not articles. |
| Title under 30 chars | `/en/privacy-policy` | A privacy page. |

### 5.3 Production pass (seeded, no spider)

| Check | Result |
|---|---|
| `http://` → `https://` | 308, one hop |
| `www.` → apex | 308, one hop. `http://www.` takes two hops (`http://www` → `https://www` → apex). That is the platform's ordering, and nothing links to it. |
| `/en/guide` | 308 → `/en/guide/technical-seo-nextjs` |
| Trailing slash `/blog/gtm-nextjs/` | 308 → no slash |
| Unknown URL | 404 with a single `<meta name="robots" content="noindex">` (the double-directive defect of the 2026-09-11 baseline is gone) |
| Production sitemap | 68 URLs, same as the local build |
| **Apex reachability** | **The apex has a single A record, `216.198.79.1`. Every TCP connection to it, and to `216.198.79.65`, failed from the owner's network and from an external fetcher (connection refused) between 21:25 and 21:43 UTC. `www` also resolves to `64.29.17.x`, which answered, so `www` worked. Pinned to `64.29.17.1`, the apex served 200. Vercel's status page listed no incident.** |

The apex finding is the most severe of the audit and cannot be fixed from the
repository. Open for the owner: check the domain in Vercel → Settings →
Domains and the A record at registro.br, and test from another network. Search
Console → Settings → Crawl stats → Host status shows whether Googlebot hit the
same failure. Any link to the 2026-10-13 deindexation is a question, not a
finding, until that report says so.

### 5.4 Not findings: artifacts of crawling localhost, or not applicable

| SF issue | Why it does not apply |
|---|---|
| Security: HTTP URLs (86), Form on HTTP URL (4) | The crawl ran on `http://localhost`. Production redirects `http://` with a 308 (§5.3). |
| Links: Outlinks To Localhost (68) | The build pointed its domain at localhost on purpose (§3). Production canonicals are `https://seotecnico.dev.br`, which CI already asserts. |
| Bad Content Type (1) | Most likely `/feed.xml`, served as `application/rss+xml`, the type recommended for RSS. The bytes are XML. The SF Security export would confirm the URL. |
| Readability difficult | The Flesch formula is calibrated for English and means nothing for pt-BR. |
| H2 multiple (68), title equals H1 (47), high external outlinks (5 pages, max 17 unique) | Informational per SF's own description. The outlinks are cited sources. |

## 6. What the crawl found that the test suite could not

- **The apex outage.** CI runs against a local build, so it can never see DNS
  or the edge.
- **Missing security headers.** No test looked at response headers outside the
  trap routes. One does now.
- **A moved external citation.** The suite never requests external URLs.
- **Raw vs rendered parity across all 68 pages.** The suite reads only the
  rendered DOM. The H15 control covers one probe route. This is the first
  site-wide measurement that an HTML-only reader gets the same page.

## 7. Still to do

1. **Search Console join** (owner exports, because no personal GSC API exists):
   Pages report with URLs (indexed / not indexed), Performance → Pages for 3
   months. Output: indexed without internal links, linked without
   impressions, not-indexed reasons vs crawl depth and inlinks.
2. CrUX for the 68 URLs through `CRUX_API_KEY`. The origin was absent from the
   dataset on 2026-09-11, so expect "no field data" and report it as such.
3. Register the time of the owner's Screaming Frog run against production.
4. Write `relatorio-auditoria-crawl.md` with real numbers only, and decide
   whether the case becomes a PT/EN article.

## 8. Reproduce

```bash
# 1. Local production build that cannot reach either GA4 property
NEXT_PUBLIC_GTM_ID= SITE_INDEXABLE=true NEXT_PUBLIC_DOMAIN=http://localhost:3000 npm run build
#    then start it on port 3000 with the same env (launch config `next-start-audit`)

# 2. advertools crawl + external status (Python 3.13 venv)
py -3.13 -m venv audits/.venv
audits/.venv/Scripts/python -m pip install -r audits/requirements.txt
audits/.venv/Scripts/python -I audits/scripts/crawl_audit.py --base http://localhost:3000 --out audits/crawl-YYYY-MM-DD

# 3. Raw vs rendered
node audits/scripts/raw-vs-rendered.mjs --base http://localhost:3000 --out audits/crawl-YYYY-MM-DD

# 4. Screaming Frog (free): crawl http://localhost:3000/, export Internal,
#    Response Codes, Hreflang, Bulk Export → All Inlinks, Issues overview into
#    audits/crawl-YYYY-MM-DD/sf/
```

Raw exports stay out of git (`.gitignore`, per CLAUDE.md §14: publish aggregates,
not raw datasets). The scripts and `audits/crawl-*/summary*.json` are versioned.
