# How AI is used in this project

> **Status:** reference · first written 2026-10-26
> **Evidence rule:** every statement is tagged **[repo]** (checkable in this
> repository with the command shown) or **[owner]** (how the owner describes
> his own workflow; not recorded in the repo). Numbers are as of commit
> `b141722` (merge of PR #114, 2026-10-24).
> **Source for:** the first entry of the project section
> (`docs/proposals/project-section.md`).

## 1. Summary

The site is built by one person working with Claude. The owner decides what
gets built, supplies the data only he can reach (Search Console, GA4, keyword
validation), reviews every change and merges every pull request. Claude
writes most of the code, tests, documentation and article drafts, inside
rules this repository enforces: `CLAUDE.md` as the contract, CI as the gate,
and a claims policy that forbids numbers without a versioned measurement.

What makes the AI output usable here is not the model. It is that almost every
rule a model could break is a rule a test checks.

## 2. What the history shows **[repo]**

| Measure | Value | Command |
|---|---|---|
| Commits on `main` | 468 | `git rev-list --count HEAD` |
| Merged pull requests | 117 merge commits, PRs #1 → #114 | `git log --merges --oneline` |
| Non-merge commits | 351 | `git rev-list --no-merges --count HEAD` |
| …with a `Co-Authored-By: Claude …` trailer | 351 (all of them) | see below |
| First commit | 2026-07-12 | `git log --reverse --format=%ad --date=short \| head -1` |

```bash
git log --no-merges --format='%(trailers:key=Co-Authored-By,valueonly)' \
  | grep -i claude | sed 's/<.*//' | sort | uniq -c
```

| Model named in the trailer | Commits | First → last |
|---|---|---|
| Claude Fable 5 | 46 | 2026-07-12 → 2026-07-25 |
| Claude Opus 4.8 | 28 | 2026-07-13 → 2026-07-22 |
| Claude Opus 5 | 101 | 2026-07-24 → 2026-10-15 |
| Claude Opus 5.5 | 176 | 2026-09-23 → 2026-10-23 |

Commits by conventional-commit type (non-merge): `docs` 131, `feat` 67,
`content` 59, `fix` 35, `test` 18, `ci` 10, others 31. Documentation is the
largest category: in this project the record of a decision is part of the
deliverable.

**What these numbers do not say.** A co-author trailer records that a Claude
session produced the commit. It does not measure how much of the text the
model wrote versus how much the owner edited, dictated or rejected before the
commit existed. No such measurement exists for this project, and this file
does not estimate one.

## 3. Who does what

| Step | Owner | Claude |
|---|---|---|
| Decide the next piece of work | yes **[owner]** | proposes, in research notes and proposals **[repo]** |
| Keyword and demand validation | yes, outside the sessions (Google Trends, Autocomplete, GSC; Semrush until October 2026) **[owner]** | analyses exports the owner provides **[owner]** |
| Search Console and GA4 data | exports them by hand from the project's properties, which live in the owner's personal Google account **[owner]** | reads the exports; never holds the credentials **[owner]** |
| Research | reviews | writes dated research notes with evidence labels (`docs/research/`) **[repo]** |
| Code, tests, docs, article drafts | reviews, corrects | writes them in a session with repository access **[repo]** |
| Pull request | reviews and merges (§14) **[repo]** | opens it; never merges |
| After merge | requests indexing, distributes | — |

The owner uses two kinds of session **[owner]**: a claude.ai Project for
editorial work (briefs, keyword analysis, article review), and Claude Code
sessions with the repository for implementation. Work moves from the first to
the second as a handoff file: verbatim code is left as `[CODE-n]`
placeholders for the session that can read the repo, and decisions that need
an editor are marked `[NOTA-REDACAO]`.

## 4. The contract: `CLAUDE.md` **[repo]**

`CLAUDE.md` is read at the start of every session and declares itself the
single source of truth. What makes it work as a contract for a model rather
than as a wish list:

- **Numbered sections**, so a commit, a review comment or a skill can cite
  "§10" instead of paraphrasing a rule.
- **Dated owner decisions** inside the rule ("owner rule, 2026-10-23"; "rule
  since 2026-09-25"), so a later session knows which rule is newer and why it
  exists.
- **The claims policy** (§10): mechanism, conditional or magnitude, and
  magnitude needs a measurement with declared method. This is the rule that
  keeps generated text from inventing numbers.
- **An out-of-scope list** (§13), which is as useful to a model as the scope.

## 5. Guardrails that make the output checkable **[repo]**

CI (`.github/workflows/ci.yml`) blocks a merge on any failure:

| Gate | What it catches that a model might get wrong |
|---|---|
| Lint, type-check, 33 Vitest files | broken code, schema builders, content parsing |
| Content loader (`src/lib/content.ts`) | title > 60, description > 155, tl;dr > 300, unknown category, `basedOn` pointing to a non-experiment |
| `content-code-paths.test.ts` | an article citing a repository path that does not exist |
| `hreflang.test.ts` | a translation pair declared on one side only |
| `design-rules.test.ts`, `design-tokens.test.ts` | hardcoded colours, forbidden utilities, token drift |
| 8 Playwright specs | one H1, title and description, canonical, JSON-LD types, hreflang in both directions, contrast, accessibility |
| Lighthouse CI | performance budgets (§6) |

When a rule matters and is not yet a test, it tends to be broken: the closing
translation note of English articles is a convention, not a check, and the two
pairs published on 2026-10-23 shipped without it (found while writing the
`content-page` skill, whose `check-pair.mjs` now checks it).

## 6. Narrowing claims **[repo]**

Several commits exist only to make a statement smaller and true. Example:
`e376922` (*narrow the apex finding to a route problem, not an outage*)
reduced an outage reading to what the evidence supported: the owner's network
could not connect to one Vercel IP range, while a TCP check reached it from
17 of 18 nodes worldwide and from São Paulo. The research notes follow the same habit with labels such as
**[documented]**, **[inference]** and **[observation]**
(`docs/research/2026-10-18-scaled-content-research.md`).

## 7. Skills **[repo]**

Skills are folders of instructions a Claude session loads when a task matches
their description. Two kinds are in use:

- **Third-party**, pinned in `skills-lock.json`: `frontend-design`
  (anthropics/skills), `next-best-practices` (vercel-labs/next-skills),
  `vercel-react-best-practices` (vercel-labs/agent-skills). Installed locally,
  not versioned.
- **Project skills**, versioned under `.claude/skills/`: written from this
  repository's own history. The first is `content-page`. How they are made
  is in `docs/skills.md`.

## 8. What stays with the owner

- Merging. No session merges its own pull request.
- Secrets. Keys live in Vercel environment variables (§14); Search Console and
  GA4 live in the owner's personal Google account **[owner]**.
- Search Console data, by hand. No API pulls it: the `gsc-monitor` toolkit
  named in `CLAUDE.md` §7.3 has **never run against this site**, because the
  only Search Console API credentials the owner has belong to another account,
  which this project does not use **[owner]**. Every Search Console number in
  the repository comes from a manual export, dated in the file that records it
  (for example `docs/baseline/2026-09-11/search-console.md`) **[repo]**.
- Publication decisions: whether a topic is worth a page, and whether a page
  is ready.
- Distribution: indexing requests and posts happen after merge, by hand.

## 9. Reproducing the numbers

```bash
git clone https://github.com/Alf4kill/seotecnico.dev.br && cd seotecnico.dev.br
git rev-list --count HEAD
git log --merges --oneline | wc -l
git log --no-merges --format='%(trailers:key=Co-Authored-By,valueonly)' | grep -ci claude
git log --no-merges --format='%s' | sed -E 's/^([a-z]+)(\([^)]*\))?:.*/\1/' | sort | uniq -c | sort -rn
```

Run them on a later commit and the numbers grow; the table in §2 is a dated
snapshot, not a live figure.
