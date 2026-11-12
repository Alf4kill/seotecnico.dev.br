# Research — the register of the Portuguese pages against native technical Portuguese, November 2026

> **Status:** research note · 2026-11-11 · step 2 of
> `docs/proposals/portuguese-style.md`; input for `check-portuguese.mjs`
> (step 3) and the `portuguese-style` skill, not an article.
> **Question:** how do this site's Portuguese pages differ, in measurable
> structure, from technical Portuguese written by Brazilian developers before
> AI-assisted writing was common?
> **Method:** register features measured with
> `.claude/skills/portuguese-style/scripts/register-pt.mjs` on 22 native pages
> (`native-corpus-pt.json`) and on the 30 Portuguese pages of the site
> (`content/blog`, `content/guia`, `content/projeto`), at `cf086ec`. The band
> (native p10, p50, p90 per feature) is written to
> `register-thresholds-pt.json`.
> **Command:** `node .claude/skills/portuguese-style/scripts/calibrate-register-pt.mjs --pages`
> (add `--write` to rewrite the band). Needs network; pages change, so a rerun
> can move the numbers.
> **Labels:** **[observation]** = measured here on 2026-11-11.
> **[inference]** = my reading.
> **Quotes:** none. No corpus text is stored in the repository: the scripts
> keep counts only.

## 0. Corpus

### 0.1 Criteria (owner approval, 2026-11-11)

1. Technical writing for developers (or technical SEO), by Brazilian
   authors, originally in Portuguese.
2. Dated before **2022-11-30**, with no date on or after it in the page's
   metadata or inside the article. A later page may be AI-assisted, and the
   band would measure that register as native.
3. Several authors and sites, none from this site.
4. Counts only, no text stored.
5. Measured with the same definitions the site's check will use.

The script checks 2 (and part of 1) again on every run: it rejects a page
whose function words are not Portuguese, whose text carries a translation
note, or whose metadata or article area has a date on or after the cutoff.

### 0.2 Pages

All fetched on **2026-11-11** from the live site. The Internet Archive was
the plan for dated copies, but `web.archive.org` did not answer from this
network (timeouts on the CDX API and on snapshots; `archive.org` itself
answered), so dates come from the page itself or, where the page has none in
its markup, from the site's sitemap or the date printed in the text.

| ID | Kind | Site | Author | Date | Date evidence |
|---|---|---|---|---|---|
| N1 | first-person | akitaonrails.com | Fabio Akita | 2018-01-09 | URL, `article:published_time` = modified, JSON-LD |
| N2 | first-person | akitaonrails.com | Fabio Akita | 2017-06-16 | same |
| N3 | first-person | akitaonrails.com | Fabio Akita | 2017-01-06 | same |
| N4 | first-person | akitaonrails.com | Fabio Akita | 2015-05-15 | same |
| N5 | first-person | eltonminetto.dev | Elton Minetto | 2020-06-29 | URL, `article:published_time` = modified |
| N6 | first-person | diegoeis.com | Diego Eis | 2017-02-01 | `article:published_time`; modified 2022-08-04 |
| N7 | tutorial | sergiolopes.org | Sérgio Lopes | 2012-12-05 | date printed in the page |
| N8 | tutorial | sergiolopes.org | Sérgio Lopes | 2012-04-15 | same |
| N9 | tutorial | sergiolopes.org | Sérgio Lopes | 2013-01-27 | same |
| N10 | tutorial | sergiolopes.org | Sérgio Lopes | 2013-08-22 | same |
| N11 | tutorial | pythonclub.com.br | Bruno Cezar Rocha | 2014-05-31 | sitemap `lastmod` |
| N12 | tutorial | pythonclub.com.br | Michell Stuttgart | 2016-05-06 | sitemap `lastmod` |
| N13 | tutorial | pythonclub.com.br | Eduardo Klosowski | 2022-10-17 | sitemap `lastmod` (latest change) |
| N14 | tutorial | loiane.com | Loiane Groner | 2014-01-20 | URL, `article:published_time`, JSON-LD |
| N15 | tutorial | loiane.com | Loiane Groner | 2014-01-13 | same |
| N16 | tutorial | zup.com.br | Juliana Sampaio | 2021-06-22 | `article:published_time`; modified 2021-08-16 |
| N17 | seo | agenciamestre.com | Fabio Ricotta | 2012-11-05 | `article:published_time`, JSON-LD |
| N18 | seo | agenciamestre.com | Fabio Ricotta | 2020-11-05 | same; modified 2021-10-01 |
| N19 | seo | agenciamestre.com | Fabio Ricotta | 2012-11-21 | same |
| N20 | seo | agenciamestre.com | Fabio Ricotta | 2009-03-26 | same; modified 2018-12-03 |
| N21 | seo | agenciamestre.com | Fabio Ricotta | 2010-10-29 | same; modified 2022-03-24 |
| N22 | seo | conversion.com.br | Diego Ivo | 2016-06-20 | `article:published_time` = modified, JSON-LD |

