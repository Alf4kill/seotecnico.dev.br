// ─────────────────────────────────────────────────────────────────────────────
// Raw vs rendered HTML, for every sitemap URL (docs/crawl-audit-2026-10.md).
//
// Neither the free Screaming Frog nor advertools executes JavaScript, and the
// Playwright SEO suite reads only the rendered DOM — so nothing in the repo
// compares the two. This does: each page is opened twice in Chromium, once with
// JavaScript disabled (what an HTML-only reader gets: Googlebot's first wave,
// ChatGPT, Claude, Gemini per /blog/quais-ias-executam-javascript) and once with
// it enabled, and the visible text, links, headings and JSON-LD are compared.
//
//   node audits/scripts/raw-vs-rendered.mjs --base http://localhost:3000 \
//     --out audits/crawl-2026-10-23
//
// GTM and every other third-party host is blocked: the local build carries no
// container id, and this keeps it that way even if one is ever added.
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const USER_AGENT = 'seotecnico-audit/1.0 (+https://seotecnico.dev.br/sobre)'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const base = arg('base', 'http://localhost:3000').replace(/\/$/, '')
const out = arg('out')
if (!out) throw new Error('--out is required')

const sitemapXml = await (await fetch(`${base}/sitemap.xml`, { headers: { 'user-agent': USER_AGENT } })).text()
const paths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)

/** Everything an HTML reader could cite or follow, read from the live DOM. */
const snapshot = () => {
  const words = (document.body.innerText || '').split(/\s+/).filter(Boolean)
  return {
    words,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => `${h.tagName}:${h.textContent.trim()}`),
    jsonld: document.querySelectorAll('script[type="application/ld+json"]').length,
    title: document.title,
  }
}

const browser = await chromium.launch()
const contexts = {
  raw: await browser.newContext({ javaScriptEnabled: false, userAgent: USER_AGENT }),
  rendered: await browser.newContext({ javaScriptEnabled: true, userAgent: USER_AGENT }),
}
for (const context of Object.values(contexts)) {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === base ? route.continue() : route.abort()
  )
}

const rows = []
for (const path of paths) {
  const views = {}
  for (const [mode, context] of Object.entries(contexts)) {
    const page = await context.newPage()
    await page.goto(`${base}${path}`, { waitUntil: mode === 'rendered' ? 'networkidle' : 'load' })
    views[mode] = await page.evaluate(snapshot)
    await page.close()
  }
  const { raw, rendered } = views
  const rawWords = new Set(raw.words)
  const onlyRendered = [...new Set(rendered.words.filter((w) => !rawWords.has(w)))]
  const rawLinks = new Set(raw.links)
  rows.push({
    path,
    rawWords: raw.words.length,
    renderedWords: rendered.words.length,
    wordDelta: rendered.words.length - raw.words.length,
    onlyRenderedSample: onlyRendered.slice(0, 25).join(' '),
    linksOnlyRendered: [...new Set(rendered.links.filter((l) => !rawLinks.has(l)))],
    linksOnlyRaw: [...new Set(raw.links.filter((l) => !rendered.links.includes(l)))],
    headingsChanged: raw.headings.join('|') !== rendered.headings.join('|'),
    jsonldRaw: raw.jsonld,
    jsonldRendered: rendered.jsonld,
    titleChanged: raw.title !== rendered.title,
  })
  process.stdout.write('.')
}
await browser.close()

const differs = rows.filter(
  (r) => r.wordDelta !== 0 || r.linksOnlyRendered.length || r.linksOnlyRaw.length || r.headingsChanged || r.jsonldRaw !== r.jsonldRendered || r.titleChanged
)
const summary = {
  base,
  pages: rows.length,
  pagesThatDiffer: differs.length,
  pagesWithMoreTextRendered: rows.filter((r) => r.wordDelta > 0).length,
  pagesWithLessTextRendered: rows.filter((r) => r.wordDelta < 0).length,
  pagesWithLinksOnlyRendered: rows.filter((r) => r.linksOnlyRendered.length).length,
  pagesWithHeadingChanges: rows.filter((r) => r.headingsChanged).length,
  pagesWithJsonLdChanges: rows.filter((r) => r.jsonldRaw !== r.jsonldRendered).length,
  pagesWithTitleChanges: rows.filter((r) => r.titleChanged).length,
  largestDeltas: [...rows].sort((a, b) => Math.abs(b.wordDelta) - Math.abs(a.wordDelta)).slice(0, 10)
    .map(({ path, rawWords, renderedWords, wordDelta }) => ({ path, rawWords, renderedWords, wordDelta })),
}

mkdirSync(join(out, 'rendered'), { recursive: true })
writeFileSync(join(out, 'rendered', 'raw-vs-rendered.json'), JSON.stringify(rows, null, 2) + '\n')
writeFileSync(join(out, 'summary-rendered.json'), JSON.stringify(summary, null, 2) + '\n')
console.log('\n' + JSON.stringify(summary, null, 2))
