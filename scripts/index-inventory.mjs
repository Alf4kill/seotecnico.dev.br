// ─────────────────────────────────────────────────────────────────────────────
// Inventário de indexáveis: o que um site oferece para indexar, tipo por tipo,
// e quanto texto próprio cada tipo de página carrega.
//
// Para cada alvo (uma origem):
//   1. lê o robots.txt e abre os sitemaps (declarados + caminhos padrão);
//   2. pede cada <loc> uma vez (GET, sem seguir redirect) e guarda o HTML;
//   3. por página: status, noindex, canonical (própria, outra URL, ausente),
//      title, description, H1, palavras do conteúdo, palavras próprias (fora
//      dos blocos que se repetem no site), tipos de JSON-LD, links internos,
//      tempo até o primeiro byte e bytes;
//   4. por arquivo de taxonomia (tag, categoria): quantos posts ele lista;
//   5. por tipo de sitemap: quantas URLs ficam indexáveis e o que elas têm.
// Fase opcional `crux`: os Core Web Vitals de campo da origem (p75, 28 dias),
// pela rota pública do checador de CWV deste site (/api/checador-cwv), que
// consulta a API do Chrome UX Report.
// Base: docs/research/2026-11-16-index-inventory.md.
//
// Regras de coleta (docs/proposals/case-studies-content.md §3–§4), as mesmas de
// scripts/sitemap-audit.mjs:
// - node:https, não fetch (o fetch do Node acrescenta sec-fetch-mode: cors,
//   PR #95); cabeçalhos: só User-Agent, Accept e Accept-Encoding;
// - robots.txt lido antes; caminho bloqueado não é pedido;
// - uma requisição por vez, pausa mínima de PAUSE_MS (ou o Crawl-delay);
// - nada de busca no Google; URLs de outro host num sitemap são contadas,
//   nunca pedidas.
//
// Fases, para que a análise possa ser refeita sem pedir nada de novo:
//   node scripts/index-inventory.mjs fetch   --targets <arquivo.json> [--out <pasta>] [--only S3]
//   node scripts/index-inventory.mjs probe   --targets <arquivo.json> [--out <pasta>] [--only S3]
//   node scripts/index-inventory.mjs crux    --targets <arquivo.json> [--out <pasta>] [--only S3]
//   node scripts/index-inventory.mjs analyze --targets <arquivo.json> [--out <pasta>] [--only S3]
//
// Saída em <out>/: html/<código>/*.html, raw-<código>.json e crux-<código>.json
// (locais, ver .gitignore: trazem hosts, caminhos e texto) e summary.json
// (versionável). Alvos de terceiros saem só pelo código e por números:
// totais à dezena (à centena acima de mil), contagens pequenas em faixas
// (1–4, 5–9) e proporções com duas casas. Alvos `public: true` saem exatos.
//
// Formato do arquivo de alvos: audits/case-studies/index-inventory.example.json.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const [command, ...argv] = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const TODAY = new Date().toISOString().slice(0, 10)
const TARGETS = arg('targets')
// Where runs land, and who the crawl says it is. The defaults keep every run
// already recorded in this repository reproducible; the environment variables
// are for pointing the toolkit at your own targets from your own repository
// (audits/case-studies/README.md).
const OUT_BASE = process.env.AUDIT_OUT_DIR ?? path.join('audits', 'case-studies')
const OUT = arg('out', path.join(OUT_BASE, `index-inventory-${TODAY}`))
const ONLY = arg('only')
const UA_TOKEN = process.env.AUDIT_UA_TOKEN ?? 'seotecnico-index-inventory'
const UA = `${UA_TOKEN}/1.0 (+${process.env.AUDIT_UA_CONTACT ?? 'https://seotecnico.dev.br'})`
const PAUSE_MS = 1000
const MAX_BYTES = 5_000_000
const MAX_SITEMAPS = 200
const DEFAULT_SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml']
// The `crux` phase reads field data through this site's own public endpoint,
// which returns CrUX already parsed into {inDataset, period, metrics[]} — the
// shape the `analyze` phase expects. Calling the CrUX API directly returns a
// different shape, so overriding this means pointing at an endpoint that
// answers in the same one. It needs no API key, and it is the only part of
// this toolkit still tied to this site (audits/case-studies/README.md).
const CWV_ENDPOINT =
  process.env.AUDIT_CWV_ENDPOINT ?? 'https://seotecnico.dev.br/api/checador-cwv'
