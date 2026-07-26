// ─────────────────────────────────────────────────────────────────────────────
// Validador de meta tags (/ferramentas/validador-meta-tags) — a lógica pura.
//
// Mesmo split do gerador de JSON-LD: extração e checagens vivem aqui (testadas
// no Vitest, sem DOM e sem rede); o fetch da URL fica na rota de API e a
// apresentação no client component. Os limites usados (60/155) são os mesmos
// que o site ensina e que a própria suíte Playwright deste repo impõe — a
// ferramenta valida pelos critérios que o laboratório pratica.
//
// Parsing por regex, de propósito: só interessam tags de <head> (title, meta,
// link) e a contagem de <h1>, todas estruturas planas onde um parser HTML
// completo seria dependência sem ganho. O custo aceito: atributos com ">"
// dentro de aspas confundem o corte da tag — raro em <meta>, irrelevante para
// o veredito.
// ─────────────────────────────────────────────────────────────────────────────

import { inCidr, parseCidr, type Cidr } from './crawler-verification'

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

export type CheckStatus = 'ok' | 'warning' | 'error'

export interface MetaCheck {
  id: string
  label: string
  status: CheckStatus
  /** Frase curta em PT explicando o veredito deste item. */
  detail: string
}

export interface ExtractedMeta {
  title: string | null
  description: string | null
  canonical: string | null
  metaRobots: string | null
  htmlLang: string | null
  charset: string | null
  viewport: string | null
  og: Partial<Record<'title' | 'description' | 'image' | 'url' | 'type', string>>
  twitterCard: string | null
  h1Count: number
}

/* ------------------------------------------------------------------ *
 * Guarda da URL de entrada (anti-SSRF, parte pura)
 *
 * Fica aqui, e não na rota, porque é a fronteira de segurança da ferramenta e
 * §8 do CLAUDE.md exige teste de unidade para a lógica de /lib. A rota mantém
 * só o que precisa de rede: o DNS que resolve o hostname antes do fetch.
 * ------------------------------------------------------------------ */

/** Portas aceitas: as duas padrão e a de dev mais comum atrás de proxy. */
export const ALLOWED_PORTS = ['80', '443', '8080']

/** Loopback, link-local e faixas privadas — v4 e v6, mais o formato mapeado. */
const PRIVATE_RANGES: Cidr[] = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '::1/128',
  '::/128',
  'fc00::/7',
  'fe80::/10',
  '::ffff:0:0/96',
]
  .map(parseCidr)
  .filter((c): c is Cidr => c !== null)

export function isPrivateAddress(ip: string): boolean {
  return PRIVATE_RANGES.some((range) => inCidr(ip, range))
}

export type TargetUrl = { ok: true; url: URL } | { ok: false; error: string }

/**
 * Normaliza o que o usuário digitou e recusa tudo que não seja uma página web
 * pública — menos o passo de DNS, que a rota faz em seguida.
 */
export function parseTargetUrl(raw: string): TargetUrl {
  const fail = (error: string): TargetUrl => ({ ok: false, error })

  const input = raw.trim()
  if (!input) return fail('Informe uma URL.')

  // Esquema explícito que não seja http(s) é recusado com a mensagem certa. Sem
  // isso, `ftp://x` viraria `https://ftp://x` e morreria no check de DNS, com um
  // erro que não descreve o problema. Só a forma `esquema://` conta: exigir as
  // duas barras é o que distingue um esquema de um `exemplo.com:8080`, que o
  // regex sem elas leria como esquema "exemplo.com". Esquemas sem barras
  // (`javascript:`, `data:`) não escapam — viram URL inválida logo abaixo.
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(input)?.[1]?.toLowerCase()
  if (scheme && !['http', 'https'].includes(scheme)) {
    return fail('Só http e https são suportados.')
  }

  let url: URL
  try {
    url = new URL(scheme ? input : `https://${input}`)
  } catch {
    return fail('URL inválida.')
  }

  if (url.port && !ALLOWED_PORTS.includes(url.port)) {
    return fail('Porta não suportada.')
  }

  // Nomes locais nunca chegam ao DNS: barrá-los aqui dá a mensagem certa e não
  // depende de como o resolvedor da máquina trata `.local`.
  const host = url.hostname.replace(/\.$/, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return fail('Endereços locais não são suportados.')
  }
  // IP literal é decidido aqui mesmo — não há nome para resolver.
  const literal = host.startsWith('[') ? host.slice(1, -1) : host
  if (/^[\d.]+$/.test(literal) || literal.includes(':')) {
    if (isPrivateAddress(literal)) {
      return fail('Endereços de rede interna não são suportados.')
    }
  }

  return { ok: true, url }
}

