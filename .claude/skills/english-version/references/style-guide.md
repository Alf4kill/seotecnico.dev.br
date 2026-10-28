# English style guide for seotecnico.dev.br

Decided in the 2026-10-27 revision, after feedback that the English pages
read like a translation of the Portuguese. The target reader is a developer
or technical SEO who reads English natively or professionally and has never
seen the Portuguese page. The test for every sentence: **would an English
technical writer have written it this way from scratch?**

## Variety and mechanics

| Point | Rule | Example |
|---|---|---|
| Variety | American English, everywhere (content, UI strings, alt text, SVG labels) | behavior, analyze, catalog, labeled |
| Dates in prose | Month D, YYYY | September 25, 2026 |
| Dates in tables, logs, sources, code | ISO, as the repository records them | 2026-09-25 |
| Times | as recorded, with the zone when it matters | 14:05 UTC |
| Numbers | thousands with a comma; decimal point; a space before units in prose | 1,191 fetches · 0.25% · 4.9 s · 80 ms |
| Ranges | en dash, no spaces | 80–148 ms |
| Quotation marks | straight double quotes in prose, as the published pages use; a curly apostrophe (’) only inside a single-quoted YAML string, where a straight one would end it | "the script ran" |
| Serial comma | not used (the site's existing style) | ChatGPT, Claude and Perplexity |
| Headings | sentence case | What the pilot showed |
| Contractions | yes in explanatory prose; no in titles, tables and quoted rules | doesn't, isn't, can't |
| Person | "I" for the owner's decisions and measurements, "you" for the reader, "the site" for the system | I ran the test; you can check |

## Register

- **Plain, direct, a little conversational.** The Portuguese pages are
  written by one person about his own site; the English should sound like
  the same person explaining it to a colleague, not like a report.
- **One idea per sentence.** Portuguese chains clauses with colons and
  semicolons; English splits them. Three colons in a paragraph is the
  signal (`check-english.mjs` warns on it).
- **Verbs over nouns.** "We ran a test" over "a test was carried out";
  "Google ignores it" over "it is ignored by Google".
- **Say the thing.** Drop "it is worth noting that", "it is important to
  remember", "it is possible to": start with what is worth noting.
- **Hedge exactly as much as the claim level** (CLAUDE.md §10). Level 1
  claims are plain statements; level 3 claims carry their measurement. No
  added "basically", "simply", "actually" to sound natural.
- **No generalizations about people** the source does not make ("nobody
  checks this", "almost everyone gets this wrong"). They read as translated
  hyperbole and break the claims policy.

## Glossary — the site's terms

| Portuguese | English on this site | Not |
|---|---|---|
| leitura (an assistant opening a page) | fetch, visit | reading |
| rodada | round | turn |
| pedido (to an assistant) | prompt | request (reserved for HTTP) |
| requisição | request | requisition |
| foi feito / rodou | ran, was run | was done, was made |
| defeito (software) | bug; problem or mistake (a draft) | defect |
| relato | write-up, story, entry | account |
| registro (experiment log) | the log, the experiment log | the register |
| registrar (a hypothesis) | pre-register, log | register |
| nota (datada) | Update, September 25: · Note (September 25): | Note of September 25 |
| espelho do diagrama | the same steps in text / as a table | the diagram's mirror |
| eixo (blog category) | topic | axis |
| laboratório | the lab | the laboratory |
| pilar | the pillar guide | the pillar (alone, unexplained) |
| sessão de redação | writing session | redaction session |
| verificação | verification pass | the verification |
| afirmação menor | scaling a claim down | making a claim smaller |
| medição | measurement | measuring (as a noun) |
| instrumento | tool (redirects, canonicals); instrument only for a measuring setup | instrument (for any tool) |
| métrica de campo / de laboratório | field data / lab data | field metric / laboratory metric |
| resposta curta (tldr) | short answer, TL;DR | short response |

Product and UI names are the vendor's English names (Search Console's
"URL Inspection", PageSpeed Insights' "Diagnose performance issues"), taken
from the English help pages, never back-translated from the Portuguese UI.

## What a native pass changes, in one example

Portuguese:

> Vale a pena lembrar: o teste foi feito em 10 leituras controladas, e por isso
> o resultado não generaliza: é um piloto.

Literal (what the site had):

> It is worth remembering: the test was done in 10 controlled readings, and
> that is why the result does not generalize: it is a pilot.

Native:

> Keep the scale in mind. This was a pilot of 10 controlled visits, so the
> result doesn't generalize.

Same facts, same claim level, half the colons, no calques, a contraction.