// Um bloco de texto que aparece em pelo menos esta fração das páginas lidas é
// do molde (menu, rodapé, banner, chamada fixa), não da página.
const BOILERPLATE_SHARE = 0.3

if (!['fetch', 'crux', 'probe', 'analyze'].includes(command) || !TARGETS) {
  console.error('uso: node scripts/index-inventory.mjs <fetch|crux|probe|analyze> --targets <arquivo.json> [--out <pasta>] [--only <código>]')
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequestAt = 0
let pauseMs = PAUSE_MS
let requests = 0

/** GET sem seguir redirect, com o tempo até o primeiro byte. */
async function get(url, accept = 'text/html') {
  const wait = lastRequestAt + pauseMs - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
  requests++
  const lib = url.startsWith('https:') ? https : http
  const started = performance.now()
  return new Promise((resolve) => {
    const req = lib.get(
      url,
      { headers: { 'User-Agent': UA, Accept: accept, 'Accept-Encoding': 'gzip, br' }, timeout: 30_000 },
      (res) => {
        const ttfbMs = Math.round(performance.now() - started)
        const chunks = []
        let size = 0
        let stream = res
        const enc = res.headers['content-encoding']
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip())
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress())
        stream.on('data', (c) => {
          size += c.length
          if (size <= MAX_BYTES) chunks.push(c)
        })
        stream.on('end', () => {
          let buf = Buffer.concat(chunks)
          if (buf[0] === 0x1f && buf[1] === 0x8b) {
            try {
              buf = zlib.gunzipSync(buf)
            } catch {}
          }
          resolve({ status: res.statusCode, headers: res.headers, body: buf.toString('utf8'), bytes: size, ttfbMs })
        })
        stream.on('error', (e) => resolve({ error: String(e) }))
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', (e) => resolve({ error: String(e) }))
  })
}

async function follow(url, accept) {
  const hops = []
  let current = url
  for (let i = 0; i <= 5; i++) {
    const res = await get(current, accept)
    if (res.error) return { hops, error: res.error }
    hops.push({ url: current, status: res.status })
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(res.headers.location, current).href
      continue
    }
    return { hops, final: res, finalUrl: current }
  }
  return { hops, error: 'too many redirects' }
}

// ── robots.txt (mesma leitura de scripts/sitemap-audit.mjs) ─────────────────
function parseRobots(text) {
  const groups = []
  const sitemaps = []
  let current = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === 'sitemap') {
      sitemaps.push(value)
      continue
    }
    if (key === 'user-agent') {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [], crawlDelay: null }))
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (current && (key === 'allow' || key === 'disallow')) current.rules.push({ allow: key === 'allow', path: value })
      if (current && key === 'crawl-delay' && Number(value) > 0) current.crawlDelay = Number(value)
    }
  }
  return { groups, sitemaps }
}

