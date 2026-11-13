# History: reviewing AI-assisted Portuguese prose — research and analysis so far

> **Status:** history log · started 2026-11-11 · input for a future page,
> not the page. Append new entries at the end of §2; do not rewrite earlier
> ones.
> **Purpose:** keep a dated record of what was asked, researched, measured
> and decided about writing and reviewing the site's Portuguese text with AI,
> so a later article about it can be built from first-hand records instead
> of memory.
> **Plan:** `docs/proposals/portuguese-style.md`
> **Labels:** **[repo]** = measured or read in this repository, with the
> command in §5. **[report]** = stated by the external research report of
> 2026-11-11; its sources were **not** re-read here and must be, before any
> of it reaches a page (content-page phase 1). **[inference]** = a reading,
> not a measurement.

---

## 1. The question

The owner's concern, stated in November 2026: the articles carry accurate
information but some of the phrasing sounds AI-written, and Google might
penalize text that reads as generated. He asked whether the way the text is
produced can be improved through skills, one to write and one to review the
pages already published, and wants the result reusable in his other
projects.

## 2. Timeline

### 2026-11-11 — external research report **[report]**

A deep-research report (not versioned; see plan §10, decision 4) answered
four questions: what Google says, whether Google uses an AI detector, how
reliable detectors are in Portuguese, and which skills and tools exist.

What it concluded:

- **Google's guidance.** The generative AI content guide was updated on
  2026-10-01. The update adds a manual fact check of all AI-generated content
  before publishing, including `<title>`, meta description, structured data
  and alt text, and points to rater guideline sections 4.6.5 (scaled content
  abuse) and 4.6.6 (low-effort, low-originality main content). The helpful
  content page gained a paragraph calling fabricated author profiles
  deception. The target is low value, however the content is made.
- **Detection.** No primary Google source says AI authorship is detected or
  demoted. A widely shared quote attributed to Danny Sullivan (March 2026)
  appears only on a humanizer vendor's blog, without a source: unverified.
- **Detectors.** Studies cited: high false-positive rates for non-native
  writers (Liang et al., 2023), weak robustness against paraphrase (RAID,
  ACL 2024), and poor results on Portuguese scientific text (WICS/SBC, 2025).
  The report recommends not using detectors as a metric.
- **Tools.** No mature skill exists for technical pt-BR. It proposed
  combining `blader/humanizer` (MIT, English patterns), the pt-BR skill
  `portugues-tecnico-controlado` (license unconfirmed) and Vale with custom
  pt-BR rules, and rejected commercial humanizers.
- **A 19-pattern catalog** of AI-like writing in pt-BR (filler connectives,
  generic openings, summary closings, "não é X, é Y", triads, inflated
  adjectives, em dashes, bold labels, chatbot residue, English calques,
  support verbs, vague attributions, missing experience…), built from
  Wikipedia's "Signs of AI writing", Brazilian press articles from 2026 and
  editorial judgment. The report says no academic study quantifies these
  marks in a pt-BR corpus.
- **A three-layer flow:** deterministic lint, a review skill that suggests
  edits and marks gaps instead of filling them, a 15-item human checklist.

### 2026-11-11 — repository analysis **[repo]**

Read: `.claude/skills/content-page/` (SKILL.md, `draft-verification.md`,
`handoff-kit.md`, `check-draft.mjs`), `.claude/skills/english-version/`
(SKILL.md, `calques.md`, `placeholders.mjs`), `CLAUDE.md` §10,
`docs/skills.md` §3 and §7, `docs/research/2026-10-27-english-register-profile.md`.

**Finding 1: most of the report's flow already exists.**

| Report layer | Already in the repository |
|---|---|
| draft with markers, no invented data | content-page phases 1–3; handoff kit with `[CODE-n]`, `NOTA-REDACAO`, "no number without a source" |
| invariants script | `placeholders.mjs compare` |
| human fact check (Google, 2026-10-01) | content-page phase 4, never skipped, and the owner's PR review |
| experience gaps | gate 0.1 (first-hand evidence) and the claims policy (§10) |

What is missing is a Portuguese style layer: the English side has a style
guide, a calque catalog and a register script measured against native
English; the Portuguese side has nothing versioned. Its style guide lives in
the Claude Project, outside the repository.

**Finding 2: the report's lexical patterns barely occur here.** Across the 27
Portuguese articles (64,599 words of prose, code and SVG removed):

