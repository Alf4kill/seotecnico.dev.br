# Skills in this repository

> **Status:** reference · first written 2026-10-26
> **Related:** `docs/ai-workflow.md` (how AI is used here),
> `docs/proposals/project-section.md` (where this becomes public content)

## 1. What a skill is

A skill is a folder with a `SKILL.md`: YAML frontmatter (`name`,
`description`) plus instructions. A Claude session sees every skill's name and
description at all times, and loads the body only when a task matches the
description. Supporting files load only when the body points to them.

```
.claude/skills/<name>/
├── SKILL.md          # when to use it (description) + the procedure (body)
├── references/       # read on demand: templates, rules for one sub-case
├── scripts/          # deterministic checks, run instead of re-reasoned
└── evals/            # test prompts and what a good result looks like
```

Three layers, three costs: the description is always in context (keep it to
a few sentences, and make it name the situations that should trigger it); the
body is loaded per task (keep it under ~500 lines); references and scripts
cost nothing until used.

## 2. Where skills live

| Kind | Location | Versioned | Example |
|---|---|---|---|
| Project skill | `.claude/skills/<name>/` | **yes** | `content-page` |
| Third-party skill | installed locally, pinned in `skills-lock.json` | lock file only | `frontend-design`, `next-best-practices`, `vercel-react-best-practices` |

`.claude/` is otherwise ignored (editor and local session state). The
`.gitignore` allowlists project skills one by one, so a third-party skill
installed into the same folder never lands in a commit by accident:

```gitignore
# Editor / local tooling — project skills are versioned (docs/skills.md)
.claude/*
!.claude/skills/
.claude/skills/*
!.claude/skills/content-page/
```

A new project skill adds its own `!.claude/skills/<name>/` line in the PR that
creates it.

## 3. When a process deserves a skill

Write a skill when all three are true:

1. **It has happened at least twice** and will happen again. The history is
   the evidence: find the earlier instances in `git log` before writing
   anything.
2. **Its rules are scattered.** The knowledge needed sits in several sections
   of `CLAUDE.md`, a test or two, and conventions that exist only in past
   commits.
3. **Something was missed** at least once, or would be easy to miss.

If only (1) is true, a checklist in a doc is enough. If the process is one
command, a script or an npm task is enough.

## 4. How to create one (the process used for `content-page`)

1. **Collect the instances.** List the commits and PRs where the process
   happened and read what they touched. For page pairs:
   `git log --format='%h %ad %s' --date=short | grep -i 'PT and EN'` →
   `02a834f`, `2caa4e0`; `git show --stat` shows the shape: two MDX files plus
   one entry in `src/lib/hreflang.ts`, with the experiment-log row in a
   separate commit (`751a444`).
2. **Find the rules.** Search `CLAUDE.md`, tests and commit messages for every
   constraint the instances obeyed. Some exist only in history: "English text
   links only to English pages" is commit `8aba089`, not a section.
3. **Split judgment from checks.** Anything a script can decide (file exists,
   field matches, link points inside its language) goes into `scripts/`.
   Anything that needs judgment (is there first-hand evidence? is this in
   scope?) goes into the body, with the reason.
4. **Write the description first.** It decides when the skill runs. Name the
   situations, including indirect ones ("the English version of…"), and the
   project-specific reason the skill applies even when the user mentions only
   one language.
5. **Write the body as phases with gates.** Explain why each rule exists.
   Point to `CLAUDE.md` sections instead of copying them, so there is one
   source of truth; the skill states that `CLAUDE.md` wins on conflict.
6. **Run the script on the real repository** before trusting it. A check that
   flags half of the published, correct pages is wrong, not strict.
7. **Write test prompts** in `evals/<case>/`: the request as the owner would
   type it, and a description of a good result. Include one request the skill
   should refuse or redirect.
8. **Ship it with a doc entry** (the catalog below) and the `.gitignore` line.

## 5. Worked example: `content-page`

**Why.** Two facts from the history. Since 2026-10-23 every new article ships
in Portuguese and English in the same PR (§10, commit `59f86e1`), and the
build validated each file, not the pair. And every published draft, from every
route, needed corrections that only a pass against the sources and the code
found (`docs/content-pipeline.md` §4).