/* ------------------------------------------------------------------ *
 * Extração
 * ------------------------------------------------------------------ */

/** Entidades comuns em <title>/<meta content> — o suficiente para exibição. */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Atributos de uma tag: aceita aspas duplas, simples e valores nus. */
function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>()
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag)) !== null) {
    attrs.set(m[1].toLowerCase(), decodeEntities(m[2] ?? m[3] ?? m[4] ?? ''))
  }
  return attrs
}

export function extractMeta(html: string): ExtractedMeta {
  const result: ExtractedMeta = {
    title: null,
    description: null,
    canonical: null,
    metaRobots: null,
    htmlLang: null,
    charset: null,
    viewport: null,
    og: {},
    twitterCard: null,
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
  }

  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0]
  if (htmlTag) result.htmlLang = parseAttributes(htmlTag).get('lang') ?? null

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  if (titleMatch) result.title = decodeEntities(titleMatch[1]) || null

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag)
    const content = attrs.get('content') ?? ''
    const name = attrs.get('name')?.toLowerCase()
    const property = attrs.get('property')?.toLowerCase()

    if (attrs.has('charset')) result.charset ??= attrs.get('charset') ?? null
    if (name === 'description') result.description ??= content || null
    if (name === 'robots') result.metaRobots ??= content || null
    if (name === 'viewport') result.viewport ??= content || null
    if (name === 'twitter:card') result.twitterCard ??= content || null
    if (property?.startsWith('og:')) {
      const key = property.slice(3) as keyof ExtractedMeta['og']
      if (['title', 'description', 'image', 'url', 'type'].includes(key)) {
        result.og[key] ??= content || undefined
      }
    }
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag)
    if (attrs.get('rel')?.toLowerCase() === 'canonical') {
      result.canonical ??= attrs.get('href') ?? null
    }
  }

  return result
}

/* ------------------------------------------------------------------ *
 * Checagens
 * ------------------------------------------------------------------ */

/** Compara URLs ignorando barra final e caixa do host — nada além disso. */
function sameUrl(a: string, b: string): boolean {
  try {
    const ua = new URL(a)
    const ub = new URL(b)
    const norm = (u: URL) =>
      `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/$/, '')}${u.search}`
    return norm(ua) === norm(ub)
  } catch {
    return false
  }
}

