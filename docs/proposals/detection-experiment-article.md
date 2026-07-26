# Proposal — Publishing the crawler detection experiment as site content

> Status: **proposal — approved direction, drafting not started** · 2026-07-25
> Source material: [`detection-experiment.md`](../detection-experiment.md) (method),
> [`measurement-plan.md`](../measurement-plan.md) (event + synthetic exclusions),
> [`experiment-log.md`](../experiment-log.md) (dated hypotheses H1–H6).
> Binding constraints: CLAUDE.md §10 (content conventions), §5.2 (one query per
> article), and — above everything — `detection-experiment.md` §7 (publication
> rules). If a sentence in the article violates §7, the sentence is wrong, not
> the rule.

## 1. Why publish this (the motive, stated once)

The experiment answers a question the audience asks constantly and the public
discussion answers with vibes: *"is AI using my content, and can I even know?"*
Almost nobody publishes the attempt from a domain they own, with method, dated
predictions and the honesty about what is unknowable. That gap is the article.
It serves O2 (long-tail PT query), O6 (documented before/after experiment) and
O7 (AEO: the central claim is short, counterintuitive and verifiable — prime
citation material).

## 2. Two articles, not one

The method and the results have different publication dates by design — the
hypotheses' windows close ≈2026-10-23. Forcing them into one piece would either
delay the method by three months or publish results that don't exist yet.

| # | Article | Publishes | Carries |
|---|---|---|---|
| 1 | **Method**: how this site detects and classifies AI crawlers | ≈2026-08-08 (see §5) | The two-axis classification, the honeypots, identity verification, what is structurally unknowable, first ~14 days of real counts |
| 2 | **Results**: what 90 days of data said about H1–H6 | after ≈2026-10-23 | The verdicts, including falsified hypotheses (§7 rule 6 makes "it didn't work" publishable) |

This proposal plans article 1 concretely; article 2 inherits the frame and gets
its own outline when the data exists.

## 3. Article 1 — plan

### 3.1 Query and frontmatter

Primary query candidates considered:

- `como saber se a IA usa meu conteúdo` — **chosen.** High intent, matches the
  article's honest core (you cannot prove absence; you can measure three
  things), and the SERP for it is entirely opinion pieces with zero first-party
  data.
- `bloquear crawler de IA` — rejected here: that is the *policy* story
  (`ai-crawler-policy.md`), a different article if ever.
- `honeypot robots.txt` — rejected as primary (tiny volume); it becomes an H2
  and likely owns its featured-snippet anyway.

```yaml
title: "Como saber se a IA usa seu conteúdo: método e honeypot"   # ≤60
description: "Um site real medindo crawlers de IA: honeypot no robots.txt, verificação de identidade por IP e DNS, e o que é impossível saber."  # ≤155
slug: detectar-crawlers-ia
primaryQuery: como saber se a ia usa meu conteudo
tldr: >-  # ≤300 — the liftable answer
  Provar que a IA NÃO usa seu conteúdo é impossível. O que dá para medir, com
  logs próprios: quais agentes declarados buscam suas páginas, se respeitam o
  robots.txt (honeypot) e se a identidade alegada é verdadeira (IP + DNS
  reverso). Este site mede os três — método e dados abertos.
lang: pt-BR
faq:  # 4–6 items; each answer ≤ ~300 chars, no vendor accusations
  - "User-Agent identifica um crawler?"        # não — é alegação; verificação = feed de IP / rDNS / assinatura
  - "O que é um honeypot de robots.txt?"       # URL que só existe na linha Disallow; acesso = desrespeito deliberado
  - "Robots.txt impede treinamento de IA?"     # não — é pedido voluntário; medir compliance é o máximo possível
  - "Dá para saber se meu texto entrou num modelo?"  # não, pela negativa — mirrors §6
```

### 3.2 AEO first paragraph

Answers the query in the first sentence, in the negative-first form that makes
it quotable: *"Não existe como provar que a IA **não** usa seu conteúdo. Existem
três coisas mensuráveis — e este site mede as três, em produção: …"* Then the
three questions table from `detection-experiment.md` §1, translated.

