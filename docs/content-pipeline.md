# How a content page is made here

> **Status:** reference · first written 2026-10-26 · English step revised 2026-10-27
> **Evidence rule:** as in `docs/ai-workflow.md` — **[repo]** is checkable in
> this repository or its PRs; **[owner]** is the owner's description of work
> done outside it (editorial sessions, briefs, session logs), not versioned.
> **Source for:** the project-section entry "Como uma página nasce aqui"
> (`docs/proposals/project-section-review.md` §6.2). **Procedure:** the
> `content-page` skill (`.claude/skills/content-page/`).

## 1. Summary

A page here is the end of a chain, not a writing task: a dated research note,
a brief the owner approves, a draft, a verification pass against the sources
and the code, an English version, registration, scripted checks and a PR the
owner merges. The step that matters most is the verification pass. Every
draft the site has published, from every route, needed corrections that only
that pass found (§4).

## 2. The chain

| Phase | Where | Artefact | Versioned |
|---|---|---|---|
| Gates: first-hand evidence, scope, no overlap | repo session | decision | no |
| Research note | repo session, with web access | `docs/research/YYYY-MM-DD-<topic>.md` | **[repo]** yes |
| Brief | repo or editorial session | `brief-<slug>.md` | no — briefs are deleted after use **[owner]** |
| Draft | external writing session, the owner, or the repo session | MDX + delivery notes + session log | no **[owner]** |
| Verification pass | repo session | corrected MDX; corrections listed in the commit body | **[repo]** yes |
| English version | repo session, `english-version` skill: fact sheet, English draft written without the Portuguese prose, native read, fidelity check | `content/en/blog/<slug>.mdx` + list of judgment calls in the PR | **[repo]** yes |
| Register | repo session | `src/lib/hreflang.ts`, `docs/experiment-log.md` | **[repo]** yes |
| Checks | repo session + CI | script output, CI run | **[repo]** in the PR |
| Merge, indexing request, distribution | owner | log row date | **[repo]** the row |

