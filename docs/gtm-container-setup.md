# GTM Container Setup — SEO Técnico

> Reproducible specification of the Google Tag Manager container so it can be
> rebuilt from scratch (or audited) without access to the original account.
> Companion to [`measurement-plan.md`](measurement-plan.md), which owns the
> event catalog. This file owns the **container internals**: variables,
> triggers, tags, and consent wiring.
>
> **How to read this:** sections marked _Observed_ are facts captured from the
> live container at runtime; sections marked _Target_ are the canonical
> configuration this project commits to. Rebuild to match _Target_, then
> confirm against _Observed_.

---

## 1. Identifiers

| Thing | Value |
|---|---|
| GTM web container | `GTM-N5RB56R9` |
| GA4 Measurement ID | `G-59LQZ6LR72` |
| GA4 tag location | Configured **inside** the GTM container (no hardcoded `gtag` on the site) |
| Env var feeding the site | `NEXT_PUBLIC_GTM_ID` (Vercel) → `src/lib/site.ts` → `<GoogleTagManager>` |

_Observed (2026-07-13, local run):_ `window.google_tag_manager` exposes both
`GTM-N5RB56R9` and `G-59LQZ6LR72`; `google_tag_data` present (consent model
active); `autoEventsSettings` present. The container therefore already contains
a working GA4 configuration tag.

---

## 2. How the site feeds GTM (app side — already implemented)

The container is deliberately thin because the site does the privacy-sensitive
parts before GTM ever loads:

1. **Consent default (denied) — before GTM.** Inline `beforeInteractive` script
   in [`src/app/layout.tsx`](../src/app/layout.tsx) pushes
   `gtag('consent','default', { ad_storage, ad_user_data, ad_personalization,
   analytics_storage: 'denied', wait_for_update: 500 })`.
2. **GTM injection.** `<GoogleTagManager gtmId={site.gtmId} />` from
   `@next/third-parties` mounts the container **only when `NEXT_PUBLIC_GTM_ID`
   is set** (afterInteractive — i.e. after the consent default).
3. **Consent update.** The LGPD banner
   ([`ConsentBanner.tsx`](../src/components/layout/ConsentBanner.tsx)) calls
   `applyConsent()` → `gtag('consent','update',{ analytics_storage })`. Choice
   persisted in `localStorage` (`seotecnico:consent-analytics`) and re-applied
   on later visits.
4. **Custom events.** Pushed only through the typed helper
   [`src/lib/analytics.ts`](../src/lib/analytics.ts) `pushEvent()` — never raw
   `window.dataLayer.push` in components (CLAUDE.md §7.2).

**Consequence for GTM:** the container must **not** define its own
consent-default, and every tag must respect the built-in `analytics_storage`
consent check.

---

## 3. Container-level settings

_Target:_

- **Admin → Container Settings → Enable consent overview.** The site sends the
  default-denied state before GTM loads, so the overview should show all GA4
  tags gated on `analytics_storage`.
- **Consent Mode: advanced.** Tags load on every page and, while consent is
  denied, send **cookieless** pings. This is intentional and documented in
  `measurement-plan.md`.

_Observed:_ advanced mode confirmed via the `gcs` parameter on real
`/g/collect` hits — `gcs=G100` while denied (cookieless, no `_ga` cookie),
`gcs=G101` after "Aceitar". (`G1` = consent mode on, digits = ad_storage /
analytics_storage; `0`=denied, `1`=granted.)

---

## 4. Variables

### 4.1 Built-in (enable in Variables → Configure)

`Page URL`, `Page Path`, `Page Hostname`, `Click URL`, `Click Element`,
`Click Text`, `Scroll Depth Threshold`, `Event`.

### 4.2 Constants

| Name | Type | Value |
|---|---|---|
| `CONST - GA4 Measurement ID` | Constant | `G-59LQZ6LR72` |

### 4.3 Data Layer Variables (one per custom event parameter)

These names **must match** the keys pushed by `pushEvent()` in
`src/lib/analytics.ts`.

| Variable name | Data Layer Variable Name | Used by event |
|---|---|---|
| `DLV - schema_type` | `schema_type` | `tool_generate_jsonld` |
| `DLV - issues_found` | `issues_found` | `tool_validate_meta` |
| `DLV - lcp_bucket` | `lcp_bucket` | `tool_check_cwv` |
| `DLV - article_slug` | `article_slug` | `article_read` |

### 4.4 Derived variable for outbound clicks

| Name | Type | Definition |
|---|---|---|
| `JS - link_domain` | Custom JavaScript | returns the hostname of `{{Click URL}}` (see snippet below) |

```javascript
function () {
  try { return new URL({{Click URL}}).hostname; }
  catch (e) { return undefined; }
}
```

---

## 5. Triggers

| Trigger name | Type | Condition |
|---|---|---|
| `Init - All Pages` | Initialization — All Pages | — |
| `History Change` | History Change | — |
| `CE - tool_generate_jsonld` | Custom Event | Event equals `tool_generate_jsonld` |
| `CE - tool_validate_meta` | Custom Event | Event equals `tool_validate_meta` |
| `CE - tool_check_cwv` | Custom Event | Event equals `tool_check_cwv` |
| `CE - article_read` | Custom Event | Event equals `article_read` |
| `Link - outbound` | Just Links (Click) | `{{Click URL}}` does **not** contain `{{Page Hostname}}`; wait for tags |
| `Scroll - milestones` | Scroll Depth | Vertical, percentages `25,50,75,90` |

