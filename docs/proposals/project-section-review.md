# Review: the `/projeto` proposal

> **Status:** review of `docs/proposals/project-section.md` (draft of
> 2026-10-26, delivered outside the repo with `docs/ai-workflow.md`,
> `docs/skills.md` and `.claude/skills/bilingual-page/`)
> **Reviewed at:** `b141722` (merge of PR #114), 2026-10-26
> **Companion:** `docs/proposals/project-section-example-entry.md` — the
> worked example of one entry, from brief to registered pair.

## 1. Verdict

Build it, with five changes (§3). The proposal is sound: the scope is
narrow, every number in it was checked and holds, and it reuses the
pipeline instead of inventing one. The changes are about how the section
relates to pages that already exist, and about one objective that is worded
as a production quota.

## 2. What was checked

| Claim in the proposal | Check | Result |
|---|---|---|
| 468 commits, 351 non-merge, 117 merges | `git rev-list --count`, `--no-merges`, `git log --merges` on `origin/main` | holds |
| Per-model trailer counts (46 / 28 / 101 / 176) | trailer one-liner of `ai-workflow.md` §2 | holds |
| Commits cited (`e376922`, `59f86e1`, `8aba089`, `02a834f`, `2caa4e0`, `751a444`, `a729d8e`) | `git log -1` on each | all exist, subjects match |
| `check-pair.mjs --all` → 24 pairs, 0 errors, 5 warnings | ran it against `main` | holds, exit 0; the 5 warnings are the ones listed in the proposal §9 |
| Playwright routes come from the sitemap | `tests/seo/seo.spec.ts:30`, `a11y.spec.ts`, `design.spec.ts` | holds; **`contrast.spec.ts` has a hardcoded list** (add `/projeto` there) |
| G2 is Google's people-first page | `docs/research/2026-10-18-scaled-content-research.md` line 29 | holds |
| Blog loader requires `category`; English loader requires `lang: en` | `src/lib/content.ts` `getAllPosts`, `getAllEnglishPosts` | holds |
| `tldr` and `basedOn` missing from CLAUDE.md §10 | compared with `PostFrontmatter` | holds — worth fixing regardless of the section |

One date is off by a day: `b141722` is dated 2026-10-23 22:36 −03:00, not
2026-10-24 (`ai-workflow.md` header). It is 2026-10-24 only in UTC. Pick one
convention and say it.

## 3. Changes recommended

### 3.1 The section already exists in the footer — use it

`src/components/layout/Footer.tsx` already has a column titled **Projeto /
Project** with Sobre, Design and the privacy policy. That settles the naming
decision (proposal §8.1): `/projeto` + `/en/project` match a label readers
already see, `/bastidores` would introduce a second name for the same idea.

- Make the column title link to `/projeto` (and `/en/project`), and keep the
  three links under it.
- List `/design` on the `/projeto` index as a hand-written entry. It is
  already a project entry in everything but location (the proposal itself
  calls it "the other colophon"). The index then has two items the day it
  ships, which removes most of the thin-index risk of proposal §7.

### 3.2 Say what each "about the site" page is for

Four pages now talk about the site. Without a written split, entries will
drift into each other:

| Page | Answers | Changes |
|---|---|---|
| `/sobre`, `/en/about` | who runs it and what the site is | rarely |
| `/laboratorio`, `/en/lab` | what was measured, and the method of each experiment | per experiment |
| `/en/case-studies` | results, told for a hiring reader | per case |
| `/projeto`, `/en/project` | **how the site is built and run** (tooling, process, decisions, postmortems) | per entry |

Add this table to the new CLAUDE.md §5.4. It also answers where a future
postmortem goes (`/projeto`) versus a measurement (blog + `/laboratorio`).

### 3.3 Reword O8: evidence, not coverage

"Every recurring workflow has a public project entry" is a quota. A quota is
what produces filler, and §1 warns that filler on an exact-match domain reads
as spam. Proposed row:

```markdown
| O8 | The way the site is built is public and checkable: AI use is disclosed, and every number about the project's history prints the command that reproduces it | `/projeto` entries; each links a versioned artifact | Month 4+ |
```

The skill catalog in `docs/skills.md` can keep its own list of candidate
skills; an entry is written when there is something first-hand to say, not
because a skill exists.

### 3.4 Two facts to confirm before entry 1 is written

1. **History rewrite.** All SHAs changed on 2026-10-19. PR pages on GitHub
   for PRs merged before that date show the old SHAs. Entry 1 should say, in
   one sentence, that cited SHAs are from the current history, and prefer PR
   links over SHAs for anything older than 2026-10-19.
2. **Which Google account — confirmed by the owner, 2026-10-26.** The Search
   Console and GA4 properties are in the owner's personal account. The API
   credentials `gsc-monitor` uses are in a work account, so **`gsc-monitor`
   has never run against this site**; every Search Console number in the repo
   is a manual export. `ai-workflow.md` §3 and §8 now say so. On the page,
   say only that: the toolkit has not run here and the data is exported by
   hand. Nothing about the other account beyond "another account this project
   does not use" (the new §13 bullet rules out client work).

   Two versioned texts read as if the toolkit ran, and PR 1 corrects them:
   - `CLAUDE.md` §3 (O2: "own GSC Monitor"), §7.3 ("`gsc-monitor`: weekly
     indexing + query snapshots"): keep the plan, add its status — *not
     running: no Search Console API access for this project; data comes from
     manual exports (owner, 2026-10-26)*. Same treatment for any §7.3 tool
     that has not run.
   - `docs/experiment-log.md`, the row whose result reads "GSC snapshot at
     publish via gsc-monitor": append a dated correction, without rewriting
     the row — *2026-10-26: no gsc-monitor snapshot was taken; the toolkit has
     never run against this site. The 2026-09-11 figures in this row come from
     the manual export in `docs/baseline/2026-09-11/`.*

   No published page claims the toolkit ran (`grep -ri gsc-monitor content
   src`: no match).

### 3.5 Loader: one collection reader, not a third copy

`getAllPosts` and `getAllEnglishPosts` already repeat the same read → validate
→ sort logic. A `getProjectEntries(lang)` written the same way makes three
copies. Extract a private `readCollection(dir, { lang, category: 'required' |
'forbidden' })` in `src/lib/content.ts` and call it from all three; the two
existing functions keep their signatures, so nothing else changes. Done in
PR 2, covered by the existing `content.test.ts`.

## 4. Smaller notes

- **Index JSON-LD.** §6 requires schema on every page type. Use what
  `/laboratorio` uses: `WebPageJsonLd` + `BreadcrumbJsonLd`.
- **Entry JSON-LD.** `Article` as proposed. `TechArticle` adds nothing
  Google uses.
- **Search UI.** Entries need a result label ("Projeto" / "Project") so a
  reader can tell them from articles; `search-data.ts` has the static-item
  shape to follow.
- **`llms.txt`.** Yes, under its own heading (proposal §8.3): an agent asked
  "how is this site built" should land on the entry, not guess from articles.
- **Feed.** Stays out, as proposed. The feed is the blog.
- **`check-pair.mjs` for entries.** The pillar and tool checks must be off for
  the project type, and replaced by "links at least one versioned artifact"
  (a GitHub URL to a commit, PR or file). That is the section's evidence rule
  made executable.

## 5. Order of work

The proposal's four PRs stand, with two adjustments:

| PR | Contents | Change from the proposal |
|---|---|---|
| 1 — policy + skills | CLAUDE.md edits, `.gitignore`, skill, `ai-workflow.md`, `skills.md`, `content-pipeline.md`, proposal + this review | O8 reworded (§3.3); §5.4 gets the table of §3.2; `gsc-monitor` status in §3/§7.3 and the log correction (§3.4) |
| 2 + 3 — section + entry 1 | loader refactor, routes, sitemap, search, `llms.txt`, pairs, footer, `/design` on the index, tests, entry 1 pair | merged as **one PR**, so the index never ships with a single item or `noindex` |
| 4 — entry 2 pair | via the skill | unchanged |

## 6. Addendum (2026-10-26): the page pipeline as entry and as skill

The owner asked for the section to document how content pages are made —
research, automation, the steps that make a page well informed — and for that
process to become a project skill.

### 6.1 One skill, `content-page`, instead of `bilingual-page`

The real process starts before the brief (a dated research note) and has a
phase the proposal's skill does not cover: the draft often comes from a
writing session without the repository, and the verification pass against
sources and code is where every published page was corrected. Two skills that
both trigger on "write an article" would compete, so `content-page` absorbs
`bilingual-page` (nothing of it is versioned yet, so the rename costs
nothing):

| File | Origin |
|---|---|
| `SKILL.md` | rewritten: 9 phases with where each runs, three drafting routes, one standard |
| `references/research-note.md` | new, from the two notes in `docs/research/` |
| `references/handoff-kit.md` | new: what the writing session gets, the instructions block, the return package |
| `references/draft-verification.md` | new: the pass, with every correction the history records (PRs #7, #17, #27, `0b95d3c`, `0d997fb`, `4de2df3`, `7e73fc1`) |
| `references/brief-template.md` | extended: research note, drafting route, banned framings, prose ceiling |
| `references/translation.md`, `page-types.md` | kept; page types gain the project-entry link rule |
| `scripts/check-draft.mjs` | new: single-file checks on arrival and before the PR |
| `scripts/check-pair.mjs` | kept, paths renamed |
| `evals/` | the three cases + `verify-returned-draft` |

**Correction to the proposal's skill:** it says `src/lib/mdx.ts` maps no
components and that capitalised tags appear only in code. `<Image>` is mapped
(`src/components/mdx/mdx-components.tsx`) and used in prose by four articles.
`check-draft.mjs` found it on its first run against the published set.

**Second correction:** the proposal's `SKILL.md` frontmatter is not valid
YAML. Its one-line `description` contains `: ` ("…mentioned: every new
article…"), which js-yaml (the parser gray-matter uses) rejects. A loader that
parses strictly would not read the description that decides when the skill
runs. `content-page` uses a folded block (`description: >-`) and parses.

Verified: `check-draft.mjs --published` → 48 files, 0 errors, 0 warnings;
a draft broken in ten ways → ten findings, exit 1; `check-pair.mjs --all` →
24 pairs, 0 errors.

The `.gitignore` allowlist of proposal §4 changes its last line to
`!.claude/skills/content-page/`.

### 6.2 Entry 3 — "Como uma página nasce aqui"

Moves from "later candidates" into the first batch. Source document:
`docs/content-pipeline.md`, with the same [repo]/[owner] tagging as
`ai-workflow.md`.

| | PT | EN |
|---|---|---|
| Slug | `como-uma-pagina-nasce` | `how-a-page-is-made` |
| Question | Como uma página de conteúdo é feita aqui, da pesquisa ao merge, e o que é verificado em cada etapa? | |
| Evidence | `docs/content-pipeline.md`; `5adfded` → `7e73fc1` → `ed4adb4`; the PR bodies of §4 of that doc; the skill folder | |

Outline: direct answer → the chain (table) → one page traced
(`scaled-content-abuse`) → what verification caught (table) → automated vs
judgment → the skill → links (the article it traces, Entry 1, Entry 2, the
skill on GitHub).

It overlaps Entry 2 ("Skills"): Entry 2 explains what a skill is and when a
process deserves one; Entry 3 is the process itself. Entry 2's worked example
becomes `content-page`, and it links Entry 3 for the content.

Order: Entry 1 (AI use) → Entry 3 (the pipeline) → Entry 2 (skills), so each
links only to entries already published.

### 6.3 What was not used

The second file attached with the request (a job-search research prompt) is
personal — career and job search are excluded from the whole site by the
proposed §13 bullet. It is not cited anywhere. The research-note template
already carries the general rules it shares with this site (open the original
page, invent nothing, mark the unknown).

## 7. Decisions still open for the owner

Proposal §8 items 4, 5 and 6 are unaffected by this review. Items 1–3 now
have a recommendation: `/projeto` (§3.1), O8 reworded (§3.3), search and
`llms.txt` both yes (§4).
