# Proposal: `/projeto` — a section that documents the project itself

> **Status:** proposal — accepted with changes on 2026-10-26; the changes,
> including the skill renamed `content-page`, are in
> `project-section-review.md`, which wins where the two differ
> **Origin:** owner request, 2026-10-26: a sub-section about the project
> itself, its actions and the content made in it, as documentation; no
> personal subjects, only the owner's content about the project.
> **Last updated:** 2026-10-26
> **Companion files:** `docs/ai-workflow.md` (source for entry 1),
> `docs/skills.md` (source for entry 2), `.claude/skills/bilingual-page/`

---

## 1. What this is

A third content surface next to the blog and the tools: **`/projeto`** (PT)
and **`/en/project`** (EN), where each entry documents how this site is built
and run. The first two entries explain how AI is used in the project and how
a repeated process becomes a skill, with the `bilingual-page` skill as the
worked example.

It is **not** a blog category. The blog stays inside the niche of §13 (how
machines fetch, render, read or index pages); the project section is the one
place where the subject is the project.

## 2. Why it belongs on this site

1. **It is the portfolio claim made visible.** §1 says the repository and the
   documented results are the portfolio artifact. Today a visitor has to read
   `git log` to see how the site is built. The section puts that on a page,
   with every number tied to a command they can rerun.
2. **Google asks for exactly this.** The people-first content page (G2 in
   `docs/research/2026-10-18-scaled-content-research.md`) asks site owners to
   answer *Who, How and Why*, including disclosure of automation. A page that
   says how AI is used here, with evidence, is that disclosure. The site's own
   article `scaled-content-abuse` argues the line is scale without value, not
   the tool; the section shows the site applying that to itself.
3. **It is non-commodity by construction.** Nobody else can write "how this
   repository is built". Every entry rests on first-hand data.
4. **It fits the lab method.** The blog publishes measurements; the section
   publishes the method that produces them.

It is not meant to rank. Search demand is not a gate for entries (§5.3).

## 3. Policy changes to `CLAUDE.md`

### 3.1 §13, the niche bullet — replace

**Before**

```markdown
- Content outside the niche: content SEO, link building, general marketing,
  news commentary, and any topic that is not about how machines (Googlebot,
  AI assistants) fetch, render, read or index pages
```

**After**

```markdown
- Blog content outside the niche: content SEO, link building, general
  marketing, news commentary, and any topic that is not about how machines
  (Googlebot, AI assistants) fetch, render, read or index pages. The single
  exception is the project section (§5.4), and only for entries about this
  project itself.
- Personal subjects, anywhere on the site: career, job search, personal life,
  client work, and opinions that are not about this repository.
```

### 3.2 §5.1, route map — add

```
/projeto                        → Project section index (pair of /en/project)
/projeto/[slug]                 → Project entries (MDX, content/projeto)
```

### 3.3 New §5.4 — add after §5.3

```markdown
### 5.4 Project section (documentation of the project itself)

Entries document how this site is built and run: decisions, methods,
tooling, processes (including how AI is used), postmortems. Since 2026-MM-DD
(owner decision).

- **Scope:** this project only. No personal subjects (§13).
- **Evidence:** every entry links at least one versioned artifact (commit,
  PR, file in `docs/`). A number about the project's history prints the
  command that reproduces it, and the commit it was measured at.
- **Claims policy** (§10) applies unchanged.
- **Surfaces:** sitemap, hreflang pairs, on-site search. Not in `/blog`,
  related articles or the RSS feed: the blog's topical cluster stays clean.
- **Frontmatter:** the article schema (§10) without `category`.
  `primaryQuery` is the honest question the entry answers; search demand is
  not required.
- **Bilingual:** like articles, every entry ships PT + EN in the same PR.
- **Reachable** from `/sobre`, `/en/about` and the footer (§6, no orphans).
```

### 3.4 §3, objectives — add one row (owner decision, §8 item 2)

```markdown
| O8 | Document the process: every recurring workflow has a public project entry, and the repeated ones a versioned skill | entries in `/projeto`; skills in `.claude/skills/` | Month 4+ |
```

§13 ends with "anything that doesn't map to an objective in section 3"; O8 is
what the section maps to. The alternative is mapping it to §2 alone, which
§13 does not accept as written.

