---
name: english-version
description: >-
  Write or revise the English side of a page on seotecnico.dev.br so it reads
  as if it had been written in English, not translated from Portuguese. Use it
  for phase 5 of the content-page skill (the English version of a new article
  or project entry), whenever the owner asks to translate, adapt or "fazer a
  versão em inglês" of a page, and whenever he says the English sounds
  literal, translated, stiff or non-native ("soa traduzido", "inglês não
  nativo", "revisar o inglês") — for one page, a batch, or the English UI
  strings under src/app/(en). Covers the fact sheet, the English draft written
  without the Portuguese prose, the native read, the fidelity check against
  the Portuguese, the site's style guide (Google developer documentation style
  as the base) and glossary, and a script that flags known calques and
  measures register against native technical English. It does not decide what a
  page says: facts, numbers and claim levels come from the Portuguese side.
---

# English version (fact sheet → blind English draft → native read → fidelity check)

Feedback the owner received in October 2026 said the English pages read
like a translation. The 2026-10-27 revision found why: every English page had been
written sentence by sentence from the Portuguese, so Portuguese structure
survived in correct English words — colon chains, "it is worth", "that is
why", "readings" for fetches, day-month dates, British and American spelling
mixed. Research on machine and LLM translation says the same thing: the
literal first draft is the default, and it improves when the model is told
to write from the meaning and then revise for the target reader
(`docs/research/2026-10-27-english-translation-quality.md`).

The same day showed that removing calques is not enough. A page written in
that revision, with the Portuguese open, came out free of every known calque
and still far from native register: a colon in one of every seven
sentences (native median: one in 64), more than a third of its sentences
opening with "The", noun chains where English uses a verb or a possessive,
never a "you"
(`docs/research/2026-10-27-english-register-profile.md`). A writer who reads
the Portuguese sentence keeps its shape.

So this skill never translates. It turns the Portuguese into a fact sheet,
has the English written **from the fact sheet by a writer who never reads
the Portuguese prose**, reads the English alone as an English reader would,
and only then checks it against the Portuguese for facts. `CLAUDE.md` wins on
any conflict.

## Files

| File | Read when |
|---|---|
| `references/structure.md` | always: what stays identical (facts, code, H2/FAQ counts, links), what is free (paragraphs inside a section), the closing note |
| `references/style-guide.md` | always: the Google developer documentation style guide as the base, the site's deviations, register, glossary |
| `references/calques.md` | before the native read: calques and structural interference found on this site, with before/after |
| `scripts/check-english.mjs` | after the native read, and on every published page before trusting a change to it |
| `scripts/register.mjs`, `register-thresholds.json` | how the register warnings are measured, and the native thresholds |
| `scripts/calibrate-register.mjs`, `native-corpus.json` | to re-measure the thresholds (network; record the run in a research note) |

## Inputs

- The **final** Portuguese file: after content-page's verification pass
  (phase 4), never a draft. Translating a draft doubles the corrections.
- For a revision: the current English file and its Portuguese pair.

## Step 1 — Fact sheet (a file, in English, no prose)

Read the Portuguese page once, whole. Write the fact sheet **to a file**
outside the repository (the session's scratchpad; like the brief, it is
never committed). It is the only thing the English writer gets, so anything
missing from it is missing from the page. In English, as notes, never as
sentences to translate. Per H2, in order:

- what the section **does** for the reader (answers the query, shows
  evidence, gives a procedure, sets a limit), in one line;
- each claim as a note, with its level (CLAUDE.md §10) and its exact hedge
  ("in this test", "on this site", "no" vs "mostly not");
- numbers, dates, counts and verdicts, exactly;
- links: anchor idea and English target (mapped through `TRANSLATION_PAIRS`);
- code blocks, diagrams and tables as placeholders (`[CODE-1]`, `[SVG-1]`,
  `[TABLE-1]` with its columns): the writer places them, you paste them
  verbatim afterwards;
- what is Brazil-specific and needs one clause for a foreign reader.

Above the sections: the English query and title idea (new page) or the
published `title`, `slug`, `primaryQuery` and H2 wording (revision, so
anchors stay unless a heading is worth changing), the FAQ questions as
notes, and the page's job in one sentence.

The hedges are the part a natural rewrite most often loses (two cases in the
2026-10-27 revision, both reverted): write them out, word for word.

## Step 2 — English draft by a writer who never saw the Portuguese

When the session can start a subagent, the draft is written by one that
receives the fact sheet, `style-guide.md`, the "Structural interference"
section of `calques.md`, and an English page of the same type as a model
of format (frontmatter, components, closing note) — **never the Portuguese
file or an earlier English version of the page.** Prompt:

