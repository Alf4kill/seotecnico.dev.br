// ─────────────────────────────────────────────────────────────────────────────
// Auditoria de sitemap de fora: o que o sitemap promete × o que cada URL responde.
//
// Para cada origem do arquivo de alvos:
//   1. lê o robots.txt (regras para o nosso token e linhas `Sitemap:`);
//   2. acha os sitemaps (os declarados no robots.txt + os caminhos de
//      `sitemapPaths`), abre os índices recursivamente e registra, por arquivo:
//      status, tipo, número de entradas, `lastmod` (presença, valores
//      distintos, o valor mais comum, quantos caem na hora em que o arquivo
//      foi servido) e se o arquivo está declarado no robots.txt;
//   3. pede cada `<loc>` uma vez (GET, sem seguir redirect) e classifica a
//      resposta: 200 indexável e canônica, redirect, 4xx, 5xx, noindex,
//      canonical para outra URL, bloqueada pelo robots.txt, outro host;
//   4. marca entradas repetidas e URLs malformadas;
//   5. compara o `lastmod` com as datas da própria página (JSON-LD e
//      `article:*_time`), no dia escrito em cada uma;
//   6. conta os links internos das páginas lidas e pede as URLs mais linkadas
//      que não estão em nenhum sitemap, para saber se são páginas indexáveis.
// Base: docs/research/2026-11-11-sitemap-audit.md.
//
// Por que node:https e não fetch: o fetch do Node (undici) acrescenta
// `sec-fetch-mode: cors` a toda requisição — o defeito medido no PR #95.
//
// Regras de coleta (docs/proposals/case-studies-content.md §3–§4):
// - robots.txt de cada origem é lido antes; caminho bloqueado não é pedido;
// - uma requisição por vez, pausa mínima de PAUSE_MS (ou o Crawl-delay, se maior);
// - nada de busca no Google; só as origens do arquivo de alvos; URLs de outro
//   host listadas num sitemap são contadas, nunca pedidas.
//
// Saída: <out>/raw.json (tudo, com hosts e caminhos — local, ver .gitignore) e
// <out>/summary.json (versionável). Alvos de terceiros saem só pelo código
// S1–S5, com sitemaps rotulados por tipo e contagens arredondadas: totais à
// dezena (à centena acima de mil), contagens de defeito pequenas em faixas (1–4, 5–9) e proporções com
// duas casas. Alvos `public: true` (este site) saem com valores exatos e URLs.
//
//   node scripts/sitemap-audit.mjs --targets audits/case-studies/sitemap-audit.local.json
//   node scripts/sitemap-audit.mjs --targets <arquivo> --out audits/case-studies/sitemap-audit-2026-11-11
//   node scripts/sitemap-audit.mjs --summarize --out audits/case-studies/sitemap-audit-2026-11-11
//   node scripts/sitemap-audit.mjs --recheck-5xx S4 --out audits/case-studies/sitemap-audit-2026-11-11
//
// Formato do arquivo de alvos: audits/case-studies/sitemap-audit.example.json.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import zlib from 'node:zlib'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const TODAY = new Date().toISOString().slice(0, 10)
const TARGETS = arg('targets')
const OUT = arg('out', path.join('audits', 'case-studies', `sitemap-audit-${TODAY}`))
const ONLY = arg('only') // código de um alvo, para rodar um de cada vez
const UA_TOKEN = 'seotecnico-sitemap-audit'
const UA = `${UA_TOKEN}/1.0 (+https://seotecnico.dev.br)`
const PAUSE_MS = 1000
const MAX_BYTES = 5_000_000
const MAX_SITEMAPS = 200
const DEFAULT_SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml']
// Hora de geração: um lastmod a menos disso do cabeçalho Date da resposta do
// arquivo diz quando o arquivo foi montado, não quando a página mudou.
const GENERATION_WINDOW_MS = 2 * 60 * 60 * 1000
// Páginas fora do sitemap: as MISSING_TOP mais linkadas que nenhum sitemap
// lista, se linkadas por pelo menos MISSING_MIN_SHARE das páginas lidas.
const MISSING_TOP = 15
const MISSING_MIN_SHARE = 0.05

