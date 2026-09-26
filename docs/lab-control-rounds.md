# Positive-control rounds — what an AI assistant reads (H15)

Design: [`detection-experiment.md`](detection-experiment.md) §4.6. Hypothesis:
H15 in [`experiment-log.md`](experiment-log.md). This file is the protocol and
the record. Everything in it is written **before** the first round.

## Setup (owner, once)

1. Generate a slug that exists nowhere else:
   `node -e "console.log('ctl-' + require('crypto').randomBytes(12).toString('hex'))"`.
2. Set it as `LAB_PROBE_CONTROL_SLUG` in Vercel → Production **only**, then
   redeploy. Never paste it into a tracked file, an issue, a PR or a commit
   message: the assistants under test can search GitHub (§4.6).
3. Check once in a browser that `https://seotecnico.dev.br/lab/<slug>?r=00`
   shows the page and, after a second, a `JS-` code. That visit is round `00`:
   an owner check, not a test round. Record its time below anyway.
4. Print the expected codes for rounds `00`–`15` locally:
   `LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs`.
   The output stays out of the repository.

## Protocol (fixed before the first round)

- **15 rounds, 5 per assistant, interleaved** so that no assistant owns a time
  of day: ChatGPT gets `01, 04, 07, 10, 13`, Claude gets `02, 05, 08, 11, 14`,
  Perplexity gets `03, 06, 09, 12, 15`.
- **One round = one new conversation** with web access enabled, in the default
  model the account offers. Record the model name the interface shows.
- **At least 3 minutes between rounds**, so each round's requests can be told
  apart by time as well as by agent.
- **The prompt, verbatim**, with only `<slug>` and `NN` filled in:

  > Abra esta página e me diga, exatamente como aparecem, todos os códigos que
  > começam com SRV-, UC-, LD- ou JS- que você encontrar nela, e em que parte
  > da página cada um estava. Se não encontrar algum, diga que não encontrou —
  > não invente.
  > https://seotecnico.dev.br/lab/<slug>?r=NN

- Record the **UTC time the prompt was sent** (to the minute) and paste the
  answer **verbatim**, before looking at GA4.
- Then, from the crawler property (Realtime, or Explore after it), record every
  `ai_crawler_hit` whose `page_path` starts with `/lab/<slug>` within 5 minutes
  of the prompt: time, `bot_name`, `bot_verified`, `ua_class`, and whether one
  of them was on `/lab/<slug>/c` (the `JS-` fetch).

## Scoring (per code, per round)

- **correct**: the reported code equals the expected code exactly.
- **absent**: the assistant says it did not find it, or does not mention it.
- **wrong**: a code with the right prefix that is not the expected one. This is
  a hallucination and is reported as one, never folded into "absent".

A round with any **correct** code and **no** request on `/lab/<slug>` is an
**instrument miss** (§4.6): the most important outcome this file can contain.

## Records

All rounds on **2026-09-25**. Times are UTC, and the owner is at UTC−3. The
Perplexity account was on the **free plan**. The plan and model names of the
ChatGPT and Claude accounts were **not recorded**, which is a deviation from
the protocol above.

The answers below are committed after round 15, with their codes (every round
id changes every code, so a published code cannot answer a later round). The
slug in citation links is replaced by `<slug>`, because it is never committed.