URLs are in `native-corpus-pt.json`. Total: 22 pages, 9 sites, 11 authors,
21,534 words of running prose.

### 0.3 Rejected, and why **[observation]**

| Candidate | Reason |
|---|---|
| a Pythonclub post on mutable tuples | a translation: the page says it was first published in English by O'Reilly. The script now rejects pages with a translation note |
| Akita's "Akitando" posts (2018–2022) | transcripts of videos: spoken register, not written |
| most Elton Minetto posts | under 300 words of prose (code-heavy) |
| Agência Mestre marketing posts, Diego Eis product and book posts, Conversion company news | not technical writing for developers |
| two Conversion posts of 2022 on Google's ranking systems and an update | summaries of English Google pages, close to translation |
| Tableless, Lucas Santos, Fernando Daciuk, Willian Justen | every sitemap `lastmod` after the cutoff (site rebuilt or republished), so no page can show it is older |
| Caelum blog, Rocketseat blog, Nubank's blog | redirect, timeout, or no Portuguese prose in the served HTML |

The first run also rejected the five Agência Mestre pages and N6: `<time>`
elements dated 2024 and 2026 belonged to a sidebar of recent posts, not to
the article. The date check now reads `<time>` only inside the article area;
the page-level metadata of those six pages is before the cutoff.

## 1. The band **[observation]**

| Feature | first-person p50 | tutorial p50 | seo p50 | native p10 | native p50 | native p90 | site p50 | site pages outside |
|---|---|---|---|---|---|---|---|---|
| colons per 100 sentences | 3.0 | 4.9 | 3.0 | 2.2 | 4.5 | 16.7 | 26.0 | 27 of 30 above |
| dash asides per 100 sentences | 3.0 | 0.0 | 0.0 | 0.0 | 0.0 | 4.8 | 0.0 | 14 of 30 above |
| semicolons per 100 sentences | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 1.9 | 5.1 | 23 of 30 above |
| median words per sentence | 13.0 | 17.0 | 18.0 | 13.0 | 17.0 | 26.0 | 19.0 | 0 of 30 |
| "você" per 100 words | 1.3 | 0.6 | 1.0 | 0.3 | 0.8 | 1.9 | 0.1 | 26 of 30 below |
| first person singular per 100 words | 0.6 | 0.1 | 0.0 | 0.0 | 0.2 | 1.0 | 0.1 | (not judged) |
| list items per 1,000 words of prose | 2.0 | 0.0 | 0.0 | 0.0 | 2.0 | 23.9 | 6.8 | 2 of 30 above |
| bold-label paragraphs per 100 paragraphs | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 22.2 | 0.0 | 3 of 30 above |

Definitions (`register-pt.mjs`): prose is a paragraph of 25+ words that ends
like a sentence; tables, lists, headings, quotes, code and SVG are out of it.
A colon counts when a space follows it inside a prose paragraph. A dash aside
is an em dash, or a spaced en dash or hyphen, with a pair counted once.
Pages with under 300 words or 15 sentences of prose are not profiled.

## 2. What the numbers say

**Colons.** The site's median page has 26 colons per 100 sentences of prose;
the native median is 4.5 and the native p90 16.7. 27 of 30 pages are above
it, all twelve July pages among them (24–52). The newer pages are lower
(13–40) and still mostly above. **[observation]**

