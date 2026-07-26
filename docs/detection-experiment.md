# Record — Crawler detection: behavioural classification, not accusation

> Status: **shipping** · designed 2026-07-25 · scope: [`src/lib/ai-crawlers.ts`](../src/lib/ai-crawlers.ts),
> [`src/lib/crawler-verification.ts`](../src/lib/crawler-verification.ts) (new),
> [`src/lib/net-id.ts`](../src/lib/net-id.ts) (new),
> [`src/lib/lab-traps.ts`](../src/lib/lab-traps.ts) (new),
> [`src/app/robots.ts`](../src/app/robots.ts), [`src/proxy.ts`](../src/proxy.ts),
> [`src/app/lab/`](../src/app/lab/) (new)
> Companion to [`ai-crawler-policy.md`](ai-crawler-policy.md) (which declares the policy),
> [`measurement-plan.md`](measurement-plan.md) (which defines the `ai_crawler_hit` event)
> and [`experiment-log.md`](experiment-log.md) (which holds the dated predictions).

## 0. Purpose — read this before reading anything else

**This experiment classifies behaviour. It does not accuse anyone of anything.**

The deliverable is a method: given the requests that arrive at one small domain,
how confidently can an ordinary site owner say *"this pattern has a low / medium /
high likelihood of being an automated fetch for model-training purposes, made
against a machine-readable request not to"*? That question is currently answered
in public with vibes and vendor press releases. It is answerable with logs, and
almost nobody publishes the attempt from a domain they own.

What follows from that framing, and binds every article or post that comes out of
this work:

- **Purpose is not observable.** Whether a fetch feeds a training corpus is a fact
  about a vendor's internal pipeline. Nothing at the HTTP layer reveals it. Where
  this record says "training-purpose", it means *the vendor's own published
  documentation says this agent collects training data* — a citation, not an
  inference.
- **Non-compliance is not illegality.** `robots.txt` is a voluntary protocol
  ([`ai-crawler-policy.md`](ai-crawler-policy.md) §4). A crawler that ignores it
  has declined a request, which is a different thing from breaking a law. This
  repo makes no legal claim, and no output of this experiment should be phrased as
  one.
- **A user-agent string is a claim, not an identity.** Any observation attributed
  to a named agent must survive the verification in
  [`crawler-verification.ts`](../src/lib/crawler-verification.ts). Unverified
  traffic wearing a vendor's name is reported as *impersonation of that name* and
  never as that vendor. Getting this backwards would mean publishing a false
  accusation against a named company, which is the single worst failure mode
  available here.
- **The output is a likelihood, and it is labelled as one.** Tiers below are
  defined by which observations are present, so any reader can re-derive the tier
  from the data. There is no weighted score, because weights would be numbers this
  site invented — the same reason `wordCount` was rejected in the 2026-07-25 entity
  graph work.
- **One domain, small N.** Nothing here generalises. Every finding is scoped to
  `seotecnico.dev.br` and dated.

---

## 1. The three questions, and which are answerable

| Question | Answerable? | By what |
|---|---|---|
| Is this request from an automated client? | **Yes**, high confidence | Header shape, subresource behaviour, the two-pipeline delta (§2) |
| Which agent is it? | **Partly** | Vendor-published IP ranges, forward-confirmed reverse DNS, and Web Bot Auth signatures; structurally impossible for vendors that publish none of the three |
| Is it fetching for training? | **No** | Only the vendor knows. Behaviour supports a likelihood; documentation supplies the stated purpose |
| Was it authorized? | **Yes**, deterministically | What `robots.txt` said to that agent at request time |

Note the asymmetry that shapes the whole design: *authorization* is a fact this
repo controls and can state exactly. *Purpose* is the one variable that can only
ever be estimated. Any sentence that mixes the two without marking which is which
is a sentence to rewrite.

---

## 2. Signal inventory

Signals available at the edge, with what each is actually worth. Crawlers do not
execute JavaScript, so every browser-side technique is unavailable by
construction — which is why the strongest detector here is a join, not a header.

### 2.1 The two-pipeline delta — the load-bearing signal