**How it grew.** The first draft, `bilingual-page`, covered brief → PT → EN →
PR. Tracing a real page (`scaled-content-abuse`) showed the process starts
earlier, with a dated research note, and that its most important step — the
verification pass on a draft written outside the repository — was missing.
Two skills that both trigger on "write an article" would compete, so the
draft was widened into one skill before anything was versioned. The catalog
ideas `research-note` and `session-handoff` became two of its references.

**What it contains.**

| File | Role |
|---|---|
| `SKILL.md` | nine phases with where each runs: gates → research note → brief → draft (three routes) → verification → English → register → checks → PR |
| `references/research-note.md` | the shape of the notes in `docs/research/`: dated sources, labels, claims to make and to avoid |
| `references/brief-template.md` | the brief the owner reviews before any prose, including the drafting route and banned framings |
| `references/handoff-kit.md` | what an external writing session receives, the instructions block, the return package |
| `references/draft-verification.md` | the verification pass, with every correction the history records |
| `references/translation.md` | what stays identical, what is adapted, link mapping, the closing note |
| `references/page-types.md` | blog article (live) and project entry (proposed) |
| `scripts/check-draft.mjs` | single-file checks on arrival and before the PR; exit 1 on error |
| `scripts/check-pair.mjs` | pair-level checks; exit 1 on error |
| `evals/` | four test prompts: brief only, repair an existing pair, an off-niche request, verify a returned draft |

**The first runs of the scripts** were both wrong before they were right.

`check-pair.mjs`:

- *Round 1* reported 13 of 24 pairs as failing on `datePublished`. The rule
  was wrong, not the pairs: translations made before 2026-10-23 were published
  later than their originals, on purpose. The check now fails only when the
  English date is earlier than the Portuguese one, or when a pair dated from
  2026-10-23 on has two different dates.
- *Round 2* ended with 24 pairs, 0 errors and 5 warnings: three Portuguese →
  English links (`hreflang-nextjs` to the English guide,
  `ia-nao-consegue-acessar-site` to its own English version, `pre-registro-seo`
  to `/en/case-studies`), plausible on purpose but worth a look, and the two
  English articles of 2026-10-23 without the closing translation note. Links
  whose counterpart is missing on the other side are printed as NOTE lines for
  a single pair, and for `--all` only with `--verbose`.
- *Mutation test:* breaking one English file on purpose (wrong
  `translationOf`, an H1, a `{{`, the pillar link swapped for the Portuguese
  one) produced five errors and exit code 1.

`check-draft.mjs`, run on all 48 published articles:

- *Round 1* failed 6 files and warned on most of the rest, all false
  positives: `<Image>` in four articles (the first draft of the skill said MDX
  mapped no components; `src/components/mdx/mdx-components.tsx` maps
  `Image`), a date-format table read as a placeholder, SVG `aria-label` text
  counted as long quotes, and Windows line endings hiding the lead paragraph.
- *Round 2:* 48 files, 0 errors, 0 warnings.
- *Mutation test:* a draft broken in ten ways (H1, `{{`, an unmapped
  component, an untokenised SVG colour, "clique aqui", a banned framing, no
  pillar link, placeholders, an SVG without a label, a 20-word quote) produced
  ten findings and exit code 1.

One more defect was found by parsing the skill itself: the first draft's
one-line `description` contained `: `, which is not valid YAML. It is now a
folded block (`description: >-`).

**What it does not do.** It does not judge whether a topic is worth a page,
translate for you, or merge. Those stay with the owner (`docs/ai-workflow.md`
§8).

## 6. Catalog

| Skill | Status | Trigger | Output |
|---|---|---|---|
| `content-page` | versioned | write, research, plan, verify, translate or update a page; a returned draft | research note → brief → draft → verification → PT + EN MDX → hreflang entry → log row → PR |
| `research-note` | absorbed into `content-page` (`references/research-note.md`) | "research X before we write about it" | `docs/research/YYYY-MM-DD-<topic>.md` with evidence labels, a dated sources table and the one-quote-per-source rule (pattern of the two existing notes) |
| `experiment-log-row` | idea | any deliberate SEO change, publication or evaluation pass | a row with hypothesis, window and power note (§7.3), and later its verdict |
| `session-handoff` | absorbed into `content-page` (`references/handoff-kit.md`) | moving work from an editorial session to a repository session | a handoff file with `[CODE-n]` placeholders, `[NOTA-REDACAO]` decisions and the questions the repo session must verify |

An idea becomes a skill when it meets §3. Each one is a separate PR.
