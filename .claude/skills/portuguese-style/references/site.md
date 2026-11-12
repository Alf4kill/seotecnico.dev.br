# Site layer — seotecnico.dev.br

> **Layer:** this site only. The portable rules are in `estilo-ptbr.md`; this
> file adds what seotecnico.dev.br decides on top of them. `CLAUDE.md` is the
> source of truth: where this file points to a section, read the section, and
> where they disagree, `CLAUDE.md` wins and this file is the one to fix.
> **Status:** first version, 2026-11-11 (proposal step 1); §7 and §8 added
> 2026-11-12 (step 4).

## 1. Reader and author

- **Reader** (`CLAUDE.md` §1, widened on 2026-10-04): a developer who builds
  modern websites (React, Next.js and equivalent stacks), with Next.js as the
  reference implementation. Assume React and Next.js basics; never explain
  what a component is, always explain what Googlebot or an AI assistant does
  with it.
- **Author:** one person, writing in the first person about his own site and
  measurements (`estilo-ptbr.md` §1). "Neste site" is the site's standard
  way to scope a measured claim (39 times in 23 of 30 pages).
- **Experience is evidence, never biography.** At most one or two passages
  per page, each with its record (commit, log row, audit). Zero is fine;
  forced is not. No "about me" paragraph (that is `/sobre` and the byline),
  no credentials used as an argument, and no client work or client data of
  any kind (`CLAUDE.md` §13).

## 2. Page shape

| Part | Rule | Source |
|---|---|---|
| First paragraph | answers `primaryQuery` for a human, standalone, in two to four sentences; a reader or an assistant that stops here has the answer | §10 (AEO) |
| `tldr` | the same answer in ≤300 characters | §10 |
| H1 | never in the body: the title renders it | content-page phase 3 |
| H2s | the questions the page answers, in the order a reader needs them: what → why it matters for crawling or indexing → how → how to verify | — |
| Verification | a how-to page ends its procedure with how to confirm it worked (Search Console, Rich Results Test, DevTools, `curl`); new pages call the section "Como verificar" (published pages use it 3 times and "Como conferir" 3 times; headings stay, their anchors are linked) | — |
| Measurement pages | a "Método e limites" section states n, dates, the instrument and what the result does not show | §7.3, §10 |
| Layer 1 pages | close with "No Next.js", with this repository's real code | §5.2 |
| Sources | external sources listed at the end under "Fontes", each with the date it was read | content-page phase 1 |
| Length | as long as the question needs; the pillar is the only page meant to be long | — |

## 3. Title and description

- **Title** (≤60 characters): the query as people type it, a colon, and the
  concrete angle of this page. 22 of the 27 blog titles follow it, and 3
  more are questions:
  "Soft 404: quando o site responde 200 ao que não existe". The title's colon
  is a convention of the format and does not count against the prose.
- A question as the title only when the query itself is a question
  ("llms.txt funciona? O que um site real mediu"). No clickbait questions
  ("Você está cometendo estes erros de SEO?").
- **Description** (≤155 characters): the first line of the answer and what
  the page contains (code, a measurement, a tool), not an ad.
- On a published page, a style revision does not change either (proposal
  §3.4).

## 4. Claims, code, figures

- **Claims policy** (`CLAUDE.md` §10): level 1 mechanism, level 2
  condition, level 3 magnitude with its measurement. "Isso melhora o LCP"
  without a number or a mechanism is not a sentence this site publishes.
  Claims about stacks the site does not run stay at level 1.
- **Code** shown as this site's is the repository's, with its path. Next.js
  code is App Router and TypeScript. Code that is not from the site carries
  the label "Ilustrativo: não existe neste repositório" (11 uses in 8 pages).
- **Diagrams:** inline SVG in token colours, `role="img"`, `aria-label`, and a
  text mirror (table or paragraph) next to it (`CLAUDE.md` §9). Raster images
  through `<Image>`, with explicit dimensions and a descriptive `alt` in
  Portuguese (§6).
- **FAQ:** only questions people ask; FAQ rich results ended on 2026-05-07,
  so `faq` exists for readers and assistants, not for a SERP feature.
- **Links:** pillar and at least one tool on blog pages, descriptive anchors,
  never "clique aqui" (`check-draft.mjs` fails on it).

## 5. Glossary — the site's terms

The same concepts as the English glossary
(`english-version/references/style-guide.md`), so the two sides name things
the same way.

| Term on this site | Means | Not |
|---|---|---|
| leitura | an assistant or crawler opening a page (EN: fetch, visit) | acesso, hit (in prose) |
| rodada | one round of an experiment | turno, tentativa |
| pedido | what was typed to an assistant (EN: prompt) | requisição (reserved for HTTP) |
| requisição | an HTTP request; "request" only inside code, logs or a quoted UI | — |
| log público, registro público | `docs/experiment-log.md`, linked | — |
| pré-registrar | write hypothesis, prediction and window before the data | — |
| laboratório | `/laboratorio` and its experiments | lab (in Portuguese prose) |
| guia de SEO técnico para Next.js | `/guia/seo-tecnico-nextjs` (the wording most pages use for it) | pilar (alone, unexplained) |
| sessão de redação | the external writing session (route A) | — |
| verificação (contra as fontes) | content-page phase 4 | revisão (that is the style pass) |
| métrica de campo / de laboratório | CrUX and RUM / Lighthouse | — |

Counts at `5a0209b` in the 30 pages: rodada 135, leitura 110, pedido 77,
sessão de redação 10.

## 6. Dates on the page

`dateModified` changes only with a change in substance; a language-only
revision does not bump it (content-page, "Updating an existing pair"). A
dated note inside the page ("Atualização de 25 de setembro de 2026:") is a
change in substance and does.

## 7. What a style revision may change

| Field or part | New draft | Published page | Why |
|---|---|---|---|
| body prose | yes | yes | the purpose of the pass |
| `tldr` | yes | yes | prose; it renders on the page and as `Article.abstract` |
| `faq` answers | yes | yes | prose; the questions stay (FAQ count is checked against the English pair) |
| `title`, `description` | yes | **no** | they are what Google shows; changing them is an SEO change with its own log row (proposal §3.4) |
| `dateModified` | — | **no** | a language-only revision is not a change in substance (§6) |
| `slug`, `primaryQuery`, `lang`, `translationOf`, `category`, `status`, `keywords`, `basedOn` | no | no | identity and routing, not prose |
| H2 wording | yes | only with the owner, links updated | headings are anchors other pages link to |
| code, inline code, link targets, components, figures, numbers, dates, hedges | no | no | facts and markup (`SKILL.md`, rule 1) |
| the English pair | — | untouched | it is written from a fact sheet, not from the Portuguese prose (english-version step 1) |

## 8. Where the review runs

After content-page phase 4 (verification) and before phase 5 (English): the
prose is reviewed once the facts are final, and the English is written from
the fact sheet, so the order does not leak Portuguese style into it. On a
published page it runs on its own, one PR per batch, with a log row when the
batch is a deliberate change (proposal §6, steps 6 and 7).
