# Field data (CrUX) baseline — 2026-07-20

> **Status: awaiting capture (owner-run).** Needs a CrUX/PSI API key, which per
> CLAUDE.md §14 lives only in Vercel environment variables. Fill every
> `_pending_`, then flip this line to `Status: captured`.

## Expected result at this date: no field data

The site went live in July 2026 with effectively no traffic. CrUX only reports
an origin or a URL once it has enough distinct visitors in the 28-day window, so
**"origin not found in the CrUX dataset" is the expected answer today** — and it
is exactly the datapoint worth recording. The moment the origin *does* enter
CrUX is itself a milestone for objective O1.

Recording the absence now is what makes the later presence measurable.

## 1. Origin-level field data

```bash
curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"origin":"https://seotecnico.dev.br","formFactor":"PHONE"}'
```

| Metric (p75, phone) | Value | Good threshold |
|---|---|---|
| LCP | _pending_ | ≤ 2.5s |
| INP | _pending_ | ≤ 200ms |
| CLS | _pending_ | ≤ 0.1 |
| TTFB | _pending_ | ≤ 800ms |

If the response is `404 CrUX data not found`, write **"not in dataset"** in
every row above and record the date the query was run. Do not leave it blank.

Query run on: _pending_
Result: _pending_ (`data returned` / `not in dataset`)

## 2. URL-level field data

Same call with `"url"` instead of `"origin"`. Only worth running once the
origin appears — URL-level data needs far more traffic than origin-level.

| URL | LCP | INP | CLS | In dataset? |
|---|---|---|---|---|
| `/` | | | | _pending_ |
| `/blog/melhorar-lcp-nextjs` | | | | _pending_ |
| `/ferramentas/gerador-json-ld` | | | | _pending_ |

## 3. RUM cross-check (own data)

The site collects its own field data through `web-vitals` → GTM → GA4 (live
since 2026-07-18, see [`../../measurement-plan.md`](../../measurement-plan.md)).
This is the only field signal available *before* CrUX has enough traffic, and it
is the one that can be segmented by page.

_GA4 → Reports → Engagement, or Explore with the web-vitals custom dimensions.
Record the LCP distribution for the last 28 days._

| Metric | Sample size | p75 | Good / needs improvement / poor |
|---|---|---|---|
| LCP | _pending_ | _pending_ | _pending_ |
| INP | _pending_ | _pending_ | _pending_ |
| CLS | _pending_ | _pending_ | _pending_ |

Caveat to record alongside the numbers: RUM here is consent-gated (LGPD banner,
Consent Mode v2 default-denied), so the sample is only visitors who accepted
analytics. It is a biased sample, not a census — useful for direction, not for
claiming a p75 equal to CrUX's.

## 4. Lab cross-check

Lab numbers for the same date are already captured automatically in
[`lighthouse.md`](lighthouse.md). Lab and field measure different things: lab is
one synthetic run on a throttled connection, field is the p75 of real visits
over 28 days. A green lab result does not predict a green field result — it only
removes lab-visible causes.

## Capture checklist

- [ ] Origin query run and result recorded (including "not in dataset")
- [ ] URL-level queries run or explicitly skipped with a reason
- [ ] GA4 RUM distribution recorded
- [ ] Status line at the top flipped to `captured`
