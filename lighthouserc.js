// ─────────────────────────────────────────────────────────────────────────────
// Lighthouse CI — performance budgets (CLAUDE.md §6/§8):
//   Performance ≥ 95 · LCP < 2.0s · CLS < 0.05 · TBT < 200ms (lab proxy for INP)
//
// URLs cover one page per template. Blog posts share a single template, so only
// the newest post is audited (it changes automatically as content is published);
// the Playwright suite is what visits every post. Runs against the production
// server (`next start`) — a build must exist before `lhci autorun`.
//
// Never pointed at production: every request there passes through
// src/proxy.ts and becomes an `ai_crawler_hit`, which would contaminate the
// detection experiment's buckets (docs/detection-experiment.md). Field
// performance is the RUM pipeline's job, not this file's.
// ─────────────────────────────────────────────────────────────────────────────

// CommonJS by necessity: @lhci/cli loads this file via require().
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const matter = require('gray-matter')

// Dedicated port so a dev server on 3000 is never audited by mistake.
const BASE_URL = 'http://localhost:3200'

/** Slug of the most recently published post in /content/blog, if any. */
function newestPostSlug() {
  const dir = path.join(__dirname, 'content', 'blog')
  if (!fs.existsSync(dir)) return undefined

  const posts = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => matter(fs.readFileSync(path.join(dir, file), 'utf8')).data)
  return posts
    .sort((a, b) => String(b.datePublished).localeCompare(String(a.datePublished)))
    .at(0)?.slug
}

const paths = [
  '/',
  '/guia/seo-tecnico-nextjs',
  '/blog',
  '/ferramentas',
  '/ferramentas/gerador-json-ld',
  '/ferramentas/validador-meta-tags',
  '/ferramentas/checador-cwv',
  '/en/guide/technical-seo-nextjs',
  '/en',
  '/en/about',
  '/design',
  '/en/design',
  '/sobre',
  '/politica-de-privacidade',
]
const slug = newestPostSlug()
if (slug) paths.push(`/blog/${slug}`)

// Sharding (ci.yml runs one job per shard, in parallel). Round-robin over the
// list, so each shard gets a mix of templates. LHCI_SHARD is 1-based, because
// GitHub expressions cannot do arithmetic on the matrix value. Unset = every
// URL, which is what a local `npm run lhci` does.
const shardTotal = Number(process.env.LHCI_SHARD_TOTAL ?? 1)
const shard = Number(process.env.LHCI_SHARD ?? 1)
if (!(Number.isInteger(shard) && shard >= 1 && shard <= shardTotal)) {
  throw new Error(`LHCI_SHARD=${shard} is outside 1..${shardTotal}`)
}
const shardPaths = paths.filter((_, i) => i % shardTotal === shard - 1)

module.exports = {
  ci: {
    collect: {
      url: shardPaths.map((p) => `${BASE_URL}${p === '/' ? '' : p}`),
      startServerCommand: 'npm run start -- --port 3200',
      startServerReadyPattern: 'Ready',
      numberOfRuns: 3,
      settings: {
        // Real (devtools) throttling instead of the default lantern simulation:
        // lantern models the preloaded webfont as an LCP dependency and reports
        // ~2.4s even though font-display: swap paints the text at FCP (measured:
        // simulated LCP 2418ms vs devtools LCP 1676ms = FCP on the same build).
        throttlingMethod: 'devtools',
        // GitHub Actions runners need --no-sandbox to launch Chrome.
        chromeFlags: '--no-sandbox',
        // CI builds with the real GTM container (ci.yml), so gtm.js, gtag.js
        // and every tag they run are part of the measured page, as they are
        // for a real visitor. Only the beacons that would land in GA4 are
        // cut: an audit must never write localhost pageviews or web_vitals
        // into the human property (Consent Mode v2 advanced sends cookieless
        // pings even while consent is denied). The scripts still download and
        // execute; a blocked beacon costs nothing measurable.
        blockedUrlPatterns: [
          '*google-analytics.com*',
          '*analytics.google.com*',
          '*/g/collect*',
          '*google.com/ccm/*',
          '*doubleclick.net*',
        ],
      },
    },
    assert: {
      assertions: {
        // median-run: devtools throttling is a real measurement, so single
        // outlier runs must not fail the budget.
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      // Free report hosting (link printed in the CI log, expires in ~7 days).
      target: 'temporary-public-storage',
    },
  },
}