if (!TARGETS && !argv.includes('--summarize') && !argv.includes('--recheck-5xx')) {
  console.error('uso: node scripts/sitemap-audit.mjs --targets <arquivo.json> [--out <pasta>] [--only <código>] | --summarize --out <pasta>')
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequestAt = 0
let pauseMs = PAUSE_MS
let requests = 0
const childParent = new Map() // sitemap filho → índice que o lista

/** GET sem seguir redirect. Cabeçalhos: só User-Agent, Accept e Accept-Encoding. */
async function get(url, accept = 'text/html') {
  const wait = lastRequestAt + pauseMs - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
  requests++
  const lib = url.startsWith('https:') ? https : http
  return new Promise((resolve) => {
    const req = lib.get(
      url,
      { headers: { 'User-Agent': UA, Accept: accept, 'Accept-Encoding': 'gzip, br' }, timeout: 30_000 },
      (res) => {
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
          // sitemap.xml.gz servido sem Content-Encoding: o corpo é o próprio gzip.
          if (buf[0] === 0x1f && buf[1] === 0x8b) {
            try {
              buf = zlib.gunzipSync(buf)
            } catch {}
          }
          resolve({ status: res.statusCode, headers: res.headers, body: buf.toString('utf8'), bytes: size })
        })
        stream.on('error', (e) => resolve({ error: String(e) }))
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', (e) => resolve({ error: String(e) }))
  })
}

/** Segue até 5 redirects (só para robots.txt, sitemaps e a home). */
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

// ── robots.txt ──────────────────────────────────────────────────────────────
// Grupo do nosso token se existir, senão o de `*`. Regra mais longa vence;
// empate fica com Allow (RFC 9309). `Sitemap:` vale para o arquivo inteiro.
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
    const inner = m[1]
    const locRaw = (inner.match(/<(?:\w+:)?loc>([\s\S]*?)<\/(?:\w+:)?loc>/i) ?? [])[1]
    if (locRaw == null) continue
    const lastmod = (inner.match(/<(?:\w+:)?lastmod>([\s\S]*?)<\/(?:\w+:)?lastmod>/i) ?? [])[1]?.trim() ?? null
    entries.push({ locRaw, loc: decodeXml(locRaw.trim()), lastmod })
  }
  // `&` cru dentro de <loc> torna o XML inválido.
  const unescapedAmp = entries.filter((e) => /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(e.locRaw)).length
  return { root, entries, unescapedAmp }
}

/** Por que um <loc> está malformado, ou null. */
function malformed(loc) {
  // Espaço em volta do <loc> (XML indentado) é tolerado; dentro da URL, não.
  if (/\s/.test(loc)) return 'space inside the URL'
  let u
  try {
    u = new URL(loc)
  } catch {
    return 'not an absolute URL'
  }
  if (!/^https?:$/.test(u.protocol)) return 'not http(s)'
  if (/%20/i.test(u.pathname)) return 'encoded space in the path'
  return null
}

// ── HTML da página ──────────────────────────────────────────────────────────
const decodeHtml = (s) => (s == null ? null : s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim())
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? decodeHtml(m[1] ?? m[2] ?? m[3]) : null
}

function readPage(body, headers) {
  const head = body.slice(0, 400_000)
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  const metaRobots = metas
    .filter((t) => /^(robots|googlebot)$/i.test(attr(t, 'name') ?? ''))
    .map((t) => attr(t, 'content') ?? '')
  const metaProp = (p) => {
    const t = metas.find((x) => (attr(x, 'property') ?? '').toLowerCase() === p)
    return t ? attr(t, 'content') : null
  }
  const canonicalTag = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical')
  const headerCanonical = (String(headers.link ?? '').match(/<([^>]+)>\s*;\s*rel="?canonical"?/i) ?? [])[1] ?? null
  let datePublished = null
  let dateModified = null
  for (const m of body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    datePublished ??= (m[1].match(/"datePublished"\s*:\s*"([^"]+)"/) ?? [])[1] ?? null
    dateModified ??= (m[1].match(/"dateModified"\s*:\s*"([^"]+)"/) ?? [])[1] ?? null
  }
  datePublished ??= metaProp('article:published_time')
  dateModified ??= metaProp('article:modified_time')
  const links = []
  const visible = body.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
  for (const m of visible.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], 'href')
    if (href) links.push(href)
  }
  return {
    metaRobots,
    xRobotsTag: headers['x-robots-tag'] ?? null,
    canonical: canonicalTag ? attr(canonicalTag, 'href') : headerCanonical,
    datePublished,
    dateModified,
    links,
  }
}

