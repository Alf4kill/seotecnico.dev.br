// ─────────────────────────────────────────────────────────────────────────────
// Anatomia de template: mede, no HTML que o servidor entrega, o que um conjunto
// de páginas geradas pelo mesmo molde tem em comum.
//
// Para cada alvo (uma origem + a página que lista as URLs), baixa o inventário
// e calcula, só sobre o HTML bruto:
//   - identidade do molde: title × H1 × alt × description;
//   - bloco repetido (ex.: lista de cidades): peso em bytes e em texto, itens,
//     nomes distintos, painéis de aba, se o bloco é idêntico entre páginas;
//   - texto: similaridade literal (Jaccard de 5-gramas de palavras) e de
//     vocabulário (cosseno de termos) com o vizinho mais próximo, frases que se
//     repetem entre páginas, páginas sem nenhum número com unidade;
//   - URLs: pares de slugs com os mesmos tokens, prefixos comerciais;
//   - links: quanto do inventário cada página linka;
//   - higiene: robots.txt, sitemap.xml, canonical, meta robots, JSON-LD,
//     variações de URL.
// Nada aqui lê resultado de busca: é o que a origem respondeu, na data da rodada.
//
// Regras de coleta (docs/proposals/case-studies-content.md §3–§4), as mesmas de
// scripts/soft404-probe.mjs:
// - node:https, não fetch (o fetch do Node acrescenta sec-fetch-mode: cors,
//   PR #95); cabeçalhos: só User-Agent, Accept e Accept-Encoding;
// - robots.txt lido antes; caminho bloqueado não é pedido;
// - uma requisição por vez, pausa mínima de PAUSE_MS;
// - nenhuma busca no Google.
//
// Duas fases, para que a análise possa ser refeita sem pedir nada de novo:
//   node scripts/template-anatomy.mjs fetch   --targets <arquivo.json> [--out <pasta>] [--only S1]
//   node scripts/template-anatomy.mjs analyze --targets <arquivo.json> [--out <pasta>] [--only S1]
//
// Saída em <out>/: html/<código>/*.html e raw-<código>.json (ficam locais, ver
// .gitignore: trazem hosts, caminhos e texto) e summary.json (versionável:
// alvos de terceiros aparecem só pelo código e por números; nenhum caminho,
// título ou frase). Toda contagem de páginas sai como proporção do conjunto e,
// num alvo de terceiro, os totais absolutos são arredondados (o total exato de
// páginas ou de itens de um site é um detalhe dele). Alvos `public: true`
// saem com os totais exatos.
//
// Formato do arquivo de alvos: audits/case-studies/template-anatomy.example.json.
// Os marcadores (onde começa o corpo, onde começa o bloco) são expressões
// regulares aplicadas ao HTML; os de um site de terceiro identificam o site e
// por isso vivem só no arquivo local.
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
const OUT = arg('out', path.join('audits', 'case-studies', `template-anatomy-${TODAY}`))
const ONLY = arg('only')
const UA_TOKEN = 'seotecnico-template-anatomy'
const UA = `${UA_TOKEN}/1.0 (+https://seotecnico.dev.br)`
const PAUSE_MS = 1000
const MAX_HOPS = 5
const MAX_BYTES = 5_000_000
const MAX_PAGES = Number(arg('max', 400))

if (!['fetch', 'analyze'].includes(command) || !TARGETS) {
  console.error('uso: node scripts/template-anatomy.mjs <fetch|analyze> --targets <arquivo.json> [--out <pasta>] [--only <código>]')
  process.exit(2)
}

const targets = JSON.parse(fs.readFileSync(TARGETS, 'utf8')).filter((t) => !ONLY || t.code === ONLY)
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16)

// ── HTTP ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequestAt = 0
let requests = 0

/** GET sem seguir redirect. Cabeçalhos: só User-Agent, Accept e Accept-Encoding. */
async function get(url, accept = 'text/html') {
  const wait = lastRequestAt + PAUSE_MS - Date.now()
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
    hops.push({ url: current, status: res.status })
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(res.headers.location, current).href
      continue
    }
    return { hops, final: res, finalUrl: current }
  }
  return { hops, error: 'too many redirects' }
}

