# Report: component tests and accessibility (seotecnico.dev.br)

Date: 2026-10-23 · Branch: `feat/testes-a11y` · Commits:
`9b25746` deps · `37043a3` `9b2228b` `58b019d` `9b0c337` fixes ·
`f1d5b49` component tests · `aa53f71` axe suite · `cf3043d` CI · README and
this report in the commit that adds this file.

Every number below was taken from the test output on this branch. Anything
that was not measured says so.

## Unit and component tests (Vitest + Testing Library)

- **Total:** 497 Vitest tests in 33 files, all passing (local run, 2026-10-23).
  - **Added in this branch:** 10 component tests in 3 files.
  - **Already in the repo:** 487 tests in 30 files.
- **Pure functions:** already covered before this branch, nothing added or
  duplicated:
  - `jsonld-generator.ts`: `parseSameAs`, `validateInput`, `buildSchema`,
    `toJsonLd`, `toNextComponent`.
  - `meta-validator.ts`: `parseTargetUrl`, `isPrivateAddress`, `extractMeta`,
    `runChecks`, `countIssues`. The limits sit at the boundaries `TITLE_MAX` = 60
    and `DESCRIPTION_MAX` = 155.
  - `crux.ts`: `rate`, `parseOrigin`, `parseCruxReport`, `formatMetric`.
  - CrUX boundaries: the code uses `p75 <= goodMax` for good and
    `p75 < poorMin` for needs-improvement. So 2500 ms is good, 2501 ms needs
    improvement and 4000 ms is poor. INP and CLS follow the same rule: 200 / 500
    and 0.1 / 0.25. `crux.test.ts` already tests these exact values.
  - The CrUX API is mocked in `src/app/api/checador-cwv/route.test.ts`. No test
    touches the network.
- **Components tested** (`src/components/tools/*.test.tsx`): every query is by
  role or label, every interaction goes through `user-event`, and API routes
  are mocked.

  | Component | Tests | What they cover |
  |---|---|---|
  | `JsonLdGenerator` | 4 | Article output and key event; required-field alert with no output and no event; switching to FAQPage; output tabs |
  | `MetaValidator` | 3 | Result, SERP preview fallback, issue count and key event; empty-field alert without a request; API error shown without an event |
  | `CwvChecker` | 3 | One metric in each band (2500 ms good, 201 ms needs improvement, 0.25 poor), with `lcp_bucket` only in the event; device toggle `aria-pressed` and `formFactor`; "not in CrUX" treated as an answer, not an error |

- **Functions extracted or refactored to make testing possible:** none. The
  logic was already in `/lib`.
- **Bugs the tests found:**
  - The generated JSON-LD output (`<pre>`) had no accessible name, so
    `getByRole('region', { name: /resultado/i })` could not find it. Fixed in
    `58b019d`: it is now a named, focusable region.

## Accessibility (axe-core + Playwright, WCAG 2.0/2.1 A and AA)

- **Pages covered:** 70 routes, which is every sitemap route plus `/busca` and
  `/en/search`, each in both themes (dark and light).
  - The three tools are audited again after producing a result: JSON-LD after
    generating and after a validation error, the meta validator after a result,
    and the CWV checker after a result.
  - Total: **148 audits**.
- **Tags:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. No rule is disabled.
  `color-contrast` is reported but not asserted; see the contrast section below.

### Violations before (code from `main` at `fdb3007`)

**266 nodes**, all of impact *serious*, in 148 of 148 audits.

- **By impact:** critical 0 · serious 266 · moderate 0 · minor 0.
- **By rule:**

  | Rule | Nodes | Mode |
  |---|---|---|
  | `label-content-name-mismatch` | 224 | blocking |
  | `scrollable-region-focusable` | 16 | blocking |
  | `color-contrast` | 14 | warning |
  | `listitem` | 8 | blocking |
  | `link-in-text-block` | 4 | blocking |

- **By page:** the header was on every page, so every page had at least one
  finding.
  - 33 Portuguese pages had 2 per theme.
  - 31 English pages had 1 per theme.
  - The rest:
    - `/blog/chatgpt-le-javascript` and `/blog/inp-nextjs`: 3 per theme.
    - `/design`: 5 per theme. `/en/design`: 4 per theme.
    - `/blog/ssr-ssg-isr-nextjs` and `/en/tools/json-ld-generator`: 2 dark, 3 light.
    - `/en/blog/nextjs-ssr-ssg-isr`: 1 dark, 2 light.
    - `/ferramentas/gerador-json-ld`: 3 dark, 4 light, both before and after
      generating. 7 dark, 8 light in the error state.