const isNoindex = (p) => p.metaRobots.some((v) => /noindex|none/i.test(v)) || /noindex|none/i.test(String(p.xRobotsTag ?? ''))

/** Sem fragmento e sem query: a forma usada para comparar links com o sitemap. */
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
const slashToggle = (u) => (u.endsWith('/') ? u.slice(0, -1) : `${u}/`)

/** Dia como escrito na string (YYYY-MM-DD), sem converter fuso. */
const dayOf = (s) => (s ? (s.match(/^(\d{4}-\d{2}-\d{2})/) ?? [])[1] ?? null : null)
const hasTime = (s) => /T\d{2}:\d{2}/.test(s ?? '')
/**
 * Duas datas dizem o mesmo momento? Com hora nas duas, compara o instante
 * (tolerância de um minuto: o sitemap e o JSON-LD arredondam diferente); sem
 * hora em uma delas, compara o dia como escrito. Um lastmod em UTC e um
 * dateModified em −03:00 da mesma noite caem em dias diferentes, e não são
 * datas diferentes.
 */
function sameDate(a, b) {
  if (!a || !b) return false
  if (hasTime(a) && hasTime(b)) {
    const d = Math.abs(Date.parse(a) - Date.parse(b))
    return Number.isFinite(d) && d <= 60_000
  }
  return dayOf(a) === dayOf(b)
}