// ── robots.txt (RFC 9309: regra mais longa vence; empate fica com Allow) ─────
function parseRobots(text) {
  const groups = []
  let current = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.replace(/#.*/, '').trim().match(/^([a-z-]+)\s*:\s*(.*)$/i)
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
const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' }
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)

/** Texto de um trecho de HTML: sem script/style, sem tags, espaços colapsados. */
const textOf = (html) =>
  decode(
    html
      .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

/** Blocos de texto de um trecho: um por parágrafo, item de lista, título ou célula. */
const blocksOf = (html) =>
  html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .split(/<\/?(?:p|li|ul|ol|h[1-6]|div|section|figure|figcaption|table|tr|td|th|blockquote|pre|br)\b[^>]*>/i)
    .map(textOf)
    .filter(Boolean)

const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m ? decode(m[1] ?? m[2]).trim() : null
}

function readHead(html) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  const meta = (name) => {
    const tag = metas.find((t) => (attr(t, 'name') ?? '').toLowerCase() === name)
    return tag ? attr(tag, 'content') : null
  }
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical')
  // <h1> dentro de <script> não conta: bibliotecas trazem modelos de HTML em JavaScript.
  const visible = html.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
  const h1s = [...visible.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1]))
  const jsonLdTypes = []
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (!node || typeof node !== 'object') return
        if (node['@type']) jsonLdTypes.push(...[].concat(node['@type']))
        if (node['@graph']) walk(node['@graph'])
      }
      walk(JSON.parse(m[1]))
    } catch {
      jsonLdTypes.push('(invalid JSON)')
    }
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return {
    title: titleMatch ? textOf(titleMatch[1]) : null,
    description: meta('description'),
    metaKeywords: meta('keywords'),
    robots: meta('robots'),
    canonical: canonicalTag ? attr(canonicalTag, 'href') : null,
    lang: attr((html.match(/<html\b[^>]*>/i) ?? [''])[0], 'lang'),
    h1s,
    jsonLdTypes,
  }
}

/** Trecho do HTML entre dois marcadores (regex em texto). null se o início não existe. */
function slice(html, startRe, endRe) {
  if (!startRe) return null
  const s = html.search(new RegExp(startRe, 'i'))
  if (s === -1) return null
  const rest = html.slice(s)
  const e = endRe ? rest.slice(1).search(new RegExp(endRe, 'i')) : -1
  return e === -1 ? rest : rest.slice(0, e + 1)
}

const pathsIn = (html, origin) => {
  const out = new Set()
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], 'href')
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) continue
    try {
      const u = new URL(href, origin + '/')
      if (u.origin === origin) out.add(u.pathname.replace(/\/+$/, '') || '/')
    } catch {
      /* href malformado: ignorado */
    }
  }
  return out
}

// ── estatística ─────────────────────────────────────────────────────────────
const sorted = (a) => [...a].sort((x, y) => x - y)
const quantile = (a, q) => {
  if (!a.length) return null
  const s = sorted(a)
  const pos = (s.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo] + (s[hi] - s[lo]) * (pos - lo)
}
const round = (n, d = 3) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d)
const dist = (a, d = 3) => ({ median: round(quantile(a, 0.5), d), p10: round(quantile(a, 0.1), d), p90: round(quantile(a, 0.9), d), min: round(Math.min(...a), d), max: round(Math.max(...a), d) })

// Palavras vazias do português e do inglês (o controle tem código e termos em
// inglês). A lista é curta de propósito: o que importa é ser a mesma para todos.
const STOP = new Set(
  `a à ao aos as às o os um uma uns umas de do da dos das dum duma em no na nos nas num numa por pelo pela pelos pelas para pra com sem sob sobre entre ate até apos após desde contra e ou mas nem que se como quando onde porque pois ja já nao não sim tambem também muito muita muitos muitas mais menos tao tão so só ainda apenas cada todo toda todos todas outro outra outros outras mesmo mesma mesmos mesmas esse essa esses essas este esta estes estas isso isto aquele aquela aqueles aquelas aquilo ele ela eles elas eu tu voce você voces vocês nos nós me te lhe lhes seu sua seus suas nosso nossa nossos nossas meu minha ser sao são e é era eram foi foram sera será estar esta está estao estão ter tem têm tinha ha há haver pode podem deve devem fazer faz feito the of and to in is for on with that this it as are be or by an at from`.split(/\s+/),
)

const words = (text) => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])

