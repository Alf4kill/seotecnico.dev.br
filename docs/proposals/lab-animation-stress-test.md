# Proposal + feasibility analysis: `/lab` — JS animation stress test

> **Status:** proposal — analyzed and revised, implementation not started
> **Origin:** owner's draft (2026-07-22), reviewed against the repo state and the
> July 2026 library landscape
> **Last updated:** 2026-07-22

---

## 1. What this is

Not a comparative benchmark between animation libraries. A **saturation test**:

> How many animations can one page sustain before it stops being fast — and
> what has to be done to raise that ceiling?

The page **is** the experiment: a realistic, dense editorial/marketing page
running 30–60+ simultaneous or scroll-triggered animations across multiple
libraries at once. Break it, fix it, document the ceiling at each stage.

The differentiator versus existing comparison articles: the output is a
**headline number** ("60 animations, 6 libraries, LCP 1.1s"), not a table of
kilobytes.

### 1.1 Verdict (analysis)

The idea is strong and well-aligned with the project's objectives (CLAUDE.md §3):

| Objective | How the lab serves it |
|---|---|
| **O5** — free asset attracting usage + backlinks | The interactive control panel is the linkable asset; it behaves like a tool |
| **O6** — documented before/after experiment | The stage progression is exactly the `experimento.py` before/after ethos, pre-registered |
| **O7** — AEO/GEO citations | An original, quotable number ("N animations before INP degrades") is the kind of statistic AI engines cite |
| §2 — portfolio narrative | "Developer who breaks his own site on purpose, then fixes and measures it" is the strongest possible version of the story |

**Sequencing caveat (CLAUDE.md §11):** this is a Phase-4-shaped deliverable —
an original-data link magnet. It should occupy the Phase 4 "original-data
benchmark" slot (it can replace or precede the CWV e-commerce benchmark idea),
not preempt the remaining Phase 3 spokes and tools. Not a blocker; a scheduling
decision.

---

## 2. URL structure

```
/lab                          → experiments index
/lab/animations               → stress-test hub (panel + results)   [indexed]
/lab/animations/stage-0       → static baseline                     [noindex]
/lab/animations/stage-1       → naive maximalism                    [noindex]
/lab/animations/stage-2       → loading discipline                  [noindex]
/lab/animations/stage-3       → runtime discipline                  [noindex]
/lab/animations/stage-4       → SSR-safe / crawlable                [noindex]
/lab/animations/stage-5       → ceiling hunt                        [noindex]
/blog/[slug]                  → teardown articles, linking both ways [indexed]
```

Each stage is a separately deployed URL — reproducible, measurable in
isolation. Index/noindex assignments are a resolved decision; see §7.1.

---

## 3. Stages

| Stage | What it is | Expected result |
|---|---|---|
| **0 — Baseline** | Static page, zero animation | Reference CWV |
| **1 — Naive maximalism** | Everything eagerly imported, barrel imports, all libs loaded, scroll listeners, animating `top`/`height`/`filter` | Deliberately bad — the "before" |
| **2 — Loading discipline** | Dynamic imports per route, modular imports, lazy island hydration, everything below the fold deferred | Big bundle/LCP win; main thread still busy |
| **3 — Runtime discipline** | Compositor-only properties, off-screen pause via IntersectionObserver, pause on `visibilitychange`, rAF batching, single shared ticker | INP/TBT drop sharply |
| **4 — SSR-safe & crawlable** | Final visual state in the HTML, animation as progressive enhancement, `prefers-reduced-motion`, no entrance effects that shift layout | CLS→0, content indexable |
| **5 — Ceiling hunt** | Re-add animations until INP degrades again | **The number**: "N animations before it hurts" |

**Internal-validity rule (analysis):** build all six stages as **one
parameterized template + a per-stage config**, not six hand-built pages.
Cheaper to produce, and it guarantees stages differ only by the variable under
test — otherwise the before/after deltas are not attributable.

---

## 4. Library bench (revised)

The owner's draft listed nine candidates. Three facts changed the table
(verified July 2026):

- **GSAP is now 100% free, including all formerly Club-only plugins**
  (ScrollTrigger, SplitText, MorphSVG…) since April 2025, following the Webflow
  acquisition — everything installs from public npm. The bench should use the
  real plugins, not tiptoe around licensing.
- **The "Motion One / Popmotion" row is obsolete.** Motion One merged into the
  `motion` package (the former Framer Motion); Popmotion is unmaintained. The
  `motion` mini (~2.3 KB, pure WAAPI) vs hybrid (~17–18 KB) builds are
  themselves two distinct bench data points — the separate row is deleted.