| Pattern | Matches | Per 1,000 words |
|---|---|---|
| filler connectives ("além disso", "vale ressaltar", "em suma"…) | 5 | 0.08 |
| "não é X, é Y" | 5 | 0.08 |
| inflated adjectives ("crucial", "fundamental", "robusto"…) | 3 | 0.05 |
| support verbs ("realizar a implementação") | 0 | 0 |
| vague attribution ("estudos mostram") | 0 | 0 |
| English calques ("endereçar", "jogar um papel") | 0 | 0 |
| chatbot residue ("espero que isso ajude") | 0 | 0 |
| "por isso" | 33 | 0.51 |

**Finding 3: the structural signals are present.** Per article, running
prose only (tables, lists, headings and code removed):

| Measure | July 2026 (11 articles) | Since September (16 articles) |
|---|---|---|
| sentences with an em dash | 18–41% | 13% on 2026-09-13; 0% from 2026-09-25 on (one page at 4%) |
| sentences with a colon | 25–51% | 12–36% |
| median sentence length (words) | 18–26 | 15–20 |
| list items per article, three newest | — | 24–25 |

For scale: the English register profile measured a native median of 1.6
colons per 100 sentences; the English pages had 25.0 before their revision
(`docs/research/2026-10-27-english-register-profile.md`).

**[inference]** The em dash dropped to zero from 2026-09-25 with no rule in the
repository explaining it; the likeliest source is the Project's style guide.
The July pages were never revised under it.

**[inference]** The colon may be part of the owner's own voice: his two
drafts (route B) have 21% (`pre-registro-seo`) and 30% (`sec-fetch-mode`) of
sentences with one, and the verification pass may also have touched those.
A native Portuguese corpus is needed before calling the range high.

**Finding 4: the invariants check already works on Portuguese.**
`placeholders.mjs compare` on a copy of `gtm-nextjs.mdx` with one number
changed (4 → 7777) reported `missing number: 4` and `new number: 7777`.

**Conclusion of the analysis.** A separate writing skill would duplicate
content-page phase 3. A review skill meets all three conditions of
`docs/skills.md` §3. Vale and a new invariants script are not needed. A
style-only revision must not bump `dateModified`. The batch revision should
wait for the November 2026 core update (started 2026-11-10) to finish.

### 2026-11-11 — plan written

`docs/proposals/portuguese-style.md`: style rules into content-page, a new
`portuguese-style` review skill modelled on `english-version`, calibration
against native Portuguese, and the July pages first. Status: proposal, not
started.

### 2026-11-11 — review of the plan **[repo]**

A second session read the plan and this file against the repository before
any decision.

**Reproduced.** Both §5 scripts, run at `5a0209b`, print the numbers of
Findings 2 and 3 exactly (64,599 words; 5/5/3/0/0/0/0 and 33; every
per-article range). On Windows the structural script prints `blog\<file>`,
because it splits paths on `/`; the values are unaffected.

**Problems found in the plan:**

1. **Two different colon measures.** §5 counts the share of sentences that
   contain any `:`. `english-version/scripts/register.mjs` counts colons
   followed by a space per 100 sentences, with a native median of 1.56 and
   a threshold (p90) of 6.52 (`register-thresholds.json`). The "1.6" quoted
   in plan §2 and in Finding 3 is a different measure, in another language,
   so it is not a scale for the Portuguese numbers. The §5 measure also
   counts a colon that introduces a list, code or table, which is normal
   Portuguese punctuation; the English `colon-chain` rule counts only colons
   between clauses in running prose.
2. **The "before" will not match the script.** §5 says the future script
   will measure differently, so the before/after the future page needs
   (§3.2) would compare two instruments. The baseline has to be re-measured
   with `check-portuguese.mjs` at `5a0209b` and recorded here.
3. **Corpus contamination.** Native pages written after late 2022 may be
   AI-assisted themselves. The corpus criteria should require a publication
   date before 2022-11-30, checked on the page or in an archive snapshot,
   and store counts only, as `native-corpus.json` does.
4. **Scope.** The 27 measured pages are `content/blog` only. The pillar
   (`content/guia/seo-tecnico-nextjs.mdx`) and the two project entries are
   Portuguese prose too.
5. **Portability.** The plan puts `estilo-ptbr.md` in `content-page`, so the
   portable review skill would depend on the site-specific one. The English
   precedent is the reverse: `english-version` owns `style-guide.md` and
   `content-page` phase 5 points to it.