function shingles(tokens, n = 5) {
  const set = new Set()
  for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(' '))
  return set
}
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0
  let inter = 0
  const [small, big] = a.size < b.size ? [a, b] : [b, a]
  for (const x of small) if (big.has(x)) inter++
  return inter / (a.size + b.size - inter)
}
function cosine(a, b) {
  let dot = 0
  const [small, big] = a.size < b.size ? [a, b] : [b, a]
  for (const [k, v] of small) dot += v * (big.get(k) ?? 0)
  return dot
}
/** Normaliza um vetor esparso para norma 1. */
function unit(vec) {
  let n = 0
  for (const v of vec.values()) n += v * v
  n = Math.sqrt(n) || 1
  for (const [k, v] of vec) vec.set(k, v / n)
  return vec
}

// Número seguido de unidade de medida. Duas leituras: com e sem o sinal de
// porcentagem, porque "100%" também aparece em texto de venda sem dado nenhum.
const UNITS =
  'kcal\\/h|kcal|kwh|kw|mw|kva|cv|hp|btu|°c|ºc|bar|psi|kgf\\/cm²|kgf|kg\\/h|kg|t\\/h|toneladas?|ton|m³\\/h|m³|m²|m3|m2|mm|cm|km|metros?|l\\/h|litros?|rpm|volts?|hz|ms|segundos?|minutos?|horas?|kb|kib|mb|gb|bytes?|px|bps'
const NUMBER_UNIT = new RegExp(`\\d+(?:[.,]\\d+)?\\s?(?:${UNITS})(?![\\p{L}\\p{N}])`, 'iu')
const NUMBER_UNIT_OR_PERCENT = new RegExp(`\\d+(?:[.,]\\d+)?\\s?(?:%|${UNITS})(?![\\p{L}\\p{N}])`, 'iu')

// Prefixos de intenção comercial no slug: todos pedem "quem fabrica ou vende X".
const COMMERCIAL_PREFIXES = new Set(['fabricante', 'fabricantes', 'fabrica', 'fornecedor', 'fornecedores', 'empresa', 'empresas', 'melhor', 'melhores', 'comprar', 'preco', 'venda', 'loja', 'distribuidor', 'distribuidores'])