### Violations after

**0 blocking.** The 14 contrast nodes remain as **warnings**, in 5 colour pairs
across 6 routes. They will stay until the owner decides on each pair.

### Fixes

| Problem | Rule / WCAG | Fix | Commit |
|---|---|---|---|
| The brand link and the pt-BR search button had names that did not contain their visible text | `label-content-name-mismatch`, 2.5.3 | Brand: the name now comes from the visible text plus an sr-only hint. Search: renamed "Buscar no site" | `37043a3` |
| Wide tables and code blocks scrolled but could not receive focus | `scrollable-region-focusable`, 2.1.1 | `tabIndex=0` on MDX `table`/`pre` and on the hand-written example `pre` | `9b2228b` |
| JSON-LD output had no name, and `role="alert"` on a `ul` left its `li` orphaned | `listitem`, 1.3.1 | Output is a named region; the alert moved to a wrapper | `58b019d` |
| The author link on `/design` was told apart from the text by colour alone | `link-in-text-block`, 1.4.1 | Underline, the same treatment as `.rich-text` links. No colour changed | `9b0c337` |

- **Justified exclusions:** none. No `.exclude()` is used.
- **Colour changes applied:** none. Each one needs the owner's approval. They
  are listed below as proposals.

### Contrast: warnings waiting for a decision

| # | Where | Theme | Text / background | Ratio | Required | Proposal |
|---|---|---|---|---|---|---|
| 1 | Plain `pre` blocks: a fence without rehype-pretty-code, and the hand-written example on the JSON-LD generator pages. Routes: `/blog/ssr-ssg-isr-nextjs`, `/en/blog/nextjs-ssr-ssg-isr`, `/ferramentas/gerador-json-ld`, `/en/tools/json-ld-generator` | light | `#3A3C42` on `#1B222B` | 1.45:1 | 4.5:1 | Apply the existing dark-island tokens to `.rich-text pre`, giving `#C6D0DB` on `#1B222B` = **10.26:1**. No palette value changes; the light-theme text colour was leaking into a block that stays dark. |
| 2 | Third word of the `/design` and `/en/design` h1 ("suíço" / "Swiss"), `text-gray-strong` | dark | `#35404E` on `#0E1116` | 1.79:1 | 3:1 (large) | `text-label`: **5.17:1** |
| 3 | Same word | light | `#A8ADB4` on `#F2EDE3` | 1.93:1 | 3:1 (large) | `text-label`: **5.13:1** |
| 4 | "03" in the type specimen on `/design` and `/en/design`, inside `aria-hidden` art | dark | `#35404E` on `#12161C` | 1.72:1 | 3:1 | Keep. It is decorative text in a specimen, which WCAG 1.4.3 exempts. |
| 5 | Same specimen | light | `#A8ADB4` on `#ECE6DA` | 1.81:1 | 3:1 | Keep, same reason. |

- **Cases axe could not decide:** 2200 `color-contrast` nodes were reported as
  `incomplete`, meaning text over a background image or overlapping elements.
  They were not reviewed manually.
- **Blocking gate unchanged:** contrast by colour role is still blocking in
  `tests/seo/contrast.spec.ts`, and every one of those checks passed.

## CI

- **Workflow:** `.github/workflows/ci.yml`.
  - Job `verify` runs Vitest, component tests included, through
    `npm run test:coverage`.
  - Job `seo` runs the axe suite together with the Playwright suite, then
    publishes the contrast table in the job summary and uploads `a11y-report`
    as an artifact.
- **Last run:** not verified at the time of writing. It will be filled in from
  the pull request.
- **Time added to the pipeline:**
  - Locally, the axe suite alone took 1.1 min for 148 tests, on 12 cores with
    the default worker count.
  - The CI figure is not measured yet.

## README

- "Quality" section added: yes, as a table under `## Testing`.
- Badge: yes, for the CI workflow.

## Open items and limitations

- The contrast warnings above wait for the owner's decision. Until then they
  remain warnings.
- The 2200 `incomplete` contrast nodes were not reviewed manually.
- Coverage is WCAG 2.0/2.1 A and AA. WCAG 2.2 criteria are not tested, among
  them `target-size` (2.5.8).
- axe finds about a third of WCAG issues. Screen reader, keyboard-only and zoom
  testing were not done.
- Component tests run in jsdom: no layout, so nothing about overflow or
  visibility. Those are covered by Playwright.
- The JSON-LD tabs use `role="tab"` without `tabpanel` or `aria-controls`, and
  without arrow-key navigation. axe does not flag this. It was not changed.
