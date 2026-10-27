# Worked example: one `/projeto` entry, from brief to registered pair

> **Status:** example for owner review · 2026-10-26
> **What this is:** entry 1 of `docs/proposals/project-section.md` §6 ("How
> AI is used in this project") walked through every phase of the
> `content-page` skill, so the section's process is documented on a real
> case before any code exists. Everything below is a draft; nothing here is
> published or registered.
> **Review:** `docs/proposals/project-section-review.md`

The pages themselves are not written here: phase 2 of the skill says the
owner reviews the brief before any prose. What this file adds over the
proposal is the brief filled in with measured values, the exact files the PR
would touch, and what each check is expected to say.

---

## Phases 0–2 — Gates and brief

No research note (phase 1): every source of this entry is in the repository.

```markdown
# Brief — How AI is used in this project

**Date:** 2026-10-26 · **Page type:** project entry
**Status:** draft brief, waiting for owner review

## 1. Question and query
- Question the page answers: how is a technical SEO site built with Claude,
  and what stays with the owner?
- `primaryQuery` PT: "como a ia é usada neste projeto" — not validated for
  demand, on purpose: project entries are not gated by search demand
  (proposed CLAUDE.md §5.4).
- English query: "how ai is used in this project" — same.
- Existing pages with a close `primaryQuery`: `grep -rn primaryQuery content`
  → closest is `scaled-content-abuse` ("scaled content abuse"), which is
  about Google's policy, not this site's process. No overlap.

## 2. Gates
- First-hand evidence: `docs/ai-workflow.md`; git history at `b141722`;
  commits `e376922` (narrowed claim), `59f86e1` (bilingual rule);
  `.github/workflows/ci.yml` (the gates table).
- Scope: project section — the subject is this repository, not how machines
  read pages, so §13 keeps it out of the blog.
- Layer (§5.2): n/a (project).

## 3. Identity
| | PT | EN |
|---|---|---|
| slug | uso-de-ia | how-ai-is-used |
| route | /projeto/uso-de-ia | /en/project/how-ai-is-used |
| title (≤60) | Como a IA é usada neste projeto de SEO técnico (48) | How AI is used in this technical SEO project (44) |
| description (≤155) | Um site de SEO técnico feito com o Claude: o que o histórico do Git mostra, quem decide o quê e quais regras viram teste no CI. (130) | A technical SEO site built with Claude: what the Git history shows, who decides what, and which rules are enforced as CI tests. (127) |
| tldr (≤300) | 191 chars (below) | 174 chars (below) |
| category | none — rejected by the project loader | none |
| status | none | none |
| basedOn | none (not an experiment) | none |

## 4. Outline (identical H2s in both languages)
1. (first paragraph, no H2) direct answer
2. O que o histórico mostra / What the history shows
3. Quem faz o quê / Who does what
4. O contrato: CLAUDE.md / The contract: CLAUDE.md
5. Regras que são testes / Rules that are tests
6. Diminuir uma afirmação / Making a claim smaller
7. O que fica com o dono / What stays with the owner
8. Como reproduzir os números / Reproducing the numbers

## 5. Claims inventory
| Claim | Level | Source |
|---|---|---|
| 468 commits, 351 non-merge, 117 merges at `b141722` | 3 | `git rev-list` commands printed in section 8 |
| 351 of 351 non-merge commits carry a Claude co-author trailer | 3 | trailer one-liner, section 8 |
| Per-model counts 46 / 28 / 101 / 176 | 3 | same one-liner — **owner decision 4** (keep or drop model names) |
| A trailer does not measure how much text the model wrote | 1 | mechanism: what a trailer records |
| The owner merges every PR | 2 | §14; checkable in the merge commits' committer |
| Rules that are tests catch what a model gets wrong | 2 | the CI gates table + the 2026-10-23 counter-example (two EN pairs without the closing note, a convention with no test) |
| Apex finding narrowed from outage to route problem | 3 | commit `e376922` |

## 6. Code, diagrams and FAQ
- Repo code to quote: none as code; the shell one-liners of section 8 are
  commands, copied verbatim in both languages.
- Diagrams: none needed. The "who does what" table is the structure.
- FAQ: none. Nobody searches these questions; an FAQ here would be invented.

## 7. Links
| Purpose | PT target | EN target |
|---|---|---|
| index | /projeto | /en/project |
| related (Google on AI content) | /blog/scaled-content-abuse | /en/blog/scaled-content-abuse |
| related (the lab method) | /blog/pre-registro-seo | /en/blog/seo-testing-pre-registration |
| related (the other colophon) | /design | /en/design |
| versioned artifact (required) | https://github.com/Alf4kill/seotecnico.dev.br/blob/main/docs/ai-workflow.md | same |

## 8. Experiment-log row (draft)
| Date | Change | Hypothesis (+ power note) | Result |
|---|---|---|---|
| merge date | Published `/projeto/uso-de-ia` + `/en/project/how-ai-is-used` | Both URLs indexed within 4 weeks of the indexing request. Existence prediction: one observation per URL, nothing to power; no ranking or traffic prediction (§7.3). | pending |

## 9. Open decisions for the owner
- [NOTA-REDACAO] Keep the per-model table (proposal §8.4)?
- [NOTA-REDACAO] Confirm or correct every **[owner]** line of
  `docs/ai-workflow.md` §3 and §8. Settled 2026-10-26: properties in the
  personal account, Search Console data exported by hand, `gsc-monitor` never
  run against the site (review §3.4). The page says that, and nothing about
  the account the API credentials belong to.
- [NOTA-REDACAO] One sentence on the 2026-10-19 history rewrite: SHAs cited
  are from the current history (review §3.4).
```

---

## Phases 3–5 — What the two files would start with

Only the frontmatter and the first paragraph, to show the shape. The body is
written after the brief is approved.

`content/projeto/uso-de-ia.mdx`

```yaml
---
title: "Como a IA é usada neste projeto de SEO técnico"
description: "Um site de SEO técnico feito com o Claude: o que o histórico do Git mostra, quem decide o quê e quais regras viram teste no CI."
slug: "uso-de-ia"
primaryQuery: "como a ia é usada neste projeto"
keywords: ['ia', 'inteligência artificial', 'claude', 'claude code', 'llm', 'processo', 'bastidores']
lang: "pt-BR"
tldr: >-
  Uma pessoa e sessões do Claude com acesso ao repositório: o Claude escreve
  código, testes e rascunhos; o dono decide, revisa e faz o merge de todo PR.
  O CI bloqueia o que quebra uma regra.
datePublished: "YYYY-MM-DD"
dateModified: "YYYY-MM-DD"
---

Este site é construído por uma pessoa trabalhando com o Claude. O dono decide
o que entra, traz os dados que só ele acessa e revisa e faz o merge de cada
pull request; o Claude escreve a maior parte do código, dos testes e dos
rascunhos, dentro de regras que o próprio repositório verifica.
```

`content/en/project/how-ai-is-used.mdx`

```yaml
---
title: "How AI is used in this technical SEO project"
description: "A technical SEO site built with Claude: what the Git history shows, who decides what, and which rules are enforced as CI tests."
slug: "how-ai-is-used"
primaryQuery: "how ai is used in this project"
keywords: ['english', 'inglês', 'ai', 'claude', 'claude code', 'llm', 'process']
lang: "en"
translationOf: "uso-de-ia"
tldr: >-
  One person and Claude sessions with repository access: Claude writes code,
  tests and drafts; the owner decides, reviews and merges every PR. CI blocks
  whatever breaks a rule.
datePublished: "YYYY-MM-DD"
dateModified: "YYYY-MM-DD"
---
```

Both files ship in the same PR with the same `datePublished` (§10, rule of
2026-10-23). The English file ends with the closing translation note.

## Phase 6 — Register

`src/lib/hreflang.ts`, at the end of `TRANSLATION_PAIRS` (comments in
Portuguese, as in the rest of the file). The index pair goes in once, in the
PR that builds the section:

```ts
  // A seção do projeto: como o site é construído. Índice e entradas.
  {
    id: 'project',
    paths: {
      'pt-BR': '/projeto',
      en: '/en/project',
    },
  },
  {
    id: 'uso-de-ia',
    paths: {
      'pt-BR': '/projeto/uso-de-ia',
      en: '/en/project/how-ai-is-used',
    },
  },
```

Plus the experiment-log row of brief §8, committed before the pages.

## Phase 7 — Checks and what they should print

```bash
node .claude/skills/content-page/scripts/check-draft.mjs content/projeto/uso-de-ia.mdx --type project
node .claude/skills/content-page/scripts/check-draft.mjs content/en/project/how-ai-is-used.mdx --type project
node .claude/skills/content-page/scripts/check-pair.mjs --type project uso-de-ia   # flag added with the section
npm test
npm run build
npm run test:seo
```

Expected from the pair check, once it has the per-type table (review §4):

```
OK    uso-de-ia ↔ how-ai-is-used
```

It must **not** report "does not link the pillar" or "links no tool" for a
project entry, and it **must** fail if neither side links a GitHub URL to a
commit, PR or file. If the first run prints either of those, the script is
wrong, not the entry — the same lesson as the skill's first round on blog
pairs (`docs/skills.md` §5).

## Phase 8 — The PR

One branch, commits in this shape:

1. `content: publish how AI is used in this project, PT and EN` — both MDX
   files + the `hreflang.ts` entry.
2. `docs(log): register the first project entry` — the log row.

PR description: this brief, the claims inventory with sources, the
`check-pair.mjs` output, the open `[NOTA-REDACAO]` items, and the after-merge
steps (indexing request for both URLs, date written into the log row).