// ── fase 1: coleta ──────────────────────────────────────────────────────────
async function fetchTarget(t) {
  const requestsBefore = requests
  const dir = path.join(OUT, 'html', t.code)
  fs.mkdirSync(dir, { recursive: true })
  const home = await follow(`${t.origin.replace(/\/$/, '')}/`)
  if (!home.final) throw new Error(`${t.code}: home sem resposta (${home.error})`)
  const origin = new URL(home.finalUrl).origin
  const robotsRes = await get(`${origin}/robots.txt`, 'text/plain')
  const robots = robotsRes.status === 200 ? parseRobots(robotsRes.body ?? '') : []
  const sitemapRes = await get(`${origin}/sitemap.xml`, 'application/xml')
  const sitemapLocs = sitemapRes.status === 200 ? [...(sitemapRes.body ?? '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1])) : []

  // Inventário: a página que o site usa para listar suas URLs.
  let inventory
  if (t.inventory.type === 'sitemap') {
    inventory = sitemapLocs.map((u) => new URL(u).pathname.replace(/\/+$/, '') || '/')
  } else {
    const inv = await follow(`${origin}${t.inventory.path}`)
    if (!inv.final || inv.final.status !== 200) throw new Error(`${t.code}: inventário respondeu ${inv.final?.status ?? inv.error}`)
    inventory = [...pathsIn(inv.final.body, origin)]
  }
  const include = t.inventory.include ? new RegExp(t.inventory.include) : null
  const exclude = t.inventory.exclude ? new RegExp(t.inventory.exclude) : null
  inventory = [...new Set(inventory)].filter((p) => (!include || include.test(p)) && (!exclude || !exclude.test(p))).sort()
  if (inventory.length > MAX_PAGES) throw new Error(`${t.code}: ${inventory.length} URLs no inventário, acima de --max ${MAX_PAGES}`)

  const pages = []
  for (const [i, p] of inventory.entries()) {
    if (!robotsAllows(robots, p)) {
      pages.push({ path: p, skipped: 'disallowed by robots.txt' })
      continue
    }
    const r = await follow(`${origin}${p}`)
    const file = `${String(i).padStart(4, '0')}.html`
    if (r.final) fs.writeFileSync(path.join(dir, file), r.final.body)
    pages.push({ path: p, file: r.final ? file : null, chain: r.hops.map((h) => h.status), status: r.final?.status ?? null, bytes: r.final?.bytes ?? null, error: r.error })
    if ((i + 1) % 20 === 0) console.log(`${t.code}: ${i + 1}/${inventory.length}`)
  }

  // Variações de URL de uma página do inventário: respondem 200 com o mesmo
  // conteúdo? (só faz diferença quando não há canonical).
  const variants = []
  const sample = pages.find((p) => p.status === 200 && p.path !== '/' && (!t.landing?.include || new RegExp(t.landing.include).test(p.path)))
  if (sample && t.variants !== false) {
    for (const [label, url] of [
      ['trailing slash', `${origin}${sample.path}/`],
      ['query string', `${origin}${sample.path}?x=1`],
      ['index.php', `${origin}/index.php`],
    ]) {
      const urlPath = new URL(url).pathname
      if (!robotsAllows(robots, urlPath)) continue
      const r = await follow(url)
      variants.push({ label, chain: r.hops.map((h) => h.status), status: r.final?.status ?? null, redirected: r.hops.length > 1, head: r.final ? readHead(r.final.body) : null })
    }
  }

  const manifest = {
    code: t.code,
    origin,
    collectedAt: new Date().toISOString(),
    userAgent: UA,
    pauseMs: PAUSE_MS,
    requests: requests - requestsBefore,
    robotsTxt: { status: robotsRes.status ?? null, groups: robots.length },
    sitemapXml: { status: sitemapRes.status ?? null, urls: sitemapLocs.length },
    variantSample: sample?.path ?? null,
    variants,
    pages,
  }
  fs.writeFileSync(path.join(OUT, `raw-${t.code}.json`), JSON.stringify(manifest, null, 2))
  console.log(`${t.code}: ${pages.length} URLs · ${requests} requisições até aqui`)
}

// ── fase 2: análise ─────────────────────────────────────────────────────────
function analyzeTarget(t) {
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, `raw-${t.code}.json`), 'utf8'))
  const dir = path.join(OUT, 'html', t.code)
  const origin = manifest.origin
  const landingInclude = t.landing?.include ? new RegExp(t.landing.include) : null
  const landingExclude = t.landing?.exclude ? new RegExp(t.landing.exclude) : null
  const isLanding = (p) => (!landingInclude || landingInclude.test(p)) && (!landingExclude || !landingExclude.test(p))

  const docs = manifest.pages
    .filter((p) => p.file && p.status === 200)
    .map((p) => {
      const html = fs.readFileSync(path.join(dir, p.file), 'utf8')
      return { ...p, html, head: readHead(html), landing: isLanding(p.path) }
    })
  const landings = docs.filter((d) => d.landing)
  const others = docs.filter((d) => !d.landing)
  const landingPaths = new Set(landings.map((d) => d.path))
  const inventoryPaths = new Set(docs.map((d) => d.path))
  const brandSuffix = t.brandSuffix ? norm(t.brandSuffix) : null

  for (const d of landings) {
    const h1 = d.head.h1s[0] ?? ''
    d.kw = norm(h1)
    d.kwTokens = new Set(words(h1))
    const bodyHtml = slice(d.html, t.body?.start, t.body?.end) ?? ''
    const blockHtml = slice(d.html, t.block?.start, t.block?.end)
    d.bodyFound = bodyHtml.length > 0
    // O corpo nunca inclui o bloco, mesmo que os marcadores se sobreponham.
    const ownHtml = blockHtml && bodyHtml.includes(blockHtml) ? bodyHtml.replace(blockHtml, ' ') : bodyHtml
    d.bodyText = textOf(ownHtml)
    d.bodyBlocks = blocksOf(ownHtml)
    d.bodyImgs = [...bodyHtml.matchAll(/<img\b[^>]*>/gi)].map((m) => attr(m[0], 'alt'))
    d.pageTextChars = textOf(d.html).length
    d.htmlBytes = Buffer.byteLength(d.html)
    if (blockHtml) {
      const itemTag = t.block.item ?? 'li'
      const itemRe = new RegExp(`<${itemTag}\\b[^>]*>([\\s\\S]*?)<\\/${itemTag}>`, 'gi')
      const paneStarts = [...blockHtml.matchAll(/<[a-z0-9]+\b[^>]*class=["'][^"']*\btab-pane\b[^"']*["'][^>]*>/gi)]
      const panes = paneStarts.map((m, i) => {
        const html = blockHtml.slice(m.index, paneStarts[i + 1]?.index ?? blockHtml.length)
        return { active: /\bactive\b/.test(attr(m[0], 'class') ?? ''), items: [...html.matchAll(itemRe)].map((x) => textOf(x[1])), textChars: textOf(html).length }
      })
      const items = [...blockHtml.matchAll(itemRe)].map((x) => textOf(x[1])).filter(Boolean)
      d.block = {
        bytes: Buffer.byteLength(blockHtml),
        textChars: textOf(blockHtml).length,
        items,
        panes,
        // O título do bloco costuma levar a palavra-chave da página; o que se
        // compara entre páginas é a lista.
        listHash: sha(items.join('\n')),
      }
    }
    d.links = pathsIn(d.html, origin)
    // Bloco de "relacionadas": links escolhidos por página, à parte da malha fixa.
    const relatedHtml = slice(d.html, t.related?.start, t.related?.end)
    d.related = relatedHtml ? pathsIn(relatedHtml, origin) : null
    d.bodyLinks = pathsIn(bodyHtml, origin)
  }

  // ── identidade do molde ───────────────────────────────────────────────────
  const titleCore = (d) => {
    const title = norm(d.head.title)
    return brandSuffix && title.endsWith(brandSuffix) ? title.slice(0, -brandSuffix.length).trim() : title
  }
  const withImgs = landings.filter((d) => d.bodyImgs.length > 0)
  const descNorm = (d) => norm((d.head.description ?? '').replace(/(\.{3}|…)\s*.*$/u, ''))
  // Toda contagem de páginas sai como proporção (0 a 1) do conjunto. Num alvo
  // de terceiro, os totais absolutos (URLs, itens, pares, bytes) são
  // arredondados: o total exato de um site é um detalhe dele, e o que a medida
  // quer mostrar é a proporção. O detalhe local (detail-*.json) guarda os exatos.
  const L = landings.length
  const share = (n, d = L) => (d ? round(n / d, t.public ? 3 : 2) : null)
  const approx = (n, step) => (t.public || n == null ? n : Math.round(n / step) * step)
  const atLeast = (n, step) => (t.public ? n : Math.floor(n / step) * step)
  const distApprox = (a, step) => {
    const d = dist(a, 0)
    return t.public ? d : Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Math.round(v / step) * step]))
  }
  const identity = {
    oneH1: share(landings.filter((d) => d.head.h1s.length === 1).length),
    titleEqualsH1: share(landings.filter((d) => d.kw && titleCore(d) === d.kw).length),
    titleContainsH1: share(landings.filter((d) => d.kw && norm(d.head.title).includes(d.kw)).length),
    pagesWithBodyImages: share(withImgs.length),
    allBodyImageAltsEqualH1: share(withImgs.filter((d) => d.bodyImgs.every((a) => norm(a) === d.kw)).length, withImgs.length),
    descriptionIsBodyOpening: share(
      landings.filter((d) => {
        const dn = descNorm(d)
        return dn.length >= 30 && norm(d.bodyText).includes(dn)
      }).length,
    ),
    descriptionTruncatedWithEllipsis: share(landings.filter((d) => /(\.{3}|…)/.test(d.head.description ?? '')).length),
    distinctTitles: share(new Set(landings.map((d) => d.head.title)).size),
    distinctDescriptions: share(new Set(landings.map((d) => d.head.description)).size),
  }

  // ── bloco repetido ────────────────────────────────────────────────────────
  const withBlock = landings.filter((d) => d.block)
  let block = null
  if (withBlock.length) {
    const ref = withBlock[0].block
    const names = ref.items.map(norm)
    const activeChars = ref.panes.filter((p) => p.active).reduce((a, p) => a + p.textChars, 0)
    block = {
      pagesWithBlock: share(withBlock.length),
      distinctLists: new Set(withBlock.map((d) => d.block.listHash)).size,
      itemsAtLeast: atLeast(ref.items.length, 1000),
      distinctNamesAtLeast: atLeast(new Set(names).size, 1000),
      panes: ref.panes.length,
      activePanes: ref.panes.filter((p) => p.active).length,
      ...(t.public ? { itemsPerPane: ref.panes.map((p) => p.items.length) } : {}),
      textInActivePanesShare: ref.panes.length ? round(activeChars / ref.panes.reduce((a, p) => a + p.textChars, 0)) : null,
      blockBytes: distApprox(withBlock.map((d) => d.block.bytes), 10_000),
      shareOfHtmlBytes: dist(withBlock.map((d) => d.block.bytes / d.htmlBytes)),
      shareOfPageText: dist(withBlock.map((d) => d.block.textChars / d.pageTextChars)),
      bodyShareOfPageText: dist(withBlock.map((d) => d.bodyText.length / d.pageTextChars)),
    }
  }

  // ── texto ─────────────────────────────────────────────────────────────────
  const bodies = landings.filter((d) => d.bodyText.length > 0)
  for (const d of bodies) {
    d.tokens = words(d.bodyText)
    d.shingles = shingles(d.tokens)
    d.terms = d.tokens.filter((w) => !STOP.has(w) && !d.kwTokens.has(w) && w.length > 1)
  }
  const df = new Map()
  for (const d of bodies) for (const w of new Set(d.terms)) df.set(w, (df.get(w) ?? 0) + 1)
  for (const d of bodies) {
    const tf = new Map()
    for (const w of d.terms) tf.set(w, (tf.get(w) ?? 0) + 1)
    d.tf = unit(new Map(tf))
    d.tfidf = unit(new Map([...tf].map(([w, v]) => [w, v * Math.log(bodies.length / df.get(w))])))
  }
  const nearest = { literal: [], vocab: [], vocabIdf: [] }
  let vocabPairsAbove70 = 0
  let literalPairsAbove30 = 0
  for (let i = 0; i < bodies.length; i++) {
    let bl = 0
    let bv = 0
    let bi = 0
    for (let j = 0; j < bodies.length; j++) {
      if (i === j) continue
      const l = jaccard(bodies[i].shingles, bodies[j].shingles)
      const v = cosine(bodies[i].tf, bodies[j].tf)
      const vi = cosine(bodies[i].tfidf, bodies[j].tfidf)
      if (l > bl) bl = l
      if (v > bv) bv = v
      if (vi > bi) bi = vi
      if (j > i && v >= 0.7) vocabPairsAbove70++
      if (j > i && l >= 0.3) literalPairsAbove30++
    }
    nearest.literal.push(bl)
    nearest.vocab.push(bv)
    nearest.vocabIdf.push(bi)
  }

  // Frases: a palavra-chave da página vira {KW}, para que o mesmo molde com
  // lacuna conte como a mesma frase.
  const sentenceCount = new Map()
  const openingCount = new Map()
  for (const d of bodies) {
    const kwRe = d.kw ? new RegExp(d.kw.split(' ').map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'g') : null
    const sentences = d.bodyBlocks
      .flatMap((b) => b.split(/(?<=[.!?:;])\s+/))
      .map((s) => {
        const n = norm(s)
        return kwRe ? n.replace(kwRe, '{kw}') : n
      })
      .filter((s) => s.split(' ').length >= 6)
    d.sentences = sentences
    for (const s of new Set(sentences)) sentenceCount.set(s, (sentenceCount.get(s) ?? 0) + 1)
    if (sentences[0]) {
      const opening = sentences[0].split(' ').slice(0, 6).join(' ')
      openingCount.set(opening, (openingCount.get(opening) ?? 0) + 1)
    }
  }
  const repeated = [...sentenceCount.entries()].sort((a, b) => b[1] - a[1])
  const tenth = Math.max(2, Math.ceil(bodies.length / 10))
  const repeatedSet = new Set(repeated.filter(([, n]) => n >= tenth).map(([s]) => s))
  const text = {
    pagesWithBody: share(bodies.length),
    bodyWords: distApprox(bodies.map((d) => d.tokens.length), 10),
    literalNearest: dist(nearest.literal),
    literalPairsAtOrAbove030: approx(literalPairsAbove30, 10),
    vocabularyNearest: dist(nearest.vocab),
    vocabularyNearestTfIdf: dist(nearest.vocabIdf),
    vocabularyPairsAtOrAbove070: approx(vocabPairsAbove70, 10),
    pagesWithoutNumberAndUnit: share(bodies.filter((d) => !NUMBER_UNIT.test(d.bodyText)).length, bodies.length),
    pagesWithoutNumberUnitOrPercent: share(bodies.filter((d) => !NUMBER_UNIT_OR_PERCENT.test(d.bodyText)).length, bodies.length),
    h1PhraseDensity: dist(
      bodies.filter((d) => d.kw).map((d) => {
        const n = norm(d.bodyText)
        const hits = n.split(d.kw).length - 1
        return (hits * d.kw.split(' ').length) / Math.max(1, n.split(' ').length)
      }),
    ),
    sentencesInAtLeastTenthOfPages: repeatedSet.size,
    pagesWithAtLeastOneSuchSentence: share(bodies.filter((d) => d.sentences.some((s) => repeatedSet.has(s))).length, bodies.length),
    topRepeatedSentencePages: repeated.slice(0, 5).map(([, n]) => share(n, bodies.length)),
    topOpeningPages: [...openingCount.values()].sort((a, b) => b - a).slice(0, 3).map((n) => share(n, bodies.length)),
  }

  // ── URLs ──────────────────────────────────────────────────────────────────
  const slugTokens = landings.map((d) => new Set(norm(d.path.split('/').filter(Boolean).pop() ?? '').split(' ').filter(Boolean)))
  let slugPairs = 0
  const inPair = new Set()
  for (let i = 0; i < slugTokens.length; i++)
    for (let j = i + 1; j < slugTokens.length; j++)
      if (jaccard(slugTokens[i], slugTokens[j]) >= 0.66) {
        slugPairs++
        inPair.add(i).add(j)
      }
  const urls = {
    depthOne: share(landings.filter((d) => d.path.split('/').filter(Boolean).length === 1).length),
    slugTokens: dist(slugTokens.map((s) => s.size), 0),
    slugPairsJaccardAtOrAbove066: approx(slugPairs, 10),
    pagesInSuchPairs: share(inPair.size),
    commercialPrefix: share(landings.filter((d) => COMMERCIAL_PREFIXES.has(norm(d.path.split('/').filter(Boolean).pop() ?? '').split(' ')[0])).length),
  }

  // ── links ─────────────────────────────────────────────────────────────────
  const inbound = new Map(landings.map((d) => [d.path, 0]))
  const outShare = []
  for (const d of landings) {
    let n = 0
    for (const p of d.links) if (p !== d.path && landingPaths.has(p)) {
      n++
      inbound.set(p, inbound.get(p) + 1)
    }
    outShare.push(n / Math.max(1, landings.length - 1))
  }
  const links = {
    shareOfOtherLandingsLinkedFromEachLanding: dist(outShare),
    landingsLinkedFromEveryOtherLanding: share([...inbound.values()].filter((n) => n === landings.length - 1).length),
    internalLinksPerLanding: distApprox(landings.map((d) => d.links.size), 10),
    // Só links para outra página do inventário: a galeria de imagens não conta.
    landingsWithABodyLinkToAnotherInventoryPage: share(landings.filter((d) => [...d.bodyLinks].some((p) => p !== d.path && inventoryPaths.has(p))).length),
  }
  const withRelated = landings.filter((d) => d.related)
  if (withRelated.length) {
    const relIn = new Map(landings.map((d) => [d.path, 0]))
    for (const d of withRelated) for (const p of d.related) if (p !== d.path && relIn.has(p)) relIn.set(p, relIn.get(p) + 1)
    const v = [...relIn.values()]
    links.relatedBlock = {
      pagesWithBlock: share(withRelated.length),
      linksPerPage: dist(withRelated.map((d) => d.related.size), 0),
      landingsNeverPicked: share(v.filter((n) => n === 0).length),
      landingsPickedMoreThan10Times: share(v.filter((n) => n > 10).length),
    }
  }

  // ── higiene ───────────────────────────────────────────────────────────────
  const selfCanonical = (d) => {
    if (!d.head.canonical) return false
    try {
      return (new URL(d.head.canonical, origin).pathname.replace(/\/+$/, '') || '/') === d.path
    } catch {
      return false
    }
  }
  const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})
  const shares = (obj, d) => Object.fromEntries(Object.entries(obj).map(([k, n]) => [k, share(n, d)]))
  const otherTitles = count(others.map((d) => d.head.title ?? '(none)'))
  const hygiene = {
    robotsTxtStatus: manifest.robotsTxt.status,
    sitemapXmlStatus: manifest.sitemapXml.status,
    sitemapXmlUrls: approx(manifest.sitemapXml.urls, 10),
    statusOfInventory: shares(count(manifest.pages.map((p) => String(p.status ?? p.skipped ?? 'error'))), manifest.pages.length),
    redirectedInventoryUrls: share(manifest.pages.filter((p) => (p.chain?.length ?? 0) > 1).length, manifest.pages.length),
    canonicalPresent: share(docs.filter((d) => d.head.canonical).length, docs.length),
    canonicalSelf: share(docs.filter(selfCanonical).length, docs.length),
    noindex: share(docs.filter((d) => /noindex/i.test(d.head.robots ?? '')).length, docs.length),
    jsonLdTypesOnLandings: shares(count(landings.flatMap((d) => [...new Set(d.head.jsonLdTypes)])), L),
    landingsWithoutJsonLd: share(landings.filter((d) => d.head.jsonLdTypes.length === 0).length),
    distinctMetaKeywordsAcrossSite: new Set(docs.map((d) => d.head.metaKeywords ?? '')).size,
    pagesWithMetaKeywords: share(docs.filter((d) => d.head.metaKeywords).length, docs.length),
    otherPagesSharingATitle: share(Object.values(otherTitles).filter((n) => n > 1).reduce((a, n) => a + n, 0), others.length),
    htmlBytesLandings: landings.length ? distApprox(landings.map((d) => d.htmlBytes), 10_000) : null,
    htmlBytesOtherPages: others.length ? distApprox(others.map((d) => Buffer.byteLength(d.html)), 10_000) : null,
    urlVariants: manifest.variants.map((v) => ({
      label: v.label,
      chain: v.chain,
      status: v.status,
      canonicalPresent: !!v.head?.canonical,
    })),
  }

  const result = {
    code: t.code,
    label: t.label,
    collectedAt: manifest.collectedAt,
    ...(t.public ? { requests: manifest.requests } : {}),
    counts: t.public
      ? 'exact; page counts are shares of the set'
      : 'page counts are shares of the set, to two decimals; absolute totals are rounded (pages, pairs and links to the nearest 10, list items down to the thousand, bytes to the nearest 10,000)',
    inventory: {
      source: t.inventory.type === 'sitemap' ? 'sitemap.xml' : 'HTML page that lists the site URLs',
      urls: approx(manifest.pages.length, 10),
      landings: approx(L, 10),
      otherPages: approx(others.length, 10),
    },
    markersFound: { body: share(landings.filter((d) => d.bodyFound).length), block: share(withBlock.length), related: share(withRelated.length) },
    identity,
    block,
    text,
    urls,
    links,
    hygiene,
  }

  // Detalhe local (com caminhos e frases), para conferir a leitura à mão.
  fs.writeFileSync(
    path.join(OUT, `detail-${t.code}.json`),
    JSON.stringify(
      {
        ...result,
        exact: { urls: manifest.pages.length, landings: L, otherPages: others.length, blockItems: withBlock[0]?.block.items.length ?? null, slugPairs, pagesInSlugPairs: inPair.size },
        topRepeatedSentences: repeated.slice(0, 40),
        topOpenings: [...openingCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
        pages: landings.map((d, i) => ({ path: d.path, title: d.head.title, h1: d.head.h1s[0], bodyWords: d.tokens?.length ?? 0, literal: round(nearest.literal[bodies.indexOf(d)]), vocab: round(nearest.vocab[bodies.indexOf(d)]), inbound: inbound.get(d.path), slugPair: inPair.has(i) })),
        otherPages: others.map((d) => ({ path: d.path, title: d.head.title, h1s: d.head.h1s })),
      },
      null,
      2,
    ),
  )
  if (t.public) result.origin = origin
  return result
}

