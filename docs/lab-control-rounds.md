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

**Re-confirmed on 2026-09-27.** The 5/5 export above was also taken on 2026-09-25, a few hours after the 3/2 one, so by the rule this very lesson produced it was not final. The same query, re-exported on 2026-09-27 with the day closed for more than 24 hours, returns exactly the same five rows and 13 events: ChatGPT-User 5, Claude-User 5 (all `verified-ip`), the owner's page view, the Discord preview and the owner's `/c` fetch. The verdict stands.

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

---

# Round 2 — Gemini, DeepSeek, Grok (H16)

Design: [`detection-experiment.md`](detection-experiment.md) §4.7.
Hypothesis: H16 in [`experiment-log.md`](experiment-log.md). Written on
2026-09-27, before the instrument change ships and before any round.

What changes from round 1, and why:

- **Each assistant gets its own secret URL**, derived from the slug. For an
  agent that does not declare itself, the URL is the only identity it cannot
  choose. A hit on the Grok probe can only come from something that received
  the Grok URL.
- **The probe pages record the request's shape** (`lab_*` parameters in
  [`measurement-plan.md`](measurement-plan.md)): the raw user agent, `Accept`,
  `Accept-Language`, the country, and which published IP feed the address
  falls in, whatever the user agent claims.
- **Model and plan are recorded per round.** Round 1 missed this.

## Setup (owner, once, in this order)

1. **Rotate the slug.** The round-1 slug was sent to three vendors and pasted
   into Discord. The probe URLs are secret only while the slug is, since
   anyone who knows it can compute them from the public algorithm. Generate a
   new one with the command in round 1's setup, set it as
   `LAB_PROBE_CONTROL_SLUG` in Vercel → Production, and record the date below.
   The round-1 URL then returns 404. Its GA4 data is unaffected, so the H15
   re-export still works.
2. **Register the nine `lab_*` custom dimensions** in the crawler property
   (Admin → Custom definitions, event scope): `lab_probe`, `lab_round`,
   `lab_endpoint`, `lab_ua_1`, `lab_ua_2`, `lab_accept`, `lab_accept_lang`,
   `lab_ip_owner`, `lab_country`. **Before** the deploy: registration is not
   retroactive.
3. **Merge and deploy** the instrument PR, then redeploy once so the new slug
   is live (or set the slug before the merge, and the merge's deploy covers
   both).
4. **Print the URLs and codes** locally. The output stays out of the
   repository:
   `LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs --probes`.
5. **Pre-flight on the `owner` probe only.** Open the owner URL with `?r=00`
   in a browser, wait for the `JS-` code, then check Realtime for two hits
   with `lab_probe = owner` (`page` and `js`) carrying `lab_ua_1` and
   `lab_ip_owner`. **Never open a vendor URL in a browser, and never paste it
   anywhere but the assistant's prompt box.** Round 1's Discord preview is the
   reason.

## Protocol (fixed before the first round)

- **15 rounds, numbered 16–30, 5 per assistant, interleaved:** Gemini gets
  `16, 19, 22, 25, 28`, DeepSeek gets `17, 20, 23, 26, 29`, Grok gets
  `18, 21, 24, 27, 30`. Each assistant always receives **its own** probe URL,
  with the round number in `?r=`.
- **Where:** Gemini at gemini.google.com; DeepSeek at chat.deepseek.com with
  **Search** on and DeepThink off; Grok at grok.com (not inside the X app).
  One round = one new conversation, default model.
- **Record per round:** the plan (free or paid) and the model name the
  interface shows.
- **At least 3 minutes between rounds.**
- **The prompt, verbatim**, identical to round 1, with only the URL filled in:

  > Abra esta página e me diga, exatamente como aparecem, todos os códigos que
  > começam com SRV-, UC-, LD- ou JS- que você encontrar nela, e em que parte
  > da página cada um estava. Se não encontrar algum, diga que não encontrou —
  > não invente.
  > https://seotecnico.dev.br/lab/<probe>?r=NN

- **No retries, no follow-ups inside a round.** A refusal or a failure is the
  round's result. Diagnostics, if any, run only after round 30, with round
  numbers from 31 up, and are recorded as diagnostics, not rounds.
