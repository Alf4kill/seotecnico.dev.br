// ─────────────────────────────────────────────────────────────────────────────
// Sonda de soft 404: pede URLs inventadas e registra o que o servidor responde.
//
// Para cada alvo (uma origem + um modelo de URL), pede uma URL que não existe
// duas vezes — com `Accept: text/html` e com `Accept: */*` — e registra a
// cadeia de redirects, o status final, <title>, meta robots, X-Robots-Tag,
// canonical, tamanho do corpo e se o corpo é idêntico ao da home (casca de SPA).
// Base: docs/research/2026-11-08-soft-404.md.
//
// Por que node:https e não fetch: o fetch do Node (undici) acrescenta
// `sec-fetch-mode: cors` a toda requisição — o defeito medido no PR #95. Aqui
// os cabeçalhos são exatamente os declarados abaixo, nada mais.
//
// Regras de coleta (docs/proposals/case-studies-content.md §3–§4):
// - robots.txt de cada origem é lido antes; caminho bloqueado não é pedido;
// - uma requisição por vez, com pausa mínima de PAUSE_MS entre elas;
// - nada de busca no Google; só as origens do arquivo de alvos.
//
// Saída: <out>/raw.json (tudo, inclusive hosts e caminhos — fica local, ver
// .gitignore) e <out>/summary.json (versionável: alvos de terceiros aparecem
// só pelo código S1–S5 e por um rótulo genérico; os do próprio site, marcados
// `public: true`, saem com o caminho).
//
//   node scripts/soft404-probe.mjs --targets audits/case-studies/targets.local.json
//   node scripts/soft404-probe.mjs --targets <arquivo> --out audits/case-studies/soft404-2026-11-09
//
// Formato do arquivo de alvos:
//   [{ "code": "SITE", "label": "this site, blog slug", "public": true,
//      "origin": "https://seotecnico.dev.br", "path": "/blog/{slug}" }]
// `{slug}` é trocado pelo slug inventado (SLUG abaixo, com a data).
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}

const TODAY = new Date().toISOString().slice(0, 10)
const TARGETS = arg('targets')
const OUT = arg('out', path.join('audits', 'case-studies', `soft404-${TODAY}`))
const UA_TOKEN = 'seotecnico-soft404-probe'
const UA = `${UA_TOKEN}/1.0 (+https://seotecnico.dev.br)`
const SLUG = `pagina-inexistente-sonda-${TODAY.replaceAll('-', '')}`
const PAUSE_MS = 1000
const MAX_HOPS = 5
const MAX_BYTES = 2_000_000
const ACCEPTS = ['text/html', '*/*']

if (!TARGETS) {
  console.error('uso: node scripts/soft404-probe.mjs --targets <arquivo.json> [--out <pasta>]')
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequestAt = 0

/** GET sem seguir redirect. Cabeçalhos: só User-Agent, Accept e Accept-Encoding. */
async function get(url, accept) {
  const wait = lastRequestAt + PAUSE_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
  const lib = url.startsWith('https:') ? https : http
  return new Promise((resolve) => {
    const req = lib.get(
      url,
      {
        headers: { 'User-Agent': UA, Accept: accept, 'Accept-Encoding': 'gzip, br' },
        timeout: 20_000,
      },
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
        stream.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), bytes: size }),
        )
        stream.on('error', (e) => resolve({ error: String(e) }))
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', (e) => resolve({ error: String(e) }))
  })
}

/** Segue até MAX_HOPS redirects, registrando cada salto. */
async function follow(url, accept) {
  const hops = []
  let current = url
  for (let i = 0; i <= MAX_HOPS; i++) {
    const res = await get(current, accept)
    if (res.error) return { hops, error: res.error }
    hops.push({ url: current, status: res.status, location: res.headers.location ?? null })
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
// empate fica com Allow (RFC 9309).
function parseRobots(text) {
  const groups = []
  let current = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === 'user-agent') {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }))
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (current && (key === 'allow' || key === 'disallow')) current.rules.push({ allow: key === 'allow', path: value })
    }
  }
  return groups
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

function robotsAllows(groups, urlPath) {
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && UA_TOKEN.startsWith(a)))
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes('*'))
  let best = null
  for (const rule of chosen.flatMap((g) => g.rules)) {
    if (!ruleMatches(rule.path, urlPath)) continue
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule
  }
  return best ? best.allow : true
}

// ── leitura do HTML ─────────────────────────────────────────────────────────
const first = (re, s) => (s.match(re) ?? [])[1] ?? null
const decode = (s) => (s == null ? null : s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim())