**The owner's own drafts are above the band too:** `pre-registro-seo` 18.4,
`sec-fetch-mode` 29.7. Both went through the verification pass before
publication, so the published text is not his draft alone. **[inference]**
In this corpus, a colon density this high is not what Brazilian technical
writers produce; whether it comes from the owner's habit, the drafting
model, or the edits of the verification pass, the record cannot separate.
This answers half of the open question in the history file (§3.5): the range
is high against native prose; its source stays open.

**Dashes.** Native p50 is 0 and p90 4.8. The July pages run 20–48; every page
from 2026-09-25 on is at 0 except one at 5.1. Zero is inside the native band:
nothing needs to come back. **[observation]**

**Semicolons.** Native p50 is 0 and p90 1.9; 23 of 30 site pages are above
it, including pages from every period. **[observation]**

**"Você".** The site addresses the reader about once per 1,000 words (p50
0.1 per 100); the native p10 is 0.3 and the median 0.8. 26 of 30 pages are
below the band. Earlier counts showed "você" in 21 of 30 pages, so it is
present but rare. **[observation]** **[inference]** The pages describe what
the site did more than they tell the reader what to do; part of that is the
genre (lab reports), part may be the impersonal register the style guide
already warns about (§1).

**Sentence length.** All 30 pages are inside the native band (13–26 words).
The July pages ran longer (15–24) than the later ones (15–22), both inside it.
**[observation]**

**Lists and bold labels.** Above p90 for lists: `auditoria-de-sitemap` (44.8
items per 1,000 words) and `soft-404` (28.3). Above p90 for bold labels:
`auditoria-de-sitemap` (47.9 per 100 paragraphs), `detectar-crawlers-ia`
(31.1), `sec-fetch-mode` (24.4). **[observation]**

## 3. Limits

- **Small and concentrated.** 22 pages; three authors write 13 of them
  (Akita 4, Lopes 4, Ricotta 5). With n = 22, the nearest-rank p90 is the
  20th value, so two native pages sit above it by construction. The band is
  a warning, never an error (proposal §4.1).
- **Older prose.** The pages date from 2009 to 2022, most from 2012–2018.
  The register of Brazilian technical writing may have moved since; the
  cutoff makes that unavoidable.
- **Natives vary.** One native page (N22) has 35 colons per 100 sentences,
  more than 24 of the 30 site pages, and 30 semicolons, more than any of them.
  A page outside the band is a question, not a verdict.
- **Dates.** Seven pages have no date in their markup; their dates come from
  the page text (N7–N10) or the sitemap (N11–N13).
- **Genre.** The site's pages are lab reports and implementation guides; the
  corpus has no lab reports. The "você" gap may be partly genre.

## 4. Baseline

The per-page values printed by `--pages` at `cf086ec` measure the site's
content as it was at `5a0209b` (`git diff 5a0209b cf086ec -- content` is
empty). They replace the heuristic counts of the history file (§5 there),
which counted the share of sentences with any colon, lists and labels
included. Step 3 confirms that `check-portuguese.mjs`, which uses the same
module, prints the same values.

## (a) Decisions

| Decision | Why |
|---|---|
| band written to `register-thresholds-pt.json` (p10/p50/p90; `dir` per feature) | the script warns on the side that matters for each feature |
| the three features to act on first: colons, semicolons, "você" | where the site is furthest from native, across all periods |
| no em dash target for pages from 2026-09-25 on | zero is inside the band; only the July pages are above it |
| sentence length is not a revision target | every page is inside the band |
| the corpus is not grown before step 3 | 22 pages meet the criteria; a larger corpus can be recalibrated with a recorded run |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "Brazilian developers use N colons per 100 sentences" | 22 pages from 11 authors; it describes this corpus |
| "colons or semicolons mean AI-written text" | the corpus predates AI writing and one native page has more semicolons than any site page; the band measures distance from these writers, not authorship |
| "the colon density comes from the AI" | the owner's own drafts are above the band too, after a verification pass |

## (c) Open questions

- Where the colon density comes from: the owner's habit, the drafting model,
  or the verification pass's edits. A draft measured before phase 4 would
  answer it for one page.
- Whether a corpus of Brazilian lab-style write-ups exists to separate the
  genre effect on "você".