// ── coleta de um alvo ───────────────────────────────────────────────────────
async function auditTarget(t) {
  const startOrigin = t.origin.replace(/\/$/, '')
  // A home diz qual é a origem canônica (www × sem www, http → https).
  const home = await follow(`${startOrigin}/`, 'text/html')
  const origin = home.final ? new URL(home.finalUrl).origin : startOrigin
  const host = new URL(origin).host

  const robotsRes = await follow(`${origin}/robots.txt`, 'text/plain')
  const robotsOk = robotsRes.final?.status === 200
  const robots = robotsOk ? parseRobots(robotsRes.final.body) : { groups: [], sitemaps: [] }
  const crawlDelay = Math.max(0, ...chosenGroups(robots.groups).map((g) => g.crawlDelay ?? 0))
  pauseMs = Math.max(PAUSE_MS, crawlDelay * 1000)

  // Sitemaps: declarados + caminhos padrão, abertos em largura.
  const declared = new Set(robots.sitemaps.map((s) => bare(s, origin)).filter(Boolean))
  const queue = [...declared, ...(t.sitemapPaths ?? DEFAULT_SITEMAP_PATHS).map((p) => `${origin}${p}`)]
  const seen = new Set()
  const sitemaps = []
  while (queue.length && sitemaps.length < MAX_SITEMAPS) {
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)
    const sm = { url, declaredInRobots: declared.has(url), parent: null, source: declared.has(url) ? 'robots.txt' : childParent.has(url) ? 'index' : 'default path' }
    const u = new URL(url)
    if (u.host !== host) {
      sm.skipped = 'other host'
      sitemaps.push(sm)
      continue
    }
    if (!robotsAllows(robots.groups, u.pathname + u.search)) {
      sm.skipped = 'disallowed by robots.txt'
      sitemaps.push(sm)
      continue
    }
    const r = await follow(url, 'application/xml,text/xml;q=0.9,*/*;q=0.1')
    sm.chain = r.hops.map((h) => h.status)
    if (r.error) {
      sm.error = r.error
      sitemaps.push(sm)
      continue
    }
    sm.status = r.final.status
    // Um caminho padrão que redireciona para um arquivo já lido (sitemap.xml →
    // sitemap_index.xml) não é um segundo sitemap: registrado, não relido.
    const finalBare = bare(r.finalUrl, origin)
    if (finalBare !== url && seen.has(finalBare)) {
      sm.redirectsTo = finalBare
      sitemaps.push(sm)
      continue
    }
    seen.add(finalBare)
    sm.contentType = r.final.headers['content-type'] ?? null
    sm.servedAt = r.final.headers.date ? new Date(r.final.headers.date).toISOString() : new Date().toISOString()
    const parsed = r.final.status === 200 ? parseSitemap(r.final.body) : { root: null, entries: [], unescapedAmp: 0 }
    sm.root = parsed.root
    sm.unescapedAmp = parsed.unescapedAmp
    sm.entries = parsed.entries
    sitemaps.push(sm)
    console.log(`${t.code} sitemap ${url}: ${sm.chain.join(' → ')} ${parsed.root ?? '-'} ${parsed.entries.length}`)
    if (parsed.root === 'sitemapindex') {
      for (const e of parsed.entries) {
        const child = bare(e.loc, origin)
        if (child && !seen.has(child)) {
          queue.push(child)
          childParent.set(child, url)
        }
      }
    }
  }
  for (const sm of sitemaps) sm.parent = childParent.get(sm.url) ?? null

  // Entradas de URL (urlset), com a origem de cada uma.
  const entries = []
  for (const sm of sitemaps) {
    if (sm.root !== 'urlset' || sm.redirectsTo) continue
    for (const e of sm.entries) entries.push({ sitemap: sm.url, loc: e.loc, locRaw: e.locRaw, lastmod: e.lastmod })
  }
  const byLoc = new Map()
  for (const e of entries) byLoc.set(e.loc, (byLoc.get(e.loc) ?? 0) + 1)

  // Cada URL distinta, uma vez.
  const pages = new Map()
  for (const loc of byLoc.keys()) {
    const why = malformed(loc)
    const p = { loc, malformed: why }
    pages.set(loc, p)
    let u
    try {
      u = new URL(loc)
    } catch {
      p.kind = 'malformed'
      continue
    }
    if (u.host !== host) {
      p.kind = 'other host'
      continue
    }
    if (!robotsAllows(robots.groups, u.pathname + u.search)) {
      p.kind = 'disallowed by robots.txt'
      continue
    }
    const r = await get(u.href, 'text/html')
    if (r.error) {
      p.kind = 'network error'
      p.error = r.error
      continue
    }
    p.status = r.status
    if (r.status >= 300 && r.status < 400) {
      p.kind = 'redirect'
      try {
        const to = new URL(r.headers.location, u.href)
        p.redirectTo = to.href
        p.redirectSameOrigin = to.origin === origin
      } catch {
        p.redirectTo = null
      }
    } else if (r.status >= 500) p.kind = '5xx'
    else if (r.status >= 400) p.kind = r.status === 404 || r.status === 410 ? '404/410' : 'other 4xx'
    else if (r.status === 200) {
      const page = readPage(r.body, r.headers)
      p.contentType = String(r.headers['content-type'] ?? '').split(';')[0] || null
      p.noindex = isNoindex(page)
      p.canonical = page.canonical
      p.datePublished = page.datePublished
      p.dateModified = page.dateModified
      p.links = page.links
      let canon = 'none'
      if (page.canonical) {
        try {
          const c = new URL(page.canonical, u.href).href
          canon = c === u.href ? 'self' : slashToggle(c) === u.href ? 'other (trailing slash only)' : 'other'
        } catch {
          canon = 'malformed'
        }
      }
      p.canonicalKind = canon
      p.kind = p.noindex ? 'noindex' : canon.startsWith('other') ? 'canonical to another URL' : 'ok'
    } else p.kind = `other ${r.status}`
    if (requests % 100 === 0) console.log(`${t.code} … ${requests} requisições`)
  }

  // Links internos das páginas 200 lidas: o que é muito linkado e não está em
  // nenhum sitemap.
  const inSitemap = new Set(pages.keys())
  const read = [...pages.values()].filter((p) => p.status === 200 && p.links)
  const linkers = new Map()
  for (const p of read) {
    const targets = new Set(p.links.map((h) => bare(h, p.loc)).filter((h) => h && new URL(h).host === host))
    for (const h of targets) linkers.set(h, (linkers.get(h) ?? 0) + 1)
  }
  const minLinkers = Math.max(2, Math.ceil(read.length * MISSING_MIN_SHARE))
  const candidates = [...linkers.entries()]
    .filter(([h, n]) => n >= minLinkers && !inSitemap.has(h) && !inSitemap.has(slashToggle(h)) && h !== `${origin}/`)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MISSING_TOP)
  const missing = []
  for (const [h, n] of candidates) {
    const u = new URL(h)
    const m = { url: h, linkedFrom: n }
    if (!robotsAllows(robots.groups, u.pathname)) {
      m.kind = 'disallowed by robots.txt'
    } else {
      const r = await get(h, 'text/html')
      m.status = r.status ?? null
      if (r.status === 200) {
        const page = readPage(r.body, r.headers)
        const c = page.canonical ? bare(page.canonical, h) : null
        const html = /text\/html|application\/xhtml/i.test(String(r.headers['content-type'] ?? ''))
        m.kind = !html ? 'not HTML' : isNoindex(page) ? 'noindex' : c && c !== h && slashToggle(c) !== h ? 'canonical to another URL' : 'indexable'
      } else m.kind = r.status >= 300 && r.status < 400 ? 'redirect' : `status ${r.status ?? r.error}`
    }
    missing.push(m)
  }
  for (const p of pages.values()) delete p.links

  return {
    code: t.code,
    label: t.label,
    public: !!t.public,
    sitemapLabels: t.sitemapLabels ?? [],
    origin,
    homeChain: home.hops.map((h) => h.status),
    robots: {
      status: robotsRes.final?.status ?? null,
      declaredSitemaps: [...declared],
      crawlDelay: crawlDelay || null,
    },
    sitemaps,
    entries,
    pages: [...pages.values()],
    linkedPagesRead: read.length,
    missingMinLinkers: minLinkers,
    missing,
  }
}

