# Reading Search Console on this site

How to read the Search Console exports this project works from, and the
inconsistencies they show. Search Console data reaches the repository only as
manual exports (`CLAUDE.md` §7.3), so every number in the log depends on how
these reports behave. Started 2026-11-16, after a page-indexing snapshot
showed 15 published URLs out of the index (`experiment-log.md`, row of that
date).

Each point says where it comes from: **[Google]** is Search Console Help or
Search Central, read on 2026-11-16 (sources at the end); **[site]** is an
observation on this domain, with the log row that records it.

## 1. A page leaving the index and coming back is normal

- **[Google]** Not every page is indexed, and that is expected: "Don't expect
  every URL on your site to be indexed." "Crawled – currently not indexed"
  is described as "a common message for many sites", because "Google doesn't
  index all pages across the web".
- **[Google]** Indexing is not instant or guaranteed, even after a request:
  "Indexing is never instant, even when you submit a crawl request directly."
- **[site]** On 2026-10-13, seven indexed URLs showed as "Crawled – currently
  not indexed" with no site change and no recrawl. All seven were back in the
  indexed list of 2026-11-12, each crawled on 2026-10-18 (rows 2026-10-13 and
  2026-11-16).
- **[site]** On 2026-11-12, 15 of the 88 sitemap URLs were out of the indexed
  list, six of them older articles that had impressions in the same months
  (row 2026-11-16).

**What this means for the log.** One absence in one snapshot is not an
incident and is not read as an effect of any change. The owner re-requests
indexing as routine maintenance, and nothing is measured about it (rule of
2026-11-15). The reason for a missing URL is looked at only when the same URL
is out in two consecutive exports, or when URL Inspection reports it as not
indexed.

## 2. The Page indexing report is a snapshot, not a per-URL tool

- **[Google]** "This report isn't used to investigate the index status of
  specific pages"; URL Inspection is the tool for one URL.
- **[Google]** New content "can take a few days" to be indexed, and a
  validation "typically takes up to about two weeks".
- **[site]** The indexed list exported on 2026-11-16 was dated 2026-11-12.
  Pages published on 2026-11-13 and 2026-11-14 were missing from it, and
  project entry 3 already had impressions on both URLs while still absent
  from the list (row 2026-11-14, entry 3).
- **[site]** A URL can have impressions in a period and be absent from the
  indexed list at the end of it: it was indexed at some point, and it is out
  on the list's date. `/en/case-studies` had 11 impressions and was out on
  2026-11-12 (row 2026-09-24).

## 3. URL Inspection: the indexed result and the live test answer different questions

- **[Google]** The default result is "from most recently indexed version of
  a page, not the live version". The live test "only confirms if
  Google-InspectionTool can access your page", and "a positive result is not
  a guarantee that it will appear in Search results".
- **[Google]** The live test does not check duplicate or canonical
  conditions.
- **[site]** A live test can fail for a moment and pass minutes later. On
  2026-11-15 at 12:25 BRT, two live tests failed with "Robots.txt
  inacessível" in the same minute as a production deploy, and the
  robots.txt report recorded "Não buscado – N/D". From outside, robots.txt
  answered 200 in under 0.4 s, and a Googlebot fetch logged by Vercel shortly
  after got 200. A recrawl request in Settings → robots.txt brought the
  report back to "Buscado" (1,117 bytes), and the live tests passed. Avoid
  live tests in the first minutes after a merge.

## 4. Performance: what the export can and cannot say

- **[Google]** Anonymized queries "aren't issued by more than a few dozen
  users over a two-to-three month period" and are not shown. They "are
  omitted whenever a filter is applied", so filtered sums do not match the
  totals.
- **[site]** At the 2026-09-11 baseline, 80% of the site's impressions came
  from anonymized queries. No declared `primaryQuery` appeared in the named
  list.
- **[Google]** Average position is the topmost position of the site's link,
  "averaged across all queries". A page's average describes the page, not
  its target query.
- **[Google]** The UI exports at most 1,000 rows, and the newest data "can be
  preliminary".
- **[site]** The export has separate tables for queries, pages and countries,
  with no join between them. A query that matches a hypothesis cannot be tied
  to a page or a country from that file. To get the join, filter the report
  by page or country before exporting, knowing that the filter drops the
  anonymized queries.

## 5. The Generative AI report

- **[site]** The export carries impressions only, by page, country, device
  and date. No clicks, no queries. On 2026-11-16 it listed 52 URLs with at
  least one impression since 2026-07-11.

## Sources (read 2026-11-16)

- [Page indexing report](https://support.google.com/webmasters/answer/7440203), Search Console Help
- [URL Inspection tool](https://support.google.com/webmasters/answer/9012289), Search Console Help
- [Performance report (Search results)](https://support.google.com/webmasters/answer/7576553), Search Console Help
- [What are impressions, position, and clicks?](https://support.google.com/webmasters/answer/7042828), Search Console Help
- [A deep dive into Search Console performance data filtering and limits](https://developers.google.com/search/blog/2022/10/performance-data-deep-dive), Search Central Blog, 2022-10-19