6. **Titles on published pages.** Rule 4.2.1 lets the review change `title`
   and `description`. On a published page that is a change Google shows in
   results, made during a core update; a language-only batch should leave
   both frozen.
7. **Hedges.** `placeholders.mjs compare` catches lost numbers, code and
   link targets, not lost hedges ("neste teste", "na maioria"). The English
   revision lost two hedges (english-version step 1). The review needs a
   hedge list written before editing, as the fact sheet does.
8. **Same reader, same voice.** The plan has one session read and edit. The
   English skill separates writer and reader because a writer keeps its own
   shape; the reading pass should go to a fresh reader.
9. **Measurement §7.** "Register values move into the band" is true by
   construction (the edits target the script): an acceptance criterion, not
   a hypothesis. The log row is a change record with a cutoff instant.
10. **Index state of the July pages.** `inp-nextjs`, `gtm-nextjs` and
    `hreflang-nextjs` were "Crawled – currently not indexed" on 2026-10-13
    (experiment log, row of that date; closed unread on 2026-11-01). Their
    state before the batch goes into its log row, so a return to the index
    is not read as an effect of the revision.

**[inference]** On where the future page goes (§3.1): the English revision
of 2026-10-27 has no project entry either. One entry on how the site's text
is reviewed, in both languages, would have its own `primaryQuery` and two
before/after records, and link to `uso-de-ia` and `como-uma-pagina-nasce`.

Status: findings reported to the owner; the plan is unchanged until he
decides.

### 2026-11-11 — plan revised

The owner approved applying the ten findings. What changed in the plan:

| Finding | Where in the plan |
|---|---|
| 1. two colon measures | §2 states the counts are heuristics and drops the English number as a scale; §4.1 defines the script's measure (colons between clauses, same definitions as `register.mjs`) |
| 2. before ≠ script | §6 step 3: the baseline is measured with the script at `5a0209b` and recorded here |
| 3. corpus contamination | §5: published before 2022-11-30, counts only, same definitions |
| 4. scope | §4.1 `--published` and §6 steps 3 and 7 cover the pillar and the project entries (30 pages) |
| 5. portability | §3.1 and §4.1: `estilo-ptbr.md` lives in `portuguese-style/references/`; new `site.md` for this site's layer; §9 rewritten |
| 6. titles | §3.4 and rule 4.2.1: `title` and `description` frozen on published pages |
| 7. hedges | §4.3 step 2 (hedge list) and step 5 (checked after the edit); eval added |
| 8. same reader | §4.3 step 3: the reading pass goes to a fresh reader; risk added |
| 9. measurement | §7: the band is an acceptance criterion; the log row is a change record with a cutoff |
| 10. index state | §6 step 6 and §7: each page's index state goes into the batch's log row |

Also fixed: the plan pointed to "history file, §6" for the future page; the
material is in §3. Evals go from three to five. §10 now carries a
recommendation per decision; the decisions are still the owner's. The
structural script in §5 now prints file names with `os.path.basename`
(output values unchanged).

### 2026-11-11 — owner decisions (plan §10)