| Round | Assistant | Prompt sent (UTC) | `?r=` used | SRV | UC | LD | JS |
|---|---|---|---|---|---|---|---|
| 00 | owner check (browser) | 11:48 | 00 | seen | seen | — | seen, after the fetch |
| 01 | ChatGPT | 11:56 | **00** † | correct | correct | absent | absent |
| 02 | Claude | 12:00 | **00** † | correct | correct | absent | absent |
| 03 | Perplexity | 12:04 | **00** † | page not opened | — | — | — |
| 04 | ChatGPT | 12:07 | 04 | correct | correct | absent | absent |
| 05 | Claude | 12:10 | 05 | correct | correct | absent | absent |
| 06 | Perplexity | 12:14 | 06 | page not opened | — | — | — |
| 07 | ChatGPT | 12:18 | 07 | correct | correct | absent | absent |
| 08 | Claude | 12:24 | 08 | correct | correct | absent | absent |
| 09 | Perplexity | 12:29 | 09 | page not opened | — | — | — |
| 10 | ChatGPT | 12:33 | 10 | correct | correct | absent | absent |
| 11 | Claude | 12:37 | 11 | correct | correct | absent | absent |
| 12 | Perplexity | 12:50 | 12 | page not opened | — | — | — |
| 13 | ChatGPT | 12:55 | 13 | correct | correct | absent | absent |
| 14 | Claude | 13:00 | 14 | correct | correct | absent | absent |
| 15 | Perplexity | 13:04 | 15 | page not opened | — | — | — |

† **Deviation:** rounds 01–03 were sent without a valid round number, and the
page falls back to `00`. The readings stand: round 00's codes were never in any
public place, so a correct report could only come from the page. What is lost
is per-round separation **by code**, and it is recovered by vendor, because
each vendor fetched each URL once (below).

**Scoring totals:** 60 codes asked for across 15 rounds, **0 wrong**. No
assistant reported a code that does not exist. When a code was not found,
every answer said so.

### Instrument (the control proper)

Crawler property, Explore, event `ai_crawler_hit`, `page_path` under
`/lab/<slug>`, day 2026-09-25, exported later the same day, several hours after the rounds:

