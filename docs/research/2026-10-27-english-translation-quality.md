# Research — why the English pages read as translated, October 2026

> **Status:** research note · 2026-10-27 · input for one process change (the
> `english-version` skill) and one revision of every English page, not an
> article.
> **Question:** what makes this site's English read like a translation of the
> Portuguese, and what procedure reduces it?
> **Trigger:** feedback the owner received (October 2026): the English
> version reads like a literal translation, with a non-native effect.
> **Method:** the sources below were read on 2026-10-27 from their own pages.
> The site's English was measured with `check-english.mjs`, written for this
> note, on `e39de3b` (before) and on the revision branch (after).
> **Labels:** **[documented]** = the source's own text says it. **[inference]**
> = my reading. **[third-party]** = a community skill page, not a study.
> **[observation]** = measured here on 2026-10-27.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **2026-10-27**.

| ID | Source | Date |
|---|---|---|
| R1 | [Lost in Literalism: How Supervised Training Shapes Translationese in LLMs](https://aclanthology.org/2025.acl-long.630) (Li et al., ACL 2025) | 2025 |
| R2 | [Mitigating Translationese with GPT-4: Strategies and Performance](https://aclanthology.org/2024.eamt-1.35) (Kunilovskaya et al., EAMT 2024) | 2024 |
| R3 | [TEaR: Improving LLM-based Machine Translation with Systematic Self-Refinement](https://arxiv.org/html/2402.16379v3) (NAACL Findings 2025) | 2025 |
| S1 | [Transcreation skill](https://claudskills.com/skills/transcreation/), community SKILL.md registry | undated |
| S2 | [Professional translator skill](https://claudskills.com/skills/professional-translator/), same registry | undated |
| G1 | [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies) | 2026-08-28 |

## 1. What the literature says

- **Literal output is the default of LLM translation.** R1 measures
  translationese in LLM translations and traces it to supervised
  fine-tuning; it persists in strong models. **[documented]** — R1
- **Explicit linguistic instructions beat "make it natural".** R2 asked GPT-4
  to revise human translations toward original-language text; revisions came
  closer to originals "when the prompts incorporate specific linguistic
  instructions". **[documented]** — R2. For this site: a style guide and a
  calque list in the skill, not a request to "sound native". **[inference]**
- **A separate estimate-and-refine pass improves a first translation.** R3's
  translate → estimate → refine loop beats a single pass. **[documented]** —
  R3. For this site: the native read (step 3) and the fidelity check (step 4)
  are separate passes, and the native read is best done by a reader who has
  not seen the Portuguese. **[inference]**

## 2. What existing translation skills do **[third-party]**

- S1 (transcreation, for marketing copy): start from strategic intent,
  "recreate the impact, not the words", offer two or three options, explain
  what changed. No verification step. — S1
- S2 (general translator): meaning, tone and intent as a native speaker would
  say it; register; flags where a direct translation would mislead; notes on
  choices. No glossary or checks published. — S2

Neither fits as-is: S1 is for persuasion, where facts may move; this site's
claims policy (CLAUDE.md §10) forbids that. What carries over is the order —
intent before words — and the notes on choices, which become the skill's
step 6 report. What neither has, and this site needs, is a fidelity check
and a project glossary. **[inference]**

## 3. Does Google care? **[documented]** + **[inference]**

G1 lists "translating" among automated transformations under scaled content
abuse, for content scraped from elsewhere. This site translates its own
pages, with hreflang pairs, so the policy does not describe it. **[inference]**
The reason to fix the English is the reader's trust and the portfolio
reading of the site (§2), not a ranking risk.

## 4. What the site's English looked like **[observation]**

`check-english.mjs --summary` over the 28 English pages (24 articles, the
guide, the case study, 2 project entries):

| Rule | at `e39de3b` | after revision |
|---|---|---|
| British spelling (mixed with American) | 76 | 0 |
| Day-month dates in prose | 63 | 0 |
| "defect(s)" for bugs and mistakes | 37 | 0 |
| "That is why / This is why" | 17 | 0 |
| "it is worth" | 15 | 0 |
| "reading(s)" for fetches and visits | 15 | 0 |
| Colon chains (3+ in a paragraph) | 14 | 1 |
| Pages with no contractions and 12+ uncontracted negatives | 10 | 0 |
| "In words" (diagram text label) | 7 | 0 |
| "the diagram's mirror" | 7 | 0 |
| "Note of <date>" | 1 | 0 |
| Translation note not on the last line | 1 | 0 |
| **Files with errors** | **28 of 28** | **0 of 28** |

Reproduce (needs the revision branch for the second column):

```bash
git archive e39de3b content/en | tar -x -C /tmp/before
node .claude/skills/english-version/scripts/check-english.mjs $(find /tmp/before/content/en -name '*.mdx') --summary
node .claude/skills/english-version/scripts/check-english.mjs --published --summary
```

The remaining colon chain (`technical-seo-nextjs`, hreflang rules) is a
labeled list written as a paragraph; it stays.

The script finds only patterns. The revision also rewrote what it cannot see
(`.claude/skills/english-version/references/calques.md`, "Found only by
reading"): passive "was done", "request" for a prompt, literal headings
("A catalogue of fixes in Next.js" → "Fixes for INP in Next.js"), literal
verdicts ("Sustained, uselessly" → "Supported, but underpowered"), and
generalizations about people the sources do not make.

Two defects that were not language turned up in the same pass:

- `nextjs-json-ld`: the sentence explaining the escape read "`<` is the
  escaped form of the `<` character"; the Portuguese and the code have
  `\u003c`. Restored.
- `which-ai-assistants-run-javascript`: a paragraph after the translation
  note. Moved above it.

And one in the UI: the English blog index said "Articles per axis" and
"Filter by kind or axis" (from "eixo"); now "topic". Form field names and
query parameters were not changed.

## (a) Decisions taken in the revision

| Decision | Why |
|---|---|
| American English everywhere | the pages mixed both; the audience is international developers, and Google's and MDN's docs are American |
| Month D, YYYY in prose; ISO in tables, logs and sources | the repository records ISO; prose follows the variety |
| Contractions in explanatory prose | their absence was the most uniform marker of translation |
| Slugs, `primaryQuery`, code, SVG geometry, H2/FAQ counts unchanged | published URLs and the pair contract (`structure.md`) |
| Heading wording changed where literal; anchors and links updated | 85 headings (`git diff -U0 e39de3b -- content/en \| grep -cE '^-#{2,4} '`); every `#anchor` link in `content/en` resolves (checked with github-slugger). An outside link to an old anchor still lands on the page, at the top |
| `dateModified` not bumped | a language revision is not a change in substance; owner may decide otherwise |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "Google penalizes translated content" | G1 targets scraped and transformed content, not a site's own translation |
| "The English now reads as native" | a pattern check proves the absence of known calques, not nativeness; a native human reader has not reviewed it |
| "LLMs can't translate naturally" | R1–R3 show the literal default *and* ways to reduce it |

## (c) Open questions

1. A human native reader for the first pages after this change, to calibrate
   the skill's native read? Owner decision.
2. Should a language-only revision bump `dateModified`? The skill says no and
   flags it in the PR.
3. Should `check-english.mjs` run in CI? It is fast and has 0 errors on the
   published pages; its WARNs are judgment calls, so only ERRORs could gate.
