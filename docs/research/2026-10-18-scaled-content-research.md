# Research — the "agency template" content model and Google, October 2026

> **Status:** research note · 2026-10-18 · input for one article, not the article.
> **Question:** does Google's current documentation support the thesis that the
> templated "agency" model (serial articles, a fixed block of served cities and
> neighbourhoods on every page, an identical institutional closing, title = H1,
> one commercial page per keyword variation) no longer works?
> **Owner constraints:** the client case that motivated the topic is not
> evidence and is not cited; none of its numbers enter the article. The
> article's example is a fictional site with no invented numbers.
> **Method:** every Google page below was downloaded on 2026-10-18 and read
> in full from its HTML. The "Last updated" date is the one printed on the page.
> Pages that now redirect were read from the Internet Archive and are marked
> as such. Nothing here relies on memory of what a page used to say.
> **Labels:** **[documented]** = Google's own current text says it.
> **[documented, historical]** = Google said it, but the page is retired or
> superseded. **[inference]** = my reading, not stated by Google.
> **[third-party]** = secondary evidence, with sample, method and conflict of
> interest listed. **[observation]** = something I measured on 2026-10-18.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **2026-10-18**.

| ID | Source | Last updated (as printed) |
|---|---|---|
| G1 | [Spam policies for Google web search](https://developers.google.com/search/docs/essentials/spam-policies) | 2026-08-28 |
| G2 | [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | 2026-10-05 |
| G3 | [Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | 2026-07-10 |
| G4 | [Guidance on using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) | 2026-10-01 |
| G5 | [Google Search's core updates and your website](https://developers.google.com/search/updates/core-updates) | 2025-12-10 |
| G6 | [A guide to Google Search ranking systems](https://developers.google.com/search/docs/appearance/ranking-systems-guide) | 2025-12-10 |
| G7 | [Search Central documentation changelog](https://developers.google.com/search/updates) | 2026-10-16 |
| G8 | [Search Status Dashboard, ranking history](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history) and each incident page | per incident (§3) |
| G9 | [What creators should know about Google's August 2022 helpful content update](https://developers.google.com/search/blog/2022/08/helpful-content-update) | published 2022-08-18; carries an "may be outdated" banner |
| G10 | Helpful content system doc, `developers.google.com/search/updates/helpful-content-update`, read from the [Internet Archive snapshot of 2023-11-08](http://web.archive.org/web/20231108122246/https://developers.google.com/search/updates/helpful-content-update). The live URL now 301-redirects to G6 `#helpful-content` | 2023-09-14 |
| G11 | Helpful content FAQ, `developers.google.com/search/help/helpful-content-faq`, read from the [Internet Archive snapshot of 2024-03-06](http://web.archive.org/web/20240306031006/https://developers.google.com/search/help/helpful-content-faq). Live URL 301-redirects to G6 | 2024-03-05 |
| G12 | [Google Search: New updates to address spam and low-quality results](https://blog.google/products/search/google-search-update-march-2024/) (blog.google, page `<title>`) | published 2024-03-05; update note 2024-04-26 |
| G13 | [What web creators should know about our March 2024 core update and new spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) | published 2024-03-05; update note 2024-06-04 |
| G14 | [Search Quality Rater Guidelines (PDF)](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf), the URL G2 and G4 link to | cover date **September 11, 2025**; HTTP `Last-Modified` 2025-09-11 |
| G15 | [What is canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) | 2026-08-20 |
| G16 | [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) | 2025-12-10 |
| G17 | [Influencing your title links](https://developers.google.com/search/docs/appearance/title-link) | 2025-12-10 |
| G18 | [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) | 2025-12-10 |
| G19 | [Google Search's guidance about AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) | published 2023-02-08 |

Third-party and Brazilian sources are listed where used (§4, §5).

---

## 1. Google's current text on the practices in the thesis

### 1.1 Scaled content abuse **[documented]** — G1

Defined as many pages "generated for the primary purpose of manipulating search
rankings and not helping users", typically unoriginal content of little value,
"no matter how it's created". The examples:

- generative AI or similar tools used to make many pages without added value;
- scraping feeds or search results, including automated synonymizing or translation;
- stitching or combining content from other pages without adding value;
- multiple sites that hide the scaled nature of the content;
- many pages that make little sense to a reader but contain search keywords.

The section ends: if you host such content, exclude it from Search.

G13 (2024) explains the change from the old "automatically-generated content"
policy: the new one applies "whether automation or humans are involved".
**[documented, historical]** That is the line that covers an agency writing by
hand to a template.

### 1.2 Keyword stuffing, including the cities example **[documented]** — G1

> "Blocks of text that list cities and regions" (G1, keyword stuffing examples)

The other two examples are lists of phone numbers without added value, and
repeating the same words or phrases until it sounds unnatural. The definition
adds that the keywords "often" appear "in a list or group, unnaturally, or out
of context". G16 repeats it in "Things we believe you shouldn't focus on":
repetition "(even in variations)" is against the spam policies.

### 1.3 Doorway abuse **[documented]** — G1

"Sites or pages … created to rank for specific, similar search queries" that
lead to intermediate pages less useful than the destination. Examples:

- multiple sites with slight URL and home-page variations;
- multiple domains **or pages targeted at specific regions or cities that funnel users to one page**;
- pages generated to funnel visitors to the usable part of a site;
- "substantially similar pages that are closer to search results than a
  clearly defined, browseable hierarchy".

**[inference]** The policy names *funnelling* and *substantial similarity*. It
does not say every page per keyword or per city is a doorway. A location page
with content specific to that place falls outside the wording.

### 1.4 Helpful content self-assessment **[documented]** — G2

> "Google has a preferred word count? (No, we don't.)" (G2)

The questions the thesis needs, all on the live page:

- producing "lots of content on many different topics in hopes that some of it might perform well";
- "using extensive automation to produce content on many topics";
- mainly summarizing others without adding value;
- writing to a word count;
- "changing the date of pages to make them seem fresh when the content has not substantially changed";
- adding or removing a lot of content to make the site seem "fresh" ("No, it won't");
- content "mass-produced by or outsourced to a large number of creators … so that individual pages … don't get as much attention or care";
- Who / How / Why: bylines "where one might be expected", disclosure of automation.

New since my last note (the page was updated 2026-10-05): a **Main content**
section. It lists "page titles and headings" as main content and describes the
four attributes raters judge: effort, originality, talent or skill, accuracy.
On effort it gives an example: "automatically generating pages from feeds or
using generative AI to produce large amounts of text without manual oversight"
is little to no effort.

### 1.5 Commodity vs non-commodity **[documented]** — G3

The guide gives no formal definition. It describes **commodity** content
("7 Tips for First-Time Homebuyers") as often based on common knowledge that
"could originate from anyone", adding little unique insight. **Non-commodity**
content ("Why We Waived the Inspection & Saved Money…") gives expert or
first-hand takes beyond common knowledge.

Relevant to the "pages per keyword variation" part of the thesis: making
separate content "for every possible variation of how people might search"
(including fan-out queries), primarily to manipulate rankings or AI responses,
"violates Google's scaled content abuse spam policy". The guide adds that a
high number of pages does not make a site more relevant.

### 1.6 Generative AI content guidance **[documented]** — G4

> "generate many pages without adding value for users may violate" (G4)

Updated 2026-10-01 with rater-guideline material (changelog G7, same date). It
points to rater guidelines §4.6.5 (scaled content abuse) and §4.6.6 (main
content with little to no effort, originality or added value). It says those
guidelines are not a guide to ranking first and that ratings "don't directly
influence ranking". It asks for review of AI-written **metadata** too: `<title>`,
meta description, structured data, image alt text. That is the generated
title/alt in the template.

### 1.7 Core updates page **[documented]** — G5

Core updates are "broad in nature, and don't target specific sites or
individual web pages". For a sustained, large drop it asks you to check
whether "your site overall (not just individual pages)" is helpful. It says
deleting content is a last resort, and that wanting to delete whole sections
suggests they were made for search engines first. Recovery: §8.

### 1.8 Rater guidelines §4.6.5 and §4.6.6 (edition of 2025-09-11) — G14

The URL Google links from G2 and G4 serves the **September 11, 2025** edition.
I found claims of May and June 2026 editions only on one blog, not confirmed
by Google, so I did not use them (§c).

**§4.6.5 Scaled Content Abuse.** It opens by calling an abundance of low-effort,
unedited content "often the defining attribute of spammy websites". It restates
the G1 definition with "compared to other similar pages on the web" added, and
lists the same five examples. The rating rule:

> "should be rated Lowest, no matter how they are created" (G14, §4.6.5)

Raters should give Lowest when they "strongly suspect" scaled abuse "after
looking at several pages on the website". **[inference]** That is a site-level
judgement made by sampling pages, which matches the template problem: the
pattern shows only across pages.

**§4.6.6 Little to no effort, originality, added value.** Lowest applies when
"all or almost all" of the main content is copied, paraphrased, embedded, auto-
or AI-generated, or reposted with little effort, originality or value, even with
credit given. It defines "copied with minimal alteration" (including
find-and-replace across a text) and paraphrase by people or AI. It also says
copying or paraphrasing does not make a page Lowest by itself. The use of
generative AI "alone does not determine" effort or rating.

**Worked examples in the section (pages 53–55)** **[documented]**:

- an error-code site where each page is created "by filling in a template from a list of error code information", with a missing value showing no manual check;
- an affiliate page made by "substituting different product names into a generic template" from Amazon content;
- a site with "hundreds of templated articles" of paraphrased content off its stated purpose. The Q&A format is called a common way to scale content from "People also ask" questions;
- a Q&A page with "repetitive questions" ("Is 40 degrees too cold for chickens?" and variants). **[inference]** This is the closest example to the keyword-variation pattern.

Related, §5.2.2 **Filler**: low-effort content that "can artificially inflate
content". A Low rating applies when there is a large amount of it, or when it
pushes the helpful content down the page. **[inference]** A 500-word block of
neighbourhoods above or inside the article fits this description. The
guidelines do not name that case.

---

## 2. Site-level vs page-level: what is documented

| Period | Text | Label |
|---|---|---|
| 2022-08-18 | The HCU "introduces a new site-wide signal". Any content on sites with "relatively high amounts of unhelpful content overall is less likely to perform well". Removing unhelpful content "could help the rankings of your other content". Classifier is automated, continuous, "not a manual action nor a spam action", weighted, English only at launch (G9). | documented, historical |
| 2023-09-14 doc | "The system generates a site-wide signal". Same wording on other content. New: third-party content on the main site or subdomains "may be included in site-wide signals"; recommends blocking it from indexing if independent of the site's purpose (G10). | documented, historical |
| 2024-03-05 | "There's no longer one signal or system" for helpfulness (G13). FAQ: core systems are "primarily designed to work on the page level", with "some site-wide signals". High amounts of unhelpful content "might cause other content on the site to perform less well … to a varying degree" (G11). | documented, historical (FAQ redirected 2024-08-15 per G7) |
| today | G6: "Our ranking systems are designed to work on the page level" and "site-wide signals and classifiers are also used". Good site-wide signals don't mean all content ranks highly, and poor ones don't mean all content ranks poorly. The helpful content system is under **Retired systems**: in March 2024 it "evolved and became part of our core ranking systems". | documented |
| today | G5: recovery means systems learning that "the site as a whole" produces helpful content. Self-assess "your site overall (not just individual pages)". | documented |
| today | G1, site reputation policy (updated 2026-08-28): Google "generally applies a presumption that individual pages (including new pages) match the overall quality of other pages on the domain". The FAQ calls this a presumption applied globally, which no longer applies to a portion categorized as separate (EEA). | documented, but stated inside the site reputation policy |

**What can be said:**

1. **[documented]** From 2022 to March 2024 Google said in plain words that
   unhelpful content was classified at site level and could hold back the rest
   of the site.
2. **[documented]** Since March 2024 there is no separate helpful content
   classifier. Google describes its systems as page-level, with site-wide
   signals and classifiers also used. It does not say which ones, what they
   measure or how much they weigh.
3. **[documented]** The general presumption that a page matches its domain's
   quality is written in G1 today. Google states it in the site reputation
   section.
4. **[inference]** Whether site-wide signals react to a template repeated on
   every page (the cities block, the fixed closing) is not documented. It is
   plausible, because the pattern exists only at site level and raters are told
   to judge it "after looking at several pages". It is not a fact.
5. **[inference]** "The whole site dropped together" is consistent with a
   site-wide signal. It is equally consistent with many pages sharing the same
   page-level defect. Google's text does not let you tell the two apart from
   outside.

---

## 3. Timeline (primary sources only)

Dates in US/Pacific as printed on G8. "Ended" = rollout complete.

| Date | Event | Source |
|---|---|---|
| 2022-08-25 → 09-09 | August 2022 helpful content update; site-wide signal, English first | G8, G9 |
| 2022-12-05 → 2023-01-12 | December 2022 HCU; "works across content globally in all languages" | G8 |
| 2023-09-14 → 09-28 | September 2023 HCU; "improves our classifier". Doc updated the same day (third-party content, site-wide) | G8, G7, G10 |
| 2023-10 / 11 | October and November 2023 core updates; October 2023 spam update | G8 |
| 2024-03-05 | March 2024 core update (to **2024-04-19**) + March 2024 spam update (to 03-20). New policies: **expired domain abuse, scaled content abuse, site reputation abuse**. HCU stops being a separate system. Target "40%" reduction | G8, G12, G13, G7 |
| 2024-04-26 | blog.google note: rollout done on 04-19; "45% less low-quality, unoriginal content … versus the 40% improvement we expected". Google's own metric, method not disclosed | G12 |
| 2024-05-05 | Site reputation abuse enforcement starts | G13 |
| 2024-08-15 | Core updates doc restructured; helpful content FAQ redirected; HCU section moved to the archived part of G6 | G7 |
| 2024 | Core updates Aug (08-15 → 09-03), Nov (11-11 → 12-05), Dec (12-12 → 12-18); spam Jun, Dec | G8 |
| 2025 | Core updates Mar (03-13 → 03-27), Jun (06-30 → 07-17), Dec (12-11 → 12-29); spam update Aug (08-26 → 09-22) | G8 |
| **2025-12-09** | Changelog: "Adding a section on smaller core updates". Purpose: site owners who improve content can rise "without having to wait for the next major core update" | G7, G5 |
| 2026-02-05 → 02-26 | February 2026 Discover core update | G8, G7 |
| 2026-03-24 → 03-25 | March 2026 spam update | G8 |
| 2026-03-27 → 04-08 | March 2026 core update | G8 |
| 2026-04-13 | New spam policy: back button hijacking | G7 |
| 2026-05-15 | Spam policies "apply to all of Google Search, including generative AI responses". Generative AI optimization guide (G3) published | G7 |
| 2026-05-21 → 06-02 | May 2026 core update | G8 |
| 2026-06 / 08 / 09 | Spam updates: Jun (06-24 → 06-26), Aug (08-18 → 08-21), Sep (09-24 → 10-08) | G8 |
| 2026-08-28 | Site reputation policy updated for the EEA (the page-matches-domain presumption is in this text) | G7, G1 |
| 2026-10-01 | Generative AI content guidance updated with rater-guideline material (§4.6.5/4.6.6) | G7, G4 |
| 2026-10-05 | Helpful content page updated (main content attributes) | G2 |

**[documented]** No helpful content update has been announced since
September 2023, and none can be, because the system is retired (G6).

---

## 4. Third-party evidence on hit sites **[third-party]**

All secondary. None measures template features (city blocks, boilerplate,
keyword-variation pages) as a variable. Gaps in method are listed as found.

| Source | What | Sample and method | Conflict of interest |
|---|---|---|---|
| [Originality.ai, March 2024 manual-action study](https://originality.ai/blog/google-march-2024-manual-action-ai-update-list) (no date printed; describes tests from 2024-03-07) | ~1,446 of ~79k sites deindexed (~1.9%); 151 of 175 deindexed sites had likely AI content | Sites drawn from BuiltWith lists of MediaVine/Raptive/Ezoic ad-network sites. "Manual action" is **inferred** from traffic in February plus deindexing, not confirmed. AI scored by the vendor's own detector (5% threshold for "likely AI"). No control group: it does not show AI share is unusual among non-deindexed sites | Sells the AI detector used for every measurement |
| [Search Engine Journal, 2024-03-12](https://www.searchenginejournal.com/googles-march-2024-core-update-impact-hundreds-of-websites-deindexed/) relaying Ian Nuttall | 837 of 49,345 tracked sites fully deindexed (~1.7%); 21 already partly back | Sample selection not described; index status by script | Nuttall is not described as selling a product here; SEJ is ad-funded news |
| [Marie Haynes, March 2024](https://www.mariehaynes.com/category/march-core-update) | No meaningful recoveries seen from the September 2023 HCU at the time | Anecdotal; no site count | Sells consulting, courses and a book |
| [Search Engine Roundtable, 2025-07-10](https://www.seroundtable.com/google-june-2025-core-update-recoveries-39735.html) (Barry Schwartz) | Partial recoveries of Sept-2023-HCU-hit sites during the June 2025 core update | Anecdotes from Glenn Gabe's posts on X, forums and commenters; **no counts** | Ad-funded news |
| [Raptive, last updated 2025-09-17](https://raptive.com/blog/what-did-googles-june-2025-core-update-tell-us-about-seo/) | "Nearly 60%" of its sites hit hard by the Sept 2023 HCU rebounded in June 2025 | >4,100 sites in its own network; "hit hard" not defined; traffic source and windows not stated; correlational | Ad network whose revenue depends on its sites' traffic |
| Glenn Gabe (GSQi) | Tracks a few hundred HCU-hit sites; reported partial surges in Aug 2024 and June 2025 | **Not opened.** gsqi.com returned HTTP 403 to every fetch. The counts circulating ("360+", "380+", "22%") reached me only through summaries | Consultant |

**What this supports:** large site-level drops and deindexing happened around
2023-09 and 2024-03. Some HCU-hit sites partly recovered in later core updates
(2024-08, 2025-06), without any public study tying recovery to specific content
changes. **What it does not support:** any claim that template features caused
the drops, or any rate.

---

## 5. Brazilian context

### 5.1 "MPI" **[observation]**

- "MPI" is sold as **"Marketing de Posicionamento na Internet"** by
  Doutores da Web ([Tecnologia MPI](https://www.doutoresdaweb.com.br/tecnologia-mpi/),
  no date, footer © 2026). The product page promises first results in "cerca
  de 02 a 06 meses", first-page placement and lower cost than paid ads. It
  gives no method detail (how many pages, per keyword or per region) and no
  verifiable evidence of results: only testimonials and unsourced company
  figures.
- **The vendor's own site shows the pattern.** Its `/sitemap.xml` (a Screaming
  Frog 17.2 export, 199 URLs, all `lastmod` 2024-11-18) has **17 slugs built
  on "aparecer … google"** alone (`aparecer-google`, `como-aparecer-google`,
  `fazer-site-aparecer-google`, `aparecer-primeiro-google`,
  `como-fazer-meu-site-aparecer-google`…). Plus many on "divulgar site/empresa",
  "empresa/agência MPI" and "anunciar site google". In the three pages I opened,
  `<title>` = keyword + brand and `<h1>` = keyword.
- **They are not textual duplicates.** Shared 5-word shingles between pairs of
  those three pages: Jaccard **0.15–0.20**. This was measured on the full
  extracted text, so shared navigation and footer are included and the overlap
  of the body alone is lower. The text is rewritten per variation. **[inference]**
  For the article: this pattern is better described by *doorway* ("substantially
  similar pages") and *scaled content* than by "duplicate content". A
  duplicate-text detector would not flag it.
- I found **no public count** of how many Brazilian sites use MPI-style
  structures, and **no independent evidence** of results, for or against.

**Recommendation:** do not name the vendor in the article. The finding is one
vendor's own site, and naming a company in a piece about spam carries legal and
fairness risk with little gain. Describe the pattern generically. Keep this
observation in `/docs` only if the owner wants it.

### 5.2 "Regiões atendidas" blocks

No public study or count found. Searches return local-SEO forum threads and
course pages, none with data. The only primary statement is G1's
cities-and-regions example (§1.2).

---

## 6. Boilerplate, near-duplicates and canonical choice

- **[documented]** G15: when indexing, Google "determines the primary content (or
  centerpiece) of each page". If pages seem the same or their primary content
  is very similar, it clusters them and picks as canonical the one that is
  "objectively the most complete and useful"; duplicates are crawled less
  often. Some duplicate content is normal and "not a violation of Google's
  spam policies".
- **[documented]** G16: no duplicate content "penalty"; it is "inefficient" but
  won't cause a manual action. "Copying others' content, however, is a different
  story". G3: reduce duplicate content "if you have time".
- **[documented]** G17 is the only current page that uses the word *boilerplate*,
  and it does so for titles:

  > "Avoid repeated or boilerplate text in <title> elements" (G17)

  Titles that vary "by only a single piece of information" are called bad, and
  Google may rewrite title links for "micro-boilerplate".
- **[documented]** G14 §2.4 separates main content (MC) from supplementary
  content (SC). G2 now lists titles and headings as main content.
- **[inference]** I found no **current** Google page on how body boilerplate
  repeated on every page is weighted (ignored as template, or counted). Older
  Google advice on "minimizing boilerplate repetition" is not in any page I
  read today, and I did not verify where it went. The article should not claim
  either way.
- **[inference, level 2 at most]** The technical hook that does hold: if the
  only thing that changes between template pages is the keyword (or city), then
  the part that varies is small next to the shared part. Google's documented
  behaviour is to cluster pages whose primary content is very similar and index
  one. Google's own text never says this about city pages.

---

## 7. Formatting myths

| Claim people make | What Google says | Label |
|---|---|---|
| There is an ideal word count | "No, we don't" (G2); "no magical word count target, minimum or maximum" (G16); "There's no ideal page length" (G3) | documented |
| Content must be chunked for AI | "There's no requirement to break your content into tiny pieces" (G3) | documented |
| Number / order of headings matters | Heading order doesn't matter to Search; no ideal number of headings (G16) | documented |
| Title equal to H1 is a problem | Not stated anywhere. G17 lists the `<h1>` as a title-link source and suggests putting the title text "in the first visible <h1>". **This contradicts the thesis item.** The documented title problems are boilerplate titles and keyword stuffing | documented (by absence + G17) |
| Lists, bold, em dashes, "AI-sounding" style are penalized | **Not mentioned** in G1–G6, G16, G18. G2 asks about "spelling or stylistic issues" and "sloppy or hastily produced" content only | documented by absence |
| AI text is penalized as such | "Appropriate use of AI or automation is not against our guidelines" (G19, 2023). G14 §4.6.6: AI use "alone does not determine" effort or rating. G1 targets scale and value "no matter how it's created" | documented |

---

## 8. Recovery

- **[documented]** G5: some changes "can take effect in a few days", but

  > "could take several months for our systems to learn and confirm" (G5)

  that "the site as a whole" is helpful long term. No effect after a few months
  may mean waiting for the next core update. Since 2025-12-09 the page also says
  smaller, unannounced core updates are another way to rise. There is "no
  guarantee" that changes will have a noticeable impact.
- **[documented, historical]** G9/G10 (2022–2023): the classifier ran
  continuously and might apply "over a period of months" until unhelpful content
  "has not returned in the long-term". G11 (2024): "no set timeline".
- **[documented]** G5: deleting is a last resort. If whole sections were made
  for search engines, deleting them "can help the good content on your site
  perform better".
- **[third-party]** §4: partial recoveries were reported in later core updates,
  roughly 10 and 21 months after the September 2023 HCU. No rates are verified.

---

## 9. AI search and commodity content

- **[documented]** G18: no extra requirements for AI Overviews or AI Mode. A
  supporting link must be indexed and snippet-eligible. AI Overviews "often don't trigger".
- **[documented]** G3: features rely on core ranking systems and on other
  systems that block spam: "our generative AI features depend on both". A unique
  viewpoint can help a page "stand out" because these systems look at many
  sources. Since 2026-05-15 spam policies explicitly cover generative AI
  responses (G7, G1).
- **Not documented:** that commodity content loses citations in AI Overviews or
  AI Mode. G3 recommends non-commodity content for visibility "in the long run"
  without describing a selection rule.
- **[third-party]** [On-Page.ai Research, 2026-07-15](https://api.on-page.ai/research/ai-citation-study)
  (Eric Lancheres): on 50 hand-picked English keywords (US, one day, AI
  Overviews via SerpApi), pages cited by AI Overviews were **not** more original
  than uncited ranking pages, using the publisher's "Information Gain" score
  (medians 52 vs 55.5, p = .07). The most original page was included in 33% of
  eligible results. Three in four citations went to pages off page one.
  Limitations are stated. Conflict: the publisher sells the metric. **This cuts
  against** "non-commodity content gets cited".

---

## (a) Claims the article can make

Levels per CLAUDE.md §10: 1 = mechanism/documented direction, no numbers;
2 = conditional; 3 = magnitude (needs declared measurement).

| # | Claim | Level | Source |
|---|---|---|---|
| a1 | Google's spam policy gives "blocks of text that list cities and regions" a page wants to rank for as an example of keyword stuffing | 1 | G1 |
| a2 | Scaled content abuse covers producing many low-value pages to manipulate rankings, whether a human, a script or an AI wrote them | 1 | G1, G13, G14 §4.6.5 |
| a3 | Pages made to rank for similar queries, including pages per region or city that funnel to one page, are named as doorway abuse | 1 | G1 |
| a4 | Making one page per query variation primarily to manipulate rankings or AI answers is named as scaled content abuse in the 2026 AI guide | 1 | G3 |
| a5 | Google's self-assessment asks about volume across many topics, extensive automation, word count targets and dates changed without real changes | 1 | G2 |
| a6 | The rater guidelines describe template-filled pages and "hundreds of templated articles" as Lowest-quality examples. Raters judge scale "after looking at several pages". Raters do not set rankings | 1 | G14, G4, G2 |
| a7 | From 2022 to early 2024 Google documented a site-wide helpful-content signal. Since March 2024 it is folded into core ranking, described as page-level with site-wide signals also used | 1 | G9, G10, G11, G6 |
| a8 | Google documents a presumption that a domain's pages match its overall quality (stated in the site reputation policy) | 1 | G1 |
| a9 | If template pages differ only by keyword or city, their primary content is near-identical. Google's documented behaviour for that is to cluster and index one canonical | 2 | G15 (inference on the template case) |
| a10 | Boilerplate `<title>` text that varies by one word is something Google recommends against, and it may rewrite such titles | 1 | G17 |
| a11 | Google states no preferred word count, no ideal page length, no required chunking, and no heading-count rule | 1 | G2, G3, G16 |
| a12 | The use of AI by itself is not what Google's policies target; scale without value is | 1 | G19, G14 §4.6.6, G1 |
| a13 | Recovery after improvements can take months, may wait for the next core update, and since Dec 2025 can also come from smaller unannounced core updates; no guarantee | 1 | G5, G7 |
| a14 | Spam policies apply to Google's generative AI responses too | 1 | G1, G7 |
| a15 | Google contrasts "commodity" content with first-hand, expert "non-commodity" content | 1 | G3 |
| a16 | Google reported a 45% reduction in low-quality unoriginal content after March 2024 against a 40% target | 3, **by attribution only** ("Google said…"). The method is not disclosed, so it cannot be presented as a measured fact | G12 |

## (b) Claims to avoid

- **"Title equal to H1 is penalized / a signal of spam."** Not documented, and
  G17 points the other way. Keep only "boilerplate titles" (a10).
- **"Google penalizes lists, bold, em dashes, AI style."** Not documented
  anywhere. These are stylistic markers, not signals.
- **"The model stopped working on [date]"** as a measured fact, or any drop
  percentage. There is no public measurement tying template features to a
  ranking change. Policies against keyword stuffing and doorways predate 2022.
  What changed in 2022–2024 is documented (scaled content regardless of method;
  site-wide helpful signal, then core). Frame as "Google's text now names these
  practices", not "we saw it die".
- **"Duplicate content penalty."** Google says there is none (G16). The template
  problem is policy (stuffing, doorways, scale) plus canonical clustering.
- **"The helpful content classifier hit your site."** The system is retired
  (G6). After March 2024, say "core ranking systems".
- **"Google evaluates the whole site, so one bad block sinks everything."**
  Only a10/a7/a8 are documented, each with its own context and caveats (G6: poor
  site-wide signals don't mean all content ranks poorly).
- **"Removing the cities block brings traffic back."** No public evidence.
- **"Every page per city is a doorway."** G1's wording is narrower (funnelling,
  substantially similar).
- **"Rater guidelines are ranking rules."** G4 and G2 say otherwise.
- **"Commodity content loses AI Overview citations."** Not documented, and one
  2026 study suggests originality did not predict citation.
- **Third-party percentages** (1.7%, ~1.9%, "nearly 60%", "22%") as facts.
  At most "a vendor/consultant reported", with its conflict, and preferably not at all.
- **Naming Brazilian vendors** or their clients (§5.1).
- **Anything from the client case**, per the owner's decision.

## (c) Open questions

1. Is there a rater-guidelines edition after 2025-09-11? Google's own link
   serves that edition; claims of May and June 2026 editions come from one blog
   and are unconfirmed.
2. How does Google weigh body boilerplate repeated on every page today: ignored
   as template, or counted? No current document says.
3. Does the page-matches-domain presumption (G1) apply outside the site
   reputation context, for example to scaled content? Google calls it a general
   presumption but writes it only in that section.
4. No public dataset links template features (city blocks, fixed closings,
   keyword-variation pages) to drops or recoveries. Glenn Gabe's tracked set is
   the closest, and I could not open it (HTTP 403).
5. How common MPI-style structures and "regiões atendidas" blocks are in Brazil:
   no count found.
6. Is commodity content less likely to be cited in AI Overviews or AI Mode?
   Undocumented. Third-party evidence is thin and points the other way.
7. pt-BR demand for any candidate query: no volume source available (see d).

## (d) Proposed angle and primaryQuery

**Angle (fits §13).** Not "how to write", but **what the template puts in the
served HTML and how Google's documents classify it**. The template generates
three things:

1. a fixed block on every page (cities, closing) → keyword stuffing example (G1), filler (G14);
2. pages per keyword or city variation → doorway / scaled content (G1, G3);
3. automatic `<title>`/alt/H1 → boilerplate titles (G17) and metadata review (G4).

Plus the canonical mechanism (G15) as the "how the machine reads it" part. The
fictional site can be generated in this repo's own stack. A closing "No Next.js"
section (generic-hub layer, §5.2) can show how `generateStaticParams` × a
keyword list *is* a doorway generator, and how to avoid it.

An optional lab component, if the owner wants a level-3 claim: measure on this
domain the share of each page's text that is shared with every other page
(the template ratio), with declared method. That is a number about this site
only, not about ranking.

**primaryQuery candidates** (none share a query with existing articles):

| Candidate | Evidence of pt-BR demand |
|---|---|
| `scaled content abuse` | Google autocomplete (hl=pt-BR, gl=br, 2026-10-18) completes only English variants. **Volume: não verificado** |
| `keyword stuffing` | Autocomplete (same settings) suggests "keyword stuffing o que é" and "keyword stuffing significado", so pt-BR searchers use the English term. **Volume: não verificado** |
| `conteúdo em escala` / `páginas doorway` / `regiões atendidas seo` | No autocomplete suggestions. **Volume: não verificado** |

Autocomplete shows a query exists, not how many people search it.
**Recommendation:** `scaled content abuse` as primaryQuery. It is the policy that
names the whole model (any method, many pages) and the term Google uses in G1,
G3, G4 and G14. Use "keyword stuffing" and "doorway" as sections and as
`keywords` synonyms for on-site search. Check volume in Search Console or
Keyword Planner before committing. Without that, demand stays "não verificado".