### 3.3 Outline (H2 sequence)

1. **O que é mensurável e o que não é** — §1's asymmetry: authorization is a
   fact, purpose is a citation, absence is unprovable. The §6 mirror lives HERE,
   early, not buried at the end — it is the article's credibility.
2. **User-Agent é alegação, não identidade** — the verification ladder:
   vendor CIDR feeds, forward-confirmed rDNS, Web Bot Auth; the token-only
   trick (`Google-Extended` never fetches — claiming it is self-incriminating);
   `unverifiable ≠ impersonated`, with the CCBot example. Code: the real
   verdict type + the FCrDNS check from `crawler-verification.ts`.
3. **O honeypot: uma URL que só existe no robots.txt** — mechanism, why
   per-agent trap paths prove nothing, why it is not a tarpit (three reasons,
   including the honesty one). Code: the real `Disallow` line + trap headers.
4. **O delta dos dois pipelines** — server-side request vs JS pageview; why
   Consent Mode advanced already killed the obvious confound. This is the
   section no competitor has.
5. **Primeiros N dias, em números** — the original data (§5 below). Counts,
   dates, definitions — no adjectives (§7 rule 3). Impersonation bucket
   reported separately, never under a vendor's name (§7 rule 2).
6. **O que este site se proíbe de publicar** — §7's rules as content. Turning
   the ethics into a section is differentiation, not filler: it is the reason a
   reader can trust article 2 when it lands.
7. **FAQ** (renders FAQPage; questions above).

Diagram: one inline SVG (existing palette tokens, textual mirror as a table) —
the classification flow: request → UA claim? → verification → verdict.
Internal links: pillar (`/guia/seo-tecnico-nextjs`), the robots/sitemap spoke
(`/blog/sitemap-dinamico-nextjs`), ≥1 tool (`/ferramentas/gerador-json-ld`,
natural anchor: machine-readable declarations of identity/authorship).
**No link to either trap URL** — linking them from an article would destroy the
single-discovery-surface invariant that `tests/seo/traps.spec.ts` pins.

### 3.4 What the article must NOT do (binding)

- Name a vendor as violator — article 1 publishes **method + counts**, never
  verdicts on companies (that is article 2's problem, under §7's three-proof
  rule, if the data ever supports it).
- Present the tiers as scores, or the likelihoods as facts.
- Imply "no evidence of ingestion" means "not ingested" (§6).
- Reveal `NET_ID_SALT_SECRET` mechanics beyond what `detection-experiment.md`
  already publishes (the doc is public; the secret is the only secret).

## 4. Original data requirement (CLAUDE.md §10)

Article 1 carries three original elements, any one of which alone satisfies the
rule: (a) the dated end-to-end validation — a residential curl claiming GPTBot
was verdicted `impersonated` while CCBot came back `unverifiable`, demonstrating
the distinction in production on 2026-07-25; (b) the first ~14 days of real
counts by `ua_class` / `bot_policy` / `bot_verified` (synthetic hits excluded by
timestamp, as documented); (c) the real production code, which no competing
article has.

## 5. Timing

**Draft now, publish ≈2026-08-08** — two weeks post-deploy, so section 5 opens
with real counts instead of only the validation. Publishing method-first is
safe: the method does not depend on the hypotheses' outcomes, and pre-registering
H1–H6 publicly *before* the results is itself the credibility play (same logic
as the llms.txt zero-fetch prediction). If the first 14 days are literally
empty, that IS the number — "zero declared AI hits in 14 days" is a finding.

Article production follows the established writing-handoff workflow (3-round,
returned draft verified against this outline and §7 before merge).

## 6. English pair

Strong `/en` candidate (the topic's demand is mostly international, and the
method is this site's most differentiated asset), but AFTER the PT version
indexes — same sequencing rule as the rest of the cluster. hreflang pair per
CLAUDE.md §6.