Plan and this file merged on 2026-11-11 (PR #136, merge `ad00e39`). The
owner answered decisions 1–4, each as recommended:

| # | Decision | Answer |
|---|---|---|
| 1 | skill name | `portuguese-style` |
| 2 | migrate `content-style-guide.md` from the Project | yes: the repository becomes the source, the Project copy points to it |
| 3 | corpus criteria (plan §5) | approved; the sources are chosen within them and listed in a dated research note |
| 4 | version the external report | no; the summary in §2 stands |

Decision 5 (where the future page goes) is not needed before the page
itself; it stays open.

### 2026-11-11 — step 1: the style guide, written from practice **[repo]**

**The file the plan expected was not where the plan said.** The plan
described `content-style-guide.md` as living in the Claude Project. It is not
in the repository or its history; an October 5 session had already noted a
proposal citing it without it existing here. The owner found his copy outside
the repository, with two other drafting notes (a keyword validation list and
an image-method note), and gave the instruction for step 1: build the guide
from what the repository already does (files, commands, skills), using the
old notes only as reference, since **most of the newer articles were not
written with them**. Step 1 changed from "migrate" to "write from measured
practice".

**What the old guide said, and what happened to it:**

| Old guide | Decision | Why |
|---|---|---|
| developer-to-developer voice, litmus test ("could this appear on any generic SEO blog?"), honest uncertainty | kept (`estilo-ptbr.md` intro, §6) | matches the claims policy and the published pages |
| first person singular, never "nós" | kept, measured | "eu" in 18 of 30 pages, "nós" forms 6 times |
| keep English terms Brazilian developers use | kept, with a one-word-per-concept rule | pages mix "requisição" (142) and "request" (43), "renderiz-" (139) and "render" (70) |
| title `{query}: {angle}`, no clickbait questions | kept, with an exception for queries that are questions | 22 of 27 blog titles follow it; 3 are question queries |
| first paragraph answers the query; "how to verify" section | kept (`site.md` §2) | CLAUDE.md §10; "Como verificar" and "Como conferir" 3 pages each |
| experience as evidence, 0–2 blocks, no "about me", no credentials | kept | — |
| "H1 contains the primary query" in the body | dropped | the title renders the H1; an H1 in the body is a defect (`0b95d3c`) |
| FAQ of 3–5 questions for FAQPage | dropped | FAQ rich results ended on 2026-05-07; `faq` only with real questions |
| anonymized agency stories as experience | dropped | client work is out of scope (CLAUDE.md §13) |
| reader is a Next.js developer | widened | niche widened on 2026-10-04 |
| English only for the pillar and top spokes | superseded | every page ships in both languages since 2026-10-23 |
| "TL;DR" code block | superseded | `tldr` frontmatter field |

**What the old guide did not say.** It has no rule on punctuation: no colon,
em dash or semicolon rule. So it does not explain the em dash falling to 0%
from 2026-09-25 (Finding 3), and that open question (§3.5) stays open.

**The two other notes were not migrated.** The keyword list is not style; it
is query planning, it cites data from a portfolio that is not this project's,
and its "every keyword is GO" rule conflicts with gates 0.1 and 0.3 of
content-page. The image note recommends Mermaid, Excalidraw and `<img>`; the
site uses hand-written inline SVG in token colours and `<Image>`
(CLAUDE.md §9), and no published page uses Mermaid or Excalidraw. Its one
rule still in force, the text mirror next to every diagram, is already in
CLAUDE.md §9.

**New practice counts** (30 pages at `5a0209b`, prose outside tables and
code; content unchanged at `ad00e39`): dates "23/10/2026" 119, "25 de
setembro" 78, ISO 16; thousands with a point 16, never a comma or a space;
"neste site" 39 in 23 pages; "Ilustrativo" 11 in 8 pages; lines opening with
a bold label 89; sentences with a semicolon 2–20% per page.

**Delivered** on branch `skill/portuguese-style-guide`:
`.claude/skills/portuguese-style/references/estilo-ptbr.md` (portable),
`references/site.md` (this site), content-page phase 3 and handoff kit rule 10
pointing to them, the `.gitignore` allowlist line (also in `docs/skills.md`
§2). `check-draft.mjs --published`: 54 files, 0 errors. No `SKILL.md` yet
(step 4). After merge, the owner replaces his old guide in the writing
Project with a pointer to `estilo-ptbr.md` and `site.md`.

Merged as PR #137 (merge `cf086ec`).

### 2026-11-11 — step 2: the native corpus and the band **[repo]**

Full record: `docs/research/2026-11-11-portuguese-register-profile.md`.

**How the corpus was found.** The plan was to read pre-cutoff copies from the
Internet Archive; `web.archive.org` timed out from this network, so the date
evidence had to come from each live page. Candidates came from sitemaps of
Brazilian developer and SEO sites, filtered to `lastmod` before 2022-11-30,
then screened page by page: Portuguese by function words, 300+ words of
prose, a named author, no date on or after the cutoff. 22 pages passed (9
sites, 11 authors, 21,534 words of prose).

**What the screening caught.** A Pythonclub post that read as native was a
translation of an English O'Reilly article, which only its own note revealed;
the script now rejects pages with a translation note. The first run threw out
six good pages because `<time>` elements of a "recent posts" sidebar carried
2024 and 2026 dates; the date check now reads `<time>` inside the article
only. Akita's "Akitando" posts passed every check and were dropped by hand:
they are video transcripts, spoken register.

**What the band shows** (site at `cf086ec`, content identical to `5a0209b`):

| Feature | native p50 / p90 | site p50 | site pages past the band |
|---|---|---|---|
| colons per 100 sentences | 4.5 / 16.7 | 26.0 | 27 of 30 |
| semicolons per 100 sentences | 0 / 1.9 | 5.1 | 23 of 30 |
| "você" per 100 words | 0.8 (p10 0.3) | 0.1 | 26 of 30, below |
| dash asides per 100 sentences | 0 / 4.8 | 0 | 14 of 30 (the 12 July pages, plus 2) |
| median words per sentence | 17 (13–26) | 19 | 0 of 30 |

Three things in it the earlier analysis did not have:

- **The owner's drafts are above the colon band too** (`pre-registro-seo`
  18.4, `sec-fetch-mode` 29.7). That answers half of open question §3.5: the
  colon density is high against native writers; whether it is the owner's,
  the drafting model's or the verification pass's stays open.
