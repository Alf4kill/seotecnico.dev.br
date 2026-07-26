# Measurement Plan — SEO Técnico

> Rule (CLAUDE.md §7.2): every event MUST be documented here BEFORE being
> implemented. All tags fire through GTM — no hardcoded gtag anywhere.
> All custom events are pushed via the typed helper `src/lib/analytics.ts`
> (`pushEvent()`), never via raw `window.dataLayer.push` in components.

## Stack

| Piece | Value |
|---|---|
| GTM web container | `GTM-N5RB56R9` (set as `NEXT_PUBLIC_GTM_ID` in Vercel) |
| GA4 property | Measurement ID `G-59LQZ6LR72` (GA4 tag configured inside the GTM container) |
| GA4 data stream | `https://seotecnico.dev.br` — Measurement ID `G-59LQZ6LR72` |
| Consent | Consent Mode v2. Default: everything **denied** (inline script before GTM, `src/app/layout.tsx`). LGPD banner (`ConsentBanner.tsx`) updates `analytics_storage` on user choice; choice persisted in `localStorage` (`seotecnico:consent-analytics`). `ad_*` stay denied permanently (no ads). |

## Events

| Event name | Description | Trigger (GTM) | Parameters | GA4 key event? | Status |
|---|---|---|---|---|---|
| `page_view` | Pageview incl. SPA navigations | Google tag, Initialization — All Pages + History Change | default | no | **verified** — fires to `G-59LQZ6LR72` on load + SPA nav, consent-gated (2026-07-13, local hit inspection) |
| `tool_generate_jsonld` | User generated a schema in the JSON-LD tool | Custom Event `tool_generate_jsonld` (dataLayer push on successful generate — validation errors don't fire it) | `schema_type` (`Article` / `FAQPage` / `BreadcrumbList` / `Person` / `Organization`) | **yes** | **live** — tool at `/ferramentas/gerador-json-ld` since 2026-07-18; GTM Custom Event trigger + GA4 tag published 2026-07-19 and validated in Tag Assistant against production (`schema_type` resolved to `Article`); `schema_type` registered as event-scoped custom dimension 2026-07-19. Remaining: mark as key event in GA4 Admin → Events after the first real hits |
| `tool_validate_meta` | User validated a URL in the meta tag tool | Custom Event `tool_validate_meta` (dataLayer push on successful validation — fetch/URL errors don't fire it) | `issues_found` (integer: checks that came back warning or error; **never the URL validated**) | **yes** | **tool live 2026-07-26** — `/ferramentas/validador-meta-tags`, logic in `src/lib/meta-validator.ts` + `/api/validador-meta` (server fetch; URL not logged nor stored). Remaining (owner, same recipe as `tool_generate_jsonld`): GTM Custom Event trigger + GA4 event tag with `issues_found` mapped from a Data Layer Variable, publish, validate in Tag Assistant; register `issues_found` as event-scoped custom dimension; mark as key event after first real hits |
| `tool_check_cwv` | User checked a domain in the CWV tool | Custom Event `tool_check_cwv` | `lcp_bucket` (`good` / `needs-improvement` / `poor` / `no-data`) | **yes** | helper ready; tool not built |
| `article_read` | Reader reached the end of an article | Element Visibility — CSS selector `#article-end` (article footer, `src/app/blog/[slug]/page.tsx`), once per page, Observe DOM changes ON | `article_slug` (= `{{Page Path}}`, e.g. `/blog/melhorar-lcp-nextjs`) | no | **live** — GTM trigger + GA4 tag published 2026-07-19; validated by owner in Tag Assistant (headless checks can't exercise IntersectionObserver-based triggers) |
| `outbound_click` | Click on external link | Link Click (Just Links) — Click URL does not contain `seotecnico.dev.br` | `link_domain` (Auto-Event Variable: Element URL → Host Name) | no | **live** — published 2026-07-19; verified on production: external-link click produces `gtm.linkClick` with the listener active (web.dev link) |
| `scroll_depth` | Scroll milestones | Scroll Depth 25/50/75/90% (vertical) | `percent` (= `{{Scroll Depth Threshold}}` built-in) | no | **live** — published 2026-07-19; validated by owner in Tag Assistant (rAF-based trigger, not exercisable from hidden/headless tabs) |
| `web_vitals` | Own RUM: a Core Web Vitals metric measured on a real visit (`web-vitals` attribution build; LCP + INP — CLS may be added later under the same event name) | Custom Event `web_vitals` (dataLayer push from `src/lib/rum.ts` when the metric finalizes — page hidden; INP may re-report a worse value if the page is revisited, same `metric_id`, so analyses take the **max per `metric_id`**) | Shared: `metric_name` (`LCP` / `INP`), `metric_id` (unique per page load, for dedup), `metric_value` (ms, rounded), `metric_rating` (`good` / `needs-improvement` / `poor`). LCP: `lcp_element` (CSS selector, ≤100 chars), `lcp_ttfb`, `lcp_load_delay`, `lcp_load_duration`, `lcp_render_delay` (ms, rounded — the 4 LCP subparts). INP: `inp_element` (CSS selector of the interacted element, ≤100 chars), `inp_interaction_type` (`pointer` / `keyboard`), `inp_load_state` (`loading` / `dom-interactive` / `dom-content-loaded` / `complete`), `inp_input_delay`, `inp_processing_duration`, `inp_presentation_delay` (ms, rounded — the 3 INP subparts) | no | **LCP live** — GTM tag/trigger created and container published 2026-07-18; tag fired with correct subpart sums in Tag Assistant preview against production (TTFB 616 + render 148 = 764 = metric_value) and confirmed again via consented production dataLayer (67 + 109 = 176). GA4 custom definitions registered 2026-07-18: 4 event-scoped dimensions (`metric_name`, `metric_rating`, `lcp_element`, `metric_id`) + 5 custom metrics in ms (`metric_value` + the 4 `lcp_*`). **INP live 2026-07-22** — code shipped in PR #24; owner created the 6 `inp_*` Data Layer Variables (same `web_vitals` GTM folder), mapped them in the `web_vitals` tag and published; all 6 `inp_*` parameters confirmed arriving in GA4 event reports the same day. Consent overview: all GA4 event tags attested as "No additional consent required" (built-in consent checks implement Consent Mode v2 advanced — no blocking rules, cookieless pings while denied). If not yet registered, add the GA4 custom definitions to query INP in Explorations: 3 event-scoped dimensions (`inp_element`, `inp_interaction_type`, `inp_load_state`) + 3 custom metrics in ms (`inp_input_delay`, `inp_processing_duration`, `inp_presentation_delay`) |

### AI crawler telemetry (separate GA4 property)

| Event name | Description | Trigger | Parameters | GA4 key event? | Status |
|---|---|---|---|---|---|
| `ai_crawler_hit` | A client requested a page or a discovery endpoint. Originally AI-UA-only; scope expanded for the detection experiment ([`detection-experiment.md`](detection-experiment.md)). Declared policy in [`ai-crawler-policy.md`](ai-crawler-policy.md) | **Not GTM.** Server-side Measurement Protocol hit from `src/proxy.ts` (Node runtime), for **every request the matcher passes** — documents, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/feed.xml`, the lab traps. `ua_class` separates the buckets | For declared agents: `bot_name` (e.g. `GPTBot`), `bot_vendor` (`OpenAI` / `Anthropic` / …), `bot_purpose` (`training` / `retrieval` / `user-triggered`), `bot_policy` (`allowed` / `disallowed` — what robots.txt tells this agent), `bot_verified` (`verified-ip` / `verified-signature` / `verified-rdns` / `impersonated` / `unverifiable` / `unknown-agent`). For every hit: `page_path`, `page_location` (feeds GA4's native page dimensions), `ua_class` (`declared-ai` / `browser-like` / `unknown`), `has_sec_fetch` (`true`/`false`), `req_conditional` (`true`/`false`), `net_id` (salted truncated /24 or /48 hash, monthly salt). On the traps: `is_trap` (`true`), `trap_channel` (`robots` / `llms`) | no | **live 2026-07-25** — shipped in PR #31 and validated end-to-end against production the same day (four synthetic hits in Realtime, all 8 original parameter keys, `bot_name` split across the 4 agents sent). **Expanded 2026-07-25** — detection experiment: all-requests scope, verification verdicts and the 6 new parameters; see [`detection-experiment.md`](detection-experiment.md). Remaining: register the event-scoped custom dimensions (below) so the parameters are queryable outside Realtime |

To query the crawler property beyond Realtime, register the event-scoped
custom dimensions `bot_name`, `bot_vendor`, `bot_purpose`, `bot_policy`,
`page_path`, `bot_verified`, `ua_class`, `has_sec_fetch`, `req_conditional`,
`net_id`, `is_trap` and `trap_channel` (Admin → Custom definitions).
`page_location` needs no registration — GA4 reads it into the built-in page
dimensions.

Scope and privacy notes for the expansion (full rationale in
[`detection-experiment.md`](detection-experiment.md)):

- **Human traffic now appears in this property** as `ua_class = browser-like`,
  anonymously: no cookie, no IP, no UA — only the path, derived boolean
  signals, and `net_id`. That is what makes the two-pipeline delta (server-side
  requests vs JS pageviews) computable at all.
- **`net_id` is correlation, not identification**: a truncated hash of the /24
  (v4) or /48 (v6), salted with `SHA-256(NET_ID_SALT_SECRET + "YYYY-MM")` — the
  salt rotates monthly with zero storage, so the identifier cannot accumulate.
  Without the env var the parameter is simply omitted (same fail-safe shape as
  the sink URL). `/politica-de-privacidade` describes this in plain language.
- **Verification never runs for browser-shaped traffic.** CIDR-feed fetches,
  reverse DNS and signature checks are gated on `ua_class = declared-ai` or the
  presence of signature headers.
- **`resp_status` is deferred**: the proxy runs before the response exists, so
  a status parameter cannot be populated truthfully yet.

**The query that matters:** filter `bot_policy = disallowed` and exclude
`page_path = /robots.txt`. A disallowed agent fetching robots.txt is
compliant — that is how it learns it is disallowed. The same agent fetching an
article afterwards is a robots.txt violation, dated and first-party.

> **The first four events in this property are synthetic — do not read them as
> findings.** They were sent by hand on 2026-07-25 to validate the pipeline:
> `GPTBot` → `/blog/inp-nextjs`, `OAI-SearchBot` → `/blog/inp-nextjs`,
> `PerplexityBot` → `/llms.txt`, `ClaudeBot` → `/robots.txt`. Two of them carry
> `bot_policy = disallowed`, and the `GPTBot` one matches the violation query
> above exactly. Any violation analysis must start after 2026-07-25, or exclude
> these four by timestamp. The `PerplexityBot` → `/llms.txt` hit likewise does
> **not** count against the 90-day llms.txt prediction in the experiment log —
> that prediction is about unprompted fetches by real agents.
>
> **Three more synthetic hits on 2026-07-25 (22:09, 22:11, 22:12 UTC−3)**,
> sent by the owner right after the detection-experiment deploy (PR #33) to
> validate the verification layer end-to-end, per
> [`detection-experiment.md`](detection-experiment.md) §10. All three returned
> `200` and produced events with the expected verdicts:
> `GPTBot` → `/blog/inp-nextjs` came back **`impersonated`** (a residential IP
> claiming GPTBot — the correct verdict for the curl itself);
> `CCBot` → `/blog/inp-nextjs` came back **`unverifiable`** (no published feed
> — and NOT impersonated, the distinction the experiment depends on);
> `GPTBot` → the robots trap came back `impersonated` with **2.65s total
> response time**, confirming `LAB_TRAP_DELAY_MS` is applied on that path.
> Exclude all three from every H1–H6 window by timestamp, exactly like the
> four above. In particular the trap hit does **not** count toward H1.

Two design decisions worth pinning, because both fail silently if reversed:

**(1) A dedicated GA4 property, never `G-59LQZ6LR72`.** Measurement Protocol
hits create users and sessions like any other hit. Sending crawler traffic to
the human property would inflate every user count, dilute every engagement
metric and skew the RUM percentiles the `web_vitals` event exists to produce.
The crawler property is free and disposable; the human property is the record.

**(2) The crawler's `User-Agent` is deliberately NOT forwarded to GA4.** GA4
automatically excludes traffic from known bots and spiders, matched against the
IAB Spiders & Bots list — and that filter reads the user agent of the hit.
Forwarding the real UA would cause GA4 to accept the request and then discard
100% of the events, with no error anywhere. The bot identity therefore travels
as the `bot_name` / `bot_vendor` **event parameters**, and the hit itself is
sent with no UA. This is the single most likely failure mode of the design.

Supporting choices: `client_id` is derived stably from the bot name, so GA4
reports one "user" per crawler and sessions are per-agent; no IP address and no
request headers are sent, so nothing here is personal data under the LGPD (and
`/politica-de-privacidade` says so); `engagement_time_msec` is set so the event
is not dropped from standard reports. If either environment variable
(`GA4_CRAWLER_MEASUREMENT_ID`, `GA4_CRAWLER_API_SECRET`) is unset, the proxy
classifies and no-ops — the same fail-safe shape as `site.gtmId`.

Validate against the debug endpoint, which returns validation errors instead of
silently accepting (`/mp/collect` always answers `204`, valid or not):

```bash
curl -s -X POST "https://www.google-analytics.com/debug/mp/collect?measurement_id=$ID&api_secret=$SECRET" -d '{"client_id":"gptbot","events":[{"name":"ai_crawler_hit","params":{"bot_name":"GPTBot","engagement_time_msec":1}}]}'
```

### Why the RUM sink is GA4 (and not an `/api/rum` endpoint)

The site is below the CrUX traffic threshold, so there is **zero field CWV
data** — own RUM is the only way to see real-user LCP. Two candidate sinks
were considered:

- **(a) GA4 event via the typed helper + GTM** — chosen. Consent-gated by the
  existing Consent Mode v2 setup (while denied, the hit is a cookieless ping,
  same as `page_view`), no server storage (LGPD-simple), and data is queryable
  in GA4 explorations with the 4 LCP subparts as event parameters.
- **(b) `navigator.sendBeacon('/api/rum')`** — rejected: CLAUDE.md §13 forbids
  databases, and Vercel Hobby retains function logs for ~1 hour, so the
  endpoint would have nowhere durable to put the data. It would be a write to
  `/dev/null` with extra latency.

## GTM container configuration (to reproduce)

1. **Consent overview**: Admin → Container Settings → check "Enable consent
   overview". The site sends the default-denied state before GTM loads.
2. **Google tag** (GA4): Tag type "Google Tag" with the Measurement ID.
   Trigger: **Initialization — All Pages**. Built-in consent checks handle
   `analytics_storage` (tag fires cookieless pings while denied — Consent
   Mode v2 advanced).
3. **SPA pageviews**: enable **History Change** trigger firing a GA4
   `page_view` event tag (per CLAUDE.md §7.2), OR rely on GA4 Enhanced
   Measurement "Page changes based on browser history events" — pick ONE to
   avoid double counting. Decision: **GTM History Change trigger** (keeps all
   logic in GTM, visible and versionable).
4. **Custom event tags**: one GA4 event tag per tool event, trigger type
   Custom Event matching the event name, parameters mapped from dataLayer
   variables of the same name.
5. **RUM tag**: GA4 event tag `web_vitals`, trigger type Custom Event
   `web_vitals`, all parameters mapped from dataLayer variables of the same
   name (9 LCP-era params + the 6 `inp_*` params — one dataLayer variable
   each; unset params simply don't appear on the hit, so LCP and INP events
   share the single tag). To analyze: GA4 Explorations, filter by
   `metric_name` (`LCP` or `INP`), percentiles over `metric_value` (dedup by
   `metric_id` — INP in particular can re-report a worse value for the same
   page load, so take the max per `metric_id`), break down by
   `lcp_element` / `inp_element` / the subpart parameters.
6. **Engagement triggers (no code involved)**: `article_read` via Element
   Visibility on `#article-end` (once per page, Observe DOM changes ON, so it
   re-arms across SPA navigations); `scroll_depth` via the native Scroll Depth
   trigger (25/50/75/90, requires the Scroll Depth Threshold built-in
   variable); `outbound_click` via Just Links with Click URL not containing
   the site host, `link_domain` extracted by an Auto-Event Variable (Element
   URL → Host Name). Keep GA4 Enhanced Measurement's "Scrolls" and "Outbound
   clicks" toggles OFF — all logic lives in GTM (same single-source decision
   as History Change pageviews).

## Validation checklist (DebugView) — Objective O3

Verified 2026-07-13 by inspecting the actual GA4 `/g/collect` requests on a
local dev run against the real container `GTM-N5RB56R9`. These hits are the same
ground truth GA4 DebugView reads from; the DebugView line stays open as the
final sign-off on the live domain (needs `debug_mode` / GA4 access).

- [x] Consent **default = all denied** pushed before GTM loads (`dataLayer[0]`)
- [x] Banner "Aceitar" → `consent update {analytics_storage: granted}`; hits carry `gcs=G101`
- [x] Banner "Recusar" / no choice → **no `_ga` cookies**; cookieless ping with `gcs=G100` (Consent Mode v2 *advanced*)
- [x] Choice persists across reloads (localStorage; banner does not reappear)
- [x] `page_view` fires on load **and on SPA navigation** (History Change → correct `dl`/`dt`)
- [x] GTM Preview (Tag Assistant) connects to the production URL (2026-07-18, `web_vitals` tag validation)
- [ ] Confirm the same hits in GA4 Admin → DebugView on the live domain (`debug_mode`)
- [ ] Each tool event appears in DebugView with its parameters (when tools ship)
- [ ] Key events marked in GA4 Admin → Events (after first real events arrive)
- [x] `ai_crawler_hit` arrives in the **crawler** property with its parameters (2026-07-25, Realtime, 4/4 synthetic hits, `bot_name` split across the 4 agents sent). Not DebugView: the hit is server-side from `proxy.ts`, so there is no browser to attach `debug_mode` to — Realtime is the equivalent ground truth for a Measurement Protocol event
- [x] Custom dimensions registered for `bot_name`, `bot_vendor`, `bot_purpose`, `bot_policy`, `page_path` + the detection-experiment set `bot_verified`, `ua_class`, `has_sec_fetch`, `req_conditional`, `net_id`, `is_trap`, `trap_channel` (owner, 2026-07-25, before the PR #33 deploy)
- [x] `NET_ID_SALT_SECRET` set in Vercel production env, `LAB_TRAP_DELAY_MS` active (confirmed by the 2.65s trap response, 2026-07-25) — without the salt, `net_id` is omitted and H1's correlation is blind
- [ ] First **unprompted** hit from a real AI crawler observed (the four above were sent by hand)

> Note: local debugging on 2026-07-13 sent a handful of real `page_view` hits to
> `G-59LQZ6LR72` from `localhost`. Recommend defining internal/dev traffic
> exclusion in GA4 (Admin → Data Streams → Configure tag settings → Define
> internal traffic) so future local runs don't pollute reports.
