// ─────────────────────────────────────────────────────────────────────────────
// Baseline crawler (CLAUDE.md §11, Phase 2 item 8).
//
// Rastreia todas as URLs do sitemap de produção e extrai os mesmos sinais que a
// suíte Playwright afirma — título, description, canonical, H1, JSON-LD — mais
// o grafo de links internos (profundidade de clique e páginas órfãs, §6).
//
// Não substitui o Screaming Frog: substitui a parte do crawl que precisa ser
// versionada e comparável entre datas, sem depender de app externo.
//
//   node scripts/baseline-crawl.mjs                     → docs/baseline/<hoje>/
//   node scripts/baseline-crawl.mjs --base http://localhost:3000 --out /tmp/x
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const BASE = (arg('base', 'https://seotecnico.dev.br')).replace(/\/$/, '')
// Data local (não UTC): o baseline é nomeado pelo dia em que foi capturado.
const TODAY = new Date().toLocaleDateString('sv-SE')
const OUT = arg('out', path.join('docs', 'baseline', TODAY))
const FORCE = argv.includes('--force')

// Rotas fora do sitemap por design, verificadas à parte: precisam responder o
// status certo (busca e 404 são noindex; robots e feed são infraestrutura).
const OFF_SITEMAP = ['/robots.txt', '/feed.xml', '/busca', '/nao-existe-probe-404']

const TITLE_MAX = 60
const DESCRIPTION_MAX = 155

async function get(url) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'seotecnico-baseline-crawler' },
  })
  const isRedirect = res.status >= 300 && res.status < 400
  return {
    status: res.status,
    location: res.headers.get('location'),
    contentType: res.headers.get('content-type'),
    body: isRedirect ? '' : await res.text(),
  }
}

const first = (re, html) => html.match(re)?.[1]?.trim()
const all = (re, html) => [...html.matchAll(re)].map((m) => m[1])
const decode = (s) =>
  s?.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")

/** Caminho normalizado (sem barra final, sem hash) para comparar links. */
const toPath = (href) => {
  const p = href.startsWith('http') ? new URL(href).pathname : href.split('#')[0]
  return p.replace(/\/$/, '') || '/'
}

function extract(url, html, status) {
  const blocks = all(
    /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g,
    html,
  )
  const jsonldTypes = []
  let jsonldValid = true
  for (const block of blocks) {
    try {
      for (const node of [].concat(JSON.parse(block))) jsonldTypes.push(node['@type'])
    } catch {
      jsonldValid = false
    }
  }

  const h1s = all(/<h1[^>]*>([\s\S]*?)<\/h1>/g, html).map((h) =>
    h.replace(/<[^>]+>/g, '').trim(),
  )

  const hrefs = all(/<a\s[^>]*href="([^"]+)"/g, html)
  const internal = [
    ...new Set(
      hrefs
        .filter((h) => (h.startsWith('/') && !h.startsWith('//')) || h.startsWith(BASE))
        .map(toPath),
    ),
  ].sort()
  const externalHosts = [
    ...new Set(
      hrefs
        .filter((h) => h.startsWith('http') && !h.startsWith(BASE))
        .map((h) => new URL(h).host),
    ),
  ].sort()

  // Contagem aproximada de palavras do texto visível: script, style e o texto
  // interno dos SVGs saem fora para não inflar o número.
  const words = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-ZÀ-ÿ]/.test(w)).length

  return {
    url,
    path: toPath(url),
    status,
    title: decode(first(/<title>([^<]*)<\/title>/, html)),
    description: decode(first(/<meta name="description" content="([^"]*)"/, html)),
    canonical: first(/<link rel="canonical" href="([^"]*)"/, html),
    robots: all(/<meta name="robots" content="([^"]*)"/g, html),
    lang: first(/<html[^>]*lang="([^"]*)"/, html),
    hreflang: all(/<link rel="alternate" hreflang="([^"]*)"/g, html),
    ogType: first(/<meta property="og:type" content="([^"]*)"/, html),
    ogImage: first(/<meta property="og:image" content="([^"]*)"/, html),
    h1Count: h1s.length,
    h1: h1s[0],
    h2Count: all(/<(h2)[^>]*>/g, html).length,
    jsonldBlocks: blocks.length,
    jsonldTypes,
    jsonldValid,
    words,
    htmlBytes: html.length,
    internalLinks: internal,
    externalHosts,
  }
}

