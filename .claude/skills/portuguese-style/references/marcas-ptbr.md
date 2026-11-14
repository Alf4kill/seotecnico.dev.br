# Patterns found on this site

Every "Before" below is a real line from a published page (shortened, with
its file and line at `631e4a3`). The "Proposed" column is a rewrite that
keeps every fact, number, hedge and link. The published pages are revised
in steps 6 and 7 of the proposal, and each row here is replaced by the
applied version when that happens, as `english-version/references/calques.md`
records its revision.

**Applied so far:** batch 1 of step 6 (2026-11-14) revised
`melhorar-lcp-nextjs`, `lcp-alto-next-js` and `json-ld-nextjs`. The examples
from those pages (the `filler`, `inflated`, `unit-space`, `register-colons`
and `register-dashes` rows, and the closing of `json-ld-nextjs`) are applied:
the rewrite in the page is close to "Proposed", and the line numbers refer to
the page before the batch. Two examples stay, waiting for the owner (rule 1):
the generalization "que quase ninguém explicita" (`melhorar-lcp-nextjs`
105) and the heading at `json-ld-nextjs` 277. Every other row is not
applied yet.

The `id` is the rule name in `check-portuguese.mjs`. Rows without an id need
a reader: no pattern separates them from correct Portuguese. Counts are
`check-portuguese.mjs --published --summary` over the 30 Portuguese pages
(27 blog, the pillar, 2 project entries), content at `631e4a3`, with the
scripts as of proposal step 4.

## Found by the script

| id | Before | Proposed | Hits |
|---|---|---|---|
| `filler` | "Vale notar que `Article` continua gerando rich result" (`json-ld-nextjs` 272) | "`Article` continua gerando rich result" | 7 |
| `filler` | "Além disso, uma saída de VPN usada por ele só foi identificada para setembro." (`detectar-crawlers-ia` 473) | "E uma saída de VPN usada por ele só foi identificada para setembro." | (same) |
| `inflated` | "O detalhe que a torna robusta é que as rotas testadas não são escritas à mão" (`json-ld-nextjs` 557) | "O que impede a suíte de esquecer uma página é que as rotas testadas não são escritas à mão" | 2 |
| `hedge-filler` | "`next/head` simplesmente não é suportado dentro de `app/`." (`metadata-api-nextjs` 49) | "`next/head` não é suportado dentro de `app/`." | 13 |
| `hedge-filler` | "o deslocamento de layout causado por imagem simplesmente não existe" (`next-image-seo` 62) | "o deslocamento de layout causado por imagem não existe" | (same) |
| `generalization` | "a decisão que quase todo mundo erra é ativá-lo no GTM **e** deixar o Enhanced Measurement do GA4 escutando os mesmos eventos" (`gtm-nextjs` 34) | "a configuração que conta cada pageview duas vezes é ativá-lo no GTM **e** deixar o Enhanced Measurement do GA4 escutando os mesmos eventos" | 5 |
| `empty-contrast` | "Não é omissão de interface, é impossibilidade conceitual — INP exige interação real de usuário real" (`guia/seo-tecnico-nextjs` 290) | "INP exige interação real de usuário real, e o lab não tem ninguém clicando." (Y, with its reason; X was never claimed) | 7 |
| `colon-chain` | "fazem a mesma coisa por caminhos diferentes: o `redirects()` do config é estático…; o middleware roda em **cada** request… A regra prática: **se a regra é conhecida no build…** … e é a que quase ninguém faz: esse problema pede mesmo um redirect…" (`redirects-canonicals-nextjs` 31) | "fazem a mesma coisa por caminhos diferentes. O `redirects()` do config é estático… O middleware roda em **cada** request… Por isso, **se a regra é conhecida no build, ela não tem o que fazer no middleware.**" | 7 |
| `date-form` | "O FAQ do Screaming Frog, consultado em 23/10/2026, descreve" (`screaming-frog-gratuito` 47) | "O FAQ do Screaming Frog, consultado em 23 de outubro de 2026, descreve" | 35 |
| `date-form` | "aparece no baseline de 2026-07-20 deste site" (`next-image-seo` 62) | "aparece no baseline de 20 de julho de 2026 deste site" | (same) |
| `unit-space` | "LCP de 4,9s — um render delay de 1.280ms" (`lcp-alto-next-js` 291), "cerca de 48KB" (356) | "LCP de 4,9 s, com render delay de 1.280 ms", "cerca de 48 KB" | 12 |
| `impersonal` | "Uma quinta causa, bloqueio no seu servidor ou na CDN, é possível, mas não foi observada aqui." (`ia-nao-consegue-acessar-site`, FAQ) | keep: "é possível" here states a possibility, not an impersonal instruction (see "What not to fix") | 1 |

## Register: found by the script, fixed by reading

These warnings are page rates against the native band
(`register-thresholds-pt.json`), not lines. The fix is a new sentence, never
a punctuation swap: a semicolon turned into a comma is still one sentence
doing two jobs.

