# Research — anatomy of a one-page-per-keyword site, November 2026

> **Status:** research note · 2026-11-09 · input for one article, not the article.
> **Question:** what does a site built on "one URL per keyword variation plus a
> nationwide list of cities on every page" put in the HTML its server delivers,
> and what does Google's current documentation say is the probable outcome of
> each piece?
> **Owner constraints (2026-11-09):** a new article, written as the analysis of
> one site, covering every technical point of that site and the theoretical
> outcome for a site of that kind. Nothing that lets a reader find the site.
> Technical parts only: no brand, funnel, business profile or keyword-demand
> reading. The site is S1 of `docs/proposals/case-studies-content.md`; the
> anonymity rules of its §3 apply, and results collected from Google by an
> assistant are not used (§4 there). Same day, after reading the draft: the
> site's exact totals (pages, list items) are not published; totals are
> rounded and page counts are given as proportions, here, in the versioned
> summary and in the article.
> **Method:** every Google page below was downloaded on 2026-11-09 (23:05 BRT,
> 2026-11-10 02:05 UTC) and read from its HTML. The "Last updated" date is the
> one printed on the page; the two Business Profile help pages print none.
> Nothing here relies on memory of what a page used to say. The history and the
> rater guidelines were read for `docs/research/2026-10-18-scaled-content-research.md`
> and are not repeated; where this note needs them it cites that note.
> **Labels:** **[documented]** = the source's own current text says it.
> **[inference]** = my reading, not stated by the source.
> **[observation]** = measured here by `scripts/template-anatomy.mjs` on the
> date given.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **2026-11-09**. IDs G1–G19 keep the numbering of the 2026-10-18
note; G20 onwards are new.

