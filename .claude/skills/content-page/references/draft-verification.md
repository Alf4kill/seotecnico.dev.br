# Draft verification — what to check, and what it has caught

Every draft gets this pass, whoever wrote it. The table below is why: no
route has produced a draft that needed no correction.

## What earlier passes caught

| Page | Route | Found in the pass | Where it is recorded |
|---|---|---|---|
| `melhorar-lcp-nextjs` | A | a lab-measurement slot with no measurement behind it (removed: no invented numbers); a RUM sentence describing a pipeline that was still roadmap | PR #7 |
| `json-ld-nextjs` | A | component files, prop shapes and an author object that do not exist in the repo; an argument built on a Google page removed on 2026-06-15; `"use client"` blamed for a failure that comes from schema created after hydration | PR #17, "Fidelity corrections" |
| `inp-nextjs` | A | an H1 in the body; SVG colour fallbacks outside the palette; an internal doc cited in reader-facing prose | `0b95d3c` |
| five-spoke batch (PR #27) | A, with `[CODE-n]` placeholders | no invented code (first time); a "100% static routes" claim the build output contradicted; the GTM draft without the pillar link (§6) | PR #27 |
| `pre-registro-seo` | B (owner) | title without the primary query; a stimulus attributed to the wrong article; a deviation list that differed from the log; quotes that had to be verbatim from the log | `0d997fb` |
| `sec-fetch-mode` | B (owner) | "plain HTTP clients send no Sec-Fetch" — false for Node's fetch; testing it found a defect in the site's own classifier (fixed in PR #95) | `4de2df3` |
| `scaled-content-abuse` | A | a manual-action sentence not matching the help text; a "most visible sign" claim reduced to the mechanism; a timeline row corrected to the changelog; a missing source for the live-test claim; `tldr` over 300 | `7e73fc1` |

Read the pattern: placeholders ended invented code, and nothing has ended
"a fact that sounded right". That is what steps 3 and 4 below are for.

## The pass, in order

1. **Inventory.** `check-draft.mjs <draft> --arrival --ban "<list>"`. Compare
   its placeholder list with the delivery notes; a placeholder the notes do
   not mention is a question for the owner.
2. **Code.** Fill each `[CODE-n]` from the file it names, verbatim; record
   the line range in the commit body. Diff any code the draft wrote itself
   against the repo. `content-code-paths.test.ts` checks a cited path exists;
   it does not check the lines.
3. **External facts.** Re-read each source the draft relies on, on the day.
   Prefer the page over the research note when they differ, and record the
   difference. Pay attention to: dates and timelines, UI labels (Search
   Console strings in pt-BR and en differ), "most/always/never" wording.
4. **Repository facts.** Every number about this site comes from a versioned
   file (experiment log, audit, lab record). Quote it from there, not from the
   draft.
5. **One test.** Pick the claim that most sounds like a testable fact and test
   it here if you can (a header a client sends, what the build output says).
6. **Diagrams.** Build each `[SVG-x]` with the diagram tokens (§9),
   `role="img"`, an `aria-label`, and its text mirror. `tests/seo/design.spec.ts`
   checks label contrast in both themes.
7. **MDX normalisation** seen in returned drafts: double-backtick escapes to
   single; no `className` or `width="100%"` on SVG figures; component props as
   strings.
8. **NOTA-REDACAO.** Decide what is editorial and reversible; keep the rest for
   the PR description.
9. **Final check.** `check-draft.mjs <file>` without `--arrival`: 0 errors.

## The commit body

`content: publish <topic>, PT and EN`, then a paragraph on what the page says,
then: "External draft (or: Owner draft), corrected against <the sources / the
log / the code>:" and one line per correction. This is the record the project
section's entry about the pipeline is built from.