| id | Pages past the band | Before | Proposed |
|---|---|---|---|
| `register-colons` | 27 of 30 | "O mecanismo dos dois fixes é o mesmo: tirar bloqueios do caminho até o primeiro paint do texto." (`lcp-alto-next-js` 312) | "Os dois fixes tiram bloqueios do caminho até o primeiro paint do texto." |
| `register-semicolons` | 23 of 30 | "A correção é o gatilho **History Change**; e a decisão que…" (`gtm-nextjs` 34) | two sentences: "A correção é o gatilho **History Change**. A configuração que…" |
| `register-dashes` | 14 of 30 | "CSS externo é render-blocking — o navegador não pinta até baixar e interpretar a folha de estilo —, então embutir o CSS crítico…" (`lcp-alto-next-js` 312) | "CSS externo é render-blocking (o navegador não pinta até baixar e interpretar a folha de estilo), então embutir o CSS crítico…" |
| `register-voce` | 24 of 30, below | impersonal frames and "o leitor" where the page gives an instruction | "você" where the reader acts ("Para saber se o seu já tem, o checador…" in `pre-registro-seo` is the model) |
| `register-list-items`, `register-bold-labels` | 1 and 3 of 30 | `auditoria-de-sitemap`: "**Caso.** … **O que contradiz.** … **Correção.** …" repeated for each finding (127–167) | judgment: a repeated case structure in a case study is a format the reader uses to compare cases. Keep it unless the labels open ordinary paragraphs too |

## Found only by reading

| Pattern | Before | Proposed |
|---|---|---|
| Empty contrast with a dash instead of a comma (the script needs ", é") | "Não é omissão da interface — é impossibilidade conceitual" (`inp-nextjs` 47) | as the `empty-contrast` row above |
| Generalization the script's verb list misses | "e é a que quase ninguém faz" (`redirects-canonicals-nextjs` 36, `guia` 142); "que quase ninguém explicita" (`melhorar-lcp-nextjs` 105); "é por isso que quase ninguém corrige" (`next-image-seo` 153) | on a draft: state what the evidence shows. On a published page, cutting it removes a claim, which is content (rule 1): report it as NOTA-REDACAO with the proposed cut, and apply it only when the owner accepts. The 2026-11-13 review of three July pages held back 12 such cuts (`docs/research/2026-11-13-early-pages-style-review.md`) |
| A closing that repeats the opening | "O que dados estruturados de fato entregam é mais modesto e mais real: eles tornam a página elegível aos rich results que ainda existem, descrevem a estrutura do conteúdo…" (`json-ld-nextjs` 623, restating the opening at 58–76); "É o caso que confirma a regra: o que importa…" (`json-ld-nextjs` 152, closing a paragraph that opened with the rule) | keep the one thing the closing adds ("Travados por teste, os dados estruturados permanecem corretos…"), or cut the closing |
| A colon that opens a sentence whose claim follows | "Agora o ponto que muda a forma de trabalhar: **não existe métrica de INP no Lighthouse.**" (`inp-nextjs` 47) | "**Não existe métrica de INP no Lighthouse**, e isso muda a forma de trabalhar." |
| A setup noun before the claim ("O detalhe…", "O mecanismo…", "A regra prática…") | "A regra prática: **se a regra é conhecida no build…**" (`redirects-canonicals-nextjs` 34) | the claim itself, with "por isso" if it follows from the sentence before |
| A label before a sentence that already says it | "Em texto, o que a figura mostra:" | keep: it marks the text mirror of a diagram (`CLAUDE.md` §9) |

No published instance was confirmed yet for two patterns of
`estilo-ptbr.md` §5.2: a triad by habit and a list where the steps cause
each other. They stay in the guide because they are frequent in
AI-assisted Portuguese. Add a row here when a revision finds one. (The
closing that repeats the opening was confirmed on 2026-11-13, row above.)

## What not to fix

- **A word used literally.** "o trabalho essencial acabou aqui"
  (`ssr-ssg-isr-nextjs` 66) means "the part that matters": it is not an
  inflated adjective. "é possível, mas não foi observada aqui" states a
  possibility: it is not an impersonal instruction.
- **"Além disso" inside a sentence, meaning "also".** "A licença custa £199
  por ano e libera, além disso, renderização de JavaScript"
  (`screaming-frog-gratuito` 47) reads fine. "também" is shorter; neither is
  wrong.
- **A contrast that refutes a belief with evidence.** "O que separa os três
  grupos não é o modelo de linguagem, é a ferramenta que busca a página"
  (`quais-ias-executam-javascript` 166): the page measured it, and the
  reader's likely belief is X. Keep.
- **"Ninguém" as a consequence of method, not a judgment of people.** "Sem o
  registro, daqui a três meses ninguém lembra o que mudou em qual semana"
  (`pre-registro-seo` 399); "Neste site, quase ninguém o lê: 9 leituras em
  57 dias" (`llms-txt-funciona` 12, measured). Both are the owner's voice
  (`voz.md`).
- **Headings.** "## `BreadcrumbList`: o schema que quase todo mundo
  esquece" (`json-ld-nextjs` 277) is a generalization, but a heading is an
  anchor other pages link to. Report it; change it only with the owner and
  with the links updated.
- **A colon that introduces one explanation, a list, a table or code.** The
  band allows about one colon in six sentences (p90 16.7 per 100). The
  warning is about the rate, not the colon.
- **Dates in source lists and parentheses.** "(consultada em 23/10/2026)"
  is the guide's form (`estilo-ptbr.md` §4). The `date-form` rule flags
  running sentences only; a hit inside a source line that the script took
  for prose is a script bug.
- **Adding "você" to reach the band.** Since 2026-11-14 the measure counts
  "você" and the imperative ("Escolha", "Teste o", "rode") together. A page
  can still sit below p10, and on this site most do: they use the imperative
  at about the native rate and "você" a tenth as often
  (`docs/research/2026-11-14-imperative-reader-address.md`). Change a frame
  only where the reader acts. Adding "você" to sentences that did not need
  it, to reach the number, is writing for the metric (found by the
  `revise-july-page` eval on `redirects-canonicals-nextjs`, 0.2 after the
  pass, under the old measure).