[`src/proxy.ts`](../src/proxy.ts) observes every request server-side. The human
GA4 property (`G-59LQZ6LR72`) records a `page_view` only if JavaScript executed.
**A document request with no corresponding pageview is a non-JS client.**

This works for one reason that was decided months ago for unrelated reasons: the
Consent Mode v2 setup is *advanced*, so a visitor who refuses the LGPD banner
still produces a cookieless ping (`gcs=G100`, verified 2026-07-13). Consent
refusal — the obvious confound — is therefore already eliminated. Remaining
confounds are ad blockers and JS-disabled browsers; both are real, both are
small, and neither correlates with the paths a crawler targets.

This signal does not read the User-Agent at all, which is precisely why it catches
the clients that lie about it.

To make the server side of the join exist, `ai_crawler_hit` fires for **every**
matched document/discovery request — not only for declared AI user-agents. Human
traffic enters as `ua_class: browser-like` and is filtered in analysis, never
enriched: no verification, no DNS, no feed fetch ever runs for a browser-shaped
request. Since the two GA4 properties share no identifier (the crawler property
has no cookie and the human property has no `net_id`), the join is computed
coarsely — per path per day — from manual UI exports of both properties. That
granularity is enough for every tier in §3 and avoids needing API credentials
this project does not have.

### 2.2 Per-request signals

| Signal | What it indicates | Weight |
|---|---|---|
| `Sec-Fetch-Dest` / `Sec-Fetch-Mode` absent on a browser-claiming UA | Not a real browser navigation | **Strong.** Best cheap tell for a spoofed-browser scraper |
| No `/_next/static/*` fetches from the same network in the window | Document-only client | Strong |
| `Accept: */*` instead of the browser's `text/html,...` string | Non-browser HTTP client | Moderate |
| `Accept-Language` absent | Non-browser HTTP client | Moderate |
| Request to `/robots.txt` | Near-pure bot signal; humans essentially never fetch it | Strong, and doubles as a **timestamped network anchor** (§4) |
| `If-None-Match` / `If-Modified-Since` present | Client maintains a cache/index it revalidates | Strong — see §3.2 |

### 2.3 What is deliberately not collected

No IP address, no raw headers, no User-Agent forwarded to GA4 — all three for the
reasons already recorded in [`measurement-plan.md`](measurement-plan.md). The
verification layer reads the client IP **transiently, in memory, per request**
(that is what checking a CIDR range is); what leaves the server is only the
verdict string. Correlation across requests uses `net_id`: a **salted, truncated
hash of the /24 (v4) or /48 (v6)**, with the salt derived from
`SHA-256(secret + "YYYY-MM")` so it rotates monthly with zero storage and cannot
accumulate into a durable identifier. That is enough to link a trap hit to a
`/robots.txt` fetch in the same month and not enough to identify anyone.
`/politica-de-privacidade` says all of this in plain Portuguese.

### 2.4 What is structurally unavailable on Vercel

Named so nobody proposes them later: TLS fingerprints (JA3/JA4), HTTP/2 frame
fingerprints (Akamai-style), raw header *order*, and TCP-level signatures. TLS
and the HTTP framing terminate at Vercel's edge before any code in this repo
runs; the platform exposes none of them. IP-reputation databases are out too —
paid services (CLAUDE.md §13).

---

## 3. The classification

Two independent axes, each a ladder of observations, crossed at the end. Neither
axis is a score.

### 3.1 Axis A — crawler likelihood

| Tier | Definition |
|---|---|
| `confirmed` | UA matches a known agent in `classifyAiCrawler()`, **or** the robots trap was hit |
| `high` | Three independent signals agree: no `Sec-Fetch-*`, no subresource fetches from `net_id` in the window, no matching pageview in the human property |
| `medium` | Two of the three |
| `low` | Browser-shaped on all three |

### 3.2 Axis B — training-purpose likelihood

| Tier | Definition |
|---|---|
| `documented` | The agent is named **and** its vendor's published documentation states it collects training data. This is a citation, not an inference — the tier name says so on purpose |
| `high` | Undeclared client; exhaustive sitemap coverage; **zero conditional requests across ≥2 fetches of the same URL**; no referral traffic ever observed from that `net_id` |
| `medium` | Undeclared; bursty or shallow coverage; mixed or insufficient signals |
| `low` | Sends conditional requests, or re-fetches in response to a genuine `lastmod` change — the shape of an index being kept fresh rather than a corpus being filled once |