> You are an American technical writer. Write this page for seotecnico.dev.br
> from the fact sheet below, as if you had done the work yourself. The reader
> is a developer who reads English natively. Follow the style guide (Google
> developer documentation style, with the site's deviations). Keep every
> claim, number, date, hedge and link exactly as the fact sheet states it;
> add no claim. Keep the H2 sections in the order given; inside a section,
> organize paragraphs as an English writer would, claim first. Put each
> placeholder ([CODE-1]…) on its own line where it belongs. Use "I" for the
> author's own actions, "you" for the reader. Return the MDX file.

Without a subagent: write it yourself from the fact sheet, with the
Portuguese file closed. You do not need it: everything verbatim is a
placeholder.

Then fill every placeholder verbatim from the Portuguese file (code with its
Portuguese comments, SVG geometry and tokens; translate only `<text>` labels,
`aria-label` and table cells) and check the frontmatter
(`structure.md`): slug and `primaryQuery` of a published page never change.

## Step 3 — Native read (the English alone)

Run the script first, so the reader knows where the page stands:

```bash
node .claude/skills/english-version/scripts/check-english.mjs content/en/blog/<slug>.mdx
```

Then read the English top to bottom as the target reader (`style-guide.md`):
a developer who never saw the original. When the session can start a
subagent, give this pass to a **new** one that has not seen the Portuguese
(the step 2 writer is too close to its own draft):

> You are a native American-English technical editor. Read this MDX page
> about technical SEO as its reader would, paragraph by paragraph. For every
> paragraph that sounds translated or non-native, return a rewrite of the
> whole paragraph that keeps the facts, numbers, hedges, links and code
> exactly. Look for: sentences that open with "The" + noun where the actor
> or "you" should lead; nouns where a verb belongs; runs of "the" (rewrite
> with possessives, compounds, pronouns, verbs — never just delete an article
> English needs); a colon joining two clauses that could be two sentences;
> semicolons; impersonal phrasing where the reader could be "you"; a noun
> repeated where "it" or "this" would do; headings that are a bare noun
> phrase. Do not touch code blocks, frontmatter keys, URLs or numbers. The
> script's warnings for this page: <paste>. Style: <paste style-guide.md
> "Variety and mechanics" and "Register">.

Without a subagent, do the same pass yourself with the Portuguese closed,
using the list in that prompt and `calques.md`.

Apply the rewrites you agree with; the fidelity check (step 4) has the last
word on any that changed a claim. Rerun the script: 0 errors. Each WARN is a
question: fix it, or leave it if the sentence is English as it stands (about
4 in 10 paragraph warnings are). The `register-*` lines should move toward
the native median; a page still past several thresholds needs another pass,
not an explanation.

## Step 4 — Fidelity check (the English against the Portuguese)

Open both. Section by section (paragraphs need not line up; facts must):

- every claim in the Portuguese is in the English, and the English adds none;
- every number, date, count and verdict matches; every hedge survived;
- every link exists on both sides, English ones pointing to `/en` pages;
- H2 count and order, FAQ count, `category`, `status`, dates: identical;
- code blocks byte-identical (`diff <(sed -n '/```/,/```/p' pt.mdx) <(…en.mdx)`
  is a quick check), including escapes inside inline code;
- headings changed → links to the old anchor updated (`grep -rn '#old-anchor' content/en`).

Then `check-pair.mjs <pt-slug>` from the content-page skill: 0 errors.

## Step 5 — Mechanics

- `title` ≤60, `description` ≤155, `tldr` ≤300 — counted **after** step 3.
- Closing translation note verbatim on the last line (`structure.md`).
- `npm test`, and the build when the session can reach Google Fonts (the
  build fetches them; in a sandbox without that host it fails before
  compiling content — then compile the changed MDX with `@mdx-js/mdx` and say
  so in the PR).

## Step 6 — Report

For the PR description (or content-page phase 8), list the judgment calls,
not the edits: heading renames (with the anchor updates), glossary choices
that differ from the Portuguese wording, any sentence where English idiom
forced a different structure around a hedged claim, any section whose order
or emphasis now differs from the Portuguese (paragraphs moved, a claim
brought to the front), and the `check-english` output with the `register-*`
values before and after. The owner reviews meaning; he should not have to
diff prose to find the places that needed judgment.

## Revising published English pages

Same steps. Step 1 is done from the published Portuguese; step 2 is a new
draft from the fact sheet, not an edit of the existing English (editing keeps
the structure that made it read as translated). The fact sheet carries the
published English headings, so anchors stay unless a heading is worth
changing. In addition:

- Start with `check-english.mjs --published --summary`: its register table
  ranks the pages furthest from native first. Revise in that order.
- `dateModified` stays unless the facts changed: a language revision is not a
  change in substance (content-page, "Updating an existing pair"). Say so in
  the PR so the owner can decide otherwise.
- A heading that changes changes its anchor: search and update links in the
  same commit.
- UI strings in `src/app/(en)` and `src/components` follow the same style
  guide; change visible text only, never form field names, query params or
  identifiers.
- Commit as `content(en): revise English for native register` with the rule
  totals before and after in the body.

## What this skill does not do

It does not translate into other languages (the site is PT + EN only, §10),
change a fact the Portuguese states, or decide that the Portuguese is wrong:
a factual problem found while translating goes back to content-page phase 4,
on both sides.