/** Profundidade de clique a partir da home + contagem de links internos recebidos. */
function linkGraph(pages) {
  const outbound = Object.fromEntries(pages.map((p) => [p.path, p.internalLinks]))
  const known = new Set(pages.map((p) => p.path))

  const inbound = Object.fromEntries(pages.map((p) => [p.path, 0]))
  for (const [source, links] of Object.entries(outbound)) {
    for (const link of links) {
      if (link !== source && known.has(link)) inbound[link] += 1
    }
  }

  const depth = { '/': 0 }
  const queue = ['/']
  while (queue.length > 0) {
    const current = queue.shift()
    for (const link of outbound[current] ?? []) {
      if (known.has(link) && depth[link] === undefined) {
        depth[link] = depth[current] + 1
        queue.push(link)
      }
    }
  }

  return { inbound, depth }
}

/** Prefixos de Disallow do robots.txt (User-agent: *). */
function disallowedPrefixes(robotsTxt) {
  const prefixes = []
  let inStarGroup = false
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.trim()
    const [field, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    if (/^user-agent$/i.test(field)) inStarGroup = value === '*'
    else if (inStarGroup && /^disallow$/i.test(field) && value) prefixes.push(value)
  }
  return prefixes
}

/** Regras da §6 aplicadas ao crawl: cada item vira uma linha de "achado". */
function findings(pages, graph, offSitemap, robotsTxt) {
  const issues = []
  const push = (severity, page, issue) => issues.push({ severity, page, issue })

  for (const p of pages) {
    if (p.status !== 200) push('error', p.path, `status ${p.status} in sitemap`)
    if (p.h1Count !== 1) push('error', p.path, `${p.h1Count} <h1> (must be exactly 1)`)
    if (!p.jsonldValid) push('error', p.path, 'a JSON-LD block does not parse')
    if (!p.jsonldTypes.length) push('error', p.path, 'no JSON-LD')
    if (!p.canonical) push('error', p.path, 'no canonical')
    else if (toPath(p.canonical) !== p.path) push('warn', p.path, `canonical points to ${p.canonical}`)
    if (!p.title) push('error', p.path, 'no <title>')
    else if (p.title.length > TITLE_MAX) push('warn', p.path, `title ${p.title.length} chars (max ${TITLE_MAX})`)
    if (!p.description) push('error', p.path, 'no meta description')
    else if (p.description.length > DESCRIPTION_MAX) push('warn', p.path, `description ${p.description.length} chars (max ${DESCRIPTION_MAX})`)
    if (p.robots.length > 1) push('warn', p.path, `${p.robots.length} robots meta tags: ${p.robots.join(' / ')}`)
    if (!p.ogImage) push('warn', p.path, 'no og:image')

    if (graph.depth[p.path] === undefined) push('error', p.path, 'orphan: unreachable from the home page')
    else if (graph.depth[p.path] > 3) push('warn', p.path, `click depth ${graph.depth[p.path]} (max 3)`)
  }

  const disallowed = disallowedPrefixes(robotsTxt)
  const blocked = (p) => disallowed.some((prefix) => p === prefix || p.startsWith(prefix))

  for (const [route, r] of Object.entries(offSitemap)) {
    const expected = route === '/nao-existe-probe-404' ? 404 : 200
    if (r.status !== expected) push('error', route, `status ${r.status}, expected ${expected}`)
    // Disallow + noindex se anulam: bloqueada no robots.txt, a página nunca é
    // rastreada, então o Google nunca lê o noindex dela.
    if (r.note?.includes('noindex') && blocked(route)) {
      push('warn', route, 'noindex + Disallow in robots.txt — the noindex can never be read')
    }
  }

  for (const p of pages) {
    if (blocked(p.path)) push('error', p.path, 'in the sitemap but disallowed in robots.txt')
  }

  return issues
}