The editorial session is a claude.ai Project without the repository **[owner]**.
It cannot see code, so since the five-spoke batch of July 2026 it writes
`[CODE-n]` and `[SVG-X]` placeholders instead of code and diagrams, and the
repository session fills them verbatim **[repo]** (PR #27 body: "no invented
code" for the first time).

## 3. One page traced: `scaled-content-abuse`

| Step | What happened | Evidence |
|---|---|---|
| Research note | every Google page read on 2026-10-18 from its HTML, printed update dates recorded, labels per claim (`[documented]`, `[inference]`, `[third-party]`, `[observation]`), 13 claims to avoid, open questions, proposed angle; 521 lines | **[repo]** `5adfded` |
| Brief | approved with changes on 2026-10-18: outline of 10 H2s, FAQ, links, banned framings, NOTA-REDACAO list, prose ceiling of 2,200 words | **[owner]** brief, not versioned |
| Writing session | the research note was not in the session, so each Google source was re-read directly; a 17-word quote cut to 8; "penalidade" removed even when negated; ~3,100 words cut to ~2,600; self-validation table (lengths, H1, double braces, fences, banned framings, quote length); 10 pending items for the repo session | **[owner]** session log `sessao-2026-10-18-scaled-content-abuse.md` |
| Verification pass | manual-action sentence aligned with the help text; a "most visible sign" claim reduced to the mechanism; a timeline row corrected to the changelog; a source added for the live-test claim; `tldr` cut to the 300-character limit the build enforces; the "No Next.js" section quotes the blog route's real `dynamicParams`, `generateStaticParams` and `generateMetadata` | **[repo]** `7e73fc1` body |
| English version | English UI labels from the English help pages, English fictional example, real code of the English route | **[repo]** `ed4adb4` |
| Links | English pages pointed at the new English articles and tools; later, the rule that English text links only English pages | **[repo]** `9742f18`, `62b32b7`, `8aba089` |

What the trace shows: the writing session's own validation table was correct
on the mechanical checks and still left four factual corrections for the
verification pass. The session missing the research note cost a full
re-research; the skill now puts the note in the handoff kit.

## 4. What the verification pass has caught **[repo]**

| Page | Draft route | Correction | Record |
|---|---|---|---|
| `melhorar-lcp-nextjs` | writing session | a lab-measurement slot with nothing to fill it; a RUM sentence about a pipeline still on the roadmap | PR #7 |
| `json-ld-nextjs` | writing session | invented component files, prop shapes and author object; an argument built on a Google page removed on 2026-06-15; a wrong mechanism for client components | PR #17 |
| `inp-nextjs` | writing session | body H1; SVG colours outside the palette; an internal doc cited in reader prose | `0b95d3c` |
| five spokes | writing session, with placeholders | a "100% static" claim the build output contradicted; a missing pillar link | PR #27 |
| `pre-registro-seo` | owner | title without the query; a stimulus attributed to the wrong article; a deviation list differing from the log | `0d997fb` |
| `sec-fetch-mode` | owner | a false claim about HTTP clients; testing it found a defect in the site's own classifier, fixed in PR #95 | `4de2df3` |
| `scaled-content-abuse` | writing session | four factual alignments with the sources; `tldr` over the limit | `7e73fc1` |

Placeholders ended the invented-code defect. Nothing has ended "a fact that
sounded right": that is why the pass re-reads sources on the day and tests one
claim when it can.

## 5. What is automated, and what is not **[repo]**

| Check | Automated by | When |
|---|---|---|
| Frontmatter fields, title ≤60, description ≤155, tl;dr ≤300, category, `basedOn` | `src/lib/content.ts` | every build |
| A cited repository path exists | `content-code-paths.test.ts` | CI |
| Pair declared on both sides | `hreflang.test.ts` | CI |
| One H1, title, description, canonical, JSON-LD, hreflang, contrast, a11y | Playwright suite | CI |
| Placeholders left, body H1, `{{`, unmapped components, untokenised SVG colours, banned framings, quote length, pillar and tool links, lead paragraph | `check-draft.mjs` | on arrival and before the PR |
| Both sides exist, same facts and dates, links inside their language, closing note, log row | `check-pair.mjs` | before the PR |
| British spelling, day-month dates, closing note not last (errors); known PT → EN calques, article patterns and a register profile against native technical English (warnings) | `check-english.mjs` (`english-version` skill) | after the native read, before the PR |
| Is the topic worth a page; is a fact still true; does the code shown match the repo's lines; does the English read as written in English | **nobody** — the verification pass, the native read and the owner | every page |

`check-draft.mjs` was written from the defects of §4 and run on all 48
published articles before being trusted. The first run failed 6 files and
warned on most of the rest, all false positives: `<Image>` in four articles
(the draft of the skill said MDX mapped no components; it maps `Image`), a
date-format table in the pre-registration pair read as a placeholder, SVG
`aria-label` text counted as long quotes, and Windows line endings hiding the
lead paragraph. After the fixes: 48 files, 0 errors, 0 warnings; a draft
broken on purpose in ten ways failed on all ten.

## 6. The English step, revised 2026-10-27 **[repo]**

Until 2026-10-27 the English version was one step with a structural
checklist. Feedback that the English read as translated led to a
revision of all 28 English pages and a dedicated skill, `english-version`
(`docs/skills.md` §6). What changed in the method:

- **Intent before words.** The English is written from a per-section fact
  sheet of what the Portuguese claims and how it hedges, saved to a file. The
  writer of the English draft never reads the Portuguese prose (added the
  same day, see below).
- **Two separate reads.** A native read of the English alone (by a reader
  that has not seen the Portuguese, when a subagent is available), then a
  fidelity check against the Portuguese for facts, hedges, links and code.
- **A style guide and a glossary.** American English, US dates in prose, ISO
  in tables; the site's terms (fetch, round, prompt, run, bug, log).
- **A script for the known calques.** `check-english.mjs`: 263 findings and
  28 of 28 files with errors at `e39de3b`; 0 errors and 1 warning after the
  revision.
- **A report of judgment calls** in the PR, so the owner reviews the places
  that needed judgment instead of diffing prose.

The research and the counts: `docs/research/2026-10-27-english-translation-quality.md`.

**Second iteration, same day.** A page written in that revision, with the
Portuguese open, came out free of calques and still built on Portuguese
structure. Measured against 26 native pages, every English page used colons
above the native p90, and 23 of 28 were past it for "the"
(`docs/research/2026-10-27-english-register-profile.md`). Three changes:
the English draft is written from the fact sheet without the Portuguese
prose; the style guide takes the Google developer documentation style guide
as its base; `check-english.mjs` measures register (article density,
sentences opening with "The", colons, semicolons, "you") against native
thresholds and ranks the pages furthest from native first.

## 7. Open questions for the owner

1. **Session logs.** The writing session's log is the best record of phase 3,
   and it is not versioned. Commit it to `docs/sessions/` (in Portuguese, as
   written, or translated per §10), or keep it outside and cite it as [owner].
2. **Briefs.** Same question; the current rule deletes them after use.
3. **Word counts** in §3 come from the session log; they are [owner] until
   the log is versioned.