### 3.5 §10, frontmatter schema — complete it (unrelated fix found here)

The schema block lists neither `tldr` nor `basedOn`, which the loader
(`src/lib/content.ts`) supports and published articles use. Add:

```yaml
tldr:           # optional, ≤300 chars: direct answer, rendered on top and as Article.abstract
basedOn:        # optional list of experiment slugs in the same language collection → isBasedOn
```

## 4. Versioning project skills

`.claude/` is ignored today, so a skill there never reaches the public repo.
Replace the line in `.gitignore`:

```gitignore
# Editor / local tooling — project skills are versioned (docs/skills.md)
.claude/*
!.claude/skills/
.claude/skills/*
!.claude/skills/bilingual-page/
```

Tested on a clone: `bilingual-page` shows as untracked (versioned), while a
third-party skill folder and `settings.local.json` placed in `.claude/` stay
ignored. Third-party skills remain pinned in `skills-lock.json`. Each new
project skill adds its own `!` line.

## 5. Section design

### 5.1 Files and routes

| Piece | PT | EN |
|---|---|---|
| Content | `content/projeto/<slug>.mdx` | `content/en/project/<slug>.mdx` |
| Index | `src/app/(pt)/projeto/page.tsx` | `src/app/(en)/en/project/page.tsx` |
| Entry | `src/app/(pt)/projeto/[slug]/page.tsx` | `src/app/(en)/en/project/[slug]/page.tsx` |
| Loader | `getProjectEntries(lang)` in `src/lib/content.ts`: same parser, `category` rejected, `lang` checked | |
| Pairs | `TRANSLATION_PAIRS`: `project` (index) + one per entry | |

The entry page reuses the article layout of `/blog/[slug]` (byline, `tldr`,
copyright line, JSON-LD), minus the category marker and related articles.

### 5.2 Surfaces

| Surface | Included | Why |
|---|---|---|
| `sitemap.ts` | yes | indexable pages |
| On-site search (`lib/search-index.ts`) | yes (decision, §8) | a reader typing "ia" or "skill" should find them |
| `/blog`, related articles, `feed.xml` | no | keeps the blog cluster on topic |
| `llms.txt` | decision (§8) | it lists the site's content for agents |
| Home | no | entry point is `/sobre` + footer |

### 5.3 SEO and schema

- `Article` + `BreadcrumbList` (Início › Projeto › entry; Home › Project ›
  entry). `Person` author as on articles.
- OG image via `next/og`, same template with "Projeto" / "Project" label.
- Everything in §6 applies, except the pillar and tool links: an entry links
  what it documents (an article, a doc, a PR) instead.

### 5.4 Tests

- Playwright: the SEO suite builds its routes from the sitemap, so entries are
  covered once `sitemap.ts` lists them; add `/projeto` and `/en/project` if
  the index is generated separately.
- Vitest: loader rejects `category`, requires `lang`; `hreflang.test.ts`
  covers the new pairs as it does all others.
- `check-pair.mjs`: generalise to a per-type table (blog, project).

## 6. Content plan — first entries

All entries follow `.claude/skills/bilingual-page/` (brief → PT → EN →
register → check → PR). Titles below are drafts; the brief measures them.

### Entry 1 — How AI is used in this project

| | PT | EN |
|---|---|---|
| Slug | `uso-de-ia` | `how-ai-is-used` |
| Draft title | Como a IA é usada neste projeto | How AI is used in this project |
| Question | Como um site de SEO técnico é construído com o Claude, e o que fica com o dono? | |
| Evidence | `docs/ai-workflow.md`; git history at the measured commit | |

Outline (identical in both languages):

1. Direct answer: one person, Claude sessions with repository access, every
   PR reviewed and merged by the owner, CI as the gate.
2. What the history shows: commits, PRs, co-author trailers by model, with the
   commands. What the numbers do not measure.
3. Who does what (table).
4. The contract: `CLAUDE.md`, numbered and dated rules, claims policy.
5. Rules that are tests (table of CI gates).
6. Making claims smaller: commit `e376922` as the example.
7. What stays with the owner.
8. Links: `scaled-content-abuse` (Google on AI content), `pre-registro-seo`
   (the lab method), `/design` (the other colophon), the repository.

### Entry 2 — Skills: turning a repeated process into an instruction

