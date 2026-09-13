# Research — how to build a content page in September 2026

> **Status:** research note · 2026-09-13
> **Why now:** agreed with the owner before the next content page (and before
> `/en/case-study`). The site's pages are indexed; the constraint is authority
> ([baseline 2026-09-11](../baseline/2026-09-11/search-console.md)). This note
> asks what has changed in how pages earn visibility, and what that changes here.
> **Evidence rule:** every claim is tagged **[primary]** (Google's own
> documentation) or **[secondary]** (third-party studies and industry press).
> Secondary numbers show a direction. None of them is a fact about this site.

## 1. What Google says

### 1.1 "AEO/GEO" is still SEO **[primary]**

Google's generative-AI optimization guide (last updated 2026-07-10) says
there are no extra requirements to appear in AI Overviews or AI Mode. It
rejects the tactics sold under the AEO/GEO label:

- **No chunking.** Content does not need to be cut into small answer blocks.
- **No special language.** AI systems understand synonyms, so write naturally.
- **No new machine-readable files.** `llms.txt` and similar files neither help
  nor harm visibility in Google Search.
- **Structured data is not required** for generative AI features. It still
  matters for rich results.
- **Inauthentic mentions** (manufactured citations) are not an effective
  strategy.

What the guide does ask for is **non-commodity content**: a unique point of
view, first-hand experience and expert takes, as opposed to summaries of what
already ranks. It also asks for clear sections and headings, good images and
video, a good page experience and little duplicate content.

### 1.2 How AI features pick links, and where they show up **[primary]**

- AI Overviews and AI Mode may use **query fan-out**: several related searches
  across subtopics, which surfaces a wider set of links than the classic top 10.
- Eligibility is the same as for a normal snippet: the page must be indexed and
  snippet-eligible. `nosnippet`, `max-snippet`, `data-nosnippet` and `noindex`
  limit what AI features can use.
- Clicks from AI features are **counted inside the normal Performance report**
  (search type *Web*). They are not a separate channel in that report.

### 1.3 New in Search Console: AI feature impressions **[primary]**

Since **2026-08-31**, every property worldwide has a *Generative AI performance
report (Search)* under Performance.

| | |
|---|---|
| Metric | **impressions only** (no clicks, no CTR) |
| Dimensions | page, country, device, date (**no queries**) |
| Export | yes |
| Threshold | the report is empty until a site has enough AI-feature impressions |
| Separate | Discover has its own generative AI report |

Google also added a Search Console setting to opt a site out of grounding its
generative AI features. Google states the choice is **not a ranking signal**
for regular results.

### 1.4 FAQ rich results are gone **[primary + secondary]**

FAQ rich results stopped showing on **2026-05-07**. The Search Console report
and Rich Results Test support were removed in June, and API support in August.
`FAQPage` markup is still valid schema.org and harmless to keep, but it no
longer changes the SERP.

### 1.5 Quality enforcement **[secondary]**

The 2026 spam updates (March, June, August) kept targeting **scaled content
abuse**: large numbers of low-value pages, increasingly unedited AI output.
Industry reports say edited, accurate, AI-assisted content stays within policy.
The risk is volume without editorial value, not the tool used.

## 2. What third-party data suggests **[secondary]**

| Finding | Source | Caveat |
|---|---|---|
| Position-1 CTR is 58% lower when an AI Overview is present (Dec 2025 vs Dec 2023, 300k keywords) | Ahrefs, Feb 2026 | desktop, aggregate GSC data |
| Organic CTR: 0.70% when cited in the AIO, 0.52% when not, 1.45% with no AIO | Seer Interactive, Sep 2025 | 42 organisations, mostly brands |
| Only ~12% of URLs cited by AI tools are also in Google's top 10 for the query | Ahrefs (15k queries) | tool-dependent |
| Citations concentrate on Reddit, Wikipedia, YouTube, LinkedIn and a few others | several citation trackers, 2026 | vendor studies with commercial interest |
| Original data earns more links than how-tos or opinion | link-building surveys, 2026 | marketing surveys, low rigour; the direction is consistent across all of them |

## 3. What this changes for this site

### 3.1 Already aligned; keep doing it

- **The one-question, answer-first article** (CLAUDE.md §10) matches what Google
  asks for, as long as it stays a reader-first choice. Do not describe it on the
  site as "AI optimization": Google says it is not a requirement.
- **`llms.txt` as a measurement, not a tactic.** The file already says no vendor
  has committed to reading it, and the detection experiment measures whether
  anything does. Google's guide confirms that framing.