- **CSS `animation-timeline`** is supported in Chrome/Edge 115+ and Safari 26+,
  but **Firefox stable still ships it behind a flag** (as of Firefox 152,
  June 2026; ~82–83% global support, named Interop 2026 priority). The stage
  using it needs progressive-enhancement framing and per-browser notes.

### 4.1 Core bench — the seven that count toward the headline number

| Library | ~min+gz | Character | Why include |
|---|---|---|---|
| **Web Animations API** (native) | 0 KB | Native baseline | Control group #1 |
| **CSS `animation-timeline`** | 0 KB | Scroll-linked, compositor-only | Control group #2 — beats any lib for scroll reveal where supported (Firefox caveat above) |
| **Motion mini** (`motion`) | ~2.3 KB | Pure WAAPI wrapper | The smallest possible lib footprint |
| **Motion hybrid** (`motion`) | ~18 KB | WAAPI + JS engine | The modern default in the React ecosystem |
| **Anime.js v4** | ~5–12 KB by modules | Timeline-heavy, strong SVG/morph | Primary candidate; ESM tree-shakeable (`sideEffects: false`, per-submodule imports) |
| **GSAP core + ScrollTrigger** | ~23 KB + plugins | Market standard | What everyone uses — now fully free; measure the real cost |
| **Lottie** (`dotlottie-web`) | ~40 KB+ | After Effects JSON | Common on client sites, notoriously heavy — the in-bench worst case |

### 4.2 Anti-pattern exhibit (measured, but outside the headline count)

- **Lenis** (~3 KB smooth scroll) — a frequent INP offender; documented as
  "what it costs", not counted as an animation.

### 4.3 Cut from v1 / deferred to teardown spin-offs

- **three.js** — cut. It turns the story into "the cost of WebGL", which is a
  different experiment; Lottie already provides the heavyweight worst case.
  Keep as an explicit later teardown.
- **AutoAnimate** (~2 KB, zero-config, very popular) — teardown candidate.
- **`@react-spring/web`** (physics model, own rAF loop; very relevant to the
  Next.js audience) — teardown candidate.
- **Rive** (the modern Lottie competitor; WASM + canvas) — teardown candidate.

Keeping the core bench small is what keeps the stage-5 count interpretable.

---

## 5. Instrumentation

What makes this publishable (and linkable):

- **On-page HUD** — `requestAnimationFrame` delta, dropped frames, active
  animation count, long tasks via `PerformanceObserver`
- **Live `web-vitals`** — LCP/INP/CLS reported on the page itself
- **Interactive control panel** — the visitor adds/removes animation clusters
  and watches the metrics move. **This is the shareable asset.**
- **Lighthouse CI in GitHub Actions** — one run per stage, feeding the article
  table automatically (see §7.3 for how this coexists with the existing gate)
- **Crawlability check** — GSC URL Inspection (rendered HTML) + fetch with JS
  disabled
- **Long-tail indexing** — track indexing status of each lab URL for 30–60
  days using the existing Python GSC toolkit

### 5.1 Metrics collected per stage

- Bundle: KB transferred / KB parsed
- LCP, INP, CLS, TBT
- Main-thread time until first animated frame
- HTML diff: `view-source` vs. DOM after JS
- Compositor vs. main thread (DevTools → Layers, paint flashing)
- INP under load: trigger an animation while a synthetic task blocks the main
  thread

### 5.2 Methodology constraints (analysis)

- **The HUD has an observer effect.** rAF-delta sampling and
  `PerformanceObserver` cost main-thread time. The HUD must be byte-identical
  across all stages so its cost cancels out of every delta.
- **Browser matrix honesty.** CI measures Chromium only. The CSS
  scroll-timeline stage behaves differently in Firefox stable (flagged).
  Methodology and articles must state the matrix explicitly.
- **Measure in CI, not on production.** Lab numbers come from the existing CI
  environment (`next start`, devtools throttling, median of ≥3 runs) so they
  are comparable run-to-run; Vercel production is only for field data
  (CrUX/RUM) on the hub. This resolves the draft's "Vercel Hobby variance"
  risk.

---

## 6. Modifying the libraries for SEO

The most original section — worth its own article.

### 6.1 Wrapper, not patch

A thin adapter per library that:

1. Reads the **SSR'd final state of the DOM** as the animation target
2. Applies the final style **synchronously** before the animation runs — the
   no-JS/crawler view matches the final view
