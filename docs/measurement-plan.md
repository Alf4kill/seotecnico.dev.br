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
| `tool_validate_meta` | User validated a URL in the meta tag tool | Custom Event `tool_validate_meta` | `issues_found` | **yes** | helper ready; tool not built |
| `tool_check_cwv` | User checked a domain in the CWV tool | Custom Event `tool_check_cwv` | `lcp_bucket` (`good` / `needs-improvement` / `poor` / `no-data`) | **yes** | helper ready; tool not built |
| `article_read` | Reader reached the end of an article | Element Visibility — CSS selector `#article-end` (article footer, `src/app/blog/[slug]/page.tsx`), once per page, Observe DOM changes ON | `article_slug` (= `{{Page Path}}`, e.g. `/blog/melhorar-lcp-nextjs`) | no | **live** — GTM trigger + GA4 tag published 2026-07-19; validated by owner in Tag Assistant (headless checks can't exercise IntersectionObserver-based triggers) |
| `outbound_click` | Click on external link | Link Click (Just Links) — Click URL does not contain `seotecnico.dev.br` | `link_domain` (Auto-Event Variable: Element URL → Host Name) | no | **live** — published 2026-07-19; verified on production: external-link click produces `gtm.linkClick` with the listener active (web.dev link) |
| `scroll_depth` | Scroll milestones | Scroll Depth 25/50/75/90% (vertical) | `percent` (= `{{Scroll Depth Threshold}}` built-in) | no | **live** — published 2026-07-19; validated by owner in Tag Assistant (rAF-based trigger, not exercisable from hidden/headless tabs) |
| `web_vitals` | Own RUM: a Core Web Vitals metric measured on a real visit (`web-vitals` attribution build; LCP + INP — CLS may be added later under the same event name) | Custom Event `web_vitals` (dataLayer push from `src/lib/rum.ts` when the metric finalizes — page hidden; INP may re-report a worse value if the page is revisited, same `metric_id`, so analyses take the **max per `metric_id`**) | Shared: `metric_name` (`LCP` / `INP`), `metric_id` (unique per page load, for dedup), `metric_value` (ms, rounded), `metric_rating` (`good` / `needs-improvement` / `poor`). LCP: `lcp_element` (CSS selector, ≤100 chars), `lcp_ttfb`, `lcp_load_delay`, `lcp_load_duration`, `lcp_render_delay` (ms, rounded — the 4 LCP subparts). INP: `inp_element` (CSS selector of the interacted element, ≤100 chars), `inp_interaction_type` (`pointer` / `keyboard`), `inp_load_state` (`loading` / `dom-interactive` / `dom-content-loaded` / `complete`), `inp_input_delay`, `inp_processing_duration`, `inp_presentation_delay` (ms, rounded — the 3 INP subparts) | no | **LCP live** — GTM tag/trigger created and container published 2026-07-18; tag fired with correct subpart sums in Tag Assistant preview against production (TTFB 616 + render 148 = 764 = metric_value) and confirmed again via consented production dataLayer (67 + 109 = 176). GA4 custom definitions registered 2026-07-18: 4 event-scoped dimensions (`metric_name`, `metric_rating`, `lcp_element`, `metric_id`) + 5 custom metrics in ms (`metric_value` + the 4 `lcp_*`). **INP live 2026-07-22** — code shipped in PR #24; owner created the 6 `inp_*` Data Layer Variables (same `web_vitals` GTM folder), mapped them in the `web_vitals` tag and published; all 6 `inp_*` parameters confirmed arriving in GA4 event reports the same day. Consent overview: all GA4 event tags attested as "No additional consent required" (built-in consent checks implement Consent Mode v2 advanced — no blocking rules, cookieless pings while denied). If not yet registered, add the GA4 custom definitions to query INP in Explorations: 3 event-scoped dimensions (`inp_element`, `inp_interaction_type`, `inp_load_state`) + 3 custom metrics in ms (`inp_input_delay`, `inp_processing_duration`, `inp_presentation_delay`) |

### AI crawler telemetry (separate GA4 property)

| Event name | Description | Trigger | Parameters | GA4 key event? | Status |
|---|---|---|---|---|---|
| `ai_crawler_hit` | An AI crawler requested a page or a discovery endpoint. Declared policy in [`ai-crawler-policy.md`](ai-crawler-policy.md) | **Not GTM.** Server-side Measurement Protocol hit from `proxy.ts` at the edge, when the request `User-Agent` matches a known agent | `bot_name` (e.g. `GPTBot`), `bot_vendor` (`OpenAI` / `Anthropic` / …), `bot_purpose` (`training` / `retrieval` / `user-triggered`), `page_path`, `bot_policy` (`allowed` / `disallowed` — what robots.txt tells this agent), `bot_verified` (phase 2, IP-range check) | no | documented — implementation in progress |

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

> Note: local debugging on 2026-07-13 sent a handful of real `page_view` hits to
> `G-59LQZ6LR72` from `localhost`. Recommend defining internal/dev traffic
> exclusion in GA4 (Admin → Data Streams → Configure tag settings → Define
> internal traffic) so future local runs don't pollute reports.
