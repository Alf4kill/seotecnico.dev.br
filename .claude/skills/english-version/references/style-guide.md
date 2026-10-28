# English style guide for seotecnico.dev.br

Decided in the 2026-10-27 revision, after feedback that the English pages
read like a translation of the Portuguese. The target reader is a developer
or technical SEO who reads English natively or professionally and has never
seen the Portuguese page. The test for every sentence: **would an English
technical writer have written it this way from scratch?**

**Base: the [Google developer documentation style guide](https://developers.google.com/style)**
(owner decision, 2026-10-27). It is written for the same reader, in American
English, and native documentation on this site's topics follows it. Where it
and this file disagree, this file wins; everything this file does not cover
follows Google. The deviations are marked "(site)" below. Why the base
changed: the first version of this guide turned a Portuguese habit (no
serial comma) into a house rule
(`docs/research/2026-10-27-english-register-profile.md`).

## Variety and mechanics

| Point | Rule | Example |
|---|---|---|
| Variety | American English, everywhere (content, UI strings, alt text, SVG labels) | behavior, analyze, catalog, labeled |
| Dates in prose | Month D, YYYY | September 25, 2026 |
| Dates in tables, logs, sources, code | ISO, as the repository records them | 2026-09-25 |
| Times | (site) 24-hour, as the repository records them, with the zone when it matters | 14:05 UTC |
| Numbers | thousands with a comma; decimal point; a space before units in prose | 1,191 fetches · 0.25% · 4.9 s · 80 ms |
| Ranges | (site) en dash, no spaces | 80–148 ms |
| Quotation marks | (site) straight double quotes in prose, as the published pages use; a curly apostrophe (’) only inside a single-quoted YAML string, where a straight one would end it | "the script ran" |
| Serial comma | used (Google). Pages published before 2026-10-27 without it are converted when they are next revised | ChatGPT, Claude, and Perplexity |
| Colons | after a complete sentence, to introduce a list or a closely related explanation; lowercase after it. In running prose, rarely: native technical prose uses about 2 per 100 sentences, this site's pages used 25 | The fields are defined as follows: |
| Semicolons | avoid (Google); two sentences instead | — |
| Headings | sentence case; describe the section or use a verb, not a bare noun phrase | How the pipeline works (not "The chain") |
| Contractions | yes in explanatory prose; no in titles, tables and quoted rules | doesn't, isn't, can't |
| Person | "you" for the reader (Google); (site) "I" for the owner's decisions and measurements, never "we" or "our" (one author, not an organization); "the site" for the system | I ran the test; you can check |

## Register

- **Plain, direct, a little conversational.** The Portuguese pages are
  written by one person about his own site; the English should sound like
  the same person explaining it to a colleague, not like a report.
- **One idea per sentence.** Portuguese chains clauses with colons and
  semicolons; English splits them. A "setup: payoff" sentence is fine once
  in a while; one in every four sentences is what made these pages read as
  translated.
- **Verbs over nouns.** "I ran a test" over "a test was carried out";
  "Google ignores it" over "it is ignored by Google"; "Verification catches
  most errors" over "The verification is responsible for catching errors".
- **Start with the actor.** Portuguese opens sentences with a definite noun
  phrase ("O mecanismo é o mesmo…", "A prevenção é…"). English starts with
  who or what acts, with "you", or with "this/it" for something already
  named: "It works the same way", not "The mechanism is the same".
- **Talk to the reader.** Where the Portuguese is impersonal ("é possível",
  "deve-se", "o leitor"), write "you can", "you need to", "you".
- **Rewrite article runs, don't delete articles.** Portuguese packs ideas
  into nouns, and every definite noun asks for a "the" in English. The
  patterns, with before and after, are in `calques.md` ("Structural
  interference"). Many "the" are required (superlatives, "the same", a
  referent already introduced): a deleted article is a new error.
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
| repositório | the repository; "repo" in conversational prose | — |
| documento (in `docs/`) | doc ("the pipeline doc"); document in formal statements | — |
| entre mim e o Claude | Claude and I (subject); between Claude and me | between me and Claude |
| nosso (the owner's) | my | our, we (one author) |

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

## A second example: structure, not words

Free of every calque, and still translated. The opening of
`/en/project/how-a-page-is-made` after the first revision (14 "the" in about
120 words, every sentence a Portuguese one in English words):

> Writing is the smallest part of a page on this site. Each one comes out of
> the same chain: a dated research note, a brief I approve, a draft, a
> verification pass against the sources and the code, the English version,
> registration, the check scripts and a pull request I merge. Verification
> does the heavy lifting.
>
> This page belongs to the Project section. How the work is split between
> me and Claude is covered in how AI is used in this project; this entry
> covers the process itself. It is based on the process document in the
> repository, and the procedure is packaged as the content-page skill, which
> any session with repository access follows step by step.

Rewritten by the owner as the reference for this pattern ("my" for his
"our", under the Person rule):

> Writing is the smallest part of making a page here. Every page goes
> through the same chain: a dated research note, a brief I approve, a draft,
> a verification pass against sources and code, an English version,
> registration, check scripts, and a pull request I merge. Verification does
> most of the work.
>
> This page is part of the Project section. How Claude and I split the work
> is covered in how AI is used in this project; this one covers the process.
> It's based on my pipeline doc, and the content-page skill packages the
> procedure so any session with repo access can follow it step by step.

What changed: one article for a coordinated pair ("sources and code"),
indefinite or no article in a list of generic steps ("an English version",
"check scripts"), a possessive and a compound for "the process document in
the repository" ("my pipeline doc"), "Claude and I" as the subject, the
skill as the actor ("the content-page skill packages"), "this one" for a
repeated "this entry", a serial comma. Facts, links and hedges are the same.