- Record the **UTC time the prompt was sent** (to the minute) and paste the
  answer **verbatim**, before looking at GA4.

Scoring is round 1's: **correct**, **absent** or **wrong** per code. A correct
code with no hit on that assistant's probe is an **instrument miss**.

## Export (on or after the second day after the rounds)

Explore → free form, event `ai_crawler_hit`, filter `lab_probe` matching
`gemini|deepseek|grok|owner`, metric **Event count**, the round day as the
range, **Show rows = 500**. GA4 takes five row dimensions per table.

**Revised 2026-09-27, after the rounds and before any export existed.** The
first version joined four tables on (`lab_probe`, `lab_round`). That key is
ambiguous when a round has several hits (Realtime showed 11 on the Grok probe
in one round): it cannot say whether a user agent and an IP feed came from the
same request. Each question below is now answered inside one table, and
`lab_ua_1` anchors the two tables that have no round.

| Table | Rows | Answers |
|---|---|---|
| 1 Instrument | `lab_probe`, `lab_round`, `lab_endpoint`, `bot_name`, `bot_verified` | A hit behind every correct code; any declared agent |
| 2 Identity | `lab_probe`, `lab_round`, `lab_ua_1`, `lab_ua_2`, `lab_ip_owner` | G2, G3, X2: token and published range in the same hit |
| 3 JavaScript | `lab_probe`, `lab_round`, `lab_endpoint`, `lab_ua_1`, `lab_ip_owner` | Which fetcher requested `/c` |
| 4 Browser shape | `lab_probe`, `lab_ua_1`, `has_sec_fetch`, `lab_accept_lang`, `lab_endpoint` | X3: a browser user agent without browser headers |
| 5 Accept, country | `lab_probe`, `lab_ua_1`, `lab_accept`, `lab_country`, `lab_endpoint` | Request shape and origin per fetcher |
| 6 Timing | `lab_probe`, `lab_round`, `lab_endpoint`, `Date + hour (YYYYMMDDHH)`, `ua_class` | Hits per round, unexplained revisits |

**Revised again 2026-09-28:** Explore offers no minute dimension (minutes exist
only in the BigQuery export and the Data API), so table 6 uses the hour. The
property's time zone is UTC−5, so hour 14 is 19:00–19:59 UTC. No H16
prediction needs the minute: rounds are joined by `lab_round`, which a late
fetch or a revisit also carries. What is lost is the delay of each fetch after
its prompt, reported as a limitation.

**From the `lab_hit` deploy on (diagnostics, round 31 up),** every table adds
`lab_hit` as its first dimension. It is unique per request and carries the
UTC time to the second, so the tables join row by row and the delay after the
prompt becomes measurable.

No table uses `page_path`, so no export contains a slug. The CSVs still stay
out of the repository; this file gets the summary.

### Analysis measures, fixed before the final export (2026-09-28)

Written after the owner's same-day preview export of 2026-09-27 (not a
result: it was missing hits Realtime had shown) and before the final one.
They add measures; no registered prediction in the H16 row changes.

1. **"Ran JavaScript" and "delivered the `JS-` code" are two measures.** H15
   never separated them because they never disagreed. Here they can:
   - *ran JavaScript* = at least one hit with `lab_endpoint = js` in the
     round. Observed by the server, independent of the answer.
   - *delivered* = the answer reports the correct `JS-` code.

   P2 as registered ("`JS-` never reported and `/c` never fetched") is scored
   on both, and each is reported separately.
2. **Fetchers are grouped into families** by `lab_ua_1`: browser or client
   name, engine and operating system (for example "Chrome on macOS",
   "HeadlessChrome on Linux", "bare `Google`"). Per assistant and round: hits
   per family, which families request `/c`, and the countries per family.
   The `JS-` code is attributed to the family that requested `/c`.
3. **G2 depends on diagnostic A.** `lab_ip_owner = none` falsifies G2 only if
   the field is shown to return a positive label in production: one
   ChatGPT request to the `h15` probe must read `openai-chatgpt-user`. If it
   does not, G2 is reported as **not tested**, and `lab_ip_owner` is
   withdrawn from every H16 verdict.

