---
name: content-page
description: >-
  Create, research, draft, verify, translate or update a content page on
  seotecnico.dev.br — a blog article (content/blog + content/en/blog) or, once
  the section exists, a project entry (content/projeto + content/en/project).
  Covers the whole pipeline the site uses: research note with dated sources,
  brief, draft (written here, by the owner, or in an external writing session
  through a handoff kit), the verification pass against sources and code, the
  English version, hreflang registration, experiment-log row, scripted checks
  and the PR. Use it whenever the owner asks to write, publish, plan,
  research, translate, review or update an article, post or page, hands back a
  draft or a writing-session delivery, or asks for "the English version" —
  even if only one language or only one phase is mentioned: every new article
  ships in Portuguese and English in the same PR (CLAUDE.md §10).
---

# Content page (research → brief → draft → verification → PT + EN → PR)

This skill turns a topic into a published Portuguese/English pair in one PR,
in the order this site has used since July 2026. It exists because the rules
for a page are scattered over CLAUDE.md, tests, two research notes and commit
messages, and because **every draft so far, from every route, arrived with
something wrong** that only a check against the sources or the code found
(`references/draft-verification.md` lists them with their commits).

`CLAUDE.md` is the source of truth. This skill points at its sections instead
of copying them; when they disagree, `CLAUDE.md` wins and this file is the one
to fix.

## Where each phase runs

| Phase | Runs in | Output | Versioned |
|---|---|---|---|
| 0 Gates | here | go / stop, with the reason | no |
| 1 Research note | here (needs the web and the repo) | `docs/research/YYYY-MM-DD-<topic>.md` | yes, own commit |
| 2 Brief | here or the editorial session | `brief-<slug>.md` | no — owner rule: briefs stay untracked and are deleted after use |
| 3 Draft | here, the owner, or an external writing session | PT MDX (+ delivery notes) | no, until phase 4 ends |
| 4 Verification | **here, always** | corrected PT MDX | yes |
| 5 English | here | EN MDX | yes |
| 6 Register | here | `hreflang.ts`, log row, sitemap images | yes |
| 7 Checks | here | script and test output | in the PR |
| 8 PR | here | PR for the owner to merge | — |

"Here" is a session with the repository. The external writing session has no
repository, so it cannot see code or run scripts: that is why it writes
placeholders instead of code, and why phase 4 can never be skipped.

## Before you start

Read `CLAUDE.md` §5.2 (layers), §6 (SEO requirements), §7.3 (experiment log,
power rule), §9 (diagram tokens), §10 (frontmatter, claims policy), §13
(scope). Then `docs/research/2026-09-13-page-creation.md` §3.3 and, in this
skill, `references/page-types.md` for the kind of page you are making.

## Phase 0 — Gates (stop here if one fails)

Tell the owner which gate failed and why; do not write around it.

1. **First-hand evidence.** The page answers a question where this site has
   data others do not: a measurement, an audit, an incident, an experiment, a
   file in this repo. Name the file or commit. A page built only on public
   sources (like `scaled-content-abuse`) passes only when its angle is this
   site's own implementation — its "No Next.js" section quotes the repo.
2. **Scope.** Blog: how machines fetch, render, read or index pages (§13).
   Anything about the project itself goes to the project section. Personal
   subjects (career, job search, clients) go nowhere on the site.
3. **No overlap.** `grep -rn "primaryQuery" content` — a new page never shares
   an equivalent `primaryQuery` with a published one (§5.2).

## Phase 1 — Research note

Write `docs/research/YYYY-MM-DD-<topic>.md` from `references/research-note.md`
before the brief. The note is what makes the page "well informed": every
external fact read on a dated day from the primary page itself, labelled by
how sure it is, and ending in the list of claims the article may and may not
make. Skip it only when every claim comes from this repository (an experiment
record, an audit) — then the record is the note.

Commit it on its own: `docs: research note on <topic>`.

## Phase 2 — Brief

Fill `references/brief-template.md`. The owner reviews it before any prose:
drafting first and planning afterwards is how filler happens, and on an
exact-match domain filler is the main risk (§1). The brief names the drafting
route (phase 3) and, for route A, the banned framings the writing session
must avoid — they become `check-draft.mjs --ban`.

## Phase 3 — Draft (three routes, one standard)

- **A. External writing session.** Build the kit of `references/handoff-kit.md`
  (brief + research note + rules + placeholder convention + return package).
  The research note travels **with** the brief: the 2026-10-18 session did not
  receive it and had to re-research every Google page.
- **B. Owner draft.** Treat it exactly like route A's return.
- **C. Written here.** Same rules; code is pasted from the repo directly, so
  there are no `[CODE-n]` placeholders.