| ID | Source | Last updated (as printed) |
|---|---|---|
| G1 | [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies) | 2026-08-28 |
| G2 | [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | 2026-10-05 |
| G3 | [Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | 2026-07-10 |
| G5 | [Google Search's core updates and your website](https://developers.google.com/search/docs/appearance/core-updates) | 2025-12-10 |
| G15 | [What is canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) | 2026-08-20 |
| G16 | [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | 2025-12-10 |
| G17 | [Influencing your title links](https://developers.google.com/search/docs/appearance/title-link) | 2025-12-10 |
| G20 | [How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | 2026-07-10 |
| G21 | [Control your snippets in search results](https://developers.google.com/search/docs/appearance/snippet) | 2026-04-20 |
| G22 | [Google image SEO best practices](https://developers.google.com/search/docs/appearance/google-images) | 2026-03-02 |
| G23 | [Meta tags and attributes that Google supports](https://developers.google.com/search/docs/crawling-indexing/special-tags) | 2025-12-10 |
| G24 | [Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) | 2025-12-10 |
| G25 | [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot) | 2026-02-03 |
| G26 | [Link best practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) | 2025-12-10 |
| G27 | [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) | 2026-09-08 |
| G29 | [Mobile-first indexing best practices](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) | 2025-12-10 |
| G30 | [Tips to improve your local ranking on Google](https://support.google.com/business/answer/7091?hl=en) (Business Profile help) | not printed |
| G31 | [Manage your service areas](https://support.google.com/business/answer/9157481?hl=en) (Business Profile help) | not printed |
| G32 | [Overview of Google crawlers and fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers) | 2026-06-12 |

G1 has not changed since the 2026-10-18 note (same printed date). The three
passages the existing article `scaled-content-abuse` relies on are still there,
word for word: the cities-and-regions example under keyword stuffing, the four
doorway examples and the scaled content abuse definition.

---

## 1. What was measured **[observation]**

`scripts/template-anatomy.mjs`, run of **2026-11-10 UTC** (S1 collected at
02:16 UTC, one request at a time, 1 s apart, robots.txt read first, declared
user agent). Raw HTML only: no rendering, no search results. Versioned
output: `audits/case-studies/template-anatomy-2026-11-10/summary.json`. The
target file, the downloaded HTML and the per-page detail stay local.

**Rounding (owner, 2026-11-09).** For S1 the summary gives every count of
pages as a share of its set (two decimals) and rounds absolute totals: pages,
pairs and links to the nearest 10, list items down to the thousand, bytes to
the nearest 10,000. The tables below follow it. SITE's numbers are exact.

**Control:** the same script on this site's 25 Portuguese blog articles (SITE),
same run. It is a control for the method, not a competitor: different kind of
page, different size.

### 1.1 Inventory and template identity

| Measure | S1 | SITE |
|---|---|---|
| URLs listed by the site (all answered 200, none redirected) | about 190 | 25 |
| Pages on the keyword template ("landings") | about 180 | — |
| Landings at depth one (`/slug`) | all | 0 of 25 |
| `<title>` without the brand suffix equals the `<h1>` | all | 25 of 25 |
| Every image in the body has `alt` equal to the `<h1>` | all | 0 of 2 pages with images |
| Meta description is the opening of the body, cut with an ellipsis | all | 0 of 25 |
| Distinct titles / distinct descriptions | all / all | 25 / 25 |

### 1.2 URLs

| Measure | S1 | SITE |
|---|---|---|
| Pairs of URLs whose slug tokens overlap by ≥ 2/3 | about 80 pairs, 46% of the landings | 0 |
| Slugs that start with a commercial-intent word (maker, supplier, company, best…) | 17% | 0 |
| Tokens per slug (median) | 3 | 3 |

### 1.3 The repeated block (list of cities in tabs)

| Measure | S1 |
|---|---|
| Landings with the block | all |
| Distinct lists across the landings | 1 |
| Items in the list | more than 5,000 (more than 5,000 distinct names) |
| Tab panels / active on load | 26 / 1 |
| Share of the block's text that sits in the active panel | 5% |
| Block size in the HTML (median) | about 260 KB |
| Block as a share of the HTML bytes (median; min–max) | 55% (51–55%) |
| Block as a share of all the text on the page (median) | 78% |
| Page's own body as a share of all the text on the page (median) | 5.8% |
| HTML per landing (median) / per other page | about 470 KB / 160 KB |

SITE has no such block. Its article HTML has a median of 288 KB, so 470 KB is
not, by itself, a large page: what the measure shows is that more than half of
each landing is the same list.

### 1.4 Text of the body

| Measure | S1 | SITE (25 bodies) |
|---|---|---|
| Words in the body (median; p10–p90) | about 750 (580–940) | 2,722 (2,241–3,606) |
| Literal similarity with the nearest page (median; max) | 0.068; 0.215 | 0.011; 0.050 |
| Pairs with literal similarity ≥ 0.30 | 0 | 0 |
| Vocabulary similarity, term frequency (median; p90) | 0.667; 0.748 | 0.500; 0.606 |
| Vocabulary similarity, TF-IDF (median) | 0.340 | 0.235 |
| Pairs with vocabulary similarity ≥ 0.70 | about 50 | 0 |
| Bodies with no number followed by a unit of measure | all | 14 of 25 |
| Same, counting a percentage as a unit | 92% | 9 of 25 |
| Exact `<h1>` phrase as a share of the body's words (median; max) | 3.8%; 10.7% | 0%; 0% |
| Sentences (6+ words, keyword replaced by a slot) found in ≥ 10% of bodies | 10 | 3 |
| Bodies with at least one of those sentences | 89% | 25 of 25 |
| Pages sharing the most repeated sentence | 54% | 25 of 25 |
| Pages opening with the same six words | 42% | none repeated |

Reading notes:

- **The vocabulary number is weak on its own.** It depends on the weighting
  (0.667 with raw term frequency, 0.340 with TF-IDF), and a set of articles on
  one niche scores 0.500 with no template at all. It does not separate the two
  sets the way the other measures do.
- **"No number with a unit" is a heuristic for one kind of page.** On an
  equipment maker's product pages a capacity, a power or a temperature is the
  expected content, and none of the bodies has one; 8% of them carry a
  percentage. On SITE the same count is 14 of
  25, because an article about hreflang has no unit to quote. The measure means
  something only against what the page is supposed to describe.
- **SITE's one sentence on 25 of 25 pages** is the author line that closes
  every article, inside the measured region. It is a fixed element, like S1's
  call to action; it is reported, not removed.
- **Earlier runs.** The owner's private studies of 2026-11-03 and 2026-11-07
  reported two slightly different counts of pages without a technical number,
  with two different body separators and a unit list that included the
  percentage. This run uses one separator and reports both definitions; its
  count with the percentage matches the later study. Only this run's numbers
  are published.

### 1.5 Internal links

| Measure | S1 | SITE |
|---|---|---|
| Share of the other landings linked from each landing (median; min) | 100%; 100% | 21%; 13% |
| Internal links per page (median) | about 190 | 18 |
| Landings with a link, inside the body text, to another page of the site | none | 24 of 25 |
| "Related pages" block: links per page | 4 (3–4) | — |
| Landings never picked by any related block | 22% | — |
| Landings picked more than 10 times | 8% | — |

The most repeated body sentence (54% of the landings) recommends another
product "of ours" by name and carries no link.

### 1.6 Crawl and index signals

| Measure | S1 | SITE |
|---|---|---|
| robots.txt | 200 | 200 |
| `sitemap.xml` | 200, **0 URLs** | 200, 80 URLs |
| Pages with `rel="canonical"` | none | 25 of 25, all self-referencing |
| Pages with `noindex` | 0 | 0 |
| Same landing with a trailing slash, with `?x=1`, and `/index.php` | 200 each, no redirect, no canonical | not tested |
| JSON-LD types on landings | `BreadcrumbList` only (all) | `Article`, `BreadcrumbList`, `FAQPage` |
| `meta keywords` | present on every page, one value for all | absent |
| Other pages (about ten) that share a `<title>` with another page | 80% | — |
| Invented URL (run of 2026-11-09, `scripts/soft404-probe.mjs`) | 302 → 404, real 404 | 404 |

Everything in §1 was read from the HTML the server sent. Body, block, links and
metadata are all there without running JavaScript.

---

## 2. Piece by piece: what the documentation says and the probable outcome

### 2.1 One URL per variation of the same request

**[documented]** G1, doorway abuse: pages "created to rank for specific,
similar search queries"; one example is substantially similar pages that are
closer to search results than to a browseable hierarchy. G3: creating separate
content for every variation of how people search, primarily to manipulate
rankings or AI responses, violates the scaled content abuse policy; a high
quantity of pages does not make a site more relevant; systems understand
synonyms, so missing long-tail variations is not a problem to solve.

**[inference] Probable outcome.** About 80 pairs of URLs differ by a third of
their tokens or less, and 17% of the URLs only add a word meaning "who makes
or sells it".
Read against G1 and G3, these are several pages for one request. The documented
consequence is the policy's general one: such sites "may rank lower" or not
appear (G1). No document says which page Google shows when several target one
query.

**Not the canonical mechanism.** G15 clusters pages whose primary content is
the same or very similar. Here no pair of bodies reaches 0.30 of literal
similarity, so the documented deduplication is **not** the expected path. The
existing article states that mechanism for a template whose pages differ only by
the keyword; this site is the rewritten version, which leaves deduplication and
stays inside the wording of scaled content. That difference is the main
technical point the new article adds.

### 2.2 Body text filled from a mould

**[documented]** G1, scaled content abuse: many pages generated for the primary
purpose of manipulating rankings, typically unoriginal and of little value, "no
matter how it's created". One example is transformation by synonyms; the
example speaks of scraped content, so applying it to a site's own mould is
**[inference]**. G2: effort and originality are attributes of main content;
generating large amounts of text without manual oversight is little to no
effort; a self-check asks whether the reader is left needing to search again.

**[inference] Probable outcome.** Ten sentence moulds reach 89% of the bodies,
42% of the pages open with the same six words, and no body has a measurement
of the product it names. That is the description in G1 and G2. What the systems do
with it is not observable from outside.

### 2.3 The nationwide list of cities

**[documented]** G1, keyword stuffing, example:

> "Blocks of text that list cities and regions that a web page is trying to rank for" (G1)

G1, hidden text: accordion or tabbed content that toggles between hiding and
showing is listed among the things that do **not** violate the policy. G29:
content may be moved into accordions or tabs. G25: Googlebot fetches the first
2 MB of an HTML file, uncompressed.

**[inference] Probable outcome.** The block matches the example literally, and
the tabs are not what makes it a problem: the content is. At about 470 KB the
page is far below the 2 MB cut-off, so nothing is truncated. The measurable
cost is that 55% of every landing's HTML and 78% of its text are one list,
identical on every landing, and the page's own body is 5.8% of its text.

**[documented]** G30: local results are based mainly on relevance (how well a
Business Profile matches the search), distance and prominence; the page's
summary line says "popularity" for the third. G31: a profile accepts up to 20 service
areas, within about two hours' drive of the base. **[inference]** A list of
names in a page changes neither the distance to the searcher nor the
prominence of the business. Whether the list makes the page appear for
"product + city" queries is not measured here (see c).

### 2.4 Title, heading, alt and description from the keyword

- **Title = H1.** **[documented]** G17 suggests making the main title clear, for
  example by putting the title text in the first visible `<h1>`. The titles
  are distinct and short. SITE does the same on 25 of 25. **Not a problem.**
- **Alt = keyword on every image.** **[documented]** G22: alt text describes the
  image, in context; filling alt attributes with keywords is keyword stuffing
  and "may cause your site to be seen as spam". **[inference]** One phrase
  repeated as the alt of every image of a page describes none of them.
- **Description = truncated opening.** **[documented]** G21: generating
  descriptions programmatically is appropriate when they are page-specific and
  readable; identical or similar descriptions are not helpful. They are all
  distinct. A cut sentence is weak copy, not a policy matter. Google builds
  snippets primarily from the page content anyway.
- **Meta keywords.** **[documented]** G23: not used by Google Search, no effect
  on indexing or ranking. Neutral.

### 2.5 Every page links to every other page

**[documented]** G24: a site that is comprehensively linked internally may not
need a sitemap; G25: Googlebot discovers URLs mainly from links. G26: anchor
text gives context about the linked page. G16: organising a site logically
helps, with the caveat that Google understands pages regardless of structure.
G1 (doorway) is the only text that opposes a "browseable hierarchy" to pages
that look like search results.

**[inference] Probable outcome.** Discovery is not at risk: every landing is
one link from every other. The same fact means the links say nothing about
which page matters: every landing receives the same links from the same block.
The only per-page choice is the related block, and it leaves 22% of the
landings out and picks 8% more than ten times. No document says a flat mesh is penalised.

### 2.6 Empty sitemap, no canonical, URL variants answering 200

**[documented]** G24: a sitemap helps discovery and guarantees nothing; a
site of about 500 pages or fewer, fully linked, may not need one. G20: none of
the canonical methods is required; without one, Google identifies the best
version itself; redirects and `rel="canonical"` are strong signals, sitemap
inclusion a weak one. G15: when the same content is reachable at several URLs,
Google clusters them and picks one.

**[inference] Probable outcome.** The empty sitemap costs nothing in discovery
here; it removes one (weak) canonical signal and whatever reporting the owner
would get from it. With no canonical and three variants of each URL answering
200, the choice of which URL represents each page is left entirely to Google.
That is tolerated by the documentation, and it is the opposite of control.

### 2.7 Structured data

**[documented]** G27: Organization markup on the home page helps Google
understand and disambiguate the organisation; there are no required properties.
Structured data makes a page eligible for a feature and guarantees nothing.

**[inference] Probable outcome.** `BreadcrumbList` alone is valid. The site
states nowhere, in machine-readable form, which organisation it is or what it
sells. That is an absence, not an error.

### 2.8 Pages that share a title

**[documented]** G17: every page should have distinct title text; when titles
repeat, Google may generate a title link from other sources on the page.

**[inference] Probable outcome.** For the institutional pages that share one title,
the title link shown is probably not the one in the `<title>`.

### 2.9 Recovery, if the owner changed course

**[documented]** G5: improvements can take months to be recognised, sometimes
only at a later core update; deleting content is a last resort, and wanting to
delete whole sections suggests they were made for search engines; no guarantee.
Covered at length in the existing article; the new one links it.

---

## 3. What the site does that the documentation does not object to

Listed so the article does not turn neutral facts into findings.

| Fact (§1) | Why it is not a finding | Source |
|---|---|---|
| Title equals H1 | Suggested by the title-link guide; SITE does the same | G17 |
| "Keyword – Brand" titles, all distinct | Concise and distinct is what the guide asks | G17 |
| Content inside tabs | Tabs and accordions are explicitly allowed | G1, G29 |
| Descriptions generated by a rule | Appropriate when page-specific | G21 |
| No `rel="canonical"` | Not required | G20 |
| No usable sitemap on a small, fully linked site | A sitemap may not be needed | G24 |
| Meta keywords | Ignored | G23 |
| About 470 KB of HTML | Below the 2 MB fetch limit; SITE's articles are 288 KB | G25 |
| Content present without JavaScript | What the server sends is what there is | §1 |
| Unknown URL answers a real 404 (after a 302) | Correct status | soft 404 run |
| Many landing pages, as such | The policies name purpose and value, not a page count | G1, G3 |

---

## 4. Anonymity, for this article

On top of `docs/proposals/case-studies-content.md` §3:

- **The template belongs to a platform, so its sentences are a search key.**
  No heading, opening sentence, call to action or block title appears, in
  either language, in the article, the note, the brief or a commit message.
  Describe the defect ("a slot filled with the wrong gender", "a sentence that
  recommends another product and carries no link").
- **No slug and no keyword of the site.** The URL grammar is shown on an
  invented sector and labelled illustrative. The numbers are the real ones.
- **Sector kept broad:** "an industrial equipment maker". No region, no product
  family, no fuel, no customer segment.
- **Left out entirely:** the second domain, the brand reading, the business
  profile, phone numbers, years in business, the footer rendering bug, the
  platform and the agency, any count of other sites on the same template.
- **No exact totals (owner, 2026-11-09).** The number of pages and of list
  items is given rounded ("about 180 pages", "more than five thousand
  cities") and counts of pages as proportions. The city block is described as
  a regionalization section listing cities from every state. The versioned
  summary follows the same rule; the exact values exist only in the local
  detail file. A number the owner did not measure is never substituted: the
  rounded value is still the measured one.
- **Ceiling.** A reader who knows the Brazilian market will recognise the class
  of platform from the model itself. The article cannot prevent that; it never
  confirms it.

---

## (a) Claims the article can make

Levels per CLAUDE.md §10. Level 3 = a number from §1, always with the run date.

| # | Claim | Level | Source |
|---|---|---|---|
| a1 | Every number in §1, as "what this server sent on 2026-11-10" | 3 | summary.json, §1 |
| a2 | The cities-and-regions block is the literal example of keyword stuffing in the spam policies | 1 | G1 |
| a3 | Tabs are not the problem: tabbed content is explicitly allowed | 1 | G1, G29 |
| a4 | A page per variation of how people search, made primarily to manipulate rankings, is named as scaled content abuse; volume does not add relevance; synonyms are understood | 1 | G3 |
| a5 | Substantially similar pages closer to search results than to a browseable hierarchy are a doorway example | 1 | G1 |
| a6 | Sites that violate the policies may rank lower or not appear; detection is automated and, as needed, by human review that can result in a manual action | 1 | G1 |
| a7 | If the bodies are rewritten rather than copied, the documented deduplication (cluster, pick one canonical) is not what applies; the policy wording is | 2 | G15 + §1.4 |
| a8 | A duplicate-text checker would report nothing on this set (no pair ≥ 0.30) while 89% of the bodies share sentence moulds | 3 | §1.4 |
| a9 | Vocabulary similarity alone does not separate a template from a niche | 3 | §1.4 (S1 vs SITE, two weightings) |
| a10 | Alt text filled with the keyword is named as keyword stuffing in the image guide | 1 | G22 |
| a11 | Title = H1, generated descriptions, no canonical, no sitemap on a small linked site and meta keywords are not problems in the documentation | 1 | G17, G21, G20, G24, G23 |
| a12 | Without a canonical and with URL variants answering 200, Google chooses the representative URL | 2 | G20, G15 + §1.6 |
| a13 | A flat mesh keeps every page discoverable and gives no page more weight than another | 2 | G24, G25 + §1.5 (inference stated as such) |
| a14 | Local results are described as based mainly on relevance of the Business Profile, distance and prominence; service areas are capped at 20 | 1 | G30, G31 |
| a15 | The page is not truncated: Googlebot's limit for HTML is 2 MB | 1 + 3 | G25 + §1.3 |
| a16 | Recovery wording (months, no guarantee, deleting as last resort) | 1 | G5 |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "The site was penalised", "lost traffic", "does not rank", "ranks for X" | No Search Console; results collected by an assistant are not used (proposal §4). The private samples even show mid-tail positions, so "it does not work" would be false as well as unsourced |
| "This is spam" / "the site violates the policy" | A verdict. Say "the pattern the policy describes" |
| "Google ignores the block" or "Google counts the block" | Not documented either way (2026-10-18 note, c2) |
| "Google clusters the template pages into one" | Contradicted by §1.4: the bodies are not near-duplicates |
| "Duplicate content" as the diagnosis | Literal similarity is low, and duplication is not a policy violation (G15, G16) |
| "Title equal to H1 is a mistake" | G17 points the other way; SITE does it |
| "The pages are too heavy" | About 470 KB is under the limit and not unusual; the point is the share |
| "Vocabulary similarity of 0.67 proves the text is the same" | §1.4: weighting halves it and a normal blog scores 0.50 |
| "The list has every city in Brazil" or any comparison with the official count | The official count was not verified (IBGE answered 403 on 2026-11-09); "more than five thousand names, from every state" is what was measured |
| "Removing the block brings traffic back" / any recovery promise | G5 gives no guarantee |
| "A page per city is always a doorway" | G1's wording is narrower |
| Any sentence, slug, sector detail or count of sibling sites | §4 |
| Raw vs rendered "14 of 14" from the private study | Not produced by a versioned script; §1 already shows the content is in the served HTML |
| The S2 inventory contrast with its private numbers (0.113 / 0.683) | Not re-measured by this script; see c3 |

## (c) Open questions

1. **Demand for the primaryQuery.** Not checked. Trends and Keyword Planner are
   the owner's, by hand (no Google query from the assistant).
2. **Does the list bring "product + city" impressions?** Unknown from outside.
   It is what the deferred manual tests T0–T2 of the S1 plan would measure. The
   article says it is unmeasured and that the recommendation does not rest on it.
3. **The inventory counter-example.** The private studies have a second site
   (S2) where pages come from real inventory and the vocabulary score is about
   the same. Publishing that contrast needs S2 run through this script
   (one more dated collection). Without it the control is SITE only.
4. **Official number of municipalities**, to compare with the list: IBGE
   page not readable on 2026-11-09 (HTTP 403).
5. **How Google weighs a body block repeated on every page:** undocumented
   (unchanged from the 2026-10-18 note).
6. **Employment contract.** The owner's legal note recommends checking it
   before publishing analyses of sites served by other agencies. Outside this
   note; flagged because this is the most exposed article of the series.

## (d) Proposed angle and primaryQuery

**Angle.** The existing article maps Google's text onto a fictional template and
says it has no measurement. This one is the measurement: one real site of that
model, anonymous, taken apart piece by piece from the HTML it serves, each
piece set against the documentation, ending in the probable outcome and in what
cannot be known from outside. Its own finding is §2.1: rewriting the text moves
the site out of deduplication and leaves it inside the policy wording, and a
duplicate checker sees nothing.

**First-hand element (gate 1).** `scripts/template-anatomy.mjs` and
`audits/case-studies/template-anatomy-2026-11-10/summary.json`, with this site
as the control. The "No Next.js" section quotes the control's numbers and the
repo code that produces them (canonical, sitemap, `dynamicParams = false`,
JSON-LD), all real.

**Overlap (gate 3).** `scaled-content-abuse` owns "scaled content abuse"
(what the policy says). The new page must not be a second page for the same
request, which would be the very pattern it describes. It takes a decision
query and links the policy article for the definitions instead of repeating them.

| Candidate primaryQuery (PT) | English pair | Note |
|---|---|---|
| `uma página por palavra-chave` | `one page per keyword` | The decision a developer or owner is asked to take; closest to the content |
| `seo programático` | `programmatic seo` | The developer's name for generating pages from a list; broader than the case |
| `páginas por cidade` | `city landing pages` | Covers only the block, a third of the article |

**Recommendation:** `uma página por palavra-chave` / `one page per keyword`,
with the other two as `keywords` for the on-site search. Demand: **não
verificado** (c1).