## Records

All rounds on **2026-09-27**. Times are UTC; the owner is at UTC−3. All
three accounts were on the **free plan**. The model labels are what each
interface showed, the same in all five rounds of each assistant: Gemini 3
Flash; DeepSeek with **Search** on (DeepThink off); Grok "Fast".

- **Slug rotated** before the merge of PR #73 (2026-09-27T18:31:20Z); the exact
  time was not recorded.
- **Instrument deploy:** 2026-09-27T18:32:10Z (merge commit `bb13195`).
- **Owner pre-flight:** about 19:20, roughly 30 minutes before round 16, read
  off Realtime. The page showed `SRV-`, `UC-` and, after the fetch, `JS-`.
  Realtime showed the two expected hits (`lab_probe = owner`, `page` and
  `js`) with `lab_ua_1` and `lab_ip_owner` filled.

| Round | Assistant | Plan / model | Prompt sent (UTC) | SRV | UC | LD | JS |
|---|---|---|---|---|---|---|---|
| 16 | Gemini | free / Gemini 3 Flash | 19:49 | correct | correct | absent | absent |
| 17 | DeepSeek | free / "Search" mode | 19:53 ‡ | correct | correct | absent | **correct** |
| 18 | Grok | free / "Fast" | 19:58 | correct | correct | absent | **correct** |
| 19 | Gemini | free / Gemini 3 Flash | 20:05 | correct | correct | absent | absent |
| 20 | DeepSeek | free / "Search" mode | 20:09 | correct | correct | absent | **correct** |
| 21 | Grok | free / "Fast" | 20:15 | correct | correct | **correct** | **correct** |
| 22 | Gemini | free / Gemini 3 Flash | 20:20 | correct | correct | absent | absent |
| 23 | DeepSeek | free / "Search" mode | 20:24 | correct | correct | absent | absent |
| 24 | Grok | free / "Fast" | 20:29 | correct | correct | **correct** | **correct** |
| 25 | Gemini | free / Gemini 3 Flash | 20:39 | correct | correct | absent | absent |
| 26 | DeepSeek | free / "Search" mode | 20:44 | correct | correct | absent | absent |
| 27 | Grok | free / "Fast" | 20:49 | correct | correct | absent | **correct** |
| 28 | Gemini | free / Gemini 3 Flash | 20:56 | correct | correct | absent | absent |
| 29 | DeepSeek | free / "Search" mode | 21:00 | correct | correct | absent | **correct** |
| 30 | Grok | free / "Fast" | 21:05 | correct | correct | absent | **correct** |

‡ The owner's note read "6:53"; the owner confirmed 16:53 local (19:53 UTC).

**Scoring totals:** 60 codes asked for across 15 rounds, **0 wrong**.

| Assistant | SRV | UC | LD | JS |
|---|---|---|---|---|
| Gemini | 5/5 | 5/5 | 0/5 | 0/5 |
| DeepSeek | 5/5 | 5/5 | 0/5 | 3/5 (rounds 17, 20, 29) |
| Grok | 5/5 | 5/5 | 2/5 (rounds 21, 24) | 5/5 |

One-sided 95% exact bounds: 5/5 → ≥ 55%; 0/5 → ≤ 45%; 3/5 → 19%–92%;
2/5 → 8%–81%. Five rounds say which behaviours exist, not how often they
happen.

### Instrument — preliminary, from Realtime

Realtime during rounds 16–18 showed 2 hits with `lab_endpoint = js` against 2
correct `JS-` codes, one `lab_ua_1` equal to `Google` and nothing else, and 11
hits on the Grok probe for its first round, with Chrome-on-Mac,
Safari-on-Mac and Chrome-on-Linux user agents. These are not results.
Realtime cannot join a hit to its round or probe, and the verdicts wait for
the export below, taken on or after 2026-09-29.

### Instrument — final export (2026-09-30)