// ── execução ────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true })
if (command === 'fetch') {
  for (const t of targets) await fetchTarget(t)
  console.log(`\n${requests} requisições · ${OUT}`)
} else {
  const summaryPath = path.join(OUT, 'summary.json')
  const previous = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath, 'utf8')).targets : []
  const results = targets.map(analyzeTarget)
  const merged = [...previous.filter((p) => !results.some((r) => r.code === p.code)), ...results].sort((a, b) => a.code.localeCompare(b.code))
  const summary = {
    method: 'scripts/template-anatomy.mjs; raw HTML only, no search results',
    userAgent: UA,
    pauseMs: PAUSE_MS,
    definitions: {
      literalNearest: 'Jaccard of word 5-grams between a page body and its most similar other body',
      vocabularyNearest: 'cosine of term frequencies (stopwords and the page own H1 words removed) with the most similar other body',
      vocabularyNearestTfIdf: 'same, with terms weighted by inverse document frequency within the set',
      pagesWithoutNumberAndUnit: 'bodies with no number followed by a unit of measure (list in the script)',
      slugPairsJaccardAtOrAbove066: 'pairs of URLs whose slug tokens overlap by two thirds or more',
      sentencesInAtLeastTenthOfPages: 'sentences of 6+ words, with the page H1 phrase replaced by a slot, found in 10% of the bodies or more',
      shares: 'every count of pages is a share (0 to 1) of the set it belongs to: template pages, bodies, all pages, or other pages',
    },
    targets: merged,
  }
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
}
