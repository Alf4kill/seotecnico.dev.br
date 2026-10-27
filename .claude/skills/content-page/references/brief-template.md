# Brief template — one per page pair

Fill every field before writing prose. A field you cannot fill is the
finding: say so to the owner instead of guessing. Character counts are
measured, not estimated (`printf '%s' "…" | wc -m`).

```markdown
# Brief — <working title>

**Date:** YYYY-MM-DD · **Page type:** blog article | project entry
**Status:** draft brief, waiting for owner review

## 1. Question and query
- Question the page answers (one sentence):
- `primaryQuery` PT:            — how it was validated (Google Trends BR,
  Autocomplete, GSC export; Semrush is no longer available):
- English query:                — validation:
- Existing pages with a close `primaryQuery` (grep result):

## 2. Gates
- Research note (path, or "none: every claim comes from <repo record>"):
- First-hand evidence (file path, commit or PR):
- Scope: blog niche (§13) | project section — why:
- Layer (§5.2): 1 generic hub | 2 Next.js spoke | 3 long-tail | n/a (project)

## 3. Identity
| | PT | EN |
|---|---|---|
| slug | | |
| route | /blog/… | /en/blog/… |
| title (≤60, contains the query) | … (NN) | … (NN) |
| description (≤155) | … (NN) | … (NN) |
| category (lib/categories.ts) | | same |
| status (only if true) | | same |
| basedOn | | English pairs of the same |

## 4. Outline
H2 list — identical structure in both languages. For layer 1, the last
content section is "No Next.js" / "In Next.js" with real code from the repo.

## 5. Claims inventory
| Claim | Level (1/2/3) | Source (file, line or commit) |
|---|---|---|

## 6. Code, diagrams and FAQ
- Repo code to quote (path + line range) — becomes `[CODE-n]` on route A:
- Diagrams (inline SVG + text mirror) — becomes `[SVG-X]` + spec on route A:
- FAQ (real questions only, same count in both languages):

## 6b. Drafting
- Route: A external writing session (handoff kit) | B owner | C this session
- Banned framings (from the note's "claims to avoid"; become `check-draft.mjs --ban`):
- Length ceiling for running prose (tables and lists not counted):

## 7. Links
| Purpose | PT target | EN target |
|---|---|---|
| pillar | /guia/seo-tecnico-nextjs | /en/guide/technical-seo-nextjs |
| tool | /ferramentas/… | /en/tools/… |
| related | | |

## 8. Experiment-log row (draft)
| Date | Change | Hypothesis (+ power note) | Result |
|---|---|---|---|
| | | | pending |

## 9. Open decisions for the owner
- [NOTA-REDACAO] …
```