3. Registers with a **global ticker** instead of the lib's own rAF loop

> GSAP exposes `gsap.ticker`; Anime.js v4 lets you drive the engine tick;
> WAAPI is already off the loop.
> **One ticker for 60 animations**, instead of 6 libraries each running a rAF.

### 6.2 Submodule reduction

Document the real delta: GSAP core vs. core + ScrollTrigger; Anime.js v4
individual imports vs. barrel; Motion `mini` vs hybrid build.

### 6.3 Replacing the scroll drivers

Swap each lib's built-in scroll handler for **one shared IntersectionObserver
+ one shared scroll rAF**. ScrollTrigger and Lenis are the biggest offenders.

### 6.4 Forcing compositor-safe output

A runtime guard (or lint rule) that warns when an animation touches a layout
property — prevents the page from regressing.

### 6.5 Kill-switch layer

Downgrade to static when:

- `prefers-reduced-motion: reduce`
- Weak device — `navigator.hardwareConcurrency`, `navigator.deviceMemory`
- `Save-Data` is on

**Accessibility floor (analysis):** the kill-switch applies site-wide,
**including stage 1**. The "deliberately terrible" page must still respect
WCAG 2.3.1 (no flashing above threshold) and `prefers-reduced-motion`.
"Naive" means slow, not harmful.

---

## 7. Integration with this repo (analysis — resolved decisions)

### 7.1 Index vs. noindex — resolved

**Index the hub (`/lab`, `/lab/animations`) and the articles; `noindex` every
stage page.**

- Stage pages are near-duplicate thin templates — exactly what CLAUDE.md §1
  warns about on an exact-match domain. They stay linked from the hub
  (shareable, reachable) but out of the index.
- The hub carries the substantial prose, the JSON-LD, and the interactive
  panel — it is the canonical linkable asset.
- Mechanics already exist: `buildMetadata({ noindex: true })` in
  `src/lib/metadata.ts` (used today by `/busca`). Stage pages use it and are
  appended to `noindexPaths` in `tests/seo/seo.spec.ts`; hub pages go into
  `src/app/sitemap.ts` and get a `/lab` branch in `expectedJsonLdTypes()`
  (suggest `WebPage` + `BreadcrumbList` for the hub).

### 7.2 Definition of "one animation" — proposed criterion

> **One animation = one tween/timeline instance bound to one element group,
> active (ticking) at the measurement viewport position.**

- Staggered children of a single timeline count as **one**.
- Every effect registers with a page-level registry; the HUD reads its count
  from the registry. The headline number is therefore **auditable in-page**
  by any visitor — which is itself a credibility feature of the article.

### 7.3 CI integration — two Lighthouse lanes

- `/lab/*` stays **out of** the main `lighthouserc.js` `paths` array. Stage 1
  is deliberately red and must never block merges; the existing gate's
  budgets (perf ≥95, LCP ≤2.0 s, CLS ≤0.05, TBT ≤200 ms) keep protecting the
  rest of the site.
- A **separate collect-only LHCI lane** runs per stage (reusing the
  `scripts/baseline-lighthouse.mjs` pattern), same environment as the gate
  (devtools throttling, 3+ runs, median), writing dated per-stage snapshots.
  Optionally, stage-0 and stage-4 assert green as a regression check; stages
  1–3 and 5 are collect-only by design.

### 7.4 Bundle-leak guard

Next.js route-level code splitting protects the rest of the site **as long as
no animation import touches shared layout or shared components**. Rule: every
library import lives inside a stage-page island behind `next/dynamic`
(`ssr: false` where the effect requires it). Note: `next/dynamic` /
`ssr: false` currently has **zero** uses in this repo — the lazy-island
pattern is net-new, which is itself article material. The existing LHCI gate
on `/` is the tripwire for accidental leakage; `@next/bundle-analyzer` for
spot checks.

### 7.5 RUM prerequisite

Stage 5's endpoint is INP, but `src/lib/rum.ts` currently reports **LCP
only**. Extending RUM to `onINP` (and ideally CLS) is a prerequisite — and per
project rules it requires a `docs/measurement-plan.md` entry plus GA4 custom
definitions **before** implementation.

### 7.6 Panel analytics

Control-panel interactions go through the typed `pushEvent` helper
(`src/lib/analytics.ts`) with a new documented event — e.g.
`lab_toggle_cluster` with `cluster_id` and `active_count` params. Not a GA4
key event, but it demonstrates the measurement pipeline, which is the
portfolio point. Documented in `measurement-plan.md` first, as always.