The conditional-request signal is the one I expect to carry this axis, and it is
the one most likely to be wrong. It is stated here as a hypothesis (H4, §7) so it
can be falsified by this site's own data rather than assumed.

Measurement honesty about this axis: the proxy sees the **request** side only —
it runs before the response exists, and 304s are produced by the cache layer
behind it. So the observable is `req_conditional` (did the client send
`If-None-Match` / `If-Modified-Since`), not the 304 ratio. A `resp_status`
parameter stays documented as **deferred** until enforcement (or a response-side
hook) exists to populate it truthfully.

### 3.3 Authorization — deterministic, not inferred

`allowed` / `disallowed` / `not-addressed` — read directly from what `robots.ts`
served to that agent at request time. Already implemented as `bot_policy`.

### 3.4 The cross-tab, and the one cell that is a fact

Only **(Axis B `documented` × `disallowed` × verified identity)** is a factual
claim: a named agent, whose vendor states its purpose, verified against that
vendor's published network ranges, fetching a path this site told it not to, on a
date. Every other cell is a hypothesis about behaviour and must be labelled as one
in anything published.

---

## 4. The honeypots

Two trap routes, one per **discovery channel**, each with an unguessable random
slug (defined once in [`src/lib/lab-traps.ts`](../src/lib/lab-traps.ts) and
consumed by `robots.ts`, `llms-txt.ts`, `proxy.ts` and the tests, so no surface
can drift). The slugs are random so a hit cannot come from URL-guessing — the
only way to arrive at each URL is through its one channel, which means **the
slug itself attributes the discovery vector**.

| Trap | URL appears ONLY in | A hit proves | `bot_policy` |
|---|---|---|---|
| A — `/lab/trap-r-7fk3q9zj` | `/robots.txt`, as a `Disallow:` line | The client parsed `robots.txt` and chose to fetch what it forbids — **deliberate disregard** | `disallowed` for every agent |
| B — `/lab/trap-l-x2m8wv5d` | `/llms.txt`, as a labelled link | The client parses `llms.txt` and follows its links — **channel adoption**, no disregard involved | `not-addressed` on purpose — putting it in robots.txt would contaminate the channel attribution |

Trap B plugs directly into the llms.txt prediction already on the record in
[`experiment-log.md`](experiment-log.md): the existing prediction counts fetches
of the *file*; Trap B counts clients that actually *use* what the file says,
which is the stronger form of adoption. Its llms.txt entry is honestly labelled
for what it is — nothing on this domain is deceptive, including bait.

### 4.1 Mechanism (Trap A)

A route whose URL appears **only** as a `Disallow:` line in `/robots.txt`. It is
absent from `sitemap.ts`, absent from the search index, linked from nowhere, and
carries `noindex, nofollow` plus an `X-Robots-Tag` response header.

There is no way to discover that URL except by parsing `robots.txt` and then
choosing to fetch what it forbids. **A request to it is, by construction, a
deliberate disregard of the policy** — no heuristic, no inference, no argument
about whether the client knew.

### 4.2 What it does not do

- It **only** catches clients that *read* `robots.txt`. A crawler that never reads
  the file cannot find the trap. So this detects deliberate disregard, not
  ignorance — a sharper claim, and a narrower one.
- It gives **no attribution by itself.** `robots.txt` is one file served
  identically to everyone, so every reader sees the trap line. Per-agent trap
  paths would therefore prove nothing, and are explicitly rejected. Attribution
  comes only from (a) the verification verdict on the trap hit itself and (b)
  correlating the trap hit's `net_id` against a declared agent's `/robots.txt`
  fetch in a nearby window (§2.2).
- It is **not a tarpit.** No generated junk, no infinite link maze, no attempt to
  poison anything. Three reasons: Vercel Hobby bills function invocations, junk
  content served from a technical-SEO domain is a brand cost, and a site whose
  argument is "measure honestly" cannot also be publishing garbage on purpose.

### 4.3 The slow variant