Rules for every route:
- First paragraph answers `primaryQuery` for a human; `tldr` says the same in
  ≤300 characters.
- No H1 in the body; no `{{` outside code; plain Markdown, GFM tables, inline
  SVG and `<Image>` (the only component `src/components/mdx/mdx-components.tsx`
  maps). Any other capitalised tag in prose is undefined at render.
- Every claim is level 1, 2 or 3 (§10); a level-3 claim cites its versioned
  source. Code presented as this site's is the repo's, with its path.
- Diagrams: inline SVG, `role="img"` + `aria-label`, token colours, a text
  mirror next to it (§9).
- Links: pillar, ≥1 tool, related articles, descriptive anchors.
- `faq` only with questions people ask (FAQ rich results ended 2026-05-07).

## Phase 4 — Verification pass (never skipped)

Follow `references/draft-verification.md`. In order:

1. `node .claude/skills/content-page/scripts/check-draft.mjs <draft> --arrival --ban "<brief's list>"`
   — the inventory: placeholders to fill and mechanical defects.
2. Fill every `[CODE-n]` verbatim from the file it names; note the line range.
   Build every `[SVG-x]` from its spec with the diagram tokens.
3. Re-read every external source the draft relies on, on the day, and every
   repo record it quotes (experiment log, audit). Correct the draft, not the
   record.
4. Run the claim that sounds most like a fact you could test, if it can be
   tested here (4de2df3 found a false claim this way, and a repo bug with it).
5. Resolve each `NOTA-REDACAO`: decide it if it is editorial and reversible;
   otherwise keep it for the PR description as an owner decision.
6. Rerun `check-draft.mjs` without `--arrival`: 0 errors before phase 5.

The commit body lists what the pass corrected ("External draft, corrected
against the sources: …"). That list is the evidence the process works; do not
summarise it away.

## Phase 5 — English version

Follow `references/translation.md`: adapt, do not transliterate; the English
slug and title carry the English query; same facts, dates, FAQ count and H2
structure; English text links only to English pages; `translationOf` points
to the Portuguese slug; the closing translation note is the last line.

## Phase 6 — Register

1. `TRANSLATION_PAIRS` in `src/lib/hreflang.ts`, at the end: `id` = PT slug,
   `paths` with both routes. Comments there are in Portuguese.
2. `docs/experiment-log.md` row **before** publishing: date, change, a
   hypothesis the site's volume can test, its power note (§7.3). Existence and
   indexing predictions are fine; ranking promises are not.
3. Raster images (`<Image>` with a file under `public/images/blog/<slug>/`):
   add them to `postImages` in `src/app/sitemap.ts`.
4. Tests that pin "the newest post" (`src/lib/content.test.ts`) may change;
   update the intent, not just the value, and say so in the commit.

The search index derives from frontmatter `keywords` (`lib/search-index.ts`);
there is no second file to edit.

## Phase 7 — Checks

```bash
node .claude/skills/content-page/scripts/check-draft.mjs content/blog/<pt>.mdx
node .claude/skills/content-page/scripts/check-draft.mjs content/en/blog/<en>.mdx
node .claude/skills/content-page/scripts/check-pair.mjs <pt-slug>          # project entry: --type project
npm test
NEXT_PUBLIC_DOMAIN=https://seotecnico.dev.br SITE_INDEXABLE=true npm run build
NEXT_PUBLIC_DOMAIN=https://seotecnico.dev.br SITE_INDEXABLE=true npm run test:seo
```

The overrides are the README's: a local `.env.local` pointing the domain to
localhost makes every canonical and sitemap assertion fail.

Both scripts exit 1 on any ERROR. Each WARN is a question to answer in the PR
description. Before trusting a change to either script, run it on everything
published (`check-draft.mjs --published`, `check-pair.mjs --all`): a check that
flags correct published pages is wrong, not strict.

## Phase 8 — PR

One branch; English commits (§10):

- `docs: research note on <topic>` (phase 1, if it is not merged already)
- `content: publish <topic>, PT and EN` — both MDX files, `hreflang.ts`,
  sitemap images; body = what the verification pass corrected
- `docs(log): register <topic>`
- test updates in their own commit, with the reason

The PR description carries: the brief (or its summary — the file is not
committed), each level-3 claim with its source, both scripts' output, open
`NOTA-REDACAO` decisions, and the after-merge steps: request indexing for
**both** URLs, distribute once (LinkedIn PT + EN, one developer community),
write that date into the log row.

Never merge. The owner reviews and merges every PR (§14).

## Updating an existing pair

Change both sides in the same PR. Bump `dateModified` on a side only when its
text changed in substance (a link target is not, commit `8aba089`). Run both
scripts; a WARN that PT `dateModified` is newer than EN means the change was
not carried over.
