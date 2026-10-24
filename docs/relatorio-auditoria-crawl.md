# Report — crawl audit (seotecnico.dev.br)

Date: 2026-10-23 · Branch: `feat/crawl-audit` · Commits: `33427a3` tooling ·
`a729d8e` security headers · `aa6f068` external link · `3f0e70d` `e376922`
`861ac0a` `5f36677` audit record and apex · `4918090` Search Console join ·
`4ec7bff` join, traces and the Screaming Frog window · this report in the
commit after them.

Every number below comes from a crawl export, a script output or a command run
on 2026-10-23. Anything that was not measured says so. The working record,
with the evidence for each line, is [`crawl-audit-2026-10.md`](crawl-audit-2026-10.md).

## Tools and why

- **Screaming Frog SEO Spider 24.3, free version.** Job postings ask for it by
  name, and at 68 pages the site is far below the free cap of 500 URLs per
  crawl. It was the reference crawl and produced the issue report.
- **advertools 0.18.0 (Scrapy).** It covers what the free licence locks: an own
  user agent, `robots.txt` obedience and crawl delay, custom XPath extraction,
  and a link graph that can be joined with the sitemap and Search Console.
- **Playwright.** Neither of the two above runs JavaScript, so each page was
  opened with JavaScript off and on and the two versions compared.
- **Rejected:** LibreCrawl (no tagged releases, settings kept in localStorage,
  Windows auto-install disabled), SEOnaut (Go + MySQL, no documented JS
  rendering), Ahrefs Webmaster Tools (crawls production with a third-party
  bot; postponed).

## Limits of the free version, met in practice

- No configuration: the user agent stays `Screaming Frog SEO Spider/24.3`, and
  speed and robots handling cannot change. That is why the crawl ran against a
  local build and not production.
- No JavaScript rendering (Crawl Config › Spider › Rendering is locked to
  "Text Only" without a licence, checked in the program), no custom extraction, no Search Console or
  Analytics integration, no saving a crawl. advertools, Playwright and a
  manual Search Console export covered each of these.
- The 500-URL cap was not reached: 198 URLs encountered, 86 internal.

## URLs crawled

- **Screaming Frog:** 198 URLs (86 internal, 112 external). The 86 internal
  ones are **68 HTML pages**, 14 JS chunks, 3 images and 1 feed.
- **advertools:** 69 internal URLs (68 HTML + feed), 2,442 internal links, 420
  external links to 19 domains. 64 distinct external URLs were checked once
  each.
- **Agreement:** both list the same 68 HTML pages, and the click depth matches
  on all 68. The production sitemap lists the same 68 URLs.

## How the crawler experiment was protected

- All three crawls ran against a local production build of `ba2b5af` (the
  commit in production). The build had no `GA4_CRAWLER_*` secrets and an
  empty GTM id, so neither GA4 property could receive anything. The
  `.env.local` GTM id is the real container, and it was blanked on purpose.
- No crawler was seeded with `/llms.txt`, which links the llms trap.
- The domain pointed at localhost, so canonicals, hreflang and the sitemap
  kept every crawler on the local host.
- Production received only a seeded pass: 9 seeds, 1 request per second, user
  agent `seotecnico-audit/1.0`, 2026-10-23 21:25–21:32 UTC. The owner's earlier
  Screaming Frog attempt (about 21:45 UTC) most likely never reached the
  server. Both windows are in the synthetic-traffic register of
  `measurement-plan.md`.
- The DNS checks after the change (23:35 UTC) were DNS lookups, TCP connects
  and one TLS handshake, with no HTTP request.

## Cross-check with Search Console

Source: Performance → Pages, Web search, 2026-07-22 → 2026-10-21, a manual
export (there is no personal Search Console API for this project). The
indexing report was not exported, so "shown" means at least one impression.

- **Orphans** (shown in search, not reached by the crawl): **0**
- **Shown in search with no internal link:** **0**. Every page has at least 2
  linking pages.
- **Linked without impressions:** **21**. 19 of them were published on
  2026-10-18, 4 days before the window closed. The other 2 are `/laboratorio`
  (online since 2026-10-04) and `/blog/pre-registro-seo` (since 2026-10-08).
  Re-check on or after 2026-11-15.
- **CrUX:** no field data for the site. Confirmed by the owner on 2026-10-23,
  as on 2026-09-11.