- **The em dash needs nothing.** Zero, the practice since 2026-09-25, is the
  native median. Only the July pages are past the band.
- **"Você" is a gap nobody had named.** The pages rarely address the reader;
  part of it may be the lab-report genre, which the corpus lacks.

The per-page values of this run replace the heuristic counts of §5 as the
"before" of every future revision.

Merged as PR #138 (merge `d106017`).

### 2026-11-11 — step 3: the checker, run on the published pages **[repo]**

`.claude/skills/portuguese-style/scripts/check-portuguese.mjs`, modeled on
`check-english.mjs`. It has three levels:

- **ERROR, exit code 1.** Chatbot residue, curly quotes, and a `lang` other
  than `pt-BR`. These have no correct use on a page of this site.
- **WARN, a pattern.** The §5.1 lists of `estilo-ptbr.md`:
  - filler connectives, inflated adjectives, support verbs, vague
    attribution, calques and generalizations about people;
  - "não é X, é Y", added hedges, impersonal frames and the corporate "we";
  - three or more colons in one paragraph;
  - a date in a sentence written as DD/MM/AAAA or ISO;
  - number mechanics: decimal point, "80ms", "25 %", a hyphen in a range.
- **WARN, register.** Any feature outside the native band of step 2, in
  the direction its `dir` gives. The band never produces an ERROR, because
  a register that differs from the band can be correct.

The checker also reads the frontmatter (`title`, `description`, `tldr`,
`faq`). It skips text inside quotation marks, code, SVG, JSX comments,
URLs and attributes.

**First run on the 30 published pages: 0 ERRORs, 14 false positives among
the WARNs.** Every one was a script defect, fixed in the script and never
in a page:

| Rule | False positives | Cause | Fix |
|---|---|---|---|
| we | 6 | "nós" in the accessibility-tree article means *nodes* | "nós" left out of the rule; possessives and verbs stay |
| empty-contrast | 4 | "Não é obrigatório, mas ajuda" is a concession, not the pattern | `, mas` removed from the rule; only "não é X, é Y" remains |
| decimal-point | 3 | "1.280 ms" is a thousands separator | groups of exactly three digits excluded |
| support-verb | 1 | "promovam um elemento" is a verb plus an object | nouns ending in *-mento* excluded |

**Second run: 30 files, 0 with errors.** WARN totals by rule:

| Rule | Hits | Rule | Hits |
|---|---|---|---|
| date-form | 32 | filler | 7 |
| register-colons | 27 | colon-chain | 6 |
| register-voce | 26 | generalization | 5 |
| register-semicolons | 23 | unit-space | 4 |
| register-dashes | 14 | register-bold-labels | 3 |
| hedge-filler | 13 | register-list-items | 2 |
| empty-contrast | 7 | inflated | 2 |
| | | impersonal | 1 |

The register values the checker prints are the values of the step 2
calibration, page by page (for example, `gtm-nextjs` colons 42.9 and
`next-image-seo` 51.6). The checker and `calibrate-register-pt.mjs` share
`register-pt.mjs`, so the step 2 table is also the checker's baseline, and
no second "before" is needed.

