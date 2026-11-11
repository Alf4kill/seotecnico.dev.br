# Research — when the sitemap contradicts the site, November 2026

> **Status:** research note · 2026-11-11 · input for one article, not the article.
> **Question:** what does Google's current documentation say a sitemap should
> list and how it treats what a sitemap gets wrong (redirects, errors,
> `noindex`, canonical elsewhere, repeated or malformed entries, a `lastmod`
> that does not track the page, important pages left out), and what do four
> real sites and this one serve on the same day?
> **Owner constraints:** the sites read from outside are cited only by code
> (S1–S4) under the anonymity rules of `docs/proposals/case-studies-content.md`
> §3: no domain, path, slug, sitemap file name, verbatim sentence, screenshot
> or identifying combination. Totals are rounded and page counts given as
> shares, in this note and in the versioned summary, as in the article (owner
> rule of 2026-11-09). S5 is out of this note and of every future target
> (owner, 2026-11-09). Results collected from Google by an assistant are not
> used (same proposal, §4); the 2026-11-07 numbers of the private studies are
> not used either: every third-party number here comes from the run in §3.
> **Method:** every page below was downloaded on 2026-11-11 and read from its
> HTML. The "Last updated" date is the one printed on the page; a blog post's
> date is its publication date. Nothing here relies on memory of what a page
> used to say.
> **Labels:** **[documented]** = the source's own current text says it.
> **[inference]** = my reading, not stated by the source.
> **[observation]** = measured here on the date given.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **2026-11-11**.

