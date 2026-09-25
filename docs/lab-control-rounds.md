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

In the table, `/c` is whether the proxy saw the `JS-` fetch in the window. Time
is UTC.

| Round | Assistant (model shown) | Prompt sent (UTC) | Proxy hits on the page (time · bot_name · bot_verified) | `/c` | SRV | UC | LD | JS |
|---|---|---|---|---|---|---|---|---|
| 00 | owner check (browser) | | | | — | — | — | — |
| 01 | ChatGPT | | | | | | | |
| 02 | Claude | | | | | | | |
| 03 | Perplexity | | | | | | | |
| 04 | ChatGPT | | | | | | | |
| 05 | Claude | | | | | | | |
| 06 | Perplexity | | | | | | | |
| 07 | ChatGPT | | | | | | | |
| 08 | Claude | | | | | | | |
| 09 | Perplexity | | | | | | | |
| 10 | ChatGPT | | | | | | | |
| 11 | Claude | | | | | | | |
| 12 | Perplexity | | | | | | | |
| 13 | ChatGPT | | | | | | | |
| 14 | Claude | | | | | | | |
| 15 | Perplexity | | | | | | | |

The answers, verbatim, go below the table, one heading per round. **Commit them
only after round 15**, and keep the codes in them. A code already published
cannot help a later round, because every round id changes every code. Before
the last round, one committed answer would let a later assistant find a code
on GitHub instead of on the page. The slug is never committed, not even after
the rounds.