| | PT | EN |
|---|---|---|
| Slug | `skills` | `skills` |
| Draft title | Skills: como um processo repetido vira instrução | Skills: turning a repeated process into an instruction |
| Evidence | `docs/skills.md`; `.claude/skills/bilingual-page/`; the two runs of `check-pair.mjs` | |

Outline:

1. Direct answer: a skill is a versioned folder of instructions and checks
   that a Claude session loads when the task matches.
2. When a process deserves one (the three conditions).
3. The eight-step process.
4. Worked example: `bilingual-page` — why it exists (owner rule of
   2026-10-23), what it contains, the script's first run (13 false failures
   from a wrong date rule → 0 errors, 5 warnings, 2 real misses).
5. What a skill does not do.
6. Links: Entry 1, the published pair it checked (`arvore-de-acessibilidade`),
   the skill folder on GitHub.

### Later candidates (not part of this proposal's PRs)

- *Como uma página nasce aqui* — from research note to merged PR, following
  one real article.
- One entry per future project skill (`research-note`,
  `experiment-log-row`, `session-handoff` — catalog in `docs/skills.md`).

## 7. Implementation plan

Four PRs, in order. Each is reviewed and merged by the owner.

| PR | Contents | Done when |
|---|---|---|
| 1 — policy + skills | `CLAUDE.md` §3/§5.1/§5.4/§10/§13 edits; `.gitignore`; `.claude/skills/bilingual-page/`; `docs/ai-workflow.md`; `docs/skills.md`; this proposal; experiment-log row for the policy change | CI green; `check-pair.mjs --all` → 0 errors |
| 2 — section scaffold | loader, four routes, sitemap, search index, pairs, breadcrumbs, OG, links from `/sobre`, `/en/about`, footer; tests; `check-pair.mjs` per-type | Playwright covers `/projeto` and `/en/project`; Lighthouse budgets pass |
| 3 — entry 1 pair | via the skill | §12 definition of done; log row |
| 4 — entry 2 pair | via the skill | same |

PR 2 ships with the index only if entry 1 is not ready: an empty index is a
thin page. Preferred: merge PR 2 and PR 3 together, or keep the index
`noindex` until the first entry lands.

### Experiment-log rows (drafts)

| Date | Change | Hypothesis | Result |
|---|---|---|---|
| merge date of PR 1 | Project section policy (§5.4, §13), O8, versioned skills | No search prediction: documentation change. | n/a |
| merge date of PR 3 | Published `/projeto/uso-de-ia` + `/en/project/how-ai-is-used` | Both URLs indexed within 4 weeks of the indexing request (existence prediction; no ranking or traffic prediction, which the site's volume cannot power, §7.3). | pending |

## 8. Decisions for the owner

1. **Names.** `/projeto` + `/en/project` (proposed), or `/bastidores` +
   `/en/behind-the-scenes`. Slugs of published pages are never renamed (§5.2),
   so this is decided once.
2. **O8.** Add the objective (§3.4), or amend §13's last bullet instead.
3. **Search index and `llms.txt`.** Proposed: search yes; `llms.txt` yes,
   under its own heading, so agents can tell documentation from articles.
4. **Model names.** Entry 1 publishes the per-model commit counts. They are
   in the public history already; keep or drop on the page.
5. **`[owner]` lines** in `docs/ai-workflow.md` §3 and §8 describe your
   workflow from outside the repo (two kinds of session, handoff markers,
   where the data lives). Confirm or correct each one before entry 1 is
   written from it.
6. **The two English articles without the closing note** (§9). Add the note,
   or record that dropping it was deliberate and remove the check.

## 9. Observations made while preparing this

- `content/en/blog/accessibility-tree.mdx` and
  `content/en/blog/screaming-frog-free-version.mdx` (both 2026-10-23) lack the
  closing translation note that the other 22 English articles end with.
- Three Portuguese articles link English pages: `hreflang-nextjs` →
  `/en/guide/technical-seo-nextjs`, `ia-nao-consegue-acessar-site` → its own
  English version, `pre-registro-seo` → `/en/case-studies`. Plausibly
  deliberate; there is no written rule for the Portuguese direction.
- `CLAUDE.md` §10's frontmatter schema is missing `tldr` and `basedOn` (§3.5).
