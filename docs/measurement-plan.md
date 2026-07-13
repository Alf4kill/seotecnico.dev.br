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
| `tool_generate_jsonld` | User generated a schema in the JSON-LD tool | Custom Event `tool_generate_jsonld` (dataLayer push on generate) | `schema_type` | **yes** | helper ready; tool not built |
| `tool_validate_meta` | User validated a URL in the meta tag tool | Custom Event `tool_validate_meta` | `issues_found` | **yes** | helper ready; tool not built |
| `tool_check_cwv` | User checked a domain in the CWV tool | Custom Event `tool_check_cwv` | `lcp_bucket` (`good` / `needs-improvement` / `poor` / `no-data`) | **yes** | helper ready; tool not built |
| `article_read` | Reader reached the end of an article | Element Visibility (article footer element) | `article_slug` | no | pending first articles |
| `outbound_click` | Click on external link | Link Click — outbound | `link_domain` | no | pending GTM setup |
| `scroll_depth` | Scroll milestones | Scroll Depth 25/50/75/90% | `percent` | no | pending GTM setup |

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
- [ ] GTM Preview (Tag Assistant) connects to the production URL
- [ ] Confirm the same hits in GA4 Admin → DebugView on the live domain (`debug_mode`)
- [ ] Each tool event appears in DebugView with its parameters (when tools ship)
- [ ] Key events marked in GA4 Admin → Events (after first real events arrive)

> Note: local debugging on 2026-07-13 sent a handful of real `page_view` hits to
> `G-59LQZ6LR72` from `localhost`. Recommend defining internal/dev traffic
> exclusion in GA4 (Admin → Data Streams → Configure tag settings → Define
> internal traffic) so future local runs don't pollute reports.
