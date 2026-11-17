# Research — what a WordPress site offers Google to index, November 2026

> **Status:** research note · 2026-11-16 · input for one article, not the article.
> **Question:** on one public WordPress site whose text is original, which
> kinds of URL does the server offer for indexing (in sitemaps, with status
> 200, no `noindex` and a self-referencing canonical), how much text of their
> own do they carry, how do the site's other hosts answer, and what does
> Google's current documentation say is the probable outcome of each piece?
> **Owner constraints (2026-11-16):** the analysis of one anonymous site,
> case S3 of `docs/proposals/case-studies-content.md`, in the format of
> `uma-pagina-por-palavra-chave` (PR #134): technical parts only. Out, as
> content SEO (CLAUDE.md §13): the creditor × action keyword grid, authorship
> on a YMYL topic, the topics outside the service. The anonymity rules of the
> proposal's §3 apply; results collected from Google by an assistant are not
> used (§4 there); no exact totals of a third-party site (rounded totals and
> proportions only, owner rule of 2026-11-09).
> **Method:** every page below was downloaded on 2026-11-16 (evening BRT,
> 2026-11-17 UTC) and read from its HTML. The "Last updated" date is the one
> printed on the page; the Search Console help page and the WordPress page
> print none. Nothing here relies on memory of what a page used to say.
> **Labels:** **[documented]** = the source's own current text says it.
> **[inference]** = my reading, not stated by the source.
> **[observation]** = measured here by `scripts/index-inventory.mjs` on the
> date given.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **2026-11-16**. IDs are this note's own.

| ID | Source | Last updated (as printed) |
|---|---|---|
| G1 | [Optimize your crawl budget](https://developers.google.com/crawling/docs/crawl-budget) | 2026-07-22 |
| G2 | [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | 2025-12-10 |
| G3 | [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | 2026-10-05 |
| G4 | [Google Search's core updates and your website](https://developers.google.com/search/docs/appearance/core-updates) | 2025-12-10 |
| G5 | [Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en) (Search Console Help) | not printed |
| G6 | [Block Search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) | 2025-12-10 |
| G7 | [How HTTP status codes affect Google's crawlers](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) | 2026-02-04 |
| G8 | [Understanding Core Web Vitals and Google search results](https://developers.google.com/search/docs/appearance/core-web-vitals) | 2025-12-10 |
| G9 | [Understanding page experience in Google Search results](https://developers.google.com/search/docs/appearance/page-experience) | 2026-09-22 |
| G10 | [Control your snippets in search results](https://developers.google.com/search/docs/appearance/snippet) | 2026-04-20 |
| G11 | [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | 2026-07-08 |
| G12 | [Understand the JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) | 2026-03-04 |
| G13 | [What is URL canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) | 2026-08-20 |
| G14 | [Influencing your title links](https://developers.google.com/search/docs/appearance/title-link) | 2025-12-10 |
| G15 | [How Google interprets the robots.txt specification](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) | 2026-10-23 |
| G16 | [CrUX methodology](https://developer.chrome.com/docs/crux/methodology) (Chrome for Developers) | 2024-06-20 |
| G17 | [Time to First Byte (TTFB)](https://web.dev/articles/ttfb) (web.dev) | 2025-11-28 |
| G18 | [Posts Tags screen](https://wordpress.org/documentation/article/posts-tags-screen/) (WordPress documentation) | not printed |
| G19 | [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies) | 2026-08-28 |

---

## 1. What was measured **[observation]**

`scripts/index-inventory.mjs`, run of **2026-11-17 UTC** (S3 collected from
01:18 to 01:37 UTC, one request at a time, at least 1 s apart, robots.txt
read first, declared user agent `seotecnico-index-inventory/1.0`; 831
requests). Raw HTML only: no rendering, no search results. Phases:

```bash
node scripts/index-inventory.mjs fetch   --targets audits/case-studies/index-inventory.local.json --out audits/case-studies/index-inventory-2026-11-17
node scripts/index-inventory.mjs probe   --targets audits/case-studies/index-inventory.local.json --only S3 --out audits/case-studies/index-inventory-2026-11-17
node scripts/index-inventory.mjs crux    --targets audits/case-studies/index-inventory.local.json --out audits/case-studies/index-inventory-2026-11-17
node scripts/index-inventory.mjs analyze --targets audits/case-studies/index-inventory.local.json --out audits/case-studies/index-inventory-2026-11-17
```

Versioned output: `audits/case-studies/index-inventory-2026-11-17/summary.json`.
The targets file, the HTML, the raw files and the CrUX and probe detail stay
local (`.gitignore`). Rounding for S3 as in the earlier runs: totals to the
nearest 10, small counts in bands (1–4, 5–9), shares with two decimals,
medians to the nearest 10. **CrUX values are rounded too** (LCP, FCP and
TTFB to 500 ms, INP to 50 ms, CLS to 0.05): an origin's exact p75 for a
dated period is a fingerprint anyone can match by querying CrUX for a
candidate origin, so it is a search key in the sense of the proposal's §3.

**Control:** this site's sitemap (88 URLs), same run, exact numbers. It is a
control for the method, not a comparison of sites.

**Definitions** (in the script and in `summary.json`):

- *indexable*: 200 without redirect, no `noindex` in meta robots or
  `X-Robots-Tag`, canonical pointing to itself or absent;
- *own words*: words in the content's text blocks (paragraphs, items,
  headings, cells) that appear on fewer than 30% of the pages read. Menu,
  footer, the "most read" box and the fixed call to action fall out because
  they repeat on every page. Checked by hand on one tag archive and one FAQ
  entry: what is left is the tag name, the category, the one post's title
  and the call to action; on the FAQ, the question and its answer;
- *posts listed* by an archive: links in its content to URLs of the posts
  sitemap, without links that appear on 30% of pages or more.

### 1.1 What the sitemaps offer, by type

S3's sitemaps list about **720** URLs; about **630** are indexable (0.88).

| Sitemap type | Listed | Indexable | Median own words | Note |
|---|---|---|---|---|
| posts | ~330 | ~330 | ~1,380 | none under 300 own words |
| tag archives | ~180 | ~180 | ~20 | median 1 post listed; 0.94 list one post or none; 0.02 are linked by another page read (self-links excluded) |
| FAQ entries (one question per URL) | ~50 | ~50 | ~50 | 0.89 under 100 own words; 0.02 linked by another page; 1–4 listed URLs answer 404 |
| testimonials (one per URL) | ~10 | ~10 | ~40 | all under 100 own words; none linked by another page |
| campaign pages | ~80 | 0 | — | all `noindex`; already in `auditoria-de-sitemap` |
| pages, partner landings | ~30, ~20 | all | ~450, ~910 | 0.61 of pages and every partner landing linked by another page |
| category archives | under 10 | all | ~420 | none has an H1 |
| author archives | under 10 | under 10 | — | 0.14 answer 200; 5–9 redirect (in `auditoria-de-sitemap`) |
| policy, page-builder entries | under 10 each | all | — | — |

The three types that hold one small item per URL (tags, FAQ entries,
testimonials) are **0.38 of everything indexable** (0.376 on the exact counts;
the rounded per-type shares add up to 0.37).

Posts: 0.92 are linked by another page read. Inbound counts exclude a page's
links to itself; an earlier version of the script counted them, which is
why the first version of this note (`b35d8be`) had "median 1 page links to each" for tags.

### 1.2 The description every page shares

The theme prints the same site-wide `<meta name="description">` on every
page. On the posts and partner landings the SEO plugin prints the page's own
description first, and the theme's comes second: 0.99 of posts and every
partner landing carry **two** description tags. On tag archives, FAQ
entries, testimonials, categories and authors, the site-wide one is the
**only** description (1.00 of each type). The control has no repeated
description.

This corrects the 2026-11-07 study (private), which counted these pages as
having an empty description: what it read was the plugin's field. The fixed
sentence is a search key and is never quoted.

### 1.3 Other hosts (probe of 2026-11-17 UTC)

| Host | Root | Invented route | `/robots.txt` | `/sitemap.xml` | Linked from |
|---|---|---|---|---|---|
| main site | 200 | 404 | 200, text | 301 to the plugin index, 200 XML | — |
| old blog subdomain | 526 | 526 | 526 | 526 | 0.13 of the pages read, and the home |
| app subdomain (client-rendered SPA) | 200 | 200, same HTML as the root | 406 with `Accept: text/plain`; 200 with the app's HTML with `*/*` or `text/html` | 406 with `application/xml`; 200 with the app's HTML with `*/*` | every page read |
| subdomain run by a third party | 200 | 301 to `/404`, which answers 200 without `noindex` | 200, text | 200, XML | 0.02 of the pages read, not the home |

The third-party subdomain answered 403 to a declared bot on 2026-11-09
(`soft404-2026-11-09/summary.json`); on 2026-11-17 it answered the same
declared user agent normally, so its soft 404 is now measured directly.
526 is Cloudflare's "invalid SSL certificate" response (the response's own
title, read on the run; a 5xx).

### 1.4 Field data and response time

CrUX through `/api/checador-cwv`, origin level, collection period
2026-10-18 to 2026-11-14, values rounded as above:

| | LCP | INP | CLS | FCP | TTFB |
|---|---|---|---|---|---|
| Phone | ~4.0 s, needs improvement | ~250 ms, needs improvement | ~0.2, needs improvement | ~4.0 s, poor | ~3.0 s, poor |
| Desktop | ~3.5 s, needs improvement | ~100 ms, good | ~0.1, good | ~3.0 s, poor | ~2.5 s, poor |

The control origin is not in the CrUX dataset (not enough visitors, G16).

Time to first byte measured by the script from one machine in Brazil, on
2026-11-17 UTC: median ~1,500 ms on the posts, ~2,020 ms on the home; this
site's median on the same run is 339 ms. One machine and one evening:
it describes the run, not the field (the field is the CrUX row).

### 1.5 Already measured, not repeated

- Raw vs rendered on S3's main site: head equal on 8 of 8 pages, the
  JavaScript adds only the cookie banner (`raw-vs-rendered-2026-11-13`,
  article `html-renderizado`).
- Sitemap defects (`noindex` campaign pages listed, author redirects, the
  404 FAQ files, a malformed URL): `sitemap-audit-2026-11-11`, article
  `auditoria-de-sitemap`. This article links it and does not recount.
- Text: posts are not paraphrase at scale (literal similarity near zero,
  2026-11-07 study, private). Not re-measured here; the article does not use
  it except as "the text is not the problem", which §1.1's own words and the
  posts' size already show.

---

## 2. What the sources say

### 2.1 Crawl budget is a large-site topic **[documented]** — G1

G1 opens by saying who it is for: sites with over a million unique pages that
change weekly, sites with over ten thousand that change daily, or sites with a
large share of URLs in "Discovered – currently not indexed". It calls the
numbers a rough estimate, not thresholds. A site whose pages are crawled on
the day they are published does not need the guide; for Search, an up-to-date
sitemap and the Page indexing report are enough.

Inside the guide, the factor it says a site controls the most is the
**perceived inventory**: without guidance, Google tries to crawl all or most
URLs it knows about, and duplicates or unimportant URLs take crawling time.
Three of its best practices bear on the case:

- `noindex` does not save crawling: Google still requests the page and drops
  it when it sees the rule (G1, best practices).
- Soft 404 pages keep being crawled (G1).
- A 404 is a strong signal not to crawl a URL again (G1).

G1 also defines a site, for crawling, as one hostname: `www.` and another
subdomain have separate budgets **[documented]**. And crawl capacity goes down
when response times grow, or with 5xx and 429 responses **[documented]**.

**[inference]** At the size of S3 (hundreds of URLs, not tens of thousands),
G1 itself says crawl budget is not the problem to solve. The case for fewer
thin URLs at this size is not crawling; it is §2.2.

### 2.2 Thin URLs: no word count, but a site-level reading **[documented]** — G2, G3, G4

- G2, "things we believe you shouldn't focus on": the length of the content
  alone does not matter for ranking, and there is no word-count target,
  minimum or maximum. The same list says the number and order of headings do
  not matter to Search.
- G3's self-assessment asks, as one of its questions, whether the content is
  written to a word count Google prefers, and answers it: Google has none.
- G4, on a sustained drop for a site as a whole: read the self-assessment for
  the site overall, not only individual pages. Deleting content is a last
  resort; when whole sections were made for search engines first, deleting
  the unhelpful content can help the good content perform better.
- G9: Google's core ranking systems generally evaluate content page by page,
  but there are some site-wide assessments.

**[inference]** Two different readings of "thin" must not be mixed. A
word-count threshold is not Google's (G2, G3), so the article cannot call a
page thin because it has under N words. What the sources support is the
site-level question: does a type of URL exist for a reader who searches, or
only because the CMS generates it? The word count here describes the type; it
is not the verdict.

### 2.3 Page indexing statuses the case maps to **[documented]** — G5

- "Crawled – currently not indexed": Google does not index every page; the
  status is common and does not necessarily need attention.
- "Discovered – currently not indexed": found, not crawled yet, usually
  because crawling was expected to overload the site.
- "Duplicate without user-selected canonical" and "Duplicate, Google chose
  different canonical than user": Google consolidates duplicates and serves
  one URL.
- "Soft 404" and "Server error (5xx)": as in the soft-404 article's note.

**[inference]** These are the statuses where a site's thin types would show
up, if they show up at all. Without the site's Search Console, which status
each URL has is unknown, and the article says so.

### 2.4 Meta description and H1 **[documented]** — G10, G14, G2

- G10: snippets are created automatically from page content; Google sometimes
  uses the meta description when it describes the page better than the
  content would. A missing description is not an error in G10's terms.
- G14: title links come from several sources, `<title>` first, also headings.
- G2: heading count and order do not matter to Search.

**[inference]** Missing descriptions and missing H1s are presentation
defects (what the snippet and the title link are built from), not indexing
defects. The article lists them as such.

### 2.5 Sitemap **[documented]** — G11

Include the URLs you want to see in Google's results, and only canonical
URLs. (Already covered by `auditoria-de-sitemap`; this page only links it.)

### 2.6 Other hosts of the same site **[documented]** — G7, G12, G15

- G7: 5xx responses make crawlers slow down; for Search, indexed URLs are kept
  for a while but eventually dropped, and content from a 5xx response is
  ignored.
- G15: a robots.txt answering 4xx (except 429) is treated as if no robots.txt
  existed, so there are no crawl restrictions; a robots.txt that is HTML is
  parsed for valid lines and the rest is ignored; a 5xx robots.txt stops
  crawling for 12 hours, then the last good copy is used for 30 days.
- G12: in a client-rendered SPA, either redirect with JavaScript to a URL the
  server answers with 404, or add `noindex` to error views with JavaScript.

### 2.7 Field data **[documented]** — G8, G9, G16, G17

- G8: thresholds LCP 2.5 s, INP 200 ms, CLS 0.1 (good).
- G9: Core Web Vitals are used by the ranking systems; a good score does not
  guarantee ranking; there is no single page experience signal.
- G16: an origin enters CrUX only if its pages are indexable (200 after
  redirects, no `noindex`) and it has enough visitors (threshold undisclosed).
- G17: TTFB good ≤ 0.8 s, poor > 1.8 s; TTFB is not a Core Web Vital.

### 2.8 WordPress tags **[documented]** — G18

Clicking a tag under a post opens a tag archive listing every post with that
tag. G18 says nothing about indexing; whether a tag archive is indexable
depends on the theme and the SEO plugin **[inference]**.

---

## (a) Claims the article can make

| Claim | Level (§10) | Source IDs |
|---|---|---|
| About 0.88 of what the sitemaps list is indexable; 0.38 of the indexable set is tags, FAQ entries and testimonials | 3 | §1.1 |
| Tag archives: median ~20 own words, 0.94 list one post or none, 0.02 linked by another page | 3 | §1.1 |
| FAQ entries ~50 own words, testimonials ~40; posts ~1,380, none under 300 | 3 | §1.1 |
| Every page carries the same site-wide description; on thin types it is the only one; posts carry two description tags | 3 | §1.2 |
| Category archives have no H1 | 3 | §1.1 |
| Word count is not a Google criterion; heading count and order do not matter to Search | 1 (documented) | G2, G3 |
| Crawl budget is not this site's problem at its size, by Google's own guide | 2 | G1 + §1.1 |
| `noindex` does not save crawling; soft 404s keep being crawled; 404 is a strong signal not to recrawl | 1 (documented) | G1 |
| Google's advice for a site-level drop is to assess the site as a whole; deleting is a last resort, and deleting sections made for search engines can help the rest | 1 (documented) | G4 |
| Ranking systems evaluate mostly page by page, with some site-wide assessments | 1 (documented) | G9 |
| A missing or generic description changes what the snippet is built from, not whether the page is indexed | 2 | G10 |
| Old blog host: 526 on every path, robots.txt included, and the main site still links it; Google slows crawling on 5xx and eventually drops indexed URLs; a 5xx robots.txt stops crawling for 12 hours, then the last good copy is used | 3 + 1 | §1.3, G7, G15 |
| App host: same HTML for every route; robots.txt answers 406 or HTML depending on `Accept`; a 4xx robots.txt means no restrictions, an HTML one yields no rules | 3 + 1 | §1.3, G15, G12 |
| Third-party host: invented route → 301 → `/404` with 200 and no `noindex`, i.e. what Search Console calls a soft 404 | 3 + 1 | §1.3, G5, G12 |
| Field data: LCP and INP need improvement on phones, TTFB poor on both; CWV are used by ranking, a good score does not guarantee ranking | 3 + 1 | §1.4, G8, G9 |
| Raw vs rendered: the JavaScript changes nothing that counts for indexing on the main site | 3 | §1.5 |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "Pages under N words are thin" / "Google penalises short pages" | G2 and G3 say there is no word count; the count describes a type, it is not a verdict |
| "Tag pages should always be noindexed" | no Google source says so; the condition is the type's value to a reader (level 2 at most) |
| "Index bloat wastes crawl budget" (as this site's problem) | G1 puts crawl budget at 10,000+ or 1,000,000+ pages; S3 has hundreds |
| "`noindex` saves crawl budget" | G1 says the opposite: the page is still requested |
| "The site was penalised / lost rankings because of it" | no Search Console; no results collected (proposal §4) |
| "Google indexes / does not index the tag pages" | unknown without Search Console; `site:` counts are estimates and were collected by the assistant |
| "Two description tags confuse Google" / "Google uses the first one" | no source says which one is used; state the defect, not an effect |
| "The 526 subdomain hurts the main site's ranking" | G1 treats hosts as separate for crawling; the effect on the main host is not documented |
| "Core Web Vitals explain the site's performance in Search" | G9: one signal among many, no single page experience signal |
| Exact p75 values, exact totals, the site-wide description sentence, sector + stack + scale combinations | anonymity (proposal §3; owner rule 2026-11-09; §1 of this note) |

## (c) Open questions

1. Demand for the query (owner's manual check; the assistant never runs
   Trends or Google queries).
2. Whether to refer to the site as S3, the code used in three published
   articles. Consistency and reproducibility argue for S3; putting every
   finding of one site on one page also makes it easier to identify, which
   the proposal's §3 warns about. Option: keep S3 and keep each detail no
   more specific than the other articles already are.
3. Whether to mention the CrUX section at all, given that the article's
   subject is indexing. It explains the TTFB of the run and is the site's own
   tool, so the proposal is a short section with a link to the CWV checker.
4. The employment-contract check (owner; proposal §3) is still open.

## (d) Proposed angle and primaryQuery

**Angle.** The opposite case of `uma-pagina-por-palavra-chave`: there the
text was the problem and every page passed a duplicate checker; here the
posts are long and original, and the problem is what the CMS and the theme
offer for indexing around them: one URL per tag, per FAQ question and per
testimonial, all with the same description, plus three sibling hosts that
each answer wrong in a different way. The analysis of one site, technical
parts only, with the probable outcome of each piece from Google's
documentation and what I would do instead.

**PT query (proposed, demand unchecked):** `index bloat`, the term Brazilian
SEO writing uses in English; alternatives `páginas de tag` / `tags wordpress
seo` (broader, more WordPress than mechanism) and `páginas finas`. `grep` of
`primaryQuery` in `content/`: no equivalent query published.
**EN query:** `index bloat`.

**First-hand element:** the run of §1 (versioned summary and script), plus
this site's own sitemap as control and the "No Next.js" section (how this
repository decides what enters `sitemap.ts`, from the code).