function readHtml(body) {
  const head = body.slice(0, 300_000)
  const metaRobots = [...head.matchAll(/<meta[^>]+name=["']robots["'][^>]*>/gi)].map((m) => decode(first(/content=["']([^"']*)/i, m[0])))
  const canonicalTag = (head.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) ?? [])[0]
  return {
    title: decode(first(/<title[^>]*>([^<]*)<\/title>/i, head)),
    metaRobots,
    canonical: canonicalTag ? decode(first(/href=["']([^"']*)/i, canonicalTag)) : null,
  }
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16)

// ── execução ────────────────────────────────────────────────────────────────
const targets = JSON.parse(fs.readFileSync(TARGETS, 'utf8'))
const robotsCache = new Map()
const homeCache = new Map()
const raw = []
let requests = 0

for (const t of targets) {
  const origin = t.origin.replace(/\/$/, '')
  // A home diz qual é a origem canônica (www × sem www, http → https): a URL
  // inventada é pedida nela, para que um redirect de host não pareça resposta
  // ao caminho inexistente.
  if (!homeCache.has(origin)) {
    const h = await follow(`${origin}/`, 'text/html')
    requests += h.hops.length
    homeCache.set(origin, h.final ? { hash: sha(h.final.body), origin: new URL(h.finalUrl).origin } : { hash: null, origin })
  }
  const home = homeCache.get(origin)
  const base = home.origin
  if (!robotsCache.has(base)) {
    const r = await get(`${base}/robots.txt`, 'text/plain')
    requests++
    robotsCache.set(base, r.status === 200 ? parseRobots(r.body ?? '') : [])
  }
  const urlPath = t.path.replace('{slug}', SLUG)
  const entry = { code: t.code, label: t.label, public: !!t.public, origin: base, path: urlPath, results: [] }
  if (!robotsAllows(robotsCache.get(base), urlPath)) {
    entry.skipped = 'disallowed by robots.txt'
    raw.push(entry)
    console.log(`${t.code} ${t.label}: robots.txt bloqueia, pulado`)
    continue
  }
  for (const accept of ACCEPTS) {
    const r = await follow(`${base}${urlPath}`, accept)
    requests += r.hops.length
    if (r.error) {
      entry.results.push({ accept, hops: r.hops, error: r.error })
      continue
    }
    const html = readHtml(r.final.body)
    entry.results.push({
      accept,
      hops: r.hops,
      finalUrl: r.finalUrl,
      status: r.final.status,
      contentType: r.final.headers['content-type'] ?? null,
      xRobotsTag: r.final.headers['x-robots-tag'] ?? null,
      bytes: r.final.bytes,
      bodyHash: sha(r.final.body),
      sameBodyAsHome: home.hash === sha(r.final.body),
      ...html,
    })
    console.log(`${t.code} ${t.label} [${accept}]: ${r.hops.map((h) => h.status).join(' → ')}`)
  }
  raw.push(entry)
}

// ── resumo versionável ──────────────────────────────────────────────────────
// Para terceiros, nada que identifique: sem host, caminho, título ou canonical
// em texto. Só fatos booleanos e status.
const isNoindex = (r) =>
  r.metaRobots.some((v) => /noindex/i.test(v ?? '')) || /noindex/i.test(String(r.xRobotsTag ?? ''))

function verdict(r) {
  if (r.status === 404 || r.status === 410) return `real ${r.status}`
  if (r.status >= 200 && r.status < 300) return isNoindex(r) ? '200 + noindex' : '200 indexable (soft 404 candidate)'
  return `other ${r.status}`
}

function canonicalKind(r) {
  if (r.canonical == null) return 'none'
  try {
    return new URL(r.canonical, r.finalUrl).href === r.finalUrl ? 'self' : 'other'
  } catch {
    return 'malformed'
  }
}

const summary = {
  date: TODAY,
  collectedAt: new Date().toISOString(),
  userAgent: UA,
  inventedSlug: SLUG,
  pauseMs: PAUSE_MS,
  requests,
  method: 'docs/research/2026-11-08-soft-404.md; script scripts/soft404-probe.mjs',
  targets: raw.map((e) => ({
    code: e.code,
    label: e.label,
    ...(e.public ? { origin: e.origin, path: e.path } : {}),
    skipped: e.skipped,
    results: e.results.map((r) =>
      r.error
        ? { accept: r.accept, error: r.error }
        : {
            accept: r.accept,
            chain: r.hops.map((h) => h.status),
            redirectedTo: r.hops.length > 1 ? (new URL(r.finalUrl).origin === e.origin ? 'same origin' : 'other origin') : null,
            status: r.status,
            verdict: verdict(r),
            noindex: isNoindex(r),
            titlePresent: !!r.title,
            titleContainsInventedSlug: !!r.title && r.title.toLowerCase().includes(SLUG.replaceAll('-', ' ')) ||
              !!r.title && r.title.toLowerCase().includes(SLUG),
            canonical: canonicalKind(r),
            sameBodyAsHome: r.sameBodyAsHome,
            kb: Math.round(r.bytes / 1024),
            ...(e.public ? { title: r.title, metaRobots: r.metaRobots, canonicalUrl: r.canonical } : {}),
          },
    ),
  })),
}

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify({ ...summary, targets: raw }, null, 2))
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(`\n${requests} requisições · ${OUT}/summary.json`)
