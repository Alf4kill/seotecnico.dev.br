# Proposal: content from the outside-in case studies

> **Status:** proposal, decided. Owner answers of 2026-11-08 in §2; type A
> option A1 chosen the same day (§6). Theme 05 started (§8).
> **Origin:** owner request, 2026-11-08: analyse a set of outside-in case
> studies and plan two kinds of content: (A) a case study per site, reading
> why it was built that way and whether that can work according to Google and
> current practitioners; (B) articles on themes drawn from one or more of them.
> **Source material:** the owner's local folders (outside the repository). The
> studies, their data and the mapping from codes to real sites are never
> committed. This file is already de-identified (§3), because the repository
> is public.
> **Last updated:** 2026-11-08

---

## 1. What the material is

Five public sites read from outside, without Search Console, with the owner's
`analise-site-sem-acesso` skill: crawl from the sitemap or HTML site map,
raw vs rendered on 14 pages, text heuristics (literal and vocabulary
similarity, specificity), technical signals, a Google results sample, the
Google policy pages of 2026-08-28 and 2026-10-05, and a Confirmed / Probable /
Hypothesis scale. Collected 2026-11-03 to 2026-11-08. Plus eight article
briefs and a test plan with data for case S1.

| Code | Sector | What the study reads |
|---|---|---|
| S1 | Industrial equipment maker | One URL per keyword variation, a nationwide municipality block on every page, brand on a separate client-rendered site. Rewritten at scale (literal similarity low, vocabulary high) and passes any duplicate checker; empty sitemap |
| S2 | Commercial real estate | Long tail from real inventory; same vocabulary score as S1 with the opposite meaning; city landing × category × home competing |
| S3 | Consumer finance platform | Text is original; the problems are architecture: thin taxonomy pages indexable, noindex URLs in the sitemap, soft 404 on a subdomain |
| S4 | B2B software | Informational volume feeding lead capture; clean blog, messy product sitemap; robots.txt open to AI crawlers |
| S5 | Retail chain | Moving informational pages into the pages that sell; a generated section that answers 200 for any path; a sitemap pointing at a non-public host |

Quality is high: every study separates fact from heuristic, names its own
false positives and says what only Search Console could answer. That is the
site's method (§10 claims levels, §7.3 power) applied to other sites.

## 2. Owner answers (2026-11-08)

| # | Question | Answer | Consequence |
|---|---|---|---|
| D1 | Is any site, or its agency, a client or employer? | No. No relationship with any of the five | §13 (client work) does not block. The S1 test plan's idea of measuring "product + city" share in GSC accounts the owner manages stays out: that is client data even when aggregated |
| D2 | How were the Google results collected? | Through the skill, in the app's built-in browser driven by the assistant | See §4. The results tables of 03/11 and 07/11 are not published as data |
| D3/D4 | Names, and on what terms? | Everything published is 100% anonymous and states that the analysis was done only for study, with no commercial purpose | Rules in §3. This overrides the earlier idea of naming the two large brands |
| D5 | The S1 data folder | Restored, in a separate local folder of the owner (not in the case-study folder): block count, page checks, T0/T1 scripts for the manual round, `metodo.md`, a spreadsheet and the counting script | Theme 01 has its data |
| — | S1 search tests (T0–T5) | **Not run now.** They need many manual searches, spread over different days (T4 is weekly for 8 weeks) | Nothing published depends on them. §5 says what that leaves out |

## 3. Anonymity and the study statement

"100% anonymous" has to survive a reader who tries to find the site. The
weak points are not the names: they are strings a search engine can match.

**Never published**

- Domains, sibling domains, subdomains, agency or platform names, people,
  phone numbers, business profile names.
- URL paths or slugs taken from a site (they carry the brand or a unique
  pattern).
- Verbatim template sentences. The S1 test plan itself finds other sites by
  searching such sentences in quotes; any reader can do the same. Paraphrase
  them and describe the defect ("a slot filled with the wrong gender").