// ── resumo ──────────────────────────────────────────────────────────────────
const round = (n, d = 2) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d)

function summarize(a) {
  const exact = a.public
  // Totais à dezena; contagens pequenas em faixas; proporções com duas casas.
  // Acima de mil, à centena: "cerca de 2.590 posts" num setor já identifica.
  const total = (n) => (exact ? n : n === 0 ? 0 : n < 10 ? 'under 10' : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100)
  const count = (n) => (exact ? n : n < 10 ? (n === 0 ? 0 : n < 5 ? '1-4' : '5-9') : total(n))
  const share = (n, d) => (d ? round(n / d, exact ? 3 : 2) : null)

  const labelOf = (url) => {
    if (exact) return url.replace(a.origin, '')
    const hit = a.sitemapLabels.find((l) => new RegExp(l.match, 'i').test(url))
    return hit ? hit.label : 'sitemap'
  }

  // Execuções anteriores à regra do redirect: o mesmo arquivo alcançado por
  // um redirect aparece duas vezes; o segundo vira referência, sem entradas.
  const sigOf = (sm) => (sm.entries ?? []).map((e) => e.loc).join(' ')
  // O mesmo conteúdo servido em dois caminhos (robots.txt aponta um índice e
  // /sitemap.xml serve uma cópia, com 200) também é um arquivo só.
  a.sitemaps.forEach((sm, i) => {
    if (sm.redirectsTo || !sm.entries?.length) return
    const twin = a.sitemaps.slice(0, i).find((o) => !o.redirectsTo && !o.sameContentAs && sigOf(o) === sigOf(sm))
    if (!twin) return
    if ((sm.chain?.length ?? 0) > 1) sm.redirectsTo = twin.url
    else sm.sameContentAs = twin.url
    sm.entries = []
  })
  const files = a.sitemaps.map((sm) => {
    const lastmods = (sm.entries ?? []).map((e) => e.lastmod).filter(Boolean)
    const freq = new Map()
    for (const l of lastmods) freq.set(l, (freq.get(l) ?? 0) + 1)
    const mode = [...freq.entries()].sort((x, y) => y[1] - x[1])[0]
    const served = sm.servedAt ? Date.parse(sm.servedAt) : null
    const atGeneration = served ? lastmods.filter((l) => Math.abs(Date.parse(l) - served) <= GENERATION_WINDOW_MS).length : 0
    const future = served ? lastmods.filter((l) => Date.parse(l) - served > GENERATION_WINDOW_MS).length : 0
    const n = sm.entries?.length ?? 0
    return {
      sitemap: labelOf(sm.url),
      foundVia: sm.source,
      ...(sm.redirectsTo ? { redirectsToFileAlreadyRead: exact ? sm.redirectsTo.replace(a.origin, '') : labelOf(sm.redirectsTo) } : {}),
      ...(sm.sameContentAs ? { sameContentAsFileAlreadyRead: exact ? sm.sameContentAs.replace(a.origin, '') : labelOf(sm.sameContentAs) } : {}),
      declaredInRobots: sm.declaredInRobots,
      skipped: sm.skipped,
      chain: sm.chain,
      status: sm.status ?? null,
      contentType: sm.contentType ? sm.contentType.split(';')[0] : null,
      root: sm.root ?? null,
      entries: total(n),
      unescapedAmpersands: count(sm.unescapedAmp ?? 0),
      lastmod: n
        ? {
            share: share(lastmods.length, n),
            distinctValues: exact ? freq.size : freq.size <= 5 ? freq.size : total(freq.size),
            mostCommonShare: mode ? share(mode[1], lastmods.length) : null,
            atServeTimeShare: share(atGeneration, lastmods.length),
            inFutureShare: share(future, lastmods.length),
          }
        : null,
    }
  })

  const P = a.pages.length
  const kinds = {}
  for (const p of a.pages) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1
  const dupLocs = new Map()
  for (const e of a.entries) dupLocs.set(e.loc, (dupLocs.get(e.loc) ?? 0) + 1)
  const repeated = [...dupLocs.values()].filter((n) => n > 1).length
  const malformedPages = a.pages.filter((p) => p.malformed)
  const redirects = a.pages.filter((p) => p.kind === 'redirect')

  // lastmod × datas da página, por URL lida com status 200.
  const lastmodOf = new Map()
  for (const e of a.entries) if (e.lastmod && !lastmodOf.has(e.loc)) lastmodOf.set(e.loc, e.lastmod)
  const dated = a.pages.filter((p) => p.status === 200 && lastmodOf.has(p.loc) && (p.datePublished || p.dateModified))
  // A data mais recente que a página declara: dateModified, ou datePublished
  // quando a página não declara modificação.
  const newest = (p) => p.dateModified ?? p.datePublished
  const withMod = dated.filter((p) => p.dateModified)
  const lm = (p) => lastmodOf.get(p.loc)
  const eqNewest = dated.filter((p) => sameDate(lm(p), newest(p))).length
  const eqPubOnly = withMod.filter((p) => !sameDate(p.dateModified, p.datePublished) && sameDate(lm(p), p.datePublished)).length
  const eqEither = dated.filter((p) => sameDate(lm(p), p.datePublished) || sameDate(lm(p), p.dateModified)).length
  const pubDiffersFromMod = withMod.filter((p) => !sameDate(p.datePublished, p.dateModified)).length

  // A mesma contagem, por arquivo de sitemap (a primeira vez que a URL aparece).
  const firstFile = new Map()
  for (const e of a.entries) if (!firstFile.has(e.loc)) firstFile.set(e.loc, e.sitemap)
  const perFile = new Map()
  for (const p of a.pages) {
    const f = firstFile.get(p.loc)
    if (!perFile.has(f)) perFile.set(f, {})
    const o = perFile.get(f)
    o[p.kind] = (o[p.kind] ?? 0) + 1
  }
  const byFile = [...perFile.entries()].map(([f, o]) => {
    const n = Object.values(o).reduce((x, y) => x + y, 0)
    return {
      sitemap: labelOf(f),
      urls: total(n),
      kinds: Object.fromEntries(Object.entries(o).sort((x, y) => y[1] - x[1]).map(([k, c]) => [k, { count: count(c), share: share(c, n) }])),
    }
  })
  const kindCounts = Object.fromEntries(
    Object.entries(kinds)
      .sort((x, y) => y[1] - x[1])
      .map(([k, n]) => [k, { count: count(n), share: share(n, P) }]),
  )

  return {
    code: a.code,
    label: a.label,
    ...(exact ? { origin: a.origin } : {}),
    robots: {
      status: a.robots.status,
      declaresSitemaps: exact ? a.robots.declaredSitemaps.map((s) => s.replace(a.origin, '')) : a.robots.declaredSitemaps.length,
      crawlDelay: a.robots.crawlDelay,
    },
    sitemapFiles: files,
    entries: total(a.entries.length),
    distinctUrls: total(P),
    repeatedUrls: { count: count(repeated), share: share(repeated, P) },
    urlsByResponse: kindCounts,
    urlsByResponseByFile: byFile,
    ...(a.recheck5xx ? { serverErrorsRechecked: { at: a.recheck5xx.at, still5xx: count(a.recheck5xx.still), nowOk: count(a.recheck5xx.ok), other: count(a.recheck5xx.other) } } : {}),
    malformedUrls: {
      count: count(malformedPages.length),
      reasons: [...new Set(malformedPages.map((p) => p.malformed))],
    },
    redirects: {
      sameOrigin: count(redirects.filter((p) => p.redirectSameOrigin).length),
      otherOrigin: count(redirects.filter((p) => p.redirectTo && !p.redirectSameOrigin).length),
      toHome: count(redirects.filter((p) => p.redirectTo === `${a.origin}/`).length),
    },
    lastmodVsPageDates: {
      pagesCompared: total(dated.length),
      lastmodEqualsNewestPageDateShare: share(eqNewest, dated.length),
      lastmodEqualsNeitherShare: share(dated.length - eqEither, dated.length),
      pagesDeclaringDateModifiedShare: share(withMod.length, dated.length),
      modifiedAfterPublicationShare: share(pubDiffersFromMod, withMod.length),
      lastmodKeepsPublicationAfterModificationShare: share(eqPubOnly, withMod.length),
    },
    linkedButNotInSitemap: {
      pagesRead: total(a.linkedPagesRead),
      threshold: `linked from at least ${Math.round(MISSING_MIN_SHARE * 100)}% of the pages read (top ${MISSING_TOP} checked)`,
      checked: count(a.missing.length),
      byKind: Object.fromEntries(
        Object.entries(a.missing.reduce((o, m) => ((o[m.kind] = (o[m.kind] ?? 0) + 1), o), {})).map(([k, n]) => [k, count(n)]),
      ),
      mostLinkedIndexableShare: (() => {
        const top = a.missing.filter((m) => m.kind === 'indexable').sort((x, y) => y.linkedFrom - x.linkedFrom)[0]
        return top ? share(top.linkedFrom, a.linkedPagesRead) : null
      })(),
      ...(exact ? { urls: a.missing.map((m) => ({ path: m.url.replace(a.origin, ''), linkedFrom: m.linkedFrom, kind: m.kind })) } : {}),
    },
    ...(exact
      ? {
          problemUrls: a.pages
            .filter((p) => p.kind !== 'ok' || p.malformed)
            .map((p) => ({ path: p.loc.replace(a.origin, ''), kind: p.kind, status: p.status ?? null, malformed: p.malformed })),
        }
      : {}),
  }
}