---

## 6. Tags

All tags are **GA4** and require `analytics_storage` consent (§7).

| Tag name | Type | Config | Trigger | Event params |
|---|---|---|---|---|
| `GA4 - Config (Google tag)` | Google Tag | Tag ID = `{{CONST - GA4 Measurement ID}}` | `Init - All Pages` | — (sends initial `page_view`) |
| `GA4 - page_view (SPA)` | GA4 Event | `page_view` | `History Change` | — |
| `GA4 - tool_generate_jsonld` | GA4 Event | `tool_generate_jsonld` | `CE - tool_generate_jsonld` | `schema_type` = `{{DLV - schema_type}}` |
| `GA4 - tool_validate_meta` | GA4 Event | `tool_validate_meta` | `CE - tool_validate_meta` | `issues_found` = `{{DLV - issues_found}}` |
| `GA4 - tool_check_cwv` | GA4 Event | `tool_check_cwv` | `CE - tool_check_cwv` | `lcp_bucket` = `{{DLV - lcp_bucket}}` |
| `GA4 - article_read` | GA4 Event | `article_read` | `CE - article_read` | `article_slug` = `{{DLV - article_slug}}` |
| `GA4 - outbound_click` | GA4 Event | `outbound_click` | `Link - outbound` | `link_domain` = `{{JS - link_domain}}` |
| `GA4 - scroll_depth` | GA4 Event | `scroll_depth` | `Scroll - milestones` | `percent` = `{{Scroll Depth Threshold}}` |

### 6.1 Event source split (why some events are app-side and some GTM-native)

- **App-side (`pushEvent`) → Custom Event trigger:** the tool events and
  `article_read`. Only the app knows `schema_type` / `issues_found` /
  `lcp_bucket` / `article_slug`, so these must be pushed from React.
- **GTM-native (no app code):** `page_view` (History Change), `outbound_click`
  (Just Links), `scroll_depth` (Scroll Depth). Keeping these in GTM avoids
  shipping tracking JS to every page.

> Reconciliation note: `src/lib/analytics.ts` currently also declares
> `outbound_click` in its typed union. With outbound handled GTM-native, that
> union member is optional — keep it only if a component ever needs to push an
> outbound click manually (finer control); otherwise it is harmless dead code.

---

## 7. Consent configuration (per tag)

_Target:_ every GA4 tag → Advanced Settings → Consent Settings →
**Require additional consent for tag to fire: not required** (rely on Google's
**built-in** `analytics_storage` check). Do **not** add a custom "consent
granted" trigger — that would turn this into *basic* mode and suppress the
cookieless pings we intentionally keep.

_Observed:_ `google_tag_data.ics.entries.analytics_storage` reported
`{ default: false, update: true }` after "Aceitar" — GA4 correctly sees
default-denied then granted.

---

## 8. The `page_view` double-count trap (read before you ship)

`page_view` on SPA navigations can be produced by **two** mechanisms:

1. **GTM History Change trigger** → `GA4 - page_view (SPA)` tag (this doc's
   choice), or
2. **GA4 Enhanced Measurement** → "Page changes based on browser history
   events" (on by default in the GA4 data stream).

Running **both** double-counts every SPA pageview. Pick one:

- **Decision (per `measurement-plan.md`): use the GTM History Change trigger.**
  Therefore, in GA4 Admin → Data Streams → Enhanced Measurement →
  ⚙ → **turn OFF "Page changes based on browser history events."** Leave the
  rest of Enhanced Measurement as desired.

_Observed:_ exactly **one** `page_view` hit fired per navigation (home →
`/guia/...`), so no double-count is currently occurring — but confirm which
mechanism is active before adding the GTM tag, to avoid introducing one.

---

## 9. Verification (Objective O3)

Verified 2026-07-13 by inspecting real `/g/collect` requests on a local run
against `GTM-N5RB56R9`:

- [x] Consent default denied pushed before `gtm.js`
- [x] "Aceitar" → `gcs=G101`, `_ga` cookies written, `page_view` sent
- [x] "Recusar" / no choice → `gcs=G100`, **no `_ga` cookies** (cookieless ping)
- [x] SPA navigation → second `page_view` with correct `dl`/`dt`
- [x] No console errors
- [ ] Tag Assistant (GTM Preview) connects to the live domain
- [ ] Same hits confirmed in GA4 Admin → DebugView (`debug_mode`) on production
- [ ] Tool / `article_read` / `outbound_click` / `scroll_depth` events (ship with the tools & articles)
- [ ] Tool events marked as **key events** in GA4 Admin → Events

---

## 10. Ultimate reproducibility: export the container

A written spec drifts. For a true portfolio artifact, also commit the raw
container definition:

1. GTM → **Admin → Export Container** → choose the current version/workspace.
2. Save the JSON as `docs/gtm-container-export.json` (contains only public IDs
   — GTM/GA4 IDs are exposed client-side anyway, no secrets).
3. Re-export and re-commit whenever the container changes.

Anyone can then **Admin → Import Container** to reproduce it exactly, and
reviewers can diff container changes in Git alongside the code.
