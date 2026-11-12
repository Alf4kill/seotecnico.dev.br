# Portuguese style guide (pt-BR technical prose)

> **Layer:** portable. Nothing here depends on seotecnico.dev.br; the site's
> rules are in `site.md`, next to this file. A project that reuses the
> `portuguese-style` skill keeps this file and writes its own `site.md`.
> **Status:** first version, 2026-11-11 (proposal `docs/proposals/portuguese-style.md`,
> step 1). The skill's `SKILL.md` comes in step 4; until then, this file is
> read by content-page phase 3 and summarized in its handoff kit.
> **Sources:** the measured practice of the site's 30 Portuguese pages at
> `5a0209b`, the owner's own drafts (route B), the rules already in the
> repository, and the owner's earlier style guide kept outside it, which most
> pages written from September 2026 on did not follow. What came from where
> is in `docs/proposals/portuguese-style-history.md`.

The reader is a developer who reads Portuguese natively and came for an
answer. The test for every paragraph: **would a Brazilian developer, writing
from their own work, have written it this way?** And the older test, kept: could
this paragraph appear on any generic blog about the topic? If yes, rewrite it
with what only this author knows, or delete it.

No numeric limit appears below yet. The limits come from a corpus of native
technical Portuguese (proposal §5, step 2) and enter the script as warnings,
never as errors. Until then, the rules are directions, with the counts that
motivated them.

## 1. Person and voice

| Point | Rule | Example |
|---|---|---|
| The author | first person singular for what the author did, decided or measured | "Eu medi", "no meu teste" |
| The reader | "você" when the sentence tells the reader what to do or what they will see | "Você vê o status no relatório" |
| No "nós" | one author is not an organization: no "nós", "nosso", "recomendamos", "vamos ver" | "Recomendamos usar…" → "Use…" |
| No impersonal frame | no "é possível", "deve-se", "pode-se": say who does it | "É possível verificar no DevTools" → "O DevTools mostra" |
| The system | name it ("o servidor", "o crawler", "o script"), and let it be the subject | "a requisição é bloqueada" → "o proxy bloqueia a requisição" |

Practice at `5a0209b`: "você" in 21 of 30 pages, "eu" in 18, "nós" and its
forms 6 times in 4 pages, "é possível / deve-se / pode-se" 0 times.

## 2. Sentences and paragraphs

- **Claim first.** The paragraph's first sentence says what it is about; the
  evidence follows. A paragraph that builds up to its point makes the reader
  hold everything until the end.
- **One idea per sentence.** When a sentence carries two claims joined by a
  colon, a semicolon or a dash, split it. Two short sentences read faster
  than one long one with a hinge.
- **One idea per paragraph,** usually two to five sentences.
- **Verbs over nouns.** "Medi o LCP" over "realizei a medição do LCP";
  "o Google ignora" over "é ignorado pelo Google". Support verbs ("realizar",
  "efetuar", "promover" + a noun ending in -ção or -mento) almost always hide
  the real verb.
- **Vary the length,** without a target. The July 2026 pages ran a median of
  18–26 words per sentence and the later ones 15–20; neither is a rule until
  the corpus says which one is normal.

## 3. Punctuation

| Mark | Use | Avoid | Practice at `5a0209b` |
|---|---|---|---|
| Colon | after a complete sentence, to introduce a list, a table, code, a quote or one closely tied explanation | chaining clauses ("o problema: o cache: a solução") or a "setup: payoff" hinge in sentence after sentence | sentences with a colon in running prose: 25–51% (July), 12–36% (later); this counts every colon, so it overstates the hinges |
| Em dash (—) | rarely, for a short aside a pair of commas cannot hold | an aside in every paragraph; two dashes in one sentence that do not form a pair; a dash in place of a colon or a period | 18–41% of sentences in July; 0% from 2026-09-25 on, one page at 4% |
| Semicolon | between items of a list written as prose when the items contain commas | joining two independent sentences: write two sentences | sentences with a semicolon: 2–20% per page |
| Parentheses | a short definition, a unit, a source, a date | a second argument inside the first | — |
| Bold | the name of a UI element the reader must find ("**History Change**"), and at most one word of emphasis in a section | emphasis on every key phrase; a bold label opening paragraph after paragraph | 89 lines open with a bold label across 30 pages |
| Quotation marks | straight double quotes for UI strings, quoted text and words used as words | curly quotes (not used anywhere on the site) | straight quotes only |
| Exclamation mark | never in explanatory prose | — | — |

## 4. Mechanics

