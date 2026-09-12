# Field data (CrUX) baseline — 2026-09-11

> **Status: captured (partial).** Section 3 (own RUM) is still `_pending_` — it
> needs GA4 access. Sections 1 and 2 are real, verified on 2026-09-11.

## Result: the origin is still not in the CrUX dataset

The [2026-07-20 baseline](../2026-07-20/crux.md) predicted this and explained
why recording the absence matters: CrUX only reports an origin once it has
enough distinct visitors in the 28-day window, so **"not in dataset" is the
expected answer for a site with almost no traffic** — and the moment the origin
*does* enter CrUX is itself a milestone for objective **O1**.

Fifty-three days later, the answer is unchanged. That is not a regression; it is
the same datapoint, now with a second dated observation behind it.

## 1. Origin-level field data

| Metric (p75) | PHONE | DESKTOP | Good threshold |
|---|---|---|---|
| LCP | not in dataset | not in dataset | ≤ 2.5s |
| INP | not in dataset | not in dataset | ≤ 200ms |
| CLS | not in dataset | not in dataset | ≤ 0.1 |
| TTFB | not in dataset | not in dataset | ≤ 800ms |

Query run on: **2026-09-11**
Result: **not in dataset** (both form factors)

### How it was queried — through the site's own tool

Rather than calling the CrUX API directly, this capture went through
`/api/checador-cwv`, the production endpoint behind **Tool 3**
(`/ferramentas/checador-cwv`), pointed at this site's own origin:

```bash
curl -H "Origin: https://seotecnico.dev.br" \
  "https://seotecnico.dev.br/api/checador-cwv?origin=https%3A%2F%2Fseotecnico.dev.br&formFactor=PHONE"
```

```json
{"origin":"https://seotecnico.dev.br","formFactor":"PHONE",
 "period":{"firstDate":"","lastDate":""},"metrics":[],
 "lcpBucket":"no-data","inDataset":false}
```

`DESKTOP` returns the same shape. Two things are established by one call:

1. The origin is absent from CrUX on 2026-09-11.
2. **Tool 3 works in production** and `CRUX_API_KEY` is correctly configured in
   Vercel — the tool returns a structured `no-data` answer rather than an error,
   which is the behaviour `measurement-plan.md` specifies (`no-data` is a
   first-class value, not a failure).

This is the project dogfooding its own instrument, which is the point of §7.3.

## 2. URL-level field data

**Skipped, with reason.** URL-level CrUX needs substantially more traffic than
origin-level. With the origin itself absent, every URL is necessarily absent —
running the queries would produce three identical `not in dataset` rows and no
information.

| URL | LCP | INP | CLS | In dataset? |
|---|---|---|---|---|
| `/` | — | — | — | skipped (origin absent) |
| `/blog/melhorar-lcp-nextjs` | — | — | — | skipped (origin absent) |
| `/ferramentas/gerador-json-ld` | — | — | — | skipped (origin absent) |

Re-run these only after the origin appears.

## 3. RUM cross-check (own data)

The site collects its own field data through `web-vitals` → GTM → GA4 (LCP live
since 2026-07-18, INP since 2026-07-22 — see
[`../../measurement-plan.md`](../../measurement-plan.md)). This is the only
field signal available *before* CrUX has enough traffic, and the only one that
can be segmented by page.

_GA4 → Explore, using the `web_vitals` custom dimensions. Record the
distribution for the last 28 days._

| Metric | Sample size | p75 | Good / needs improvement / poor |
|---|---|---|---|
| LCP | _pending_ | _pending_ | _pending_ |
| INP | _pending_ | _pending_ | _pending_ |
| CLS | not collected | — | CLS is not yet emitted by `src/lib/rum.ts` |

Caveat to record alongside the numbers: RUM here is consent-gated (LGPD banner,
Consent Mode v2 default-denied), so the sample is only visitors who accepted
analytics. It is a biased sample, not a census — useful for direction, not for
claiming a p75 equal to CrUX's.

A second caveat specific to this date: GSC recorded **4 clicks in three months**.
Whatever the RUM sample is, it is too small to carry a p75. Record it as a
count, and resist reading a percentile out of single digits.

## 4. Lab cross-check

Lab numbers for the same date are captured automatically in
[`lighthouse.md`](lighthouse.md). Lab and field measure different things: lab is
one synthetic run on a throttled connection, field is the p75 of real visits
over 28 days. A green lab result does not predict a green field result — it only
removes lab-visible causes.

With no field data at all, lab is currently the **only** performance evidence
this project has. That is worth stating plainly rather than letting a green
Lighthouse column imply more than it can.

## Capture checklist

- [x] Origin query run and result recorded (including "not in dataset")
- [x] URL-level queries explicitly skipped with a reason
- [ ] GA4 RUM distribution recorded
- [x] Status line at the top set to `captured (partial)`