`date-form` is the largest rule, and that is a finding, not noise. The guide
puts DD/MM/AAAA inside parentheses and source lists ("consultada em
23/10/2026" in a source list is correct). In practice the pages also use it
in running sentences, and the script reports those. Each hit is a decision
for the revision of that page, not an automatic change.

**Mutation test.** A scratch page seeded with one example of each pattern
gave 4 ERRORs (residue in `description` and in the body, curly quotes in
`tldr`, `lang: en`) and exit code 1. It gave one WARN for every seeded
pattern. Its last paragraph repeats the four false positives above, and
none of them fired. The `%` hit printed "5 %" for "25 %"; the excerpt now
shows the whole number (display only, same totals).

Merged as PR #139 (merge `631e4a3`).

### 2026-11-12 — step 4: the skill, and its five evals **[repo]**

New in `.claude/skills/portuguese-style/`:

- `SKILL.md`: the rules first, then the seven steps of the plan's §4.3.
- `references/marcas-ptbr.md`: real lines from the published pages, by
  pattern, each with a proposed rewrite. None is applied yet; the rows become
  the applied lines in steps 6 and 7. A "What not to fix" list comes from
  the false positives.
- `references/voz.md`: the traits of the owner's two drafts that a pass must
  keep, each with a line, and their register values.
- `site.md` §7–8: what a revision may change, field by field, and where the
  review runs.

**Two script defects found while writing the catalog.** Both were found
by checking the script's line numbers against the files.

- `unit-space` printed "280ms" for "1.280ms" and never matched "4,9s".
  Fixed: 4 hits became 12.
- Paragraph-level hits gave the paragraph's first line. They now give the
  line of the hit.

**The evals.** Each of the five cases ran in a fresh agent, in its own git
worktree, with the owner's request as he would type it and the instruction
to follow `SKILL.md`. I graded each report against the expected outcome in
its `case.yaml`. A setup defect: the worktrees were cut from `main`
(`631e4a3`), not from the step 4 branch, so the skill was not in them. Each
agent found that and read the skill from the main checkout or from the
branch, read-only. One copied it into its worktree. What they read is the
committed step 4, except the fix below, which changes measurement only.

| Case | Result | What the run did |
|---|---|---|
| `review-new-draft` | pass | removed the filler opening, both colon chains and the empty contrast in 6 minimal edits; 17 hedges listed and kept; `compare` "nothing missing"; colons 46.7 → 5.6 per 100 sentences. It also sent back to verification a factual error in the fixture ("como o Googlebot lê, sem executar JavaScript") and an unsourced "na maioria dos sites" |
| `revise-july-page` | pass | `redirects-canonicals-nextjs`: colons 36.2 → 6.1, dashes 36.2 → 0, semicolons 21.3 → 0 per 100 sentences, in 70 edits (28 dash asides, 13 semicolons, 12 colons joining two claims, 10 setup phrases, 3 dates in a sentence, 4 others); 74 hedges listed, all kept; `title`, `description`, `dateModified`, headings and the English pair unchanged (checked in its worktree); `compare` lists only the "07" of two ISO dates rewritten in words; it drafted the experiment-log row and left the URL Inspection to the owner |
| `voice-inside-band` | pass | reported colons at 12.8, inside the band, and cut no colon that introduces an explanation or a list; removed two "setup + colon" frames and three semicolons (3.8 → 1.3, now inside the band); hedges kept |
| `hedge-survives` | pass | "na maioria dos diagnósticos que eu faço" was on the hedge list and stayed with its claim, inside the same bold span; the setup colon and the dash aside went |
| `detector-request` | pass | declined the detector goal with the rule's reasons, offered the review with the page's register values, changed no file |

**What the evals found, and what changed because of it:**

- **A measurement asymmetry.** `fromMdx` left out every paragraph opening
  with `**bold**`; `fromHtml` keeps them. The native band was measured with
  one rule, the site with another. Found by `hedge-survives`: its edited
  paragraph began with bold and vanished from the "after". Fixed in
  `register-pt.mjs`, and in the paragraph rules of `check-portuguese.mjs`.
  - The band does not change.
  - 17 site pages do. The headline counts hold: colons above the band on 27
    of 30, semicolons on 23, dashes on 14. "Você" below the band went from
    26 to 24.
  - The research note carries a dated correction, and `voz.md` and
    `marcas-ptbr.md` use the corrected values.
  - Rule totals with the fix: `date-form` 35, `colon-chain` 7.
- **The profile floor.** A short draft (298 words after the edit) gets no
  register values. The agent computed them from `counts()` and did not pad
  the text. `SKILL.md` step 6 now says to report pattern counts only, and
  never pad.
- **The fresh reader.** Two of the four editing runs started a reviewer
  subagent; the other two did the pass themselves and cited the agent rules,
  which discourage starting agents unasked. `SKILL.md` already allows that path.
  The ones that read alone still rejected proposals against `voz.md`
  (kept "É por isso que comprimir a imagem pela terceira vez…", kept "A
  ressalva importa:").

- **"Você" and the imperative.** The July page stayed below the "você"
  band (0.2 against p10 0.3) because it addresses the reader in the
  imperative ("Escolha", "Teste", "rode"), which the measure does not count.
  The run did not add "você" to reach the number. That is now a row of
  `marcas-ptbr.md`, "What not to fix".

The edits the evals made stayed in their worktrees and were not merged:
the published pages change in steps 6 and 7. The worktrees were deleted
afterwards, on the owner's go-ahead.

Merged as PR #140 (merge `715d604`).

### 2026-11-12 — step 5: the review joins the pipeline **[repo]**

`content-page` has a phase 4b, "Portuguese style review", between
verification (4) and the English version (5). It is called 4b, not 5, so
the phase numbers that other files cite stay true: `english-version` calls
itself content-page's phase 5, and `portuguese-style` reports for phase 8.

What changed in `content-page`:

- the phase table and the description name the new phase;
- phase 4b runs the skill, with its gate: `check-portuguese.mjs` with 0
  errors, `compare` with nothing missing, every hedge kept;
- phase 7 runs `check-portuguese.mjs` next to the other checks;
- the publish commit body counts the style edits by pattern, and the PR
  description carries the register values and the declined suggestions;
- "Updating an existing pair" now says a language-only revision of the
  Portuguese does not bump `dateModified`, and sends a revision of published
  Portuguese pages to `portuguese-style`.

`docs/skills.md` has a worked example for the skill (§7: why, how it was
built, what it contains, the first runs and the evals) and its row in the
catalog, now §8.

The order of the two phases follows from how each is written. The review
needs final facts, so it comes after verification. The English is drafted
from a fact sheet, so the Portuguese style cannot reach it, and the review
can come before the English without changing it.

<!-- Next entries: corpus chosen, calibration run, skill evals, each batch
revision with register before/after and its log row. -->

## 3. Material for the future page

### 3.1 Where it goes

**[inference]** The subject is how this project writes its text, so it is a
project entry (§5.4), not a blog article: the blog's scope (§13) is how
machines fetch, render, read or index pages. Two entries already touch the
subject, `uso-de-ia` ("como a ia é usada neste projeto") and
`como-uma-pagina-nasce` ("como uma página de conteúdo é feita"). Before
writing, decide between a new entry with its own `primaryQuery` and an
update to one of these (content-page gate 0.3, no overlap).

### 3.2 The first-hand element

The page is only worth writing once there is a before/after: register values
of the July pages before and after the revision, the patterns found by the
script and by reading, what the compare step caught, and what the owner
rejected in review. Today the record holds only the "before".

### 3.3 Claims the page could make, once checked

| Claim | Level (§10) | Needs |
|---|---|---|
| Google's guidance asks for a manual fact check of AI-generated content, metadata included | 1 | re-read the guide on the day |
| no primary Google source says AI authorship is detected | 1 | re-read the guide, the helpful content page, the 2023 blog post |
| in this site's 27 articles, the common lexical AI marks are almost absent | 3 | §5, at a stated commit |
| the structural signals (colons, em dashes) vary by drafting period | 3 | §5 |
| register values before/after the revision | 3 | the batch PRs |

### 3.4 Claims to avoid

| Claim | Why |
|---|---|
| "Google penalizes text that sounds like AI" | no primary source; the guidance targets low value |
| the Danny Sullivan quote of March 2026 | unverified, vendor blog only |
| detector accuracy figures as current | 2023–2025 studies; detectors change |
| "colons / em dashes mean AI" | no pt-BR corpus study; the owner's own drafts use colons |
| any ranking or CTR effect of the revision | not powered (§7.3), core update running |

### 3.5 Open questions

- What is the native band for technical Portuguese? (plan §5)
- Did the late-September drop in em dashes come from the Project's style
  guide, and when exactly did the rule change?
- How much of the colon density is the owner's voice and how much the
  drafting model's?

## 4. Sources

External sources are listed in the report and have **not** been re-read for
this file. Read them on the day, from the primary page, before any claim
reaches a page.

| ID | Source | Use |
|---|---|---|
| G1 | [Google Search's guidance on using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) | 2026-10-01 update |
| G2 | [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | fabricated authors, effort |
| G3 | [Google Search's guidance about AI-generated content (2023)](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) | quality "however it is produced" |
| G4 | [Core update and spam policies, March 2024](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) | scaled content abuse |
| a1 | [Liang et al., GPT detectors are biased against non-native English writers](https://arxiv.org/abs/2304.02819) | detector bias |
| a2 | [Dugan et al., RAID](https://arxiv.org/abs/2405.07940) | detector robustness |
| a3 | [Detection tools on Portuguese scientific text, WICS/SBC 2025](https://sol.sbc.org.br/index.php/wics/article/view/35937) | Portuguese |
| t1 | [Wikipedia: WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup) | pattern catalog |
| t2 | [blader/humanizer](https://github.com/blader/humanizer) | skill reference |
| t3 | [justLuiz/portugues-tecnico-controlado](https://github.com/justLuiz/portugues-tecnico-controlado) | pt-BR rules reference |

## 5. Reproducing the numbers

Measured at commit `5a0209b` (2026-11-11), working tree clean under
`content/`. Run from the repository root with Python 3. These are regex
heuristics written for this analysis, not the future `check-portuguese.mjs`;
expect the script to measure slightly differently.

Lexical patterns (Finding 2):

```python
import re, glob, collections
pats = {
    'conectivo_muleta': r'\b(além disso|vale (ressaltar|destacar|lembrar|notar)|é importante (destacar|ressaltar|notar|lembrar)|em suma|em resumo|no cenário atual)\b',
    'nao_e_x_e_y': r'\bnão (é|se trata de) [^.,;:]{1,40}, (é|mas)\b',
    'inflacao': r'\b(crucial|fundamental|essencial|revolucionári[oa]|robust[oa]|poderos[oa])\b',
    'verbo_suporte': r'\b(realizar|efetuar) (a|o|uma|um) \w+(ção|mento)\b',
    'generalidade': r'\b(muitos especialistas|estudos mostram|especialistas afirmam)\b',
    'decalque': r'\b(jogar um papel|endereçar|mergulhar fundo|isso dito)\b',
    'chatbot': r'(espero que (isso|este artigo) ajude|como (um )?modelo de linguagem|claro! aqui está)',
    'por_isso': r'\bpor isso\b',
}
tot, words = collections.Counter(), 0
for f in sorted(glob.glob('content/blog/*.mdx')):
    t = open(f, encoding='utf-8').read()
    t = re.sub(r'^---.*?\n---\n', '', t, flags=re.S)
    t = re.sub(r'```.*?```', '', t, flags=re.S)
    t = re.sub(r'<svg.*?</svg>', '', t, flags=re.S)
    t = re.sub(r'`[^`]*`', '', t)
    t = re.sub(r'\]\([^)]*\)', ']', t)
    words += len(re.findall(r'\w+', t))
    tot.update({k: len(re.findall(p, t, flags=re.I)) for k, p in pats.items()})
print('words', words)
for k, v in tot.items():
    print(f'{k:18} {v:4}  per1000={v * 1000 / words:.2f}')
```

Structural measures per article (Finding 3):

```python
import re, glob, os, statistics as st
for f in sorted(glob.glob('content/blog/*.mdx')):
    raw = open(f, encoding='utf-8').read()
    m = re.search(r"datePublished:\s*['\"]?([0-9-]+)", raw)
    t = re.sub(r'^---.*?\n---\n', '', raw, flags=re.S)
    t = re.sub(r'```.*?```', '', t, flags=re.S)
    t = re.sub(r'<svg.*?</svg>', '', t, flags=re.S)
    t = re.sub(r'\{/\*.*?\*/\}', '', t, flags=re.S)
    lines = [l for l in t.split('\n') if l.strip()
             and not l.lstrip().startswith(('|', '#', '<', '-', '*', '>'))
             and not re.match(r'\s*\d+\.', l)]
    para = re.sub(r'\]\([^)]*\)', ']', re.sub(r'`[^`]*`', 'X', ' '.join(lines)))
    sents = [s for s in re.split(r'(?<=[.!?])\s+', para) if len(s.split()) > 2]
    n = max(1, len(sents))
    colon = sum(':' in s for s in sents) / n
    dash = sum('—' in s for s in sents) / n
    med = st.median([len(s.split()) for s in sents]) if sents else 0
    bullets = len(re.findall(r'^\s*[-*] ', t, flags=re.M))
    print(m.group(1) if m else '?', os.path.basename(f),
          f'colon={colon:.0%} dash={dash:.0%} median={med:.0f} bullets={bullets}')
```

Invariants check (Finding 4): copy an article, change one number in its
body, then
`node .claude/skills/english-version/scripts/placeholders.mjs compare <original> <copy>`.

Checker baseline (step 3), from the repository root at `d106017` plus the
step 3 branch:
`node .claude/skills/portuguese-style/scripts/check-portuguese.mjs --published --summary`.