function ruleMatches(rulePath, urlPath) {
  if (rulePath === '') return false
  const anchored = rulePath.endsWith('$')
  const pattern = (anchored ? rulePath.slice(0, -1) : rulePath)
    .split('*')
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${pattern}${anchored ? '$' : ''}`).test(urlPath)
}

function chosenGroups(groups) {
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && UA_TOKEN.startsWith(a)))
  return mine.length ? mine : groups.filter((g) => g.agents.includes('*'))
}

function robotsAllows(groups, urlPath) {
  let best = null
  for (const rule of chosenGroups(groups).flatMap((g) => g.rules)) {
    if (!ruleMatches(rule.path, urlPath)) continue
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule
  }
  return best ? best.allow : true
}

// ── XML do sitemap ──────────────────────────────────────────────────────────
const decodeXml = (s) =>
  s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

function parseSitemap(xml) {
  const root = (xml.match(/<(?:\w+:)?(urlset|sitemapindex)\b/i) ?? [])[1]?.toLowerCase() ?? null
  const tag = root === 'sitemapindex' ? 'sitemap' : 'url'
  const entries = []
  for (const m of xml.matchAll(new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'gi'))) {
    const locRaw = (m[1].match(/<(?:\w+:)?loc>([\s\S]*?)<\/(?:\w+:)?loc>/i) ?? [])[1]
    if (locRaw != null) entries.push(decodeXml(locRaw.trim()))
  }
  return { root, entries }
}

// ── HTML ────────────────────────────────────────────────────────────────────
const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3]).trim() : null
}
const stripTags = (s) => decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length

/** Remove o que não é texto lido: scripts, estilos, noscript, template, SVG, comentários. */
const visibleHtml = (html) =>
  html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')

/** Região do conteúdo: marcadores do alvo; senão <main>; senão o <body> sem header/nav/footer/aside. */
function contentRegion(html, markers) {
  const v = visibleHtml(html)
  if (markers?.start) {
    const s = v.search(new RegExp(markers.start, 'i'))
    if (s !== -1) {
      const rest = v.slice(s)
      const e = markers.end ? rest.search(new RegExp(markers.end, 'i')) : -1
      return { html: e > 0 ? rest.slice(0, e) : rest, via: 'markers' }
    }
  }
  const main = v.match(/<main\b[\s\S]*?<\/main>/i)
  if (main) return { html: main[0], via: 'main' }
  const body = (v.match(/<body\b[\s\S]*<\/body>/i) ?? [v])[0]
  return { html: body.replace(/<(header|nav|footer|aside)\b[\s\S]*?<\/\1>/gi, ' '), via: 'body' }
}

/** Blocos de texto (parágrafos, itens, títulos, células), para separar molde de conteúdo. */
function textBlocks(regionHtml) {
  return regionHtml
    .split(/<\/?(?:p|li|h[1-6]|td|th|dt|dd|blockquote|figcaption|div|section|article|br)\b[^>]*>/i)
    .map(stripTags)
    .filter((t) => words(t) > 0)
}

const hashOf = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16)

function readPage(body, headers, markers) {
  const head = (body.match(/<head\b[\s\S]*?<\/head>/i) ?? [body.slice(0, 200_000)])[0]
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  const metaRobots = metas.filter((t) => /^(robots|googlebot)$/i.test(attr(t, 'name') ?? '')).map((t) => attr(t, 'content') ?? '')
  // Todas as tags description, na ordem do HTML: um tema e um plugin podem imprimir uma cada.
  const descriptions = metas.filter((t) => (attr(t, 'name') ?? '').toLowerCase() === 'description').map((t) => attr(t, 'content') ?? '')
  const description = descriptions[0] ?? null
  const canonicalTag = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical')
  const title = (head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1]
  const visible = visibleHtml(body)
  const h1s = [...visible.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]))
  const jsonLdTypes = []
  for (const m of body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*(?:"([^"]+)"|\[([^\]]*)\])/g)) {
      if (t[1]) jsonLdTypes.push(t[1])
      else for (const x of t[2].matchAll(/"([^"]+)"/g)) jsonLdTypes.push(x[1])
    }
  }
  const region = contentRegion(body, markers)
  const regionLinks = [...region.html.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(Boolean)
  const allLinks = [...visible.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(Boolean)
  const scriptHosts = [...body.matchAll(/<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1])
  return {
    metaRobots,
    xRobotsTag: headers['x-robots-tag'] ?? null,
    canonical: canonicalTag ? attr(canonicalTag, 'href') : null,
    title: title == null ? null : stripTags(title),
    description,
    descriptions,
    h1s,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    regionVia: region.via,
    blocks: textBlocks(region.html),
    regionLinks,
    allLinks,
    scriptSrcs: scriptHosts,
  }
}

const isNoindex = (p) => p.metaRobots.some((v) => /noindex|none/i.test(v)) || /noindex|none/i.test(String(p.xRobotsTag ?? ''))
function bare(href, base) {
  try {
    const u = new URL(href, base)
    if (!/^https?:$/.test(u.protocol)) return null
    u.hash = ''
    u.search = ''
    return u.href
  } catch {
    return null
  }
}
const sameUrl = (a, b) => a && b && (a === b || a.replace(/\/$/, '') === b.replace(/\/$/, ''))

// ── fase fetch ──────────────────────────────────────────────────────────────
function labelFor(t, sitemapUrl) {
  for (const l of t.sitemapLabels ?? []) if (new RegExp(l.match, 'i').test(sitemapUrl)) return l.label
  return 'other'
}

async function fetchTarget(t) {
  const startOrigin = t.origin.replace(/\/$/, '')
  const home = await follow(`${startOrigin}/`, 'text/html')
  const origin = home.final ? new URL(home.finalUrl).origin : startOrigin
  const host = new URL(origin).host
  const robotsRes = await follow(`${origin}/robots.txt`, 'text/plain')
  const robots = robotsRes.final?.status === 200 ? parseRobots(robotsRes.final.body) : { groups: [], sitemaps: [] }
  const crawlDelay = Math.max(0, ...chosenGroups(robots.groups).map((g) => g.crawlDelay ?? 0))
  pauseMs = Math.max(PAUSE_MS, crawlDelay * 1000)

  const queue = [...new Set([...robots.sitemaps, ...(t.sitemapPaths ?? DEFAULT_SITEMAP_PATHS).map((p) => origin + p)])]
  const seen = new Set()
  const bodies = new Set()
  const entries = [] // { loc, sitemapLabel }
  while (queue.length && seen.size < MAX_SITEMAPS) {
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)
    if (new URL(url).host !== host || !robotsAllows(robots.groups, new URL(url).pathname)) continue
    const r = await follow(url, 'application/xml')
    if (!r.final || r.final.status !== 200) continue
    const h = hashOf(r.final.body)
    if (bodies.has(h)) continue
    bodies.add(h)
    const sm = parseSitemap(r.final.body)
    if (sm.root === 'sitemapindex') queue.push(...sm.entries)
    else for (const loc of sm.entries) entries.push({ loc, sitemapLabel: labelFor(t, url) })
  }

  const dir = path.join(OUT, 'html', t.code)
  fs.mkdirSync(dir, { recursive: true })
  const pages = []
  const done = new Set()
  for (const e of entries) {
    if (done.has(e.loc)) {
      pages.push({ loc: e.loc, sitemapLabel: e.sitemapLabel, repeatOf: true })
      continue
    }
    done.add(e.loc)
    let u
    try {
      u = new URL(e.loc)
    } catch {
      pages.push({ ...e, skipped: 'malformed' })
      continue
    }
    if (u.host !== host) {
      pages.push({ ...e, skipped: 'other host' })
      continue
    }
    if (!robotsAllows(robots.groups, u.pathname)) {
      pages.push({ ...e, skipped: 'blocked by robots.txt' })
      continue
    }
    const r = await get(e.loc, 'text/html')
    if (r.error) {
      pages.push({ ...e, error: r.error })
      continue
    }
    const file = `${hashOf(e.loc)}.html`
    if (r.status === 200) fs.writeFileSync(path.join(dir, file), r.body)
    pages.push({
      ...e,
      status: r.status,
      location: r.headers.location ?? null,
      contentType: String(r.headers['content-type'] ?? '').split(';')[0],
      xRobotsTag: r.headers['x-robots-tag'] ?? null,
      ttfbMs: r.ttfbMs,
      bytes: r.bytes,
      file: r.status === 200 ? file : null,
    })
    if (pages.length % 50 === 0) console.log(`${t.code}: ${pages.length}/${entries.length}`)
  }
  const raw = { code: t.code, origin, homeChain: home.hops.map((h) => h.status), collectedAt: new Date().toISOString(), requests, pages }
  fs.writeFileSync(path.join(OUT, `raw-${t.code}.json`), JSON.stringify(raw, null, 1))
  console.log(`${t.code}: ${pages.length} entradas, ${requests} requisições`)
}

// ── fase crux ───────────────────────────────────────────────────────────────
async function cruxTarget(t) {
  const out = { code: t.code, queriedAt: new Date().toISOString(), endpoint: CWV_ENDPOINT, results: [] }
  for (const formFactor of ['PHONE', 'DESKTOP']) {
    const url = `${CWV_ENDPOINT}?origin=${encodeURIComponent(t.origin)}&formFactor=${formFactor}`
    const r = await get(url, 'application/json')
    let json = null
    try {
      json = JSON.parse(r.body)
    } catch {}
    out.results.push({ formFactor, status: r.status, report: json })
  }
  fs.writeFileSync(path.join(OUT, `crux-${t.code}.json`), JSON.stringify(out, null, 1))
  console.log(`${t.code}: CrUX ${out.results.map((x) => `${x.formFactor} ${x.status}`).join(', ')}`)
}

// ── fase probe ──────────────────────────────────────────────────────────────
// Outros hosts do mesmo site (subdomínios): a raiz, uma rota inventada,
// /robots.txt e /sitemap.xml, cada um seguido até o fim. Mede se o host
// responde, se distingue rota inexistente e se os dois arquivos são arquivos.
// O robots.txt de cada host é lido antes; um robots.txt que não é texto não
// tem regras, então não bloqueia nada.
async function probeTarget(t) {
  const out = { code: t.code, probedAt: new Date().toISOString(), hosts: [] }
  const invented = `/pagina-inexistente-sonda-${TODAY.replace(/-/g, '')}`
  for (const h of t.probes ?? []) {
    const origin = h.origin.replace(/\/$/, '')
    const robotsRes = await follow(`${origin}/robots.txt`, 'text/plain')
    const robotsIsText = /text\/plain/i.test(String(robotsRes.final?.headers?.['content-type'] ?? ''))
    const robots = robotsRes.final?.status === 200 && robotsIsText ? parseRobots(robotsRes.final.body) : { groups: [] }
    const results = []
    for (const [kind, p, accept] of [
      ['root', '/', 'text/html'],
      ['invented route', invented, 'text/html'],
      ['invented route, Accept */*', invented, '*/*'],
      ['robots.txt', '/robots.txt', 'text/plain'],
      ['robots.txt, Accept */*', '/robots.txt', '*/*'],
      ['robots.txt, Accept text/html', '/robots.txt', 'text/html'],
      ['sitemap.xml', '/sitemap.xml', 'application/xml'],
      ['sitemap.xml, Accept */*', '/sitemap.xml', '*/*'],
    ]) {
      if (!kind.startsWith('robots.txt') && !robotsAllows(robots.groups, p)) {
        results.push({ kind, skipped: 'blocked by robots.txt' })
        continue
      }
      const r = await follow(origin + p, accept)
      const f = r.final
      const body = f?.body ?? ''
      results.push({
        kind,
        path: p,
        error: r.error ?? null,
        chain: r.hops.map((x) => x.status),
        finalPath: r.finalUrl ? new URL(r.finalUrl).pathname : null,
        status: f?.status ?? null,
        contentType: String(f?.headers?.['content-type'] ?? '').split(';')[0] || null,
        kb: f ? Math.round(f.bytes / 1024) : null,
        bodyHash: f ? hashOf(body) : null,
        isHtml: /<html\b/i.test(body),
        noindex: f ? isNoindex(readPage(body, f.headers)) : null,
        title: f ? readPage(body, f.headers).title : null,
        server: f?.headers?.server ?? null,
      })
    }
    const rootHash = results.find((x) => x.kind === 'root')?.bodyHash
    for (const x of results) x.sameBodyAsRoot = !!rootHash && x.bodyHash === rootHash && x.kind !== 'root'
    out.hosts.push({ label: h.label, origin, robotsIsText, results })
  }
  fs.writeFileSync(path.join(OUT, `probe-${t.code}.json`), JSON.stringify(out, null, 1))
  for (const h of out.hosts) console.log(`${t.code} ${h.label}: ${h.results.map((x) => `${x.kind}=${x.error ?? x.chain?.join('>')}`).join(' | ')}`)
}

// ── fase analyze ────────────────────────────────────────────────────────────
const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const quantile = (xs, q) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!s.length) return null
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}
const share = (n, d) => (d ? Math.round((n / d) * 100) / 100 : null)

function makeRound(pub) {
  if (pub) return { total: (n) => n, small: (n) => n, value: (n) => (n == null ? null : Math.round(n)) }
  return {
    total: (n) => (n >= 1000 ? Math.round(n / 100) * 100 : n >= 10 ? Math.round(n / 10) * 10 : n === 0 ? 0 : 'under 10'),
    small: (n) => (n === 0 ? 0 : n < 5 ? '1-4' : n < 10 ? '5-9' : Math.round(n / 10) * 10),
    // Medianas de palavras, ms e KB: à dezena, para não carregar o valor exato de uma página.
    value: (n) => (n == null ? null : n >= 100 ? Math.round(n / 10) * 10 : Math.round(n)),
  }
}

function analyzeTarget(t) {
  const raw = JSON.parse(fs.readFileSync(path.join(OUT, `raw-${t.code}.json`), 'utf8'))
  const R = makeRound(!!t.public)
  const dir = path.join(OUT, 'html', t.code)
  const read = []
  for (const p of raw.pages) {
    if (!p.file) continue
    const body = fs.readFileSync(path.join(dir, p.file), 'utf8')
    const info = readPage(body, { 'x-robots-tag': p.xRobotsTag }, t.markers?.[p.sitemapLabel] ?? t.markers?.default)
    const canon = info.canonical ? bare(info.canonical, p.loc) : null
    read.push({
      ...p,
      ...info,
      noindex: isNoindex(info),
      canonicalKind: !info.canonical ? 'missing' : sameUrl(canon, bare(p.loc, p.loc)) ? 'self' : 'other',
    })
  }
  // Blocos do molde: os que aparecem em BOILERPLATE_SHARE das páginas lidas.
  const blockPages = new Map()
  for (const p of read) for (const h of new Set(p.blocks.map(hashOf))) blockPages.set(h, (blockPages.get(h) ?? 0) + 1)
  const minPages = Math.max(2, Math.ceil(read.length * BOILERPLATE_SHARE))
  for (const p of read) {
    p.words = p.blocks.reduce((n, b) => n + words(b), 0)
    p.ownWords = p.blocks.filter((b) => (blockPages.get(hashOf(b)) ?? 0) < minPages).reduce((n, b) => n + words(b), 0)
  }
  // Posts listados por arquivo de taxonomia: links do conteúdo para URLs do sitemap de posts,
  // sem os links do molde (os que aparecem em BOILERPLATE_SHARE das páginas, como "mais lidos").
  const norm = (h, base) => bare(h, base)?.replace(/\/$/, '')
  const linkPages = new Map()
  for (const p of read) for (const u of new Set(p.regionLinks.map((h) => norm(h, p.loc)).filter(Boolean))) linkPages.set(u, (linkPages.get(u) ?? 0) + 1)
  const postSet = new Set(read.filter((p) => p.sitemapLabel === (t.postsLabel ?? 'posts')).map((p) => norm(p.loc, p.loc)))
  const archiveLabels = new Set(t.archiveLabels ?? [])
  for (const p of read) {
    if (!archiveLabels.has(p.sitemapLabel)) continue
    const linked = new Set(p.regionLinks.map((h) => norm(h, p.loc)).filter((u) => u && postSet.has(u) && (linkPages.get(u) ?? 0) < minPages))
    p.postsListed = linked.size
  }
  // Links internos de entrada: de qualquer outra página lida, uma vez por página.
  // O link de uma página para ela mesma (título do arquivo, migalha) não conta.
  const inbound = new Map()
  for (const p of read) {
    const self = bare(p.loc, p.loc).replace(/\/$/, '')
    const from = new Set(p.allLinks.map((h) => bare(h, p.loc)?.replace(/\/$/, '')).filter((u) => u && u !== self))
    for (const u of from) inbound.set(u, (inbound.get(u) ?? 0) + 1)
  }
  const inboundOf = (p) => inbound.get(bare(p.loc, p.loc).replace(/\/$/, '')) ?? 0
  // Titles repetidos entre indexáveis.
  const indexable = read.filter((p) => p.status === 200 && !p.noindex && p.canonicalKind !== 'other')
  const titleCount = new Map()
  for (const p of indexable) if (p.title) titleCount.set(p.title.toLowerCase(), (titleCount.get(p.title.toLowerCase()) ?? 0) + 1)
  const descCount = new Map()
  for (const p of indexable) if (p.description) descCount.set(p.description.toLowerCase(), (descCount.get(p.description.toLowerCase()) ?? 0) + 1)
  // Description do molde: um texto que aparece, em qualquer posição, em BOILERPLATE_SHARE das indexáveis.
  const anyDesc = new Map()
  for (const p of indexable) for (const d of new Set(p.descriptions.map((x) => x.toLowerCase()))) anyDesc.set(d, (anyDesc.get(d) ?? 0) + 1)
  const templateDescs = new Set([...anyDesc].filter(([, n]) => n >= Math.max(2, Math.ceil(indexable.length * BOILERPLATE_SHARE))).map(([d]) => d))
  const hasTemplateDesc = (p) => p.descriptions.some((d) => templateDescs.has(d.toLowerCase()))
  const onlyTemplateDesc = (p) => p.descriptions.length > 0 && p.descriptions.every((d) => templateDescs.has(d.toLowerCase()))

  const labels = [...new Set(raw.pages.map((p) => p.sitemapLabel))]
  const byType = labels.map((label) => {
    const all = raw.pages.filter((p) => p.sitemapLabel === label && !p.repeatOf)
    const ok = read.filter((p) => p.sitemapLabel === label)
    const idx = indexable.filter((p) => p.sitemapLabel === label)
    const row = {
      sitemapType: label,
      listed: R.total(all.length),
      status200: share(all.filter((p) => p.status === 200).length, all.length),
      redirects: R.small(all.filter((p) => p.status >= 300 && p.status < 400).length),
      errors4xx5xx: R.small(all.filter((p) => p.status >= 400).length),
      noindexShare: share(ok.filter((p) => p.noindex).length, all.length),
      canonicalOtherShare: share(ok.filter((p) => p.canonicalKind === 'other').length, all.length),
      indexableShare: share(idx.length, all.length),
      indexable: R.total(idx.length),
      shareOfAllIndexable: share(idx.length, indexable.length),
      ofIndexable: idx.length
        ? {
            medianWords: R.value(median(idx.map((p) => p.words))),
            medianOwnWords: R.value(median(idx.map((p) => p.ownWords))),
            p90OwnWords: R.value(quantile(idx.map((p) => p.ownWords), 0.9)),
            ownWordsUnder100Share: share(idx.filter((p) => p.ownWords < 100).length, idx.length),
            ownWordsUnder300Share: share(idx.filter((p) => p.ownWords < 300).length, idx.length),
            noDescriptionShare: share(idx.filter((p) => !p.description).length, idx.length),
            noH1Share: share(idx.filter((p) => !p.h1s.some((h) => h)).length, idx.length),
            multipleH1Share: share(idx.filter((p) => p.h1s.length > 1).length, idx.length),
            sharedTitleShare: share(idx.filter((p) => p.title && titleCount.get(p.title.toLowerCase()) > 1).length, idx.length),
            sharedDescriptionShare: share(idx.filter((p) => p.description && descCount.get(p.description.toLowerCase()) > 1).length, idx.length),
            multipleDescriptionTagsShare: share(idx.filter((p) => p.descriptions.length > 1).length, idx.length),
            templateDescriptionShare: share(idx.filter(hasTemplateDesc).length, idx.length),
            onlyTemplateDescriptionShare: share(idx.filter(onlyTemplateDesc).length, idx.length),
            medianInboundPages: R.value(median(idx.map(inboundOf))),
            linkedByAnotherPageShare: share(idx.filter((p) => inboundOf(p) > 0).length, idx.length),
            medianTtfbMs: R.value(median(idx.map((p) => p.ttfbMs))),
            medianKb: R.value(median(idx.map((p) => p.bytes / 1024))),
            jsonLdTypes: [...new Set(idx.flatMap((p) => p.jsonLdTypes))].sort(),
            regionVia: [...new Set(idx.map((p) => p.regionVia))],
            ...(archiveLabels.has(label)
              ? {
                  medianPostsListed: R.value(median(idx.map((p) => p.postsListed))),
                  onePostOrFewerShare: share(idx.filter((p) => p.postsListed <= 1).length, idx.length),
                }
              : {}),
          }
        : null,
    }
    return row
  })

  const listedUnique = raw.pages.filter((p) => !p.repeatOf).length
  const thinTypes = new Set(t.thinTypes ?? [])
  const thinIdx = indexable.filter((p) => thinTypes.has(p.sitemapLabel))
  const home = read.find((p) => sameUrl(bare(p.loc, p.loc), raw.origin + '/'))
  let crux = null
  const cruxFile = path.join(OUT, `crux-${t.code}.json`)
  if (fs.existsSync(cruxFile)) {
    const c = JSON.parse(fs.readFileSync(cruxFile, 'utf8'))
    // O p75 exato de uma origem, num período, é uma impressão digital: qualquer
    // pessoa consulta o CrUX de um candidato e compara. De terceiro, sai só a
    // faixa (bom / precisa melhorar / ruim) e o valor arredondado.
    const roundP75 = (id, v) => {
      if (t.public || v == null) return v
      if (id === 'cls') return Math.round(v * 20) / 20
      if (id === 'inp') return Math.round(v / 50) * 50
      return Math.round(v / 500) * 500
    }
    crux = {
      queriedAt: c.queriedAt,
      source: 'Chrome UX Report API via /api/checador-cwv (origin, p75, 28 days)',
      rounding: t.public ? 'exact' : 'p75 rounded: LCP/FCP/TTFB to 500 ms, INP to 50 ms, CLS to 0.05',
      results: c.results.map((r) => ({
        formFactor: r.formFactor,
        status: r.status,
        inDataset: r.report?.inDataset ?? null,
        period: r.report?.period ?? null,
        metrics: (r.report?.metrics ?? []).map((m) => ({ id: m.id, p75: roundP75(m.id, m.p75), rating: m.rating })),
      })),
    }
  }
  let probes = null
  const probeFile = path.join(OUT, `probe-${t.code}.json`)
  if (fs.existsSync(probeFile)) {
    const pr = JSON.parse(fs.readFileSync(probeFile, 'utf8'))
    // Quantas páginas lidas do site principal linkam cada host sondado, e se a home linka.
    const linksTo = (p, host) => p.allLinks.some((l) => {
      try {
        return new URL(l, p.loc).host === host
      } catch {
        return false
      }
    })
    probes = {
      probedAt: pr.probedAt,
      hosts: pr.hosts.map((h) => ({
        label: h.label,
        linkedFromShareOfPagesRead: share(read.filter((p) => linksTo(p, new URL(h.origin).host)).length, read.length),
        linkedFromHome: home ? linksTo(home, new URL(h.origin).host) : null,
        robotsIsText: h.robotsIsText,
        results: h.results.map((x) => ({
          kind: x.kind,
          chain: x.chain ?? null,
          endsOn404Path: x.finalPath ? /^\/404\/?$/.test(x.finalPath) : null,
          contentType: x.contentType ?? null,
          isHtml: x.isHtml ?? null,
          sameBodyAsRoot: x.sameBodyAsRoot ?? null,
          noindex: x.noindex ?? null,
          error: x.error ?? x.skipped ?? null,
        })),
      })),
    }
  }
  return {
    code: t.code,
    label: t.label,
    collectedAt: raw.collectedAt,
    probes,
    requests: raw.requests,
    homeChain: raw.homeChain,
    method: {
      boilerplateBlockShare: BOILERPLATE_SHARE,
      ownWords: 'words in content blocks that appear on fewer than 30% of the pages read',
      indexable: '200, no noindex (meta or header), canonical self or missing',
    },
    sitemapEntries: R.total(raw.pages.length),
    uniqueUrls: R.total(listedUnique),
    indexable: R.total(indexable.length),
    templateDescriptions: templateDescs.size,
    indexableShareOfListed: share(indexable.length, listedUnique),
    singleItemTypes: [...thinTypes],
    singleItemTypesShareOfIndexable: share(thinIdx.length, indexable.length),
    byType,
    home: home
      ? {
          ttfbMs: R.value(home.ttfbMs),
          kb: R.value(home.bytes / 1024),
          thirdPartyScriptHosts: R.small(
            new Set(home.scriptSrcs.map((s) => bare(s, home.loc)).filter(Boolean).map((u) => new URL(u).host).filter((h) => !h.endsWith(new URL(raw.origin).host.replace(/^www\./, '')))).size,
          ),
        }
      : null,
    crux,
  }
}

// ── principal ───────────────────────────────────────────────────────────────
const targets = JSON.parse(fs.readFileSync(TARGETS, 'utf8')).filter((t) => !ONLY || t.code === ONLY)
fs.mkdirSync(OUT, { recursive: true })
if (command === 'fetch') for (const t of targets) await fetchTarget(t)
if (command === 'crux') for (const t of targets) await cruxTarget(t)
if (command === 'probe') for (const t of targets) await probeTarget(t)
if (command === 'analyze') {
  const file = path.join(OUT, 'summary.json')
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { targets: [] }
  const fresh = targets.map(analyzeTarget)
  const keep = prev.targets.filter((p) => !fresh.some((f) => f.code === p.code))
  const summary = {
    date: TODAY,
    script: 'scripts/index-inventory.mjs',
    userAgent: UA,
    pauseMs: PAUSE_MS,
    rounding: 'third-party targets: totals to 10 (to 100 from 1,000), small counts in bands 1-4/5-9, shares with two decimals, medians to 10',
    targets: [...keep, ...fresh],
  }
  fs.writeFileSync(file, JSON.stringify(summary, null, 1) + '\n')
  console.log(JSON.stringify(fresh, null, 1))
}