// ── execução ────────────────────────────────────────────────────────────────
// --summarize: refaz summary.json a partir do raw.json, sem nenhuma requisição.
const SUMMARIZE_ONLY = argv.includes('--summarize') || argv.includes('--recheck-5xx')
const targets = SUMMARIZE_ONLY ? [] : JSON.parse(fs.readFileSync(TARGETS, 'utf8')).filter((t) => !ONLY || t.code === ONLY)
fs.mkdirSync(OUT, { recursive: true })
const rawPath = path.join(OUT, 'raw.json')
const summaryPath = path.join(OUT, 'summary.json')
// Rodar um alvo de cada vez (--only) acumula no mesmo raw.json.
const previous = fs.existsSync(rawPath) ? JSON.parse(fs.readFileSync(rawPath, 'utf8')).targets : []
const audits = previous.filter((p) => !targets.some((t) => t.code === p.code))
const startedAt = SUMMARIZE_ONLY ? (fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath, 'utf8')).startedAt : null) : new Date().toISOString()

for (const t of targets) {
  const before = requests
  const a = await auditTarget(t)
  a.collectedAt = new Date().toISOString()
  a.requests = requests - before
  audits.push(a)
  fs.writeFileSync(rawPath, JSON.stringify({ targets: audits }, null, 2))
  console.log(`${t.code}: ${a.pages.length} URLs, ${a.requests} requisições`)
}