- Screenshots of a site or of its results, even cropped.
- Combinations that point to one company: sector + stack + exact scale +
  topic (for example "B2B software, Next.js, N thousand posts about the tax
  reform"). Keep the sector broad, name the stack only where the finding is
  about the stack, and round counts that are not the point
  ("about 180 pages", "over five thousand municipalities").
- The non-public host found in S5's sitemap, in any form.

**Always published**

- The collection date and that it was made from outside, without access to
  the site's Search Console.
- The evidence level of each finding.
- The study statement (below), once per page that uses a case.

**Study statement, draft.** The owner asked for "for study and analysis,
non-profit". The about page says the author is open to contracts, so
"sem fins lucrativos" can be contested. A version that is literally true:

> Análise feita de fora, sobre um site público, só para estudo do método. O
> site não é identificado, não tem relação com o autor e não participou. Não
> é auditoria, recomendação ao dono nem veredito sobre spam. Não há patrocínio
> nem serviço vendido a partir dela.

English side written with the `english-version` skill, not translated. A
single shared component keeps the wording identical on every page.

**Also outside the site.** The legal note in the case-study folder recommends
checking the author's employment contract for rules on publishing. That is
the owner's to check; it changes nothing in this plan.

## 4. Google results collected by an assistant

Google's spam policies list automated queries and scraping results for rank
checking as violations. The skill's results step runs in the app's built-in
browser, driven by the assistant, about 4 s between queries. The owner's own
`metodo.md` (2026-11-08) concludes that Google treats that browser, when an
agent drives it, as automated access; the first query of that round got a
CAPTCHA.

So the results tables of 2026-11-03 and 2026-11-07 (all five studies) stay
private. Published pages do not use "Google chose page X for query Y" from
them. What this removes:

- Theme 03 (cannibalisation) as written.
- The results parts of theme 01 and of each study's "what Google shows" section.

What it does not touch: every finding read from the sites themselves (status
codes, sitemaps, canonical, raw vs rendered, text metrics). Those were
collected on each site's own origin, with the robots.txt respected and a
pause of at least 600 ms.

The skill still describes the results step as browser-driven. Updating it to
"manual only" is a separate task for the owner.

## 5. Rules that still shape the plan

1. **Niche (§13).** Out of scope: blog content that is not about how machines
   fetch, render, read or index pages; content SEO and marketing are named.
   About half of each study (keyword grammar, funnel, blog purpose,
   authorship) is content SEO. The technical half fits.
2. **Claims policy (§10).** Numbers are level-3 claims with a declared method.
   Claims about stacks this site does not run stay at level 1 unless
   measured; "what that server sent on that date" is measured.
3. **Bilingual in the same PR** (§10), through `content-page` and
   `english-version`.
4. **Reproducibility (O8, §14).** The collection and metric functions are in
   the skill; the `.js` files that went with the studies are only a record.
   Published numbers come from a versioned script and a dated run; only
   aggregates and paraphrases are published.
5. **Existing pages.** `scaled-content-abuse` (2026-10-18) covers the city
   block, one page per keyword and generated titles, and says it has no lab
   measurement. `sitemap-dinamico-nextjs` covers lastmod in Next.js.
   `javascript-seo-google-vs-ia` owns "javascript seo". No new page takes an
   equivalent `primaryQuery` (§5.2).

## 6. Type A: one study per site

Anonymity settles the legal and reputation question. Two questions are left:

- **Scope.** "Why the strategy is shaped this way" is mostly keyword and
  content strategy, which §13 excludes. Publishing per-site studies needs an
  owner decision that amends §13, as on 2026-10-04 (niche) and 2026-10-26
  (project section).
- **What is left after anonymising and removing the results tables.** A
  single anonymous site cannot be checked by the reader, and its strongest
  "does it work?" evidence was the results sample. The study still has the
  strategy map, the text metrics and the technical signals, plus a
  practitioner-opinion section that has not been researched yet.

Options:

- **A1. Studies stay private and feed type B.** No scope change.
  **Chosen by the owner, 2026-11-08.**
- **A2. One method page.** How this site reads another site's SEO from
  outside, with one anonymous example, as a `/projeto` entry or a
  `/laboratorio` method page.
- **A3. An anonymous "Análises" section.** Five pages (PT + EN), a §13
  amendment, a new surface (routes, schema, sitemap, hreflang, tests), and
  the practitioner research. If the owner wants this, the next step is a
  proposal like `project-section.md`.

## 7. Type B: theme articles

| # | Theme | Scope | Needs Google results? | Readiness | Verdict |
|---|---|---|---|---|---|
| 05 | Soft 404 in generated pages and SPAs | Strong; SPAs fit the 2026-10-04 niche | No | Data collected; docs to open; a real "No Next.js" section (this site's not-found route) | **First** |
| 04 | The sitemap that contradicts the site | Strong | No | Data collected; generic hub above `sitemap-dinamico-nextjs` | **Second** |
| 07 | Raw vs rendered HTML | Strong, the lab's topic | No | Null result on five stacks + the client-rendered counter-example; distinct `primaryQuery` | **Third**. Drop the brief's idea of fetching a third-party site with AI user agents |
| 02 | Text similarity does not prove scaled content | Good | No | Numbers not strictly comparable (one corpus sampled; separators and "specificity" differ) | **Fourth**: either recompute every corpus with one script, or publish with a section on what the table cannot compare (owner's call) |
| 01 | City list on every page | Partial | Only for its tests, which are deferred | Block count and page checks are in the S1 folder | **Revision of `scaled-content-abuse`**, adding the measured anonymous case (share of the text and of the HTML, distinct names vs items). No claim about whether the block brings city searches: that is what the deferred tests would answer, and the revision says so |
| 06 | Bulk modification dates | Good | No | One explanation is a hypothesis until a local WordPress test | **After the local test** |
| 03 | When Google picks another page | Mixed | Yes, all of it | Blocked by §4 | **Only with manual results**, if ever |
| 08 | Blog to sell × blog to capture | Out of scope (§13) | Yes | — | **Drop** unless A3 is approved |

Every theme article: the §3 anonymity rules and statement; first paragraph
answers the `primaryQuery`; ≥1 measurement; links to the pillar and ≥1 tool;
a demand check in the research note; an experiment-log row with a power
statement; PT + EN in one PR. Sources marked "a ler" in the briefs are opened
before they are cited, and update dates come only from the Search Status
Dashboard.

### The deferred S1 search tests

T0 (is the block indexed: 4 queries), T1 (product + city: 48 queries), T2
(autocomplete, Trends, Keyword Planner), T3 (template footprint, up to 30
domains + controls), T4 (weekly for 8 weeks) and T5 (Wayback) are **not run
in this plan**. They have to be typed by hand, at a human pace, and T4 needs
eight different weeks. The scripts for the manual round are ready in the S1
folder. If they are run later, they become a lab experiment of their own,
registered in the experiment log with hypotheses and power **before** the
first query, and the `scaled-content-abuse` revision gets a second update.

## 8. Sequence

1. ~~**Owner decision:** type A option~~ — A1, 2026-11-08.
2. **Method in the repository:** the skill's collection and metric functions
   under `audits/case-studies/scripts/`, raw HTML gitignored,
   `summary-*.json` with codes only. Built one piece per article: theme 05
   needs only the invented-URL probe (`docs/research/2026-11-08-soft-404.md` §3).
3. **Article: soft 404** (05).
4. **Article: sitemap errors** (04).
5. **Article: raw vs rendered** (07).
6. **Article: text similarity** (02).
7. **Revision of `scaled-content-abuse`** (01, without the search tests).
8. **Later:** theme 06 after the local WordPress test; the S1 search tests as
   their own experiment; type A if chosen.

Steps 3 to 5 are independent and can be reordered. Each is one PR with its
experiment-log row.

## 9. Gaps in the material

1. The theme 01 brief and the S1 plan point to the S1 data folder inside
   the case-study folder; it lives in another folder (§2, D5).
2. Theme 01's counter-example (city pages that pass a "swap test") comes only
   from the excluded early analysis of S2, not from the S2 study.
3. S1's count of pages without a technical number moved between runs
   (160 → 164), attributed to the body separator. The revision recounts once
   with one separator, or says why the counts differ.
4. The briefs cite several sources as "a ler" or from memory.
