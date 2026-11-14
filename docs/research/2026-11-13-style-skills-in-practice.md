# Research — the writing and review skills in practice, November 2026

> **Status:** research note · 2026-11-13 · the analysis the owner asked for
> after the first practical use of both skills, before the project entry
> about the plan (`docs/proposals/portuguese-style.md`, decision 5).
> **Question:** do the two skills work? Does the writing pipeline
> (`content-page` with `estilo-ptbr.md`, phase 4b and `english-version`)
> produce a page whose facts hold and whose register is native? Does the
> review skill (`portuguese-style`) move a page toward native without
> changing what it says?
> **Runs analysed:**
> - review: `portuguese-style` in analysis mode on the three July articles
>   (PR #142, `docs/research/2026-11-13-early-pages-style-review.md`);
> - writing: `content-page`, route C, on theme 07 of
>   `docs/proposals/case-studies-content.md` (PR #143), and the CI failure
>   it hit (fixed in PR #143, generalized in PR #144).
> **Measured at:** `bda4f98` (main after PR #144).
> **Labels:** **[observation]** = measured or read here on 2026-11-13.
> **[inference]** = my reading.

## 1. Answer

**[inference]** Both work, with one gap in the writing pipeline, now fixed
in the skill, and one measure that does not fit the site's voice.

- **Register:** writing from the style guide produced a draft already
  inside the native band (§3). The review then had little to do: 7
  proposals, against 56–77 per July page.
- **Facts:** what caught the factual errors was the second reader, not the
  verification pass. This session drafted the page, ran phase 4 on its own
  draft and missed 10 content problems. The fresh reader of phase 4b found all of them
  (§2), and so did the July readers on pages verified in July. On route C,
  the drafter and the verifier are the same session, and the 4b reader is
  the only independent reading of the facts. The skill did not say so.
- **The "você" measure:** it flagged both runs and 25 of the 31 published
  Portuguese pages. The site addresses the reader in the imperative, which
  the measure does not count (§5.4). This is an owner decision, not a fix.
  *2026-11-14:* decided as (a); the explanation turned out wrong (§5.4).

## 2. The writing run, step by step

**[observation]** What each step found on `html-renderizado`. A row lists
what that step caught and nothing else; "missed" means the problem was
present at that step and a later step found it.

| Step | Caught | Missed |
|---|---|---|
| 1 Research note | the extractor counted `<noscript>` images on the raw side, so the first run was discarded and rerun; G5 left open what URL Inspection shows, and G6 settled it | — |
| 3 Draft (route C, style guide read first) | — | the 49 pages (49 is the raw-side request count with robots.txt; the sample is 42) |
| 4 Verification, `check-draft.mjs` | `tldr` over 300; the banned framing "o Google indexou" inside the page's own disclaimer of what was not measured | 49 → 42 and the nine others below |
| 4 Verification, "one test" | the URL Inspection claim of `javascript-seo-google-vs-ia` checked against G6: correct, left unchanged | — |
| 4b Fresh reader (style) | 7 style proposals, all accepted; **10 content problems** (NOTA-REDACAO), all confirmed against `summary.json` and fixed | — |
| 4b Hedge list | my own rewrite of a proposal dropped "que só existe depois do JavaScript"; restored | — |
| 5 English writer (fact sheet only) | the same 49 vs 42, independently | — |
| 5 Native read (English only) | 32 rewrites, all applied; "it declares the wrong language" pointed at the title, and the Portuguese had the same slip ("ele declara") | — |
| 7 Checks | the brief's ban on the bare term "renderização dinâmica" failed the page that quotes Google calling it a workaround (§5.2) | the font budget (§5.3) |
| CI | Lighthouse font count 5 > 4: box-drawing characters in a quoted test comment | — |

The 10 problems the fresh reader found:

- the page count (49 → 42);
- the S1 satellite's head called "the same" while the table said 0 of 4;
- "every field has a rule", when two fields have none;
- Shopping itself, not its crawls, becoming "less frequent";
- a pointer to the wrong section;
- the control pages "equal" when they differed by one word;
- "all routes" measured on four;
- `description` and `tldr` putting the SPAs among the four sites;
- "everything depended on JavaScript" when the content did;
- a sample line that left out the satellites and the control.

The list is in the content commit `1fbd515`.

**[inference]** Each of the ten reads naturally to the person who wrote it,
because that person knows what was meant. "49 pages" was the number the
script printed first. Phase 4's steps 3 and 4 check facts against sources
and repository files. They do not check the draft against itself, or a
total against the unit it counts. Of the passes recorded in
`draft-verification.md`, this is the first route C pass, and it shows the
same pattern as the others: "a fact that sounded right".

## 3. Register: a draft written from the guide

**[observation]** `register-pt.mjs` values, per 100 sentences (colons,
dashes, semicolons) and per 100 words ("você"):

| Page | Written | Colons | Dashes | Semicolons | Words per sentence | "Você" |
|---|---|---|---|---|---|---|
| `soft-404` | before the guide | 25.4 | 0 | 5.1 | 17 | 0.0 |
| `uma-pagina-por-palavra-chave` | before the guide | 21.9 | 0 | 2.1 | 15 | 0.0 |
| `auditoria-de-sitemap` | before the guide | 12.6 | 0 | 0 | 14 | 0.3 |
| `html-renderizado`, verified draft | from the guide | 7.9 | 0 | 0 | 15.5 | 0.0 |
| `html-renderizado`, published | after 4b | 5.1 | 0 | 0 | 15.5 | 0.0 |
| native median / p90 (22 pages) | | 4.55 / 16.67 | 0 / 4.76 | 0 / 1.94 | 17 / 26 | 0.8 / 1.85 |

The three earlier pages are the same kind (outside-in case studies). All
three were published before the style guide was committed (`212df35`,
2026-11-11 22:50 −03:00; the sitemap audit is `6208548`, 14:16 the same
day).

**[inference]** The draft arrived inside the band, and the review moved it
closer to the median. One page by one drafter on one topic does not
separate the guide's effect from the drafter's. That needs drafts by
route A (external session) and route B (owner) written from the guide.
The size of the review supports the reading, though: 7 proposals on a
1,750-word page, against 56–77 on each July page.

## 4. The review run, briefly

The three July pages are the subject of
`2026-11-13-early-pages-style-review.md`. In summary:

- **[observation]** Colons halved and dashes went to about 0, with every
  hedge in place (58, 38 and 59 entries).
- **[observation]** 12 rejected proposals exposed a rule conflict (cut a
  generalization, against rule 1). It was fixed in PR #142.
- **[observation]** The readers reported content problems in all three
  pages: 9, 6 and 5 items. Two were verified in the repository: AVIF is
  not a Next.js default, and the page recommends `swap` where the site
  uses `optional`.

**[inference]** Both runs say the same about the 4b reader: a reader who did
not write the page finds content problems the verification left. On July
pages verified in July, and on a page verified the same day.

## 5. What did not work, and what changed

### 5.1 Route C has no second reader of facts outside phase 4b

Fixed in this PR:

- **`content-page/SKILL.md`, phase 4b:** the reader is also the page's
  second reader of facts, and on route C the only one. Its NOTA-REDACAO are
  resolved with phase 4's rules, and phase 4's checks run again on what
  changed.
- **`draft-verification.md`:** a row for this pass, and step 4 now asks
  for every total to be recomputed from its source, naming the unit.

### 5.2 A banned framing written as a bare term

The research note's "claims to avoid" listed the framing "dynamic rendering
is the fix". The brief turned it into the bare term "renderização dinâmica".
`check-draft.mjs --ban` matches substrings, so the ban failed a page that
names the term in order to say Google does not recommend it (claim a6). The
same happened with "o Google indexou" inside a disclaimer.

Fixed in this PR: `brief-template.md` now says a ban is the wording of the
wrong claim, never a term the page may need in order to deny it.

### 5.3 The font budget is outside phase 7

**[observation]** Local phase 7 does not run Lighthouse CI. CI failed on a
fifth font file, which a box-drawing comment inside a quoted test excerpt
had pulled in.

Fixed in PR #144: `design-rules.test.ts` reads every file under `content/`
and fails on characters outside the latin subsets, so `npm test` in phase 7
now covers this. No skill change was needed.

### 5.4 "Você" is not the site's way of addressing the reader

**[observation]**

- PT: `register-voce` WARN on `html-renderizado` (0.0), on the July pages
  (0.3 at best), and on 25 of the 31 published Portuguese pages (below
  p10 = 0.3). *Corrected 2026-11-14:* this note first said 23. That count
  read the rounded `--summary` column, which shows 0.3 for pages just under
  it. The WARN lines give 25 (`check-portuguese.mjs --published` at
  `bda4f98`). Found by the fresh reader of the project entry
  `revisao-do-portugues`.
- EN: `register-you` WARN at 0.4 against a p10 of 0.44.
- The pages address the reader with imperatives ("Escolha", "compare",
  "rode"), which the measure does not count. "What not to fix" in
  `marcas-ptbr.md` already tells the reviewer not to add "você" for the
  number, and both runs followed it.

**[inference]** A WARN on four pages in five no longer asks a question; it
is noise. Two options, for the owner:

- **(a)** Count imperative address next to "você", and re-measure the
  native band with the same definition. This is a calibration run, like
  step 2 of the proposal.
- **(b)** Keep the measure and drop it from the per-page WARNs. It would
  stay in the `--summary` table as context.

Changing the threshold alone would move the band without measuring it, so
it is not an option.

*Decided 2026-11-14:* the owner chose (a). Counting the imperative did not
remove the warnings: the site uses the imperative almost as often as native
authors in running prose (median 0.14 against 0.17 per 100 words), but uses
"você" a tenth as often (0.08 against 0.80). With the new band (p10 0.53),
26 of 32 pages are below. The second bullet of the observation above was a
wrong explanation: the imperative is not what the site uses *instead* of
"você". Method and numbers: `docs/research/2026-11-14-imperative-reader-address.md`.

### 5.5 Smaller gotchas, kept out of the skills

- **CRLF:** with `core.autocrlf`, the English file was CRLF in the working
  tree. The native read's "before" spans used LF, and 18 of 35 scripted
  replacements missed until the file was normalized. A note for whoever
  applies a rewrite table by script; the skill's tables are applied by
  hand.
- **`--ban` syntax:** `check-draft.mjs --ban` takes one comma-separated
  list. A second `--ban` replaces the first. The usage line says so.

### 5.6 Cost

**[observation]**

- Across this session, the 11 subagent runs (style readers, the English
  writer, the native read and the others) took between 1.3 and 13 minutes,
  with 87k to 188k tokens each. Source: the usage lines of the local
  session transcript, which is not versioned.
- Only one run is attributed here: the English native read, 172 s and 100k
  tokens.

**[inference]** On a new page, the cost is two fresh readers (PT style, EN
native). Both found content problems, so neither is optional. For step 6 of
the proposal (a batch of July pages), the earlier note's point stands:
group the rows by pattern for the owner.

## 6. Decision 5: where the page about the plan goes

**[observation]** The proposal's recommendation (§10, row 5) says the
English revision of 2026-10-27 "has no entry either". That is out of date.
`como-uma-pagina-nasce` ("como uma página de conteúdo é feita",
`dateModified` 2026-11-01) has a section "A versão em inglês" with that
revision's procedure and numbers. Its pipeline table has no row for phase
4b, so the entry needs an update whichever option is chosen. The other
entry on the subject, `uso-de-ia`, covers who does what, not how the text
is written.

Two options, for the owner (content-page gate 0.3 decides the overlap):

- **(a) Update `como-uma-pagina-nasce`.** Add phase 4b to its table and a
  section "A revisão do português", next to "A versão em inglês", as the
  English procedure was handled. Optionally, add `html-renderizado` as a
  second traced page.
- **(b) A new entry** on how the Portuguese text is reviewed, with its own
  `primaryQuery` ("como o texto em português é revisado" or close).
  `como-uma-pagina-nasce` would get the 4b row and a link to it in the same
  PR.

**[inference]** I recommend (b). The Portuguese side has more first-hand
material than one section holds:

- a native corpus and its band;
- two runs with before and after values (§3, §4);
- a rule conflict found and fixed;
- the reader as the step that catches facts (§2, §4).

The English section of `como-uma-pagina-nasce` is shorter because its
history lives in a research note. Either way, the page ships in PT and EN,
and every number prints the command that reproduces it (§7; CLAUDE.md
§5.4).

## 7. Reproducing

From the repository root at `bda4f98`:

```bash
node .claude/skills/portuguese-style/scripts/check-portuguese.mjs --published --summary
node .claude/skills/portuguese-style/scripts/check-portuguese.mjs content/blog/html-renderizado.mdx
node .claude/skills/english-version/scripts/check-english.mjs content/en/blog/raw-vs-rendered-html.mdx
git log --format='%h %ci %s' --diff-filter=A -- .claude/skills/portuguese-style/references/estilo-ptbr.md content/blog/auditoria-de-sitemap.mdx
git show 1fbd515 --stat
```

The verified draft (before 4b), the hedge list, the reader's proposals, the
fact sheet and the native read were working files in the session's
scratchpad. They are not in the repository, because they quote whole
sentences of drafts that changed afterwards. The verified draft's values in
§3 were measured on that file in the same session; the published page's
values come from the commands above.