| ID | Source | Last updated (as printed) |
|---|---|---|
| G1 | [Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) | 2025-12-10 |
| G2 | [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | 2026-07-08 |
| G3 | [Manage your sitemaps with a sitemap index file](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps) | 2025-12-10 |
| G4 | [Sitemaps ping endpoint is going away](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping) (Search Central blog, Gary Illyes) | posted 2023-06-26 |
| G5 | [How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | 2026-07-10 |
| G6 | [Block Search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) | 2025-12-10 |
| G7 | [How Google interprets the robots.txt specification](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) (the Search Central URL `…/robots/robots_txt` redirects here) | 2026-10-23 |
| G8 | [Optimize your crawl budget](https://developers.google.com/crawling/docs/crawl-budget) | 2026-07-22 |
| G9 | [Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en) (Search Console Help) | not printed |
| G10 | [Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en) (Search Console Help) | not printed |
| P1 | [sitemaps.org: Sitemaps XML format](https://www.sitemaps.org/protocol.html) | not printed |
| G11 | [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), "Avoid irrelevant redirects": many old URLs redirected to one irrelevant destination such as the home page might be treated as a soft 404 | 2026-08-20 |
| B1 | [The importance of setting the "lastmod" tag in your sitemap](https://blogs.bing.com/webmaster/2023/2/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap/) (Bing Webmaster blog) | posted 2023-02-01 |

Bing's Webmaster Guidelines page was not read: it renders on the client and the
served HTML has no text (126 bytes after extraction). Nothing below depends on it.

Questions people ask were read on 2026-11-11 from the Stack Exchange API
(`webmasters` site, sorted by votes); they show that a question exists, not
Brazilian search volume (§4).

---

## 1. What the sources say

### 1.1 A sitemap is a list of the URLs you want in search, and only a hint **[documented]** — G1, G2, G5

- G2 asks for the URLs "that you want to see in Google's search results", as
  fully qualified absolute URLs, which Google "will attempt to crawl … exactly
  as listed". The URLs to include are the canonical ones: when the same content
  answers at several URLs, pick one and list that one.
- G2: submitting a sitemap is "merely a hint"; G1: a sitemap helps discovery
  but does not guarantee that the items in it are crawled or indexed.
- G5: inclusion in a sitemap is a **weak** canonicalization signal (redirects
  and `rel="canonical"` are strong). Every URL in a sitemap is suggested as a
  canonical. G5 also says not to name one URL in the sitemap and a different
  one in `rel="canonical"` for the same page.
- G1 and G9: a site of about 500 pages or fewer, fully linked from the home
  page, may not need a sitemap at all.

**[inference]** None of these pages lists "what not to put in a sitemap" as a
checklist. Each defect in this note is wrong because it contradicts one of
these sentences: a redirect, a 404 or a `noindex` URL is not a URL you want in
the results, and a URL whose `rel="canonical"` names another one is the G5
conflict. The article must cite the sentence, not a rule Google did not write.

### 1.2 `noindex` and errors in a sitemap **[documented]** — G6, G10

- G6: `noindex` only works if the crawler can fetch the page; a page blocked by
  robots.txt never shows the rule and may still appear in results.
- G10 (error spikes): one cause it names is a sitemap that includes URLs
  blocked by robots.txt, `noindex` or a login.
- G10 (404s): fix only the 404s you link to yourself **or list in a sitemap**.
- G10 (sitemap filter): the Page indexing report can be filtered to "all
  submitted pages", meaning URLs in a sitemap submitted in the report **or
  declared in robots.txt**; a URL counts as submitted even if Google also found
  it by a link.

**[inference]** The report counts what the sitemap listed, so a site that lists
URLs it does not want indexed fills its own "submitted" view with exclusions
and makes the real ones harder to see. That is the practical cost; there is no
documented penalty.

### 1.3 `lastmod` **[documented]** — G2, G4, P1, B1

- G2: Google uses `<lastmod>` if it is "consistently and verifiably" accurate,
  for example compared with the page's last modification; it should reflect
  the last **significant** update (main content, structured data, links), not
  a copyright year. Google ignores `<priority>` and `<changefreq>`.
- G4 (2023): `lastmod` is used as a signal for scheduling crawls of URLs
  already discovered; if it keeps saying "changed yesterday" for a page that
  changed years ago, Google eventually stops believing it. Leaving `lastmod`
  out for pages whose date the software cannot tell (a home page, a category)
  is fine.
- P1: the date must be when the page changed, "not when the sitemap is
  generated" — a sentence Bing says it had added to the protocol (B1).
- B1 (Bing's own data, 2023): the most common incorrect `lastmod` is the same
  value on every URL, usually the generation date; if dates are consistently
  the current date, Bing may disregard them. Bing reports that 18% of the
  sitemaps it knows with `lastmod` had it set incorrectly. **[documented by
  Bing, about Bing's index in 2023]**; not a statement about Google.

### 1.4 Where a sitemap is declared and when it is read **[documented]** — G2, G3, G7, G9

- G2, G7: a `Sitemap:` line in robots.txt, as many as needed, is one of the
  documented ways to submit; it is not tied to a user agent and the URL may be
  on another host. G9: sitemaps found through robots.txt do not appear in the
  Sitemaps report, which only lists those submitted there or by the API.
- G2: a sitemap may list another host only through cross-submission (all hosts
  verified in Search Console, or each host's robots.txt pointing at it). G9's
  "URL not allowed" error is a URL on a different host, or above the
  sitemap's directory. P1: one sitemap, one host.
- G3: sitemaps listed in an index must be on the same site and in the same
  directory or below.
- G9: if a sitemap cannot be fetched, Google retries for a few days and then
  stops; errors in single URLs do not stop it from reading the rest. Google
  does not forget URLs from a sitemap that was removed from the report.
- G4: the ping endpoint is gone; robots.txt and Search Console remain.

### 1.5 Format **[documented]** — G2, P1

UTF-8; at most 50,000 URLs or 50 MB uncompressed per file; values
entity-escaped (a raw `&` breaks the XML); URLs URL-escaped (P1). A URL with a
space in its path is malformed under P1.

### 1.6 Crawl budget is a large-site topic **[documented]** — G8

G8 is written for sites of about a million pages, or ten thousand that change
daily; for everyone else, "keeping your sitemap up to date" and checking the
Page indexing report is enough. Its list includes keeping sitemaps current and
avoiding long redirect chains.

**[inference]** "Redirects in the sitemap waste crawl budget" is not a claim the
article can make about sites of a few hundred or a few thousand URLs. What it
can say is narrower: Google requests each listed URL as written (G2), so a
redirect costs an extra hop to reach the URL that should have been listed.

---

## 2. Local context

- `sitemap-dinamico-nextjs` (PT, 2026-07-20, revised 2026-10-18) owns
  `sitemap dinâmico next.js`: what Next.js generates, deriving the array from
  content, `lastmod` from frontmatter, `noindex` × `Disallow`, image sitemaps.
  The new page is a generic layer-1 hub (CLAUDE.md §5.2) about auditing a
  sitemap, which links to it for the Next.js implementation instead of
  repeating it.
- `uma-pagina-por-palavra-chave` (2026-11-10) already reports S1's empty
  sitemap and reads it as costing nothing on a small, fully linked site (G1).
  The new page links to it and does not re-describe S1.
- This site's own sitemap is the control (§3). Its "No Next.js" section can
  quote `src/app/sitemap.ts` (`lastmod` only when the frontmatter gives one)
  and `tests/seo/seo.spec.ts`, whose route list **is** `sitemap()`: every URL
  the sitemap lists is asserted by the SEO suite on every PR, which is the
  structural reason this sitemap cannot list a page that redirects or is
  `noindex` without failing CI.

---

## 3. Observations — the run of 2026-11-11 [observation]

**Run.** `scripts/sitemap-audit.mjs`, 2026-11-11 between 13:15 and 14:39 UTC,
user agent `seotecnico-sitemap-audit/1.0`, `node:https` (no `Sec-Fetch-*`
headers), robots.txt read first and obeyed, one request at a time with at
least 1 s between requests, no search engine queried. Each listed URL was
requested once without following redirects; robots.txt, sitemap files and the
home page followed up to five hops. URLs of another host listed in a sitemap
are counted, never requested. About 4,200 requests in total. The 22 URLs that
answered 500 were requested once more at 14:38 UTC (`--recheck-5xx S4`): all
22 answered 200.

**Output.** `audits/case-studies/sitemap-audit-2026-11-11/summary.json`
(versioned: codes, totals rounded to the nearest 10, or 100 from 1,000, defect counts in bands, shares; sitemap
files by type). `raw.json` and the targets file stay local.

**Reproduce:**

```bash
node scripts/sitemap-audit.mjs --targets <targets file> --out audits/case-studies/sitemap-audit-YYYY-MM-DD
node scripts/sitemap-audit.mjs --recheck-5xx S4 --targets <targets file> --out audits/case-studies/sitemap-audit-YYYY-MM-DD
```

The targets file format is `audits/case-studies/sitemap-audit.example.json`.
The real one names the sites and is never committed.

**What "ok" means.** Status 200, no `noindex` (meta `robots`/`googlebot` or
`X-Robots-Tag`), and a `rel="canonical"` that is absent or names the URL
itself. A canonical that differs only by a trailing slash counts as "another
URL" and is reported apart in the raw file (it occurred in no case).

### 3.1 The five sites

| | SITE (control) | S1 | S2 | S3 | S4 |
|---|---|---|---|---|---|
| Sector (broad) | this blog | industrial equipment | commercial real estate | consumer finance | B2B software |
| URLs listed | 82 (exact) | 0 | about 500 | about 710 | about 2,800 |
| Sitemap declared in robots.txt | yes | yes | yes | yes | yes |
| Listed URLs that are ok | 100% | — | 99%+ | 88% | 96% |
| `noindex` listed | 0 | — | 0 | 11% (about 80) | 1% (about 30) |
| Redirect listed | 0 | — | 1–4 | 5–9, all to the home page | about 40 |
| Canonical to another URL | 0 | — | 0 | 0 | about 30 |
| 404 listed | 0 | — | 0 | 1–4 | 1–4 |
| Same URL listed twice | 0 | — | 1–4 | 1–4 | about 20 |
| Malformed URL | 0 | — | 0 | 1–4 (encoded space in the path) | 0 |
| `lastmod` at the moment the file was served | 0 | — | 0 | 0 | 100% of one file |
| `lastmod` = newest date the page declares | 100% of 66 | — | 98% | 100% | 100% of the posts |
| Indexable page linked from most pages, missing from every sitemap | none (only the RSS feed) | — | yes, linked from every page | none | yes, linked from 94% of pages |

### 3.2 What each case adds

- **S1.** robots.txt announces a `sitemap.xml` that answers 200 with zero
  URLs; `/sitemap_index.xml` answers a redirect to a 404. Already in
  `uma-pagina-por-palavra-chave`; one line and a link.
- **S2, the nearly clean one.** Every file has a `lastmod` per URL and it
  tracks the newest date the page declares (98%). The rest, about ten pages,
  disagree in both directions: landing pages whose `lastmod` is weeks later
  than the date in the page, and listings whose page date is a day or two
  later than the `lastmod` (the listing was saved again after the file was
  built). One listing redirects to a category page; one URL is listed
  twice. Its finding is the opposite of a bad entry: a few city category pages
  linked from the menu of **every** page, indexable, with no entry in any
  sitemap, while sibling city categories are listed.
- **S3, contradictory signals.** One whole child sitemap (about 80 URLs) lists
  pages that are all `noindex` — the file exists only for them. The author
  sitemap lists 5–9 author archives that redirect to the home page; two FAQ
  sitemaps each list a URL that answers 404; one URL has an encoded space in
  its path. robots.txt declares the index with a trailing slash; the same
  index answers 200 without it, and `/sitemap.xml` redirects to it. Harmless:
  one index, three ways in.
- **S4, two kinds of file on one site.** The posts file (about 2,600 entries)
  has a `lastmod` per post that matches the page's own dates (100% of the
  posts with a date, compared by instant). The pages file (about 70 entries)
  has the **same** `lastmod` on every URL, equal to the second the file was
  served: it says when the file was built. A third file of landing pages and
  forms (about 170 URLs counted there) is about half ok: `noindex` 17%,
  canonical to another URL 16%, redirect 14%, 404 2%; it has no `lastmod`.
  About 20 URLs appear in two files. Pages linked from almost every page
  (94%) are indexable and in no sitemap; so is a tool linked from about one
  page in five.
- **Control.** All 82 URLs ok. 11 entries have no `lastmod` (tool pages,
  `/sobre`, the English home and about): `src/app/sitemap.ts` emits it only
  when a date can be derived from the content. Where it is emitted it equals
  the page's `dateModified` in every case. The only page linked from most
  pages and absent from the sitemap is `/feed.xml`, which is not HTML.

### 3.3 Two corrections made during the measurement

1. The first comparison of `lastmod` with page dates used the calendar day as
   written. S4 writes `lastmod` in UTC and the page dates in −03:00, so an
   evening post falls on two different days; that produced a false 6%
   mismatch. The script now compares instants when both values have a time
   (tolerance one minute) and the written day only when one has no time.
2. The first summary counted a page with no `dateModified` as "lastmod
   differs from dateModified". The comparison is now with the newest date the
   page declares (`dateModified`, else `datePublished`).

Neither correction changed a request; both are in the script's history.

### 3.4 What changed since the private study of 2026-11-07

The private study (not used here) saw the same defects on S3 and S4 four days
earlier. Two differences matter for wording: S2 had two redirecting listings
then and has one now, and S4's posts `lastmod` then equalled the publication
date in every post read, while now posts that declare a later `dateModified`
carry that date. Sitemaps are regenerated; every number is a snapshot of
2026-11-11.

---

## 4. Questions people ask

Read 2026-11-11 from the Stack Exchange API, `webmasters` site, by votes:
whether Google penalizes a `lastmod` updated daily without real changes
(2012, about 11.5k views), whether every page must be in the sitemap (2023),
how a URL with a temporary `noindex` should be handled in the sitemap (2015),
and the long-standing "sitemap paradox" thread on what a sitemap adds to a
linked site (2010, about 49k views). Evidence that the questions exist in
English; Brazilian demand is the owner's manual check (§(d)).

---

## (a) Claims the article can make

| # | Claim | Level (§10) | Source |
|---|---|---|---|
| a1 | A sitemap should list the canonical URLs you want in search results, as absolute URLs; Google requests them as written | 1 | G2 |
| a2 | A sitemap is a hint; listing a URL does not guarantee crawling or indexing | 1 | G1, G2 |
| a3 | Sitemap inclusion is a weak canonical signal; naming one URL in the sitemap and another in `rel="canonical"` is what G5 says not to do | 1 | G5 |
| a4 | A `noindex` URL in the sitemap contradicts "URLs you want in search results"; the Page indexing report names sitemaps that list `noindex` URLs as a cause of error spikes | 1 + 2 | G2, G10 |
| a5 | 404s worth fixing are the ones you link to or list in a sitemap | 1 | G10 |
| a6 | Google uses `lastmod` only if it is consistently and verifiably accurate, and stops believing it otherwise; leaving it out for pages without a reliable date is fine | 1 | G2, G4 |
| a7 | A `lastmod` equal to the moment the file was served describes the file, not the page (P1's own sentence); Bing names it as the most common incorrect value | 1 | P1, B1 |
| a8 | robots.txt `Sitemap:` is a documented way to submit; such sitemaps do not show in the Sitemaps report but count in the Page indexing report's "submitted" filter | 1 | G7, G9, G10 |
| a9 | A small, fully linked site may not need a sitemap at all, so an empty one costs little there | 1 | G1, G9 |
| a10 | Crawl budget guidance is for very large sites; elsewhere, keep the sitemap current | 1 | G8 |
| a11 | Every count and share in §3 for S1–S4 and the control, dated 2026-11-11 | 3 | `summary.json` |
| a12 | One site can have an accurate `lastmod` in one file and a generation-time `lastmod` in another: the defect belongs to the generator of each file, not to the site | 3 + 2 | §3.2 (S4) |
| a13 | A page linked from every page can still be missing from the sitemap; the audit has to compare links with the sitemap, not only check what is listed | 3 | §3.2 (S2, S4) |
| a14 | Comparing `lastmod` with page dates by calendar day gives false mismatches across time zones; compare instants | 3 | §3.3 |
| a15 | This site's sitemap cannot list a redirect or a `noindex` page without failing CI, because the SEO suite's routes are the sitemap | 2 | `tests/seo/seo.spec.ts` lines 17–32 |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "Google penalizes `noindex`/redirects/404s in a sitemap" | No source; G9 says errors in single URLs do not stop the rest of the sitemap from being read |
| "Redirects in the sitemap waste crawl budget" (for these sites) | G8 scopes crawl budget to about a million pages; the claim that is supported is the extra hop (G2) |
| "A wrong `lastmod` makes Google ignore the whole sitemap" | G4 says Google stops believing the `lastmod`, not the sitemap |
| "`priority` and `changefreq` help" | G2 and G4: Google ignores both; B1: Bing largely disregards them |
| "Every site needs a sitemap" | G1, G9: a small, fully linked site may not |
| "S4's server errors in the sitemap" | All 22 answered 200 on the recheck: transient, not a sitemap defect |
| "S4's `lastmod` equals the publication date" | True on 2026-11-07, not on 2026-11-11 (§3.4) |
| "Matching `lastmod` and `dateModified` proves the page changed" | Both can be written by the same save; whether the change was significant (G2) is not visible from outside. That is theme 06 |
| Any statement about what Google indexed or shows for these sites | No Search Console access; no assistant-driven searches (proposal §4) |
| "Bing's 18%" as a statement about today or about Google | B1 is Bing's own 2023 measurement of its own index |

## (c) Open questions

- c1 **Demand.** No verified Brazilian demand for the candidate queries; the
  owner's manual check (Trends, Keyword Planner) decides between them (§(d)).
- c2 **Is the missing S2/S4 page a problem?** The documentation says a linked
  page is discoverable without a sitemap (G1). The article can only say the
  sitemap is incomplete against the site's own links; whether it matters for
  those pages needs Search Console.
- c3 **The all-`noindex` child sitemap of S3** may be a CMS default (a custom
  post type exposed by the SEO plugin while each item is set to `noindex`).
  Plausible, not verified; the article describes the contradiction, not its
  cause.

## (d) Proposed angle and primaryQuery

**Angle.** A checklist for auditing a sitemap against the site it describes,
one item per contradiction, each with a real anonymous case measured the same
day and the Google sentence it contradicts, plus what is not a problem. The
first-hand element is the run of §3 and the script that anyone can rerun; the
"No Next.js" section is this site's control and the test that ties the SEO
suite to the sitemap.

**Layer.** 1, generic hub (§5.2). Links `sitemap-dinamico-nextjs` for the
Next.js implementation and the pillar as reference implementation.

| | PT | EN |
|---|---|---|
| primaryQuery (proposed) | `auditoria de sitemap` | `sitemap audit` |
| alternative | `erros no sitemap` | `sitemap errors` |

`erros no sitemap` is probably the more searched phrase, but people typing it
usually have a Search Console error ("Couldn't fetch", "URL not allowed");
this page is about the defects the report does not flag. The owner's demand
check decides; neither is equivalent to `sitemap dinâmico next.js`.