function toMarkdown(data) {
  const { crawledOn, base, pages, graph, offSitemap, images, issues } = data
  const cell = (v) => (v === undefined || v === '' ? '—' : String(v))
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  const lines = []

  lines.push(`# Crawl baseline — ${crawledOn}`)
  lines.push('')
  lines.push(`> Generated by \`node scripts/baseline-crawl.mjs\` against \`${base}\`.`)
  lines.push('> Machine-readable companion: [`crawl.json`](crawl.json).')
  lines.push('')
  lines.push(
    `**${plural(pages.length, 'URL')} in the sitemap · ${plural(images.length, 'image')} declared · ` +
      `${plural(issues.filter((i) => i.severity === 'error').length, 'error')} · ` +
      `${plural(issues.filter((i) => i.severity === 'warn').length, 'warning')}**`,
  )
  lines.push('')

  lines.push('## Page inventory')
  lines.push('')
  lines.push('| Path | Status | Title (chars) | Desc (chars) | H1 | H2 | JSON-LD | Words | Depth | Inbound |')
  lines.push('|---|---|---|---|---|---|---|---|---|---|')
  for (const p of pages) {
    lines.push(
      `| \`${p.path}\` | ${p.status} | ${cell(p.title?.length)} | ${cell(p.description?.length)} | ${p.h1Count} | ${p.h2Count} | ${p.jsonldTypes.join(' + ') || '—'} | ${p.words} | ${cell(graph.depth[p.path])} | ${graph.inbound[p.path]} |`,
    )
  }
  lines.push('')

  lines.push('## Titles and descriptions')
  lines.push('')
  lines.push('| Path | Title | Description |')
  lines.push('|---|---|---|')
  for (const p of pages) {
    lines.push(`| \`${p.path}\` | ${cell(p.title)} | ${cell(p.description)} |`)
  }
  lines.push('')

  lines.push('## Off-sitemap routes')
  lines.push('')
  lines.push('| Route | Status | Note |')
  lines.push('|---|---|---|')
  for (const [route, r] of Object.entries(offSitemap)) {
    lines.push(`| \`${route}\` | ${r.status} | ${cell(r.note)} |`)
  }
  lines.push('')

  lines.push('## Findings')
  lines.push('')
  if (issues.length === 0) {
    lines.push('No issues: every page in the sitemap meets the CLAUDE.md §6 rules.')
  } else {
    lines.push('| Severity | Page | Issue |')
    lines.push('|---|---|---|')
    for (const i of issues) lines.push(`| ${i.severity} | \`${i.page}\` | ${i.issue} |`)
  }
  lines.push('')

  return lines.join('\n')
}

// ── Execução ────────────────────────────────────────────────────────────────

// Um baseline já capturado é registro histórico: re-rodar no mesmo dia (para
// verificar um fix, por exemplo) não pode sobrescrevê-lo em silêncio. Use
// --out para mandar a verificação a outro lugar, ou --force se a intenção for
// mesmo substituir a captura.
if (!FORCE && fs.existsSync(path.join(OUT, 'crawl.md'))) {
  console.error(
    `[baseline] ${OUT} already holds a capture.\n` +
      '  Re-running would overwrite it. Pass --out <dir> to write elsewhere,\n' +
      '  or --force to replace the existing capture on purpose.',
  )
  process.exit(1)
}

const sitemap = await get(`${BASE}/sitemap.xml`)
if (sitemap.status !== 200) {
  console.error(`[baseline] sitemap.xml returned ${sitemap.status} — aborting`)
  process.exit(1)
}

const urls = all(/<loc>([^<]+)<\/loc>/g, sitemap.body)
const images = all(/<image:loc>([^<]+)<\/image:loc>/g, sitemap.body)

const pages = []
for (const url of urls) {
  const res = await get(url)
  pages.push(extract(url, res.body, res.status))
  process.stderr.write(`  ${res.status} ${toPath(url)}\n`)
}

const offSitemap = {}
let robotsTxt = ''
for (const route of OFF_SITEMAP) {
  const res = await get(`${BASE}${route}`)
  if (route === '/robots.txt') robotsTxt = res.body
  const robots = all(/<meta name="robots" content="([^"]*)"/g, res.body)
  offSitemap[route] = {
    status: res.status,
    contentType: res.contentType,
    note: robots.length > 0 ? `robots: ${robots.join(' / ')}` : undefined,
  }
}

const graph = linkGraph(pages)
const data = {
  crawledAt: new Date().toISOString(),
  crawledOn: TODAY,
  base: BASE,
  urls,
  images,
  pages,
  graph,
  offSitemap,
}
data.issues = findings(pages, graph, offSitemap, robotsTxt)

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'crawl.json'), `${JSON.stringify(data, null, 2)}\n`)
fs.writeFileSync(path.join(OUT, 'crawl.md'), toMarkdown(data))

const errors = data.issues.filter((i) => i.severity === 'error').length
console.log(`[baseline] ${pages.length} pages → ${OUT} (${errors} errors, ${data.issues.length - errors} warnings)`)