---

## 8. Optimization patterns to document

1. **Dynamic import per island** — `next/dynamic` with `ssr: false` + an
   IntersectionObserver trigger, so below-the-fold animation never blocks LCP
2. **Static SSR fallback** — final visual state in the HTML; the animation
   only runs if JS loads. **This is the crawlability answer**
3. **`prefers-reduced-motion` bail-out** — free accessibility win
4. **`transform`/`opacity` only**; surgical `will-change`, removed afterwards
5. **Kill off-screen animations** (pause via IntersectionObserver) and on
   `visibilitychange`
6. **Modular imports** — Anime.js v4 and GSAP punish barrel imports
7. **Prefer native** — WAAPI or CSS scroll timelines where the effect allows

---

## 9. Editorial output

| # | Article | Role |
|---|---|---|
| 1 | *How many animations can a page take? Stress test with 60+ animations and 6 libraries* | Flagship; the live lab is the hook |
| 2 | *How to keep JS animations from destroying your SEO: SSR, single ticker, and the compositor* | The patterns (§6 and §8) |
| 3+ | Per-library teardowns (three.js, react-spring, AutoAnimate, Rive…) | Spin-offs published later, linking back to the hub |

Fixed teardown template: problem → naive version → measurement → optimization
→ measurement → verdict. Fixed template = fast to produce, comparable across
posts. Articles follow the existing content conventions: frontmatter schema,
AEO first paragraph answering the `primaryQuery`, internal links to the pillar
and ≥1 tool.

---

## 10. Experiment documentation plan

Per repo conventions (docs in English):

- **`docs/lab-animations/methodology.md`** — frozen **before** measuring:
  the animation-counting criterion (§7.2), environment spec (CI runner,
  devtools throttling, runs/median), stage definitions, HUD spec, browser
  matrix, and per-stage hypotheses (pre-registration style, consistent with
  the `experimento.py` confidence-tier ethos).
- **`docs/lab-animations/results/stage-N.md`** — per-stage result tables fed
  by the LHCI snapshot script (§7.3).
- **`docs/measurement-plan.md`** — new rows: `lab_toggle_cluster` (+ any HUD
  events), extended `web_vitals` INP reporting.
- **`docs/experiment-log.md`** — one row per stage publication and per
  deliberate optimization, in the existing
  `| Date | Change | Hypothesis | Result |` format.

---

## 11. Build order (MVP slice)

1. **Prerequisites:** INP RUM + measurement-plan rows; methodology doc frozen.
2. **Stage 0** (baseline) + shared stage template + HUD + animation registry.
3. **Stage 1** (naive) → the "before" numbers.
4. **Hub + interactive panel** — the linkable asset; prioritize over having
   all six stages live.
5. **Stages 2–4** as config variants of the template.
6. **Stage 5 last** — it needs the counting criterion battle-tested.
7. **Articles** only after the numbers exist.

---

## 12. Risk register (updated)

| Risk (from draft) | Status after analysis |
|---|---|
| Thin content on lab pages | **Resolved** — noindex stages, index only hub + articles (§7.1) |
| Bundle leakage into the global site | **Mitigated** — island-only imports + LHCI gate on `/` as tripwire (§7.4) |
| Unstable measurement environment | **Resolved** — lab numbers come from CI (`next start`, devtools throttling), production is field-data only (§5.2) |
| Infra cost on Vercel Hobby | Low — all stages are static pages; Lottie JSON is the only notable asset weight |
| "One animation" undefined | **Resolved** — registry-backed criterion (§7.2) |
| *(new)* HUD observer effect | Mitigated — identical HUD across stages (§5.2) |
| *(new)* Chromium-only CI vs. Firefox flag on scroll timelines | Documented in methodology + articles (§5.2) |
| *(new)* Accessibility of the deliberately bad stage | Kill-switch + WCAG 2.3.1 floor apply even to stage 1 (§6.5) |

---

## 13. Sources for the library-landscape facts

- GSAP free for everyone (Webflow): <https://webflow.com/updates/gsap-becomes-free> and <https://gsap.com/blog/3-13/>
- Motion bundle sizes (mini vs hybrid): <https://motion.dev/docs/react-reduce-bundle-size>
- Anime.js v4 modularity: <https://www.npmjs.com/package/animejs> and <https://bundlephobia.com/package/animejs>
- CSS scroll-driven animations support: <https://caniuse.com/mdn-css_properties_animation-timeline_scroll> and <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations>