The six tables above, range 2026-09-27 to 2026-09-28 (property days, UTC−5),
filter `lab_probe` matching `gemini|deepseek|grok|owner`, taken on 2026-09-30
with both days closed for more than 24 hours. **75 events**: the 73 of the
preview of 2026-09-28 (71 vendor hits and the owner's round 00), identical row
for row, plus the owner's `lab_hit` pre-flight (round 01, two events, on
the evening of 2026-09-28 in the property's time zone). Nothing arrived late.

| Probe | Round | `page` | `js` (`/c`) | Hour (UTC−5) |
|---|---|---|---|---|
| gemini | 16, 19, 22, 25, 28 | 1 each | 0 | the prompt's hour |
| deepseek | 17, 20, 23, 26, 29 | 1 each | 1 each | the prompt's hour |
| grok | 18 / 21 / 24 / 27 / 30 | 10 / 9 / 11 / 10 / 10 | 1 / 1 / 2 / 1 / 1 | the prompt's hour |
| owner | 00, 01 | 1 each | 1 each | not a round |

**Zero instrument misses.** Every round has hits on its own probe and round,
and every correct `JS-` has a `/c` request behind it in the same round. Every
hit fell in the hour its prompt was sent, and no probe was requested again
through the end of 2026-09-28, about 32 hours after round 30. `bot_name` and
`bot_verified` are `(not set)` on all 71 vendor hits: no request declared a
registered agent.

### Fetchers by family (analysis measure 2)

Families by `lab_ua_1`, with the headers and countries of the same hits. All
71 vendor hits have `lab_ip_owner = none`.

| Assistant | Family | Hits | `/c` | `Sec-Fetch-*` | `Accept` (page) | `Accept-Language` | Country |
|---|---|---|---|---|---|---|---|
| Gemini | bare `Google` | 5 (1 per round) | 0 | no | `*/*` | `(none)` | US |
| DeepSeek | Firefox 149, Linux | 10 (1 page + 1 `/c` per round) | 5 | yes | Firefox's navigation `Accept` | `zh-CN,zh;q=0.9` | HK |
| Grok | Chrome 142/143 and Safari 26, macOS | 44 (9, 8, 9, 9, 9) | 0 | yes | each browser's own navigation `Accept` | `en-US,en;q=0.9` | 11 countries: US 20, BR 8, PL 4, CA 3, AR 2, PT 2, CL, GB, NL, RU, UA 1 each |
| Grok | `HeadlessChrome/148`, Linux | 10 (1 page + 1 `/c` per round) | 5 | yes | Chrome's navigation `Accept` | `en-US,en;q=0.9` | US |
| Grok | Chrome 152, Windows | 2 (round 24 only) | 1 | yes | Chrome's navigation `Accept` | `en-US,en;q=0.9` | US |

Every `/c` request carried `Accept: */*`, the default of a script's
`fetch()`.

- **No hit from any of the three has §2.2's spoofed-browser signature.** Every
  browser user agent came with `Sec-Fetch-*` and `Accept-Language`, and the
  Safari user agents with Safari's `Accept`, not Chrome's.
- **Grok's `JS-` code is attributed to `HeadlessChrome`**, the only family that
  requested `/c` in every round. In round 24 the Windows Chrome also requested
  it, and that round's attribution is ambiguous between the two. The macOS
  family never ran the page's JavaScript.
- **Grok's two `LD-` codes (rounds 21 and 24)** cannot be attributed to a
  family: round 21 had no extra fetcher, and every family requested the page
  in both rounds.
- **DeepSeek ran JavaScript in 5/5 rounds and delivered `JS-` in 3/5** (17, 20,
  29). In rounds 23 and 26 the `/c` request reached the server, and the answer
  still read "carregando…". The text that reached the model was taken before
  the value arrived. How long after the page each `/c` came is not measurable
  here: these rounds predate `lab_hit`, and Explore stops at the hour.

### Diagnostic A — does `lab_ip_owner` ever return a label? (2026-09-30)

Required by analysis measure 3 before any `none` could count against G2. Not
a round and not scored.

- **Sent:** ChatGPT, free plan, 2026-09-30 about 13:43 UTC, the round-1 prompt
  with `?r=31`.
- **Hit:** one request, `lab_hit` `2026-09-30T13:43:18Z-6CE6`, `lab_ip_owner` =
  **`openai-chatgpt-user`** (read off Realtime).

The field returns a positive label in production, so the 71 `none` values of
H16 are readings, not a defect.

**Deviation: the wrong probe.** The protocol named the `h15` probe. The URL
sent was the **Grok** probe (Realtime: `lab_probe = grok`). The test is not
affected, because `lab_ip_owner` depends on the request's address and not on
the path. The Grok probe is:

- **H16:** unaffected, since all 56 of its H16 hits precede this one.
- **Revisit check:** from 2026-09-30T13:43:18Z the Grok URL is also known to
  OpenAI. The later revisit check excludes this hit, and any later request on
  the Grok probe from an OpenAI agent is reported against this exposure, not as
  a revisit by xAI.
- **H17:** Grok needs a probe no other vendor has received. It moves to a new
  derived probe before round 40, in the same PR as diagnostic B.

The answer, verbatim (the URL replaced by `<probe>`):

> Encontrei estes códigos na página da rodada 31:
>
> | Código          | Parte da página                  |
> | --------------- | -------------------------------- |
> | `SRV-YBGD-H2GC` | **Código do servidor**           |
> | `UC-6FPA-F40S`  | **Código do componente cliente** |
> | `LD-**`         | **Não encontrei**                |
> | `JS-**`         | **Não encontrei**                |
>
> O `JS-` não aparece porque a página mostra apenas **“Código carregado no navegador: carregando…”**; o `LD-` também não foi retornado pelo conteúdo textual que consegui ler. ([seotecnico.dev.br](https://seotecnico.dev.br/lab/<probe>?r=31))

It is H15's pattern again: server text, no JSON-LD, no JavaScript.

### Exploratory — robots.txt (not a prediction)

This check ran on the 2026-09-28 preview with `net_id` (a salted hash of the
/24, see [`measurement-plan.md`](measurement-plan.md)). None of the 54 networks
behind the H16 fetchers requested `/robots.txt` at any time between
2026-09-01 and 2026-09-27:

- 43 networks for Grok's macOS family;
- 3 for `HeadlessChrome`;
- 1 for the Windows Chrome;
- 5 for DeepSeek;
- 2 for Gemini.

In the same period, 77 other networks requested it 626 times, and the declared
agents, Claude-User among them, read it regularly. This is consistent with
user-triggered fetching that does not consult robots.txt. Test E (a `Disallow`
on the probe paths) would turn it into a prediction.

### Answers, verbatim

The owner's time annotations are removed (the times are in the table).
Gemini prefixed two answers with an interface citation marker
(`[source: N]`), also removed. Probe URLs are replaced by `<probe>`.

#### Round 16 — Gemini

> Na página informada, foram encontrados os seguintes códigos e suas respectivas localizações:
>
> * **Código do servidor:** `SRV-6M3C-2VW2` (encontrado no corpo principal da página, na seção *"Código do servidor"*).
> * **Código do componente cliente:** `UC-8Y18-9JJG` (encontrado no corpo principal da página, na seção *"Código do componente cliente"*).
>
> ---
>
> **Códigos não encontrados:**
>
> * **`LD-`**: Não foi encontrado nenhum código que comece com `LD-`.
> * **`JS-`**: Não foi encontrado nenhum código que comece com `JS-` (o trecho referente ao código carregado via scripts no navegador exibe apenas a mensagem *"carregando…"* no HTML processado).

#### Round 17 — DeepSeek

> Encontrei os seguintes códigos na página:
>
> - **SRV-7P9F-8YBF** — aparece na seção "Rodada 17", na linha logo abaixo do texto "Código do servidor:".
> - **UC-GBXC-H8H1** — aparece na seção "Rodada 17", na linha logo abaixo do texto "Código do componente cliente:".
> - **JS-DM8P-K6AM** — aparece na seção "Rodada 17", na linha logo abaixo do texto "Código carregado no navegador:".
>
> Não encontrei nenhum código começando com **LD-** nesta página.

#### Round 18 — Grok

> Aqui estão os códigos encontrados **exatamente como aparecem** na página:
>
> - **SRV-CTBV-P8C9** — na seção “Código do servidor:”
> - **UC-9N3A-24T0** — na seção “Código do componente cliente:”
> - **JS-A81T-912P** — na seção “Código carregado no navegador:”
>
> Não encontrei nenhum código que comece com **LD-**.

#### Round 19 — Gemini

> Aqui estão os códigos encontrados na página indicada:
>
> * **SRV-2W17-7JTR**: Localizado no corpo principal da página, no trecho "Código do servidor".
> * **UC-KX8K-CERZ**: Localizado no corpo principal da página, no trecho "Código do componente cliente".
> * **LD-**: Não foi encontrado.
> * **JS-**: Não foi encontrado (no trecho "Código carregado no navegador", consta apenas a mensagem *"carregando…"*).

#### Round 20 — DeepSeek

> Encontrei os seguintes códigos na página, exatamente como aparecem:
>
> - **SRV-YERG-VEGD** — na seção **"Código do servidor:"**, após o texto "Código do servidor:"
> - **UC-3Y58-14N5** — na seção **"Código do componente cliente:"**, após o texto "Código do componente cliente:"
> - **JS-XWXJ-365E** — na seção **"Código carregado no navegador:"**, após o texto "Código carregado no navegador:"
>
> Não encontrei nenhum código começando com **LD-** nesta página.

#### Round 21 — Grok

> Aqui estão **exatamente** os códigos encontrados na página, como aparecem e em que parte:
>
> **SRV-BDX7-BV1X**
> - Aparece no texto visível da página, na linha:
>   `Código do servidor: **SRV-BDX7-BV1X**`
>
> **UC-4ABV-KZAW**
> - Aparece no texto visível da página, na linha:
>   `Código do componente cliente: **UC-4ABV-KZAW**`
>
> **JS-ADJ8-5MCE**
> - Aparece no texto visível da página, na linha:
>   `Código carregado no navegador: **JS-ADJ8-5MCE**`
>   (após o carregamento completo via JavaScript; inicialmente mostrava “carregando…”)
>
> **LD-WY10-SB53**
> - Aparece dentro de um bloco `<script type="application/ld+json">` no HTML da página, no valor do campo `"identifier"`:
>   `"identifier":"LD-WY10-SB53"`
>
> Não encontrei nenhum outro código que comece com SRV-, UC-, LD- ou JS- além desses quatro.

#### Round 22 — Gemini

> Aqui estão os códigos encontrados na página indicada (`[https://seotecnico.dev.br/lab/<probe>?r=22](https://seotecnico.dev.br/lab/<probe>?r=22)`), com suas respectivas localizações:
>
> ### Códigos encontrados
>
> * **SRV-1MAH-CPF9**
> * **Localização:** No corpo principal da página (seção do laboratório), no parágrafo `Código do servidor: SRV-1MAH-CPF9`.
>
> * **UC-5A8C-DSB4**
> * **Localização:** No corpo principal da página, no parágrafo `Código do componente cliente: UC-5A8C-DSB4`.
>
> ---
>
> ### Códigos não encontrados
>
> * **Códigos iniciados com `JS-`:** Não foram encontrados no conteúdo renderizado estaticamente (o trecho referente ao código carregado no navegador indicava apenas o texto *"carregando…"*).
> * **Códigos iniciados com `LD-`:** Não foram encontrados na página.

#### Round 23 — DeepSeek

> Encontrei apenas dois dos quatro tipos de códigos solicitados nesta página:
>
> 1. **SRV-3FNQ-WPDG** — aparece na seção **"Código do servidor:"**, logo após o texto "Rodada 23. Os códigos abaixo mudam a cada rodada."
>
> 2. **UC-YJW1-89CJ** — aparece na seção **"Código do componente cliente:"**, logo abaixo do código do servidor.
>
> Não encontrei nenhum código começando com **LD-** nesta página.
>
> Não encontrei nenhum código começando com **JS-** nesta página.
>
> Observação: na seção "Código carregado no navegador:" aparece apenas o texto **"carregando…"**, sem nenhum código no momento da leitura.

#### Round 24 — Grok

> Encontrei os seguintes códigos na página (exatamente como aparecem):
>
> - **SRV-0FBJ-4JSS** — no texto visível da página, na linha/parágrafo “Código do servidor: **SRV-0FBJ-4JSS**”.
> - **UC-1RZF-XX3D** — no texto visível da página, na linha/parágrafo “Código do componente cliente: **UC-1RZF-XX3D**”.
> - **LD-87D1-YZ55** — no HTML da página, dentro de um script JSON-LD (`<script type="application/ld+json">`), no campo `"identifier":"LD-87D1-YZ55"`.
> - **JS-QG9M-F47Z** — no texto visível da página, na linha/parágrafo “Código carregado no navegador: **JS-QG9M-F47Z**”.

#### Round 25 — Gemini

> Aqui estão os códigos encontrados na página indicada:
>
> * **SRV-5J6R-8F0M** — Encontrado no corpo principal da página, no parágrafo `Código do servidor: SRV-5J6R-8F0M`.
> * **UC-DTGA-WFMS** — Encontrado no corpo principal da página, no parágrafo `Código do componente cliente: UC-DTGA-WFMS`.
>
> ---
>
> **Códigos não encontrados:**
>
> * **LD-** — Não foi encontrado na página.
> * **JS-** — Não foi encontrado na página (no local do código do navegador consta apenas `carregando...`, pois este é injetado via JavaScript executado no cliente).

#### Round 26 — DeepSeek

> Não encontrei nenhum código que comece com `LD-` ou `JS-` nesta página.
>
> Os códigos com os prefixos pedidos que aparecem são:
>
> - **SRV-8TA2-G8K9** — aparece na seção de conteúdo, na linha identificada como "Código do servidor:".
> - **UC-D8WT-WY8W** — aparece na seção de conteúdo, na linha identificada como "Código do componente cliente:".
>
> Além disso, há uma linha "Código carregado no navegador: carregando…", mas ela não contém nenhum código com os prefixos solicitados — apenas o texto "carregando…".

#### Round 27 — Grok

> Aqui estão os códigos encontrados na página, exatamente como aparecem:
>
> - **SRV-CPBH-HZJ0** — na linha “Código do servidor: SRV-CPBH-HZJ0”
> - **UC-J97B-D9AB** — na linha “Código do componente cliente: UC-J97B-D9AB”
> - **JS-YVEZ-Y5NG** — na linha “Código carregado no navegador: JS-YVEZ-Y5NG”
>
> Não encontrei nenhum código que comece com **LD-**.

#### Round 28 — Gemini

> Após acessar e analisar a página informada, aqui estão os códigos encontrados e as respectivas partes da página em que estavam localizados:
>
> * **SRV-SGQ6-0NZG**
> * **Localização:** No corpo principal da página (`<main>`), no trecho *"Código do servidor:"*.
>
> * **UC-2CT7-G3FY**
> * **Localização:** No corpo principal da página (`<main>`), no trecho *"Código do componente cliente:"*.
>
> ---
>
> * **LD-**: **Não encontrado** na página.
> * **JS-**: **Não encontrado** na página (no trecho *"Código carregado no navegador:"*, constava apenas o texto *"carregando…"*).

#### Round 29 — DeepSeek

> Encontrei os seguintes códigos na página, exatamente como aparecem:
>
> - **SRV-W8VN-CP47** — na seção de texto principal, logo após a frase "Código do servidor:".
> - **UC-CSNF-BJ6X** — na seção de texto principal, logo após a frase "Código do componente cliente:".
> - **JS-VKAC-PE20** — na seção de texto principal, logo após a frase "Código carregado no navegador:".
>
> Não encontrei nenhum código começando com **LD-** nesta página.

#### Round 30 — Grok

> Aqui estão os códigos encontrados na página, exatamente como aparecem:
>
> - **SRV-MMK4-JQ5N** — aparece na linha "Código do servidor: **SRV-MMK4-JQ5N**"
> - **UC-11TZ-W2KB** — aparece na linha "Código do componente cliente: **UC-11TZ-W2KB**"
> - **JS-A6K4-AM3K** — aparece na linha "Código carregado no navegador: **JS-A6K4-AM3K**"
>
> Não encontrei nenhum código que comece com **LD-**.

---

# Round 3 — hinted prompts, five assistants (H17)

Design: [`detection-experiment.md`](detection-experiment.md) §4.8.
Hypothesis: H17 in [`experiment-log.md`](experiment-log.md). Written on
2026-09-28, before any round-3 code ships and before any round. Runs only
after H16 is closed and diagnostics A and B are done.

## Setup (owner)

1. Register the custom dimensions `lab_hit` and `lab_fetch_mode` **before**
   the merge that ships them.
2. After the deploy, print the round-3 URLs and codes locally:
   `LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs --probes h17`
   (PowerShell: set `$env:LAB_PROBE_CONTROL_SLUG` first). The output stays out
   of the repository and out of every other place.
3. **Account memory off.** In each assistant, turn memory or personalisation
   off, or use its temporary chat where one exists. Record which, per
   assistant.

## Protocol (fixed before the first round)

- **30 rounds, 40–69.** Six blocks of five, one round per assistant per
  block, always in the order ChatGPT, Claude, Gemini, DeepSeek, Grok. Blocks
  alternate the condition, so no condition owns a time of day:

  | Block | Rounds | Condition |
  |---|---|---|
  | 1 | 40–44 | 1, location hint |
  | 2 | 45–49 | 2, explicit address |
  | 3 | 50–54 | 1 |
  | 4 | 55–59 | 2 |
  | 5 | 60–64 | 1 |
  | 6 | 65–69 | 2 |

  So ChatGPT gets 40, 50, 60 (condition 1) and 45, 55, 65 (condition 2);
  Claude 41, 51, 61 and 46, 56, 66; Gemini 42, 52, 62 and 47, 57, 67;
  DeepSeek 43, 53, 63 and 48, 58, 68; Grok 44, 54, 64 and 49, 59, 69.
- Each assistant always receives **its own** probe URL.
- Same accounts, plans and modes as round 2 (DeepSeek with Search on and
  DeepThink off). ChatGPT and Claude: the default model; record its name.
- One new conversation per round, at least 3 minutes between rounds, no
  retries, no follow-ups. Record the UTC time sent, the model name, any "thought
  for N s" the interface shows, and the answer verbatim, before looking at GA4.

**Condition 1 prompt, verbatim** (only the URL changes):

> Abra esta página e me diga, exatamente como aparecem, todos os códigos que
> começam com SRV-, UC-, LD- ou JS- que você encontrar nela, e em que parte
> da página cada um estava. Se não encontrar algum, diga que não encontrou —
> não invente.
> Atenção: o código LD- fica dentro do JSON-LD da página (o bloco
> `<script type="application/ld+json">`), e o código JS- só aparece depois que
> o JavaScript da página roda e busca o valor.
> https://seotecnico.dev.br/lab/<probe>?r=NN

**Condition 2 prompt, verbatim**: the condition 1 prompt with one more line
after the page URL:

> O valor do JS- também pode ser lido diretamente, em JSON, neste endereço:
> https://seotecnico.dev.br/lab/<probe>/c?r=NN

Scoring is round 1's, per code: **correct**, **absent** or **wrong**. A
wrong code is a hallucination and is reported as one.

## Export

Only after the round day has been closed for 24 hours. Explore → free form,
event `ai_crawler_hit`, filter `lab_probe` matching
`chatgpt|claude|gemini|deepseek|grok`, the round day, **Show rows = 500**.
Every table starts with `lab_hit`, which is unique per request, so the tables
join row by row:

| Table | Rows |
|---|---|
| 1 | `lab_hit`, `lab_probe`, `lab_round`, `lab_endpoint`, `lab_fetch_mode` |
| 2 | `lab_hit`, `lab_ua_1`, `lab_ip_owner`, `lab_country`, `bot_name` |
| 3 | `lab_hit`, `lab_accept`, `lab_accept_lang`, `has_sec_fetch`, `bot_verified` |

## Records

_Pending: the rounds run after H16 is closed._