## Findings by type

| Type | N | Verdict |
|---|---|---|
| Network reachability of the apex domain | 1 | **Fixed** (DNS, outside the repository) |
| Missing security headers (`nosniff`, `X-Frame-Options`, `Referrer-Policy`) | 1 finding on 86/86 URLs | **Fixed** in code + CI test |
| Missing Content-Security-Policy | 1 finding on 83/86 URLs | Kept |
| External link through a redirect | 1 (2 pages) | **Fixed** |
| External link blocked for bots (DOI → 403) | 1 (2 pages) | Kept |
| Snippet width over Screaming Frog's estimate | 4 pages (2 titles, 2 descriptions) | Kept |
| Image alt over 100 characters | 3 images | Kept |
| H2 duplicate / over 70 characters | 4 / 3 pages | Kept |
| Low word count / short title | 2 / 1 pages | Kept |
| Screaming Frog issues caused by crawling `http://localhost` | 3 issue types | Not findings |
| Not applicable to this site (Flesch for pt-BR, `rss+xml` as bad type, informational filters) | 5 issue types | Not findings |
| Broken internal links, links to redirects, hreflang errors, orphans, pages deeper than 3 | 0 each | — |

## Fixed: 3 · Kept by decision: 9

**Fixed**
1. **Apex reachability.** The apex had a single A record, `216.198.79.1`, in
   Vercel's new range. From the owner's residential ISP every connection to
   that range failed, while 17 of 18 check-host nodes and a São Paulo node
   connected. `tracert` placed the break after the ISP core, and a trace to
   `76.76.21.21` completed. The A record moved to `76.76.21.21` at 23:34 UTC,
   and DNS, TCP and TLS were verified at 23:35 UTC.
2. **Security headers**, in `next.config.ts`, locked by a Playwright test.
3. **Perplexity documentation link** updated to its final URL.

**Kept, with the reason**
1. **CSP:** a useful policy needs nonces or hashes for GTM, the inline
   ThemeScript and JSON-LD. That is a separate decision with a performance
   cost to measure.
2. **DOI link:** a DOI is the canonical citation, and the 403 is the
   publisher's bot wall.
3. **Titles over 561 px:** 1–3 px over an estimate, ≤60 characters.
4. **Descriptions over 985 px:** 2–5 px over an estimate, ≤155 characters.
5. **Long alt text:** PSI screenshots whose alt carries the measured values.
   Shortening it is an accessibility call left open for the owner.
6. **Duplicate H2:** section names repeated across one experiment series.
7. **H2 over 70 characters:** a manifesto line and one numbered heading.
8. **Low word count:** the two tool index pages.
9. **Short title:** the English privacy page.

Also kept: the apex stays on the legacy address despite Vercel's "DNS Change
Recommended", until the route to `216.198.79.0/24` works from that ISP.

## Raw vs rendered HTML

On all **68** pages, the text, links, headings, JSON-LD and title are identical
with JavaScript off and on. The only difference is the copy button's label on
code blocks ("COPIAR"/"COPY"), added after hydration: +1 to +12 words on 44
pages, and on every one of them the extra words are only that label. The three tools serve their explanatory content and
their form markup in the HTML.

## Case published at

`docs/crawl-audit-2026-10.md` (working record), and the article pair
`/blog/screaming-frog-gratuito` + `/en/blog/screaming-frog-free-version`,
published with `/blog/arvore-de-acessibilidade` + `/en/blog/accessibility-tree`
(the accessibility side of the same day) and linked both ways.

## Time spent

About 2 h 45 min of working session (first crawl 21:18 UTC, this report 23:57
UTC, plus the planning before it). The owner's own time in Screaming Frog,
Search Console, Vercel and registro.br was not measured.

## Suggested CV line (no inflation)

> Ran a crawl audit of my own 68-page Next.js site with Screaming Frog (free),
> advertools and Playwright, cross-checked against Search Console. It found an
> ISP-level route failure to the apex domain (fixed via DNS) and missing
> security headers (fixed in config, enforced in CI).

PT: *Auditoria de crawl do meu site Next.js (68 páginas) com Screaming Frog
(versão gratuita), advertools e Playwright, cruzada com o Search Console:
encontrei falha de rota de uma operadora até o domínio principal (corrigida
via DNS) e headers de segurança ausentes (corrigidos na configuração e
travados no CI).*