Trap A applies a deliberate response delay, configurable via `LAB_TRAP_DELAY_MS`,
**on that path only.** No real route is affected, and the delay is capped at 8s —
below the Vercel function timeout — so the response always completes. Both traps
also send `ETag` / `Last-Modified`, so revalidation behaviour (§3.2) is
measurable even here.

Purpose: response latency is one of the few levers that reveals client
*implementation* rather than client *policy*. What it measures —

- Does the client wait, or time out? (Timeout threshold is a fingerprint.)
- Does it retry? How many times, at what backoff?
- Does it hold the connection or abort and re-request?
- Does a slow response change the crawl rate on subsequent requests?

Cost, stated plainly: this is the only component of the experiment with a real
bill attached, and it scales with how often the trap is hit. If invocations become
material, the delay gets reduced or removed — measurement is not worth an
infrastructure incident. Start at a low delay and raise it only if the trap turns
out to be quiet.

### 4.4 Risk register

- `robots.txt` now advertises that a path exists. That is the mechanism, not a
  leak — but nothing real ever goes behind it.
- Expect scanner and robots.txt-diffing noise. Those clients are identifiable and
  get **reported**, not silently filtered; the false-positive population is part of
  the finding.
- The pages are honest: a human who somehow lands there sees a plain explanation
  of what it is and why it exists. Nothing on this domain is deceptive to a human
  reader, including this.
- The `/lab` namespace is reserved by the animations proposal
  (`docs/proposals/lab-animation-stress-test.md`) with an indexed hub at `/lab`.
  The traps are leaf routes that hub must **never** link — recorded here and in
  the proposal's way when it ships.

---

## 5. Identity verification — how a claim becomes an identity

Three independent paths, strongest first. Implemented in
[`crawler-verification.ts`](../src/lib/crawler-verification.ts), Node runtime.

1. **Web Bot Auth (RFC 9421 HTTP Message Signatures)** — a valid Ed25519
   signature against a key served from the agent's own
   `/.well-known/http-message-signatures-directory`. Cryptographic; does not
   depend on the UA at all. Verdict `verified-signature`.
2. **Vendor-published IP ranges** — the client IP inside a CIDR from the vendor's
   machine-readable feed. Verdict `verified-ip`. Feeds are published by OpenAI
   (GPTBot, OAI-SearchBot, ChatGPT-User), Perplexity (PerplexityBot,
   Perplexity-User), Microsoft (Bingbot) and Apple (Applebot).
3. **Forward-confirmed reverse DNS** — PTR of the client IP ends in the vendor's
   documented suffix **and** the A/AAAA of that hostname resolves back to the
   same IP. Verdict `verified-rdns`. Documented suffixes: `*.search.msn.com`
   (Bingbot), `*.applebot.apple.com` (Applebot).

Two classes need naming because they are findings, not failures:

- **Token-only agents.** `Google-Extended` and `Applebot-Extended` are robots.txt
  *tokens*, not fetching agents — their vendors document that no request ever
  carries them as a UA. A request claiming one is therefore fake **by
  construction**: verdict `impersonated`, evidence `token-only agent never
  fetches`. This is the cheapest sharp verdict in the whole module.
- **Unverifiable vendors.** Anthropic (ClaudeBot, Claude-SearchBot, Claude-User),
  Common Crawl (CCBot), ByteDance (Bytespider) and Meta (meta-externalagent)
  publish neither ranges, nor rDNS suffixes, nor signatures. Traffic claiming
  them is `unverifiable` — **never** `impersonated`, because there is no positive
  source to have failed against. "This vendor cannot be verified by anyone" is
  itself a publishable finding.

`impersonated` is only reachable when at least one positive source existed and
the request failed it — and rDNS is tried as a fallback before the verdict, so a
stale CIDR feed alone cannot brand a vendor's new IP as an impersonator if its
PTR still checks out.

The client IP comes from Vercel's `x-real-ip` header, which the platform sets
from the connection — not from `X-Forwarded-For`, whose leftmost hop can be
client-supplied on other platforms. An `impersonated` verdict must not rest on a
header the client can influence.

Known softness, kept on the record: vendors add IPs before feeds update, and the
in-memory feed cache (6h TTL, per serverless instance) can serve stale ranges.
That is why §6 rule 7 exists.

