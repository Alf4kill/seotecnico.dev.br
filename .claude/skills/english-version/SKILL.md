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
  strings under src/app/(en). Covers the intent-first rewrite, the native
  read, the fidelity check against the Portuguese, the site's style guide and
  glossary, and a script that flags known calques. It does not decide what a
  page says: facts, numbers and claim levels come from the Portuguese side.
---

# English version (intent → English draft → native read → fidelity check)

Feedback the owner received in October 2026 said the English pages read
like a translation. The 2026-10-27 revision found why: every English page had been
written sentence by sentence from the Portuguese, so Portuguese structure
survived in correct English words — colon chains, "it is worth", "that is
why", "readings" for fetches, day-month dates, British and American spelling
mixed. Research on machine and LLM translation says the same thing: the
literal first draft is the default, and it improves when the model is told
to write from the meaning and then revise for the target reader
(`docs/research/2026-10-27-english-translation-quality.md`).

So this skill never translates in one pass. It writes from what each section
*does*, then reads the English alone, as an English reader would, then checks
it against the Portuguese for facts. `CLAUDE.md` wins on any conflict.

## Files

| File | Read when |
|---|---|
| `references/structure.md` | always: what stays identical (facts, code, H2/FAQ counts, links), what is adapted, the closing note |
| `references/style-guide.md` | always: American English, dates, register, the site's glossary |
| `references/calques.md` | before the native read: every calque found on this site, with before/after |
| `scripts/check-english.mjs` | after the native read, and on every published page before trusting a change to it |

## Inputs

- The **final** Portuguese file: after content-page's verification pass
  (phase 4), never a draft. Translating a draft doubles the corrections.
- For a revision: the current English file and its Portuguese pair.

## Step 1 — Intent map (no English prose yet)

Read the Portuguese page once, whole. Then, per H2, write down for yourself:

- what the section **does** (answers the query, shows evidence, gives a
  procedure, sets a limit), in one line;
- each claim with its level (CLAUDE.md §10) and its hedge ("in this test",
  "on this site", "no" vs "mostly not");
- what is Brazil-specific and needs one clause for a foreign reader;
- what is verbatim: code, paths, command output, quotes, numbers, dates.

This is what keeps the English free to change sentence structure without
changing a claim. The hedges are the part a natural rewrite most often
loses (two cases in the 2026-10-27 revision, both reverted).

## Step 2 — English draft from the intent

Write each section in English from the map, with the Portuguese open only to
copy what is verbatim. Rules:

- Start each paragraph with what an English writer would put first, usually
  the claim, not the Portuguese opening clause.
- Split Portuguese colon and semicolon chains into sentences.
- Glossary terms from `style-guide.md` (fetch, round, prompt, run, bug, log).
- Title and headings written for an English searcher and reader, not
  translated. New page: the slug carries the English query
  (`structure.md`). Published page: slug and `primaryQuery` never change.
- Code, SVG geometry, links' targets (mapped to `/en`), numbers: verbatim.

## Step 3 — Native read (the English alone)

Close the Portuguese. Read the English top to bottom as the target reader
(`style-guide.md`): a developer who never saw the original. Mark every
sentence that would make that reader think "this was translated": word
order, a noun where a verb belongs, an odd collocation, a stiff hedge, a
generalization about people, a term the English docs do not use. Then
compare against `calques.md` and fix.

When the session can start a subagent, give this pass to one that has **not**
seen the Portuguese — a reader who knows the original cannot unsee it:

> You are a native American-English technical editor. Read this MDX page
> about technical SEO as its reader would. List every sentence that sounds
> translated or non-native, with a rewrite that keeps the facts, numbers,
> hedges, links and code exactly. Do not touch code blocks, frontmatter keys,
> URLs or numbers. Style: <paste style-guide.md "Variety and mechanics" and
> "Register">.

Apply the rewrites you agree with; the fidelity check (step 4) has the last
word on any that changed a claim.

Then run:

```bash
node .claude/skills/english-version/scripts/check-english.mjs content/en/blog/<slug>.mdx
```

0 errors. Each WARN is a question: fix it, or leave it if the sentence is
English as it stands (a colon that introduces a list is fine).

## Step 4 — Fidelity check (the English against the Portuguese)

Open both. Paragraph by paragraph:

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
forced a different structure around a hedged claim, and the `check-english`
output. The owner reviews meaning; he should not have to diff prose to find
the places that needed judgment.

## Revising published English pages

Same steps, with step 1 done from the published Portuguese and step 2
replaced by editing the existing English. In addition:

- Start with `check-english.mjs --published --summary` to see the scale and
  which rules dominate.
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