| Point | Rule | Example |
|---|---|---|
| Dates in a running sentence | day, month in words, year | "em 25 de setembro de 2026"; "em 25 de setembro" when the year is clear |
| Dates in parentheses, source lists, captions | DD/MM/AAAA | "(lido em 23/10/2026)" |
| Dates in tables, logs, code | ISO, as the records keep them | 2026-09-25 |
| Times | 24-hour, with the zone when it matters, as the records write them | 14:05 UTC |
| Decimals and thousands | decimal comma, thousands with a point | 0,25% · 4,9 s · 1.191 requisições |
| Units | a space between number and unit; no space before % | 80 ms · 4,9 s · 25% |
| Ranges | en dash, no spaces | 80–148 ms · 2023–2025 |
| Versions, IPs, code values | as the source writes them, in inline code when they are code | `76.76.21.21` · `next.config.ts` |
| Headings | sentence case; say what the section does, or ask the question it answers | "Como verificar", not "Verificação" |

Practice at `5a0209b`, outside tables and code: "25 de setembro" form 78
times, "23/10/2026" form 119 times (mostly "lido em" in source lists and
dates in parentheses), ISO 16 times. The table above keeps both Portuguese
forms, each in its place; an ISO date in a running sentence is converted when
the page is next revised. Thousands with a point: 16 times, never a comma or
a space.

## 5. Patterns to remove

Each one below was either found on this site or is a classic of
AI-assisted Portuguese. The column "Here" is the count at `5a0209b` over the
27 blog pages (64,599 words), from the commands in the history file.

### 5.1 Found by a script

| Pattern | Example | Instead | Here |
|---|---|---|---|
| Filler connective | "Além disso, vale ressaltar que…", "Em suma," | start with what is worth noting | 5 |
| Inflated adjective | "crucial", "fundamental", "robusto", "poderoso", "revolucionário" | the measured fact, or nothing | 3 |
| Support verb | "realizar a implementação" | "implementar" | 0 |
| Vague attribution | "estudos mostram", "especialistas afirmam" | the source, by name, with its date | 0 |
| Calque from English | "endereçar um problema", "jogar um papel", "mergulhar fundo" | "resolver", "ter um papel", "detalhar" | 0 |
| Chatbot residue | "Espero que isso ajude", "Claro! Aqui está" | delete | 0 |

"Por isso" (33 times) is ordinary Portuguese and stays; the English side
treats its literal translation as a calque, not the Portuguese.

### 5.2 Found only by reading

| Pattern | Example from this site | Instead |
|---|---|---|
| Empty contrast "não é X, é Y" | "o problema nunca foi fazer o evento disparar: é fazê-lo disparar uma vez só" | keep it only when X is a belief the reader holds and the page shows evidence against it; otherwise state Y |
| Generalization about people | "a decisão que quase todo mundo erra" | what the evidence shows ("a configuração padrão conta duas vezes") |
| A list where the steps cause each other | three bullets for "A causa B, que causa C" | a paragraph: the causal words carry the argument |
| A triad by habit | "rápido, simples e eficiente" | the one adjective that is measured |
| A closing that repeats the opening | the last paragraph restating the first | end on the limit, the next step, or the source |
| A label before every paragraph | "**Resultado:** … **Por quê:** …" | sentences that say it |
| A hedge added to sound natural | "basicamente", "simplesmente", "na verdade" | delete; hedge only as much as the claim needs |
| A hedge removed to sound confident | "neste teste" dropped from a measured claim | keep it word for word (§6) |

## 6. Hedges and claims

The strength of a sentence is part of its content, not its style:

- A hedge stays word for word through any edit: "neste teste", "neste site",
  "na maioria", "quase nunca", "provavelmente".
- A mechanism is stated plainly; a measured number carries its method and
  date; a context-dependent fix is a condition ("se X, então Y").
- A style edit never turns "quase nunca" into "nunca", or "não encontrei"
  into "não existe".
- No number, quote, source or experience is added to make a passage
  stronger. A gap is a note for the author, not a sentence to fill.

## 7. Terms

- Keep an English term when it is what Brazilian developers say and write:
  deploy, build, cache, crawler, framework, header, script, `fetch`.
- Use the Portuguese word when it is the established one: rastrear,
  renderizar, indexar, requisição, cabeçalho (in running prose; the header's
  name stays as written).
- One word per concept within a page. A page that says "requisição" in one
  section and "request" in the next makes the reader wonder whether they are
  two things.
- Product and UI names exactly as the product shows them in Portuguese, in
  quotation marks when they are status strings ("Rastreada, mas não
  indexada"); the English UI name only where the Portuguese UI keeps it.

The site's own glossary (rodada, leitura, pedido…) is in `site.md`.

## 8. What not to change

A style pass edits the smallest span that fixes a pattern. It does not touch
code, inline code, link targets, numbers, dates, component tags, frontmatter
keys, or headings that other pages link to. A pattern that appears once in a
page, in a sentence that reads well, is not a reason to edit it.