---

## 6. What this experiment cannot establish

Mirrors §4 of [`ai-crawler-policy.md`](ai-crawler-policy.md), and belongs in every
published output.

**"Did the LLM respect the request?" is two questions, and only one is answerable
from a web server.**

**(a) Did the declared agent obey the directive?** Answerable. Per-agent, dated,
first-party. This is what the experiment delivers.

**(b) Did the content stay out of the model?** Not answerable in the negative,
ever, for reasons entirely outside this domain's control:

- Undeclared crawling that cannot be attributed to anyone.
- Third-party mirrors — anyone who copies an article launders it past this
  `robots.txt` completely.
- Corpora already published. Disallowing `CCBot` today does not retract dumps that
  already contain this site.

Absence of evidence of ingestion is not evidence of absence. Any post that implies
otherwise is wrong, including one written here.

---

## 7. Publication rules

The purpose statement in §0 is only real if it constrains output. These are the
constraints:

1. Name an agent **only** with all three of: verified identity, a dated
   first-party observation, and the vendor's own published statement of that
   agent's purpose. Two out of three is not enough.
2. Report the impersonation bucket **separately** and never under the vendor's
   name. "Requests claiming to be X that did not originate from X's published
   ranges" — never "X did Y".
3. Publish counts, dates and definitions. Not adjectives.
4. Label every inferred tier as inferred, in the article body, not in a footnote.
5. Where a vendor has a published position on the behaviour observed, state it
   alongside the observation.
6. Report the falsified hypotheses too. §8 exists so that "the discriminator did
   not work" is a publishable result rather than a quiet deletion.
7. Before publishing any `impersonated` finding, re-verify against a **freshly
   fetched** vendor feed at write-up time, and phrase it as "not within the
   vendor's published ranges as of DATE". A stale feed marking a vendor's new IP
   as an impersonator is this experiment's own most likely false accusation, and
   this rule is the fuse.

---

## 8. Hypotheses on the record

Per CLAUDE.md §7.3, recorded before the results are known. Windows start on merge,
not on the 2026-07-25 policy ship date, and the synthetic hits documented in
[`measurement-plan.md`](measurement-plan.md) are excluded from all of them.

| # | Hypothesis | Window | Falsified if |
|---|---|---|---|
| H1 | Trap A receives ≥1 hit from a `net_id` that also fetched `/robots.txt` within the preceding 24h | 90d | Zero correlated trap hits |
| H2 | ≥1 agent whose vendor documents it as training-purpose fetches a `Disallow`ed article path, with identity verified | 90d | No verified disallowed fetch |
| H3 | The undeclared-crawler bucket (Axis A `high`, no AI UA) is **larger** than the declared-disallowed bucket — i.e. a UA-based policy addresses a minority of the automated traffic | 90d | Declared traffic dominates |
| H4 | Conditional requests (`req_conditional`) come predominantly from agents documented as retrieval; their presence discriminates documented purpose | 90d | Presence is flat across documented purposes |
| H5 | After the `dateModified` bump on `/blog/inp-nextjs` (≈2026-08-19), retrieval-documented agents re-fetch within 14 days at a higher rate than training-documented agents | 14d from bump | No differential re-fetch |
| H6 | Trap B receives zero hits — consistent with the existing 90-day prediction that nothing fetches `/llms.txt` unprompted, extended to its stronger form (nothing *follows* it) | 90d | ≥1 non-synthetic Trap B hit |

H3 is the one I most expect to be uncomfortable, and the most useful either way:
if it holds, the per-agent policy shipped on 2026-07-25 is addressing the smaller
half of the problem, and this site should say so about its own work.

---

## 9. Implementation

### 9.1 `ai_crawler_hit` — scope change and new parameters

Documented here and in [`measurement-plan.md`](measurement-plan.md) **before**
implementation, per CLAUDE.md §7.2. Register each as an event-scoped custom
dimension in the crawler property or it stays invisible outside Realtime.

