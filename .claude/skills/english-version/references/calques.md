# Calques and false friends found on this site

Every row below was found in the published English pages during the
2026-10-27 revision (before → after are real lines, shortened). The `id` is
the rule name in `check-english.mjs`; rows without an id need a reader,
because no pattern separates them from correct English.

Counts are `check-english.mjs --summary` on the 28 English pages at `e39de3b`
(before) and after the revision (`docs/research/2026-10-27-english-translation-quality.md`).

## Found by the script

| id | Portuguese source | Before | After | Before → after |
|---|---|---|---|---|
| `british` | — (mixed variety) | behaviour, catalogue, analysed, colour | behavior, catalog, analyzed, color | 76 → 0 |
| `day-month-date` | 25 de setembro de 2026 | 25 September 2026 | September 25, 2026 | 63 → 0 |
| `defect` | defeito | six defects in the instrument | six bugs in the instrument | 37 → 0 |
| `that-is-why` | por isso | That is why the test needs a control. | That's why the test needs a control. / So the test needs a control. | 17 → 0 |
| `worth` | vale a pena / vale lembrar | It is worth checking the source. | Check the source. | 15 → 0 |
| `reading-noun` | leitura | across 10 controlled readings | across 10 controlled visits | 15 → 0 |
| `colon-chain` | a: b: c | three clauses joined by colons | separate sentences | 14 → 1 |
| `no-contractions` | — (register) | does not, is not, cannot throughout | doesn't, isn't, can't in prose | 10 → 0 |
| `in-words` | Em palavras | In words: the browser… | (label removed, or "In short,") | 7 → 0 |
| `mirror` | espelho do diagrama | The diagram's mirror | The same steps as a table | 7 → 0 |
| `note-of` | Nota de 25 de set. | Note of September 25 | Update, September 25: | 1 → 0 |
| `note-not-last` | — (structure) | a paragraph after the translation note | the note is the last line | 1 → 0 |

Rules with no hit on the site, kept because they are classic PT → EN calques:
`with-this` (com isso, além disso), `make-test` (fazer um teste),
`realize-do` (realizar = carry out), `it-is-possible` (é possível),
`in-the-case-of` (no caso de), `the-same-pronoun` (o mesmo), `false-friend`
(eventualmente, pretender, pontual).

## Found only by reading

| Pattern | Portuguese source | Before | After |
|---|---|---|---|
| Passive "was done" | foi feito | The audit was done on 10 pages. | I audited 10 pages. / The audit covered 10 pages. |
| "request" for a prompt | pedido | The request asked for the codes. | The prompt asked for the codes. |
| "account" for an entry | relato | an account of how the site was made | the story of how the site was made |
| Noun pile from a PT title | Diminuir uma afirmação | Making a claim smaller | Scaling a claim down |
| Literal heading | Um catálogo de correções | A catalogue of fixes in Next.js | Fixes for INP in Next.js |
| Literal verdict | Sustentada, sem poder | Sustained, uselessly | Supported, but underpowered |
| Over-formal verbs | verificar, constatar | it was verified that | I checked / it turned out |
| "the site" for the owner | o site fez | the site ran a control | I ran a control (when it was the owner's act) |
| Generalized hyperbole | quase ninguém | almost nobody asks it | (cut, or the measured fact) |
| Article before a general noun | a performance | the performance matters | performance matters |
| "since" for a reason | já que | since the header is forbidden | because the header is forbidden (when "since" could read as time) |
| Doubled possessive | o arquivo do site | the file of the site | the site's file |
| "Next," opening every step | em seguida | Next, … Next, … | vary, or number the steps |

## What not to "fix"

- A colon that introduces a list or a label is English. One colon per
  sentence, introducing an explanation, is fine.
- "Actually", "really", "simply" are English; flag them only when they add
  emphasis the Portuguese does not have.
- Technical terms the English documentation itself uses (render-blocking,
  hydration, crawl budget) stay, even if the Portuguese page explained them.
- Brazilian context (pt-BR SERPs, LGPD, registro.br) stays, explained once.