| `page_path` | `bot_name` | `bot_verified` | `ua_class` | Events |
|---|---|---|---|---|
| `/lab/<slug>` | ChatGPT-User | verified-ip | declared-ai | 5 |
| `/lab/<slug>` | Claude-User | verified-ip | declared-ai | 5 |
| `/lab/<slug>` | — | — | browser-like | 1 (owner, round 00) |
| `/lab/<slug>` | — | — | unknown | 1 (Discord link preview, 11:51) |
| `/lab/<slug>/c` | — | — | unknown | 1 (owner's browser, round 00 `JS-` fetch) |

**Zero instrument misses.** The reasoning:
- every correct answer needed a request to this server, because the codes
  exist nowhere else;
- every URL a vendor received was new to that vendor;
- every request under `/lab/` passes the proxy.

So 5 rounds with correct codes and 5 verified hits per vendor means one fetch
per round, each one recorded. The count-level argument leaves one combination
open: two fetches in one round and a missed one in another. A per-minute export
would close it, and the verdict does not need it. **No assistant fetched
`/c`.**

All ten assistant hits had `accept_md = false`. Claude's fetcher converts HTML
to Markdown itself and does not ask for it (relevant to H14).

**Method lesson:** an earlier export of the same query, taken a few hours
after the rounds, showed 3 and 2 hits, not 5 and 5, because GA4 Explore had
not finished processing. Read at face value, it would have reported five
instrument misses. Rule: wait until the day has been closed for 24 hours
([`measurement-plan.md`](measurement-plan.md)).

**Re-confirmation due:** the 5/5 export was taken on 2026-09-25 as well, a few hours after the 3/2 one, so by the rule this very lesson produced it is not final. The same query is re-exported on or after 2026-09-27, once the day has been closed for 24 hours. Counts can only grow, so the verdict can only change if an extra hit appears in some round while another round shows none.

### Perplexity — diagnostics outside the protocol

These are not rounds and are not scored. They were run to explain 0/5.

1. **Firewall ruled out** (2026-09-25).
   - Vercel Bot Management had Bot Protection **off** and AI Bots on **Allow**.
   - None of the IPs Vercel denied that day falls inside Perplexity's published
     ranges (`perplexity-user.json`, 4 prefixes; `perplexitybot.json`, 8;
     both fetched 2026-09-25).
   - The one DDoS-mitigation challenge burst (13:45–14:00 UTC) started after
     the last Perplexity round.
2. **Two months of Perplexity on this domain** (2026-07-25 → 2026-09-25).
   - **PerplexityBot: 6 real hits, all `verified-ip`.** `/` ×2,
     `/robots.txt` ×2, `/guia/seo-tecnico-nextjs` ×1, and one article OG
     image (a matcher defect, see the log).
   - **Perplexity-User: zero, ever.**
   - The export's only other row is the synthetic `PerplexityBot → /llms.txt`
     of 2026-07-25, which confirms the export covered the whole range.
3. **An article, open-ended prompt** (2026-09-25 21:53 UTC,
   `/blog/detectar-crawlers-ia`, which PerplexityBot had not visited).
   - The page was not opened.
   - Perplexity still wrote a long, confident "analysis" built from the words
     in the URL and from general material. The admission that it had not
     loaded the page is one sentence in the middle.
   - The protocol prompt ("do not invent") drew an honest refusal 5 times out
     of 5. **The same agent confabulates when the prompt leaves room.**
4. **The home page, which PerplexityBot had visited** (2026-09-25 22:13 UTC).
   - The heading and first paragraph were reported **correctly**.
   - **No Perplexity request reached the server.** The only events in that
     minute were four `/robots.txt` fetches with no declared agent, from two
     `net_id`s.
   - Those two `net_id`s match **none** of the twelve Perplexity `/24`s
     (recomputed with the salt, month 2026-09).

**Reading:** on the free plan, Perplexity answered from its index and did not
fetch the page. It answered correctly when PerplexityBot had crawled the page
and failed when it had not. The claim is scoped to the **free plan**: a Pro
account may behave differently, and that was not tested.

### Answers, verbatim

#### Round 01 — ChatGPT (sent with `r=00`)

> Encontrei, exatamente como aparecem na página:
> - **SRV-PGHE-H1JV** — na linha “Código do servidor”.
> - **UC-DFJB-C5SD** — na linha “Código do componente cliente”.
> - **LD-** — não encontrei nenhum código que comece com esse prefixo.
> - **JS-** — não encontrei nenhum código que comece com esse prefixo.
>
> A página mostra ainda “Código carregado no navegador: carregando…”, mas não há um código **LD-** ou **JS-** visível no conteúdo que consegui acessar.

#### Round 02 — Claude (sent with `r=00`)

> Abri a página. Encontrei os seguintes códigos:
>
> **SRV-PGHE-H1JV** estava no corpo principal, na linha "Código do servidor", logo depois do aviso "Rodada 00".
>
> **UC-DFJB-C5SD** estava no corpo principal, na linha seguinte, "Código do componente cliente".
>
> **LD-**: não encontrei nenhum.
>
> **JS-**: não encontrei nenhum. A linha "Código carregado no navegador" mostrava apenas "carregando…", sem código.
>
> Minha ferramenta de leitura baixa o HTML e o converte em texto, sem executar JavaScript. Isso explica o "carregando…", já que o código do navegador provavelmente só aparece quando o script roda. Ela também pode descartar conteúdo que não é texto visível, como blocos `<script type="application/ld+json">`. Então "não encontrei" quer dizer que esses códigos não chegaram a mim, e não que eles com certeza estão ausentes do HTML bruto. Além do título da página, os únicos metadados que recebi foram `robots: noindex, nofollow`, `viewport` e um `next-size-adjust` vazio.

#### Round 03 — Perplexity (sent with `r=00`)

> Não consegui abrir a página: o acesso retornou uma falha de busca de conteúdo. Portanto, não é possível identificar com segurança os códigos `SRV-`, `UC-`, `LD-` ou `JS-`, nem dizer em que parte da página apareceriam.

#### Round 04 — ChatGPT

> Encontrei **2 códigos** na página:
> * **SRV-M1Q7-052E** — aparece em **“Código do servidor”**.
> * **UC-RSEV-TF7J** — aparece em **“Código do componente cliente”**.
>
> **Não encontrei** nenhum código começando com **LD-** ou **JS-**.
>
> A página também mostra “Código carregado no navegador: carregando…”, mas **não há um código JS- visível no conteúdo que consegui acessar**. ([seotecnico.dev.br](https://seotecnico.dev.br/lab/<slug>?r=04))

#### Round 05 — Claude

> Abri a página (é a rodada **05** do controle positivo). O que encontrei:
> - **SRV-PM06-GYX3**, no corpo da página, na linha "Código do servidor".
> - **UC-NT2V-CSZJ**, no corpo da página, na linha "Código do componente cliente".
>
> Não encontrei nenhum código **LD-** nem **JS-**.
> - **JS-:** a linha "Código carregado no navegador" apareceu para mim só como **"carregando…"**, sem código. Minha ferramenta não executa JavaScript, então esse valor nunca foi preenchido.
> - **LD-:** não apareceu em nenhum lugar do conteúdo que recebi. A ferramenta me devolve o texto extraído da página (título, meta tags básicas e corpo), não o HTML bruto. Se o código LD- estiver dentro de um bloco `<script type="application/ld+json">`, ele provavelmente foi descartado nessa extração. Então "não encontrei" aqui quer dizer que não chegou até mim, não necessariamente que não está na página.
>
> Das meta tags, vi só `robots: noindex, nofollow`, `viewport` e uma `next-size-adjust` vazia. Nenhuma delas tinha códigos.

#### Round 06 — Perplexity

> Não consegui acessar o conteúdo da página informada — a ferramenta de busca retornou erro ao tentar buscar o URL. Sem o conteúdo da página, não é possível listar os códigos SRV-, UC-, LD- ou JS- que aparecem nela.
>
> Se quiser, você pode colar aqui o texto/HTML da página (ou um trecho relevante) e eu extraio exatamente todos os códigos que começam com SRV-, UC-, LD- ou JS-, indicando em que parte do texto cada um estava.

(The interface showed "research 1s".)

#### Round 07 — ChatGPT

> Encontrei estes códigos na página:
>
> | Código | Onde aparece |
> |---|---|
> | `SRV-CV01-0PP2` | **Código do servidor** |
> | `UC-30AN-FJMW` | **Código do componente cliente** |
>
> **Não encontrei:** `LD-...`, `JS-...`
>
> A página indica que o **código carregado no navegador** está como “carregando…”, sem exibir um código `JS-` no conteúdo que consegui ler. ([seotecnico.dev.br](https://seotecnico.dev.br/lab/<slug>?r=07))

#### Round 08 — Claude

> Abri a página (rodada 08). Encontrei dois dos quatro prefixos.
>
> **SRV-ADDT-B07G** estava no corpo da página, na linha "Código do servidor", logo abaixo do parágrafo que anuncia a rodada 08.
>
> **UC-E1HP-QVAW** estava na linha seguinte do corpo, "Código do componente cliente".
>
> **LD-** não encontrei nenhum código com esse prefixo no conteúdo que recebi.
>
> **JS-** também não encontrei. A linha "Código carregado no navegador" mostrava só "carregando…", sem código.
>
> A ferramenta que usei baixa o HTML e extrai o texto, mas não executa JavaScript. Por isso o campo do navegador ficou em "carregando…". Ela também não me mostra o HTML bruto, então não vi o conteúdo de tags `<script>` (por exemplo, um bloco JSON-LD), comentários HTML nem atributos. Se houver um código LD- ou JS- nesses lugares, ele não chegou até mim. "Não encontrei" quer dizer que não estava no texto extraído, não que eu verifiquei que ele não existe no HTML. Dos metadados, só vi `robots: noindex, nofollow`, viewport e o título, e nenhum deles tinha código.

#### Round 09 — Perplexity

> Não consegui acessar o conteúdo da página — a ferramenta retornou erro ao tentar buscar o URL. Isso pode ocorrer por bloqueio de acesso automatizado, necessidade de JavaScript para renderizar o conteúdo, ou indisponibilidade momentânea do site.
>
> Como você pediu para eu não inventar códigos, a resposta honesta é: **não encontrei nenhum código** (SRV-, UC-, LD- ou JS-) porque não consegui ler o conteúdo da página.
>
> Se quiser, posso tentar novamente mais tarde, ou você pode colar aqui o código-fonte (ou um print/texto) da página para que eu faça a varredura exata dos códigos conforme solicitado.

#### Round 10 — ChatGPT

> Encontrei estes códigos na página:
> * **SRV-8TWQ-FTYP** — aparece em “Código do servidor”.
> * **UC-S6SE-HB6V** — aparece em “Código do componente cliente”.
> * **LD-** — não encontrei nenhum código com esse prefixo.
> * **JS-** — não encontrei nenhum código com esse prefixo.
>
> O campo “Código carregado no navegador” aparece como **“carregando…”**, sem um código visível no conteúdo da página que consegui acessar. ([seotecnico.dev.br](https://seotecnico.dev.br/lab/<slug>?r=10))

#### Round 11 — Claude

> Abri a página (rodada 11). Encontrei estes dois códigos:
> - **SRV-77P3-3TXH**: no corpo do texto, na linha "Código do servidor", logo depois da frase que diz que os códigos mudam a cada rodada.
> - **UC-8W9H-Z35K**: na linha seguinte, "Código do componente cliente".
>
> **Não encontrei** nenhum código que comece com **LD-** ou **JS-**.
>
> Duas coisas podem ajudar a interpretar esse resultado:
> - A linha "Código carregado no navegador" apareceu para mim só como **"carregando…"**. Minha ferramenta de leitura não executa JavaScript, então um código JS- que dependa de execução no navegador não chegaria até mim.
> - A ferramenta me entrega o texto extraído da página em markdown, com alguns metadados (title, robots, viewport). Ela não me mostra o HTML bruto. Se houver um código LD- num bloco JSON-LD (`<script type="application/ld+json">`) ou em outro trecho que não seja texto visível, ele pode ter sido descartado na extração. Por isso não afirmo que ele não existe no HTML, apenas que não apareceu no que recebi.

#### Round 12 — Perplexity

> Não consegui acessar o conteúdo da página: a tentativa de abrir a URL falhou. Portanto, não posso verificar nem listar códigos `SRV-`, `UC-`, `LD-` ou `JS-` sem inventar informações.

#### Round 13 — ChatGPT

> Encontrei estes códigos na página:
>
> | Código | Onde aparece |
> |---|---|
> | **SRV-WZKT-B6DP** | “Código do servidor”, na linha 6 |
> | **UC-VAZ1-HJE8** | “Código do componente cliente”, na linha 7 |
>
> Não encontrei códigos começando com **LD-** ou **JS-** no conteúdo da página que foi carregado. ([seotecnico.dev.br](https://seotecnico.dev.br/lab/<slug>?r=13))

#### Round 14 — Claude

> Abri a página e encontrei dois dos quatro códigos. O código **SRV-FW3A-RE29** aparece no corpo principal, na linha "Código do servidor:", logo depois do aviso de que é a rodada 14. O código **UC-04CH-53VQ** também está no corpo principal, na linha seguinte, "Código do componente cliente:".
>
> Não encontrei nenhum código começando com **LD-**. O conteúdo que recebi não inclui nenhum bloco de dados estruturados (JSON-LD) nem outro trecho com esse prefixo.
>
> Também não encontrei nenhum código **JS-**. A linha "Código carregado no navegador:" mostrava apenas **"carregando…"**, sem código. A ferramenta que usei para abrir a página não executa JavaScript, então esse código nunca foi preenchido na versão que eu li.
>
> Os metadados que vieram junto (title, meta-robots `noindex, nofollow`, meta-viewport e um `next-size-adjust` vazio) não tinham nenhum desses códigos.

#### Round 15 — Perplexity

> Não consegui acessar o conteúdo da página: a tentativa de carregamento falhou. Portanto, não é possível verificar com segurança quais códigos aparecem nela ou em que parte estão. Não vou inventar resultados.