**Scope change:** the event now fires for every request the proxy matcher passes
(documents, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/feed.xml`, the traps) —
not only declared AI UAs. `ua_class` is what keeps the buckets separable.

| Parameter | Values | Why |
|---|---|---|
| `ua_class` | `declared-ai` / `browser-like` / `unknown` | H3 — counts the population the current policy cannot address |
| `bot_verified` | `verified-ip` / `verified-signature` / `verified-rdns` / `impersonated` / `unverifiable` / `unknown-agent` | Gates every attribution. Only computed for `declared-ai` or signed requests |
| `req_conditional` | `true` / `false` | H4 |
| `has_sec_fetch` | `true` / `false` | Axis A |
| `net_id` | salted truncated /24 (v4) or /48 (v6) hash, monthly salt | Correlation without identification (§2.3) |
| `is_trap` | `true` / `false` | §4 |
| `trap_channel` | `robots` / `llms` | Which discovery vector produced the hit (§4). Absent off-trap |

`resp_status` from the original design is **deferred** — see §3.2. The volume
guard is the existing matcher: `/_next/static/*` and every asset extension never
reach the proxy, so quota is bounded by document traffic, which on this domain is
small.

### 9.2 Runtime

`crawler-verification.ts` requires the **Node runtime**, not Edge: WebCrypto
Ed25519 (Web Bot Auth), `node:dns/promises` (FCrDNS) and `Buffer` are unavailable
in the Vercel Edge Runtime. In Next.js 16 the Proxy file **always runs on
Node.js** — declaring `runtime` in its config is a build error — so the
requirement is satisfied by construction. It stays on the record because if
this file ever moves back to an Edge middleware, the failure would be
invisible — "no signature ever verifies" — the same class of silent failure as
the User-Agent forwarding trap already documented in
[`measurement-plan.md`](measurement-plan.md).

Verification work is gated: it runs only for `declared-ai` UAs or requests
carrying signature headers, inside `event.waitUntil`, with hard timeouts, and its
failure can never fail the request.

The `Signature-Input` header is parsed with the `structured-headers` package
(spec-correct RFC 8941 Structured Field Values), not a regex.

### 9.3 Tests

Following the existing split — unit tests pin logic, Playwright asserts the served
artifact:

- `src/lib/crawler-verification.test.ts`: CIDR matching v4 and v6 including
  boundary addresses; the verdict matrix — in particular that a vendor with no
  published feed must **never** be reported as impersonation, and that token-only
  claims always are; expired-signature rejection; fail-safe when a vendor feed is
  unreachable.
- `src/lib/net-id.test.ts`: determinism within a month, rotation across months,
  v4 /24 vs v6 /48 truncation, disabled without the secret.
- `tests/seo/traps.spec.ts`: Trap A present in `/robots.txt` as a `Disallow` and
  absent from `/llms.txt`; Trap B present in `/llms.txt` and absent from
  `/robots.txt`; both absent from `/sitemap.xml`; both return `noindex` in the
  meta tag and the `X-Robots-Tag` header.

A trap accidentally added to the sitemap is the failure that would void the
experiment without any visible symptom. That is what the Playwright assertion is
for.

---

## 10. Verify it

```bash
npm test
```

```bash
npm run test:seo
```

The traps are declared but unreachable through any published surface:

```bash
curl -s http://localhost:3100/robots.txt | grep trap-r
curl -s http://localhost:3100/llms.txt | grep trap-l
curl -s http://localhost:3100/sitemap.xml | grep -c lab/trap   # must print 0
curl -sI http://localhost:3100/lab/trap-r-7fk3q9zj | grep -i x-robots-tag
```

Verification verdicts, against production:

```bash
# A real vendor range → verified-ip (or impersonated, since curl is not GPTBot)
curl -s -A "GPTBot/1.3" https://seotecnico.dev.br/blog/inp-nextjs -o /dev/null -w '%{http_code}\n'

# A vendor with no published feed → unverifiable, never "impersonated"
curl -s -A "CCBot/2.0" https://seotecnico.dev.br/blog/inp-nextjs -o /dev/null -w '%{http_code}\n'
```

Both produce `ai_crawler_hit` events. **Both are synthetic** and must be excluded
from every window in §8 by timestamp, exactly as the four hits of 2026-07-25 are.

---

## 11. Rows for `experiment-log.md`

Pasted on merge, with the ship date filled in — see
[`experiment-log.md`](experiment-log.md).
