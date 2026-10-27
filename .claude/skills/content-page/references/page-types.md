# Page types this skill covers

| Type | Status | PT file → route | EN file → route | `check-pair.mjs` |
|---|---|---|---|---|
| Blog article | live | `content/blog/<slug>.mdx` → `/blog/<slug>` | `content/en/blog/<slug>.mdx` → `/en/blog/<slug>` | yes |
| Project entry | **proposed** (`docs/proposals/project-section.md`) | `content/projeto/<slug>.mdx` → `/projeto/<slug>` | `content/en/project/<slug>.mdx` → `/en/project/<slug>` | after the section is built |

Out of scope for this skill: hand-written TSX pages (`/design`, `/sobre`,
tools, indexes). They are pairs too, but their text lives in components and
their revision date in a constant (`MANIFESTO_REVISED`, `CASE_STUDIES_REVISED`);
change them as code, not as content.

## Blog article

All of SKILL.md applies. `category` is required (`src/lib/categories.ts`).
Must stay inside the blog niche (CLAUDE.md §13): how machines fetch, render,
read or index pages.

## Project entry (once the section exists)

Documents this project: decisions, methods, tooling, processes (including how
AI is used), postmortems. Rules that differ from a blog article:

- **Scope.** About the project only. No personal topics: career, job search,
  personal life, client work, opinions unrelated to the repository.
- **Evidence.** Every entry links at least one versioned artifact (commit, PR,
  file in `docs/`). A number about the project's history is reproducible with
  the command printed next to it (for example a `git log` one-liner).
- **No category.** Entries do not use the blog axes; they stay out of `/blog`,
  related articles and the RSS feed (the section's loader enforces this).
- **Links.** The pillar and tool links of §6 are not required; a link to the
  blog article or doc the entry is about is, and so is a GitHub link to a
  versioned artifact (`check-draft.mjs --type project` enforces the second).
- **Research note.** Usually not needed: the entry's sources are the
  repository's own records. Phase 1 applies when an entry cites outside
  sources (Google's guidance on AI content, for example).
- **Query.** `primaryQuery` is still required by the frontmatter schema. Use
  the honest question the entry answers; search demand is not a gate here,
  since the section exists for documentation, not ranking.

Update this file and `check-pair.mjs` (its `PT_DIR`, `EN_DIR` and route
prefixes become a per-type table) in the same PR that builds the section.
