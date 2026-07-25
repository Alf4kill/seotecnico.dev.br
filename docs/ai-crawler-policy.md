# Record — AI crawler policy: allow retrieval, block training

> Status: **adopted** · 2026-07-25 · scope: [`src/lib/ai-crawlers.ts`](../src/lib/ai-crawlers.ts),
> [`src/app/robots.ts`](../src/app/robots.ts), [`proxy.ts`](../proxy.ts)
> Companion to [`measurement-plan.md`](measurement-plan.md) (the `ai_crawler_hit`
> event) and [`experiment-log.md`](experiment-log.md).

## TL;DR

Until now `robots.txt` carried a single `User-agent: *` group, so **every AI
crawler — including model-training crawlers — was implicitly allowed**, while
[`content/LICENSE.md`](../content/LICENSE.md) reserves all rights on the same
text. The stated licence and the machine-readable policy disagreed.

The site now declares each agent by name: crawlers that fetch **in order to
answer and cite** are allowed; crawlers that fetch **to train a model** are
disallowed. That is the combination that serves Objective **O7** (be cited by
an AI search engine) without silently donating all-rights-reserved content to
training corpora.

---

## 1. The two buckets

Purpose is the vendors' own published description of each agent, not an
inference from behaviour.

### Allowed — retrieval and user-triggered

| Agent | Vendor | What it does |
|---|---|---|
| `OAI-SearchBot` | OpenAI | Builds the index behind ChatGPT search results |
| `ChatGPT-User` | OpenAI | One-off fetch when a user asks ChatGPT to open a link |
| `Claude-SearchBot` | Anthropic | Indexes pages so Claude can cite them |
| `Claude-User` | Anthropic | One-off fetch on a user's request |
| `PerplexityBot` | Perplexity | Search index that produces Perplexity's citations |
| `Perplexity-User` | Perplexity | One-off fetch on a user's request |
| `Applebot` | Apple | Siri and Spotlight suggestions |
| `Bingbot` | Microsoft | Bing's index — load-bearing for O7, since Bing feeds Copilot and part of ChatGPT's answers |

`Googlebot` is not listed: it is covered by the `*` group and naming it would
add a group without changing a rule.

### Disallowed — model training

| Agent | Vendor | What it does |
|---|---|---|
| `GPTBot` | OpenAI | Training data for OpenAI models |
| `ClaudeBot` | Anthropic | Training data for Anthropic models |
| `Google-Extended` | Google | Whether content improves Gemini Apps and Vertex AI generative APIs |
| `Applebot-Extended` | Apple | Opt-out for training Apple's foundation models |
| `CCBot` | Common Crawl | Public corpus that feeds many third-party training sets |
| `meta-externalagent` | Meta | Crawls for Meta's AI products and training |
| `Bytespider` | ByteDance | Training data for ByteDance models |

---

## 2. The three nuances that make this policy correct

These are the parts the topic usually gets wrong, and they are the reason the
buckets are split by *token* and not by *vendor*.

**`Google-Extended` costs nothing to block.** It is a training and grounding
control, not a search control. AI Overviews and AI Mode are served from the
Search index built by Googlebot, so disallowing `Google-Extended` does not
remove the site from either, and does not affect crawling, indexing or ranking
in Google Search. It is the one training opt-out with no citation downside.

**`Applebot-Extended` is not `Applebot`.** Blocking the `-Extended` token opts
out of training Apple's foundation models; blocking plain `Applebot` would also
remove the site from Siri and Spotlight. Same shape at Anthropic: `ClaudeBot`
(training) is a different agent from `Claude-SearchBot` and `Claude-User`
(retrieval). Substring matching that is not longest-token-first would collapse
these pairs and silently invert the policy — which is exactly what
`classifyAiCrawler()` is unit-tested against.

**A named group replaces the `*` group; it does not extend it.** Per the Robots
Exclusion Protocol, a crawler obeys the *most specific* group naming it and
ignores `User-agent: *` entirely. So every allowed AI group must repeat
`Disallow: /api/` for itself. Omitting it would open `/api/` to precisely the
agents this file just named — the opposite of the intent, and invisible without
a test. `tests/seo/seo.spec.ts` asserts the repetition on every allowed group.

---

## 3. Why not the other two options

| Option | Why not |
|---|---|
| **Allow everything, explicitly** | Maximises citation odds but donates all-rights-reserved content to training corpora with nothing offered in return. The licence would still contradict the policy — only more legibly. |
| **Block every AI agent** | Protects the content but forfeits O7 outright. A site whose stated objective is to be cited by AI search cannot begin by refusing the crawlers that do the citing. |

The accepted cost of the chosen policy: blocking `GPTBot` may reduce how much
of this site ends up in the training data behind ungrounded ChatGPT answers.
Grounded, cited answers — the ones that produce a link and a visit — come from
`OAI-SearchBot` and `ChatGPT-User`, both allowed. That trade-off is a
hypothesis, and it is logged as one in
[`experiment-log.md`](experiment-log.md) rather than asserted here.

---

## 4. `robots.txt` is a request, not a fence

Compliance is voluntary. `Bytespider` in particular has a public record of
ignoring the protocol, and any agent can send any `User-Agent` string it likes.
This policy is a declaration of intent that well-behaved crawlers honour — it
is not access control, and nothing in this repo pretends otherwise.

That is precisely why the policy shipped together with measurement. The
`ai_crawler_hit` event (see [`measurement-plan.md`](measurement-plan.md))
records which agents actually arrive and on which paths, which makes two
otherwise unanswerable questions answerable with data from this domain:

1. Do the allowed retrieval crawlers actually show up?
2. Do the disallowed training crawlers respect the `Disallow`?

Question 2 is the one worth publishing. A training bot hitting an article after
this policy went live is a dated, first-party observation of a robots.txt
violation — original data, which is what CLAUDE.md §5.2 asks every article to
carry.

---

## 5. Verify it

```bash
npm test
```

```bash
npm run test:seo
```

Unit tests ([`src/lib/ai-crawlers.test.ts`](../src/lib/ai-crawlers.test.ts))
pin the bucket of every agent and the longest-token-first matching. The
Playwright suite fetches the real `/robots.txt` and asserts that `GPTBot` is
disallowed, that `OAI-SearchBot` is allowed, and that every allowed group
carries its own `Disallow: /api/`.

Read the served file directly:

```bash
curl -s http://localhost:3100/robots.txt
```