// --recheck-5xx <código>: pede de novo, uma vez, as URLs que deram 5xx na
// coleta; o resultado fica ao lado (a classificação original não muda).
const RECHECK = arg('recheck-5xx')
if (RECHECK) {
  const a = audits.find((x) => x.code === RECHECK)
  const origin = new URL(a.origin)
  const robotsRes = await follow(`${a.origin}/robots.txt`, 'text/plain')
  const robots = robotsRes.final?.status === 200 ? parseRobots(robotsRes.final.body) : { groups: [] }
  const res = { at: new Date().toISOString(), still: 0, ok: 0, other: 0, urls: [] }
  for (const p of a.pages.filter((x) => x.kind === '5xx')) {
    const u = new URL(p.loc)
    if (u.host !== origin.host || !robotsAllows(robots.groups, u.pathname + u.search)) continue
    const r = await get(u.href, 'text/html')
    const st = r.status ?? null
    if (st >= 500) res.still++
    else if (st === 200) res.ok++
    else res.other++
    res.urls.push({ loc: p.loc, status: st })
    console.log(`${RECHECK} recheck ${st} ${u.pathname}`)
  }
  a.recheck5xx = res
  fs.writeFileSync(rawPath, JSON.stringify({ targets: audits }, null, 2))
}

// Rótulos de sitemap vêm do arquivo de alvos atual, quando ele é passado.
if (TARGETS) {
  const current = JSON.parse(fs.readFileSync(TARGETS, 'utf8'))
  for (const a of audits) {
    const t = current.find((x) => x.code === a.code)
    if (t?.sitemapLabels) a.sitemapLabels = t.sitemapLabels
  }
}
audits.sort((x, y) => (x.public === y.public ? x.code.localeCompare(y.code) : x.public ? -1 : 1))
const summary = {
  date: (startedAt ?? new Date().toISOString()).slice(0, 10),
  startedAt,
  userAgent: UA,
  pauseMs: PAUSE_MS,
  method: 'docs/research/2026-11-11-sitemap-audit.md; script scripts/sitemap-audit.mjs',
  rounding:
    'third-party targets: totals to the nearest 10 ("under 10" below that) and to the nearest 100 from 1,000, defect counts in bands (1-4, 5-9) and to the nearest 10 from 10, shares to two decimals, sitemap files by type only; this site (public) is exact',
  targets: audits.map((a) => ({ collectedAt: a.collectedAt, requests: a.public ? a.requests : Math.round(a.requests / 100) * 100, ...summarize(a) })),
}
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n')
console.log(`\n${requests} requisições nesta execução · ${summaryPath}`)