- **Original measurement in every article** (§10) is the "non-commodity
  content" Google describes. It is also the only asset type the link data
  consistently favours.
- **No filler.** The exact-match-domain warning in §1 and the scaled-content
  enforcement point the same way.

### 3.2 Changes worth making

1. **Unblock part of O7 without an API.** O7 ("cited by an AI search engine")
   was blocked because the project has no Google API credentials of its own.
   The Generative AI performance report covers Google's side from the UI.
   Proposal: a monthly export, saved next to the other baselines. An empty
   report is itself a data point: below Google's threshold. ChatGPT and
   Perplexity still need `ai-search-monitor`.
2. **The Phase 3 experiment as written is void.** CLAUDE.md §11 item 11 ("FAQ
   schema on half the articles → CTR delta") measures a SERP feature that no
   longer exists. It would also have no statistical power here: Brazil, where
   every click comes from, had 288 impressions in three months. The baseline
   already concluded that the constraint is position, not snippets. **The first
   deliberate experiment needs redefining. That is an owner decision** (see §4).
3. **Distribution is part of publishing.** AI citations and links both
   concentrate on a few platforms (LinkedIn, Reddit, YouTube). For this site,
   "publish" should mean: publish, request indexing, then post the finding
   where developers are. LinkedIn also serves the job-application goal.
4. **`FAQPage` stays "when applicable", with no SERP expectation.** Keeping it
   costs nothing and the markup is valid. No new work should be justified by a
   FAQ rich result.

### 3.3 Checklist for the next content page

- [ ] The page answers a question **where this site has first-hand data** that
      others do not (a measurement, an incident, an experiment).
- [ ] The first paragraph answers it for a human reader.
- [ ] The original data is dated and traceable to a versioned file in the repo.
- [ ] Code shown as this site's code is the code in the repo
      (`content-code-paths.test.ts` checks the path exists; the lines still
      need a manual diff).
- [ ] Sections and headings; diagrams as inline SVG with a text mirror (§9).
- [ ] `Article` + `BreadcrumbList`; `FAQPage` only if the questions are real.
- [ ] After merge: request indexing, then distribute once on LinkedIn and one
      developer community, with the date recorded in the experiment-log row.
- [ ] Row in the experiment log **before** publishing, with a hypothesis the
      site's volume can actually test.

## 4. Decisions for the owner

1. **Redefine the first deliberate experiment (§11 item 11).** It must be
   measurable at this volume. Two candidates, both measured with
   `experimento.py` on position and impressions rather than CTR:
   - *Depth on the ranked cluster:* of the 11 pages averaging position ≤ 20
     in the baseline, extend half with new original measurement and keep a
     matched half unchanged as control.
   - *Internal authority:* add contextual links from the three strongest pages
     to half of the weak ones, with the other half as control.
2. **Phase order for `/en/case-study`.** §11 says Phase 4 waits for Phase 3.
   The honest option is to run the redefined experiment first, so the case
   study has a real before/after to report. The alternative is a case study of
   the technical work only, which is already measured.
3. **Candidate for the next content page.** The existing proposal
   [`proposals/detection-experiment-article.md`](../proposals/detection-experiment-article.md)
   (approved direction, not drafted) fits §3.3 better than any new topic: it is
   first-hand data nobody else has.

## Sources

Primary:
- [Google's guide to optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (updated 2026-07-10)
- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (updated 2025-12-10)
- [Generative AI performance report (Search) — Search Console Help](https://support.google.com/webmasters/answer/16984139)
- [Introducing Search generative AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) (June 2026)
- [New opportunities, control and insights for website owners](https://blog.google/products-and-platforms/products/search/new-controls-website-owners/) (2026-06-03, updated 2026-08-31)

Secondary:
- [Google drops FAQ rich results from Search — Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)
- [AI Overviews reduce clicks — Ahrefs](https://ahrefs.com/blog/ai-overviews-reduce-clicks/)
- [AI Overviews and CTR, 2026 data (Seer figures)](https://tynesidemarketing.co.uk/blog/ai-overviews-click-through-rates)
- [The AI citations report 2026 — OtterlyAI](https://otterly.ai/blog/the-ai-citations-report-2026/)
- [AI platform citation patterns — Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns)
- [August 2026 Google spam update case studies — GSQi](https://www.gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/)
- [Linkable assets in 2026](https://gauravtiwari.org/how-to-create-linkable-assets/)