export function runChecks(finalUrl: string, meta: ExtractedMeta): MetaCheck[] {
  const checks: MetaCheck[] = []
  const add = (id: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ id, label, status, detail })

  // Title
  if (!meta.title) {
    add('title', 'Title', 'error', 'Ausente. É o elemento de SEO on-page mais importante da página.')
  } else if (meta.title.length > TITLE_MAX) {
    add(
      'title',
      'Title',
      'warning',
      `${meta.title.length} caracteres — acima de ${TITLE_MAX}, o Google tende a truncar na SERP.`
    )
  } else {
    add('title', 'Title', 'ok', `Presente, ${meta.title.length} caracteres.`)
  }

  // Description
  if (!meta.description) {
    add(
      'description',
      'Meta description',
      'error',
      'Ausente. O Google gera um snippet por conta própria — raramente o que você quer.'
    )
  } else if (meta.description.length > DESCRIPTION_MAX) {
    add(
      'description',
      'Meta description',
      'warning',
      `${meta.description.length} caracteres — acima de ${DESCRIPTION_MAX}, sujeito a truncamento.`
    )
  } else {
    add('description', 'Meta description', 'ok', `Presente, ${meta.description.length} caracteres.`)
  }

  // Canonical
  if (!meta.canonical) {
    add(
      'canonical',
      'Canonical',
      'warning',
      'Ausente. Sem canonical, variações de URL (parâmetros, barra final) podem diluir o sinal.'
    )
  } else if (!/^https?:\/\//i.test(meta.canonical)) {
    add(
      'canonical',
      'Canonical',
      'error',
      `Relativo ("${meta.canonical}"). O Google recomenda canonical absoluto.`
    )
  } else if (!sameUrl(meta.canonical, finalUrl)) {
    add(
      'canonical',
      'Canonical',
      'warning',
      `Aponta para outra URL (${meta.canonical}). Se intencional (página duplicada), ok; numa página principal, é sinal de problema.`
    )
  } else {
    add('canonical', 'Canonical', 'ok', 'Presente, absoluto e autorreferente.')
  }

  // Robots
  const robots = meta.metaRobots?.toLowerCase() ?? ''
  if (robots.includes('noindex')) {
    add(
      'robots',
      'Meta robots',
      'warning',
      `"${meta.metaRobots}" — a página está pedindo para NÃO ser indexada. Confirme se é intencional.`
    )
  } else {
    add(
      'robots',
      'Meta robots',
      'ok',
      meta.metaRobots
        ? `"${meta.metaRobots}".`
        : 'Ausente — o padrão é index,follow, nenhum problema.'
    )
  }

  // H1
  if (meta.h1Count === 0) {
    add('h1', 'H1', 'error', 'Nenhum <h1> encontrado. Toda página indexável deve ter exatamente um.')
  } else if (meta.h1Count > 1) {
    add('h1', 'H1', 'warning', `${meta.h1Count} <h1> encontrados — o recomendado é exatamente um.`)
  } else {
    add('h1', 'H1', 'ok', 'Exatamente um <h1>.')
  }

  // Fundamentos do documento
  if (meta.htmlLang) {
    add('lang', 'Atributo lang', 'ok', `<html lang="${meta.htmlLang}">.`)
  } else {
    add(
      'lang',
      'Atributo lang',
      'warning',
      'Ausente no <html>. Importa para acessibilidade e para o idioma detectado.'
    )
  }
  add(
    'charset',
    'Charset',
    meta.charset ? 'ok' : 'warning',
    meta.charset ? `${meta.charset}.` : 'Meta charset ausente — declare utf-8 no topo do <head>.'
  )
  add(
    'viewport',
    'Viewport',
    meta.viewport ? 'ok' : 'warning',
    meta.viewport ? 'Presente.' : 'Ausente — sem ele a página falha o critério mobile-friendly.'
  )

  // Open Graph — o que o WhatsApp/LinkedIn/Slack usam no preview do link.
  for (const [key, label] of [
    ['title', 'og:title'],
    ['description', 'og:description'],
    ['image', 'og:image'],
  ] as const) {
    add(
      `og-${key}`,
      label,
      meta.og[key] ? 'ok' : 'warning',
      meta.og[key]
        ? 'Presente.'
        : `Ausente — o preview do link em redes sociais fica sem ${key === 'image' ? 'imagem' : 'texto próprio'}.`
    )
  }
  add(
    'twitter-card',
    'twitter:card',
    meta.twitterCard ? 'ok' : 'warning',
    meta.twitterCard
      ? `"${meta.twitterCard}".`
      : 'Ausente — o X/Twitter cai no fallback do Open Graph, sem card grande.'
  )

  return checks
}

/** Contagem que vai no evento `tool_validate_meta` (measurement-plan.md). */
export function countIssues(checks: MetaCheck[]): number {
  return checks.filter((c) => c.status !== 'ok').length
}
