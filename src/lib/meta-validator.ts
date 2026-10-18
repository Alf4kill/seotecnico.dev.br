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
//
// A ferramenta existe nos dois idiomas (/ferramentas/validador-meta-tags e
// /en/tools/meta-tag-validator): as mensagens recebem `lang`, as checagens e
// os vereditos são os mesmos.
// ─────────────────────────────────────────────────────────────────────────────

import { inCidr, parseCidr, type Cidr } from './crawler-verification'
import type { Lang } from './hreflang'

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

export type CheckStatus = 'ok' | 'warning' | 'error'

export interface MetaCheck {
  id: string
  label: string
  status: CheckStatus
  /** Frase curta, no idioma da página, explicando o veredito deste item. */
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

const TARGET_ERRORS = {
  'pt-BR': {
    empty: 'Informe uma URL.',
    scheme: 'Só http e https são suportados.',
    invalid: 'URL inválida.',
    port: 'Porta não suportada.',
    local: 'Endereços locais não são suportados.',
    private: 'Endereços de rede interna não são suportados.',
  },
  en: {
    empty: 'Enter a URL.',
    scheme: 'Only http and https are supported.',
    invalid: 'Invalid URL.',
    port: 'Port not supported.',
    local: 'Local addresses are not supported.',
    private: 'Internal network addresses are not supported.',
  },
} as const

/**
 * Normaliza o que o usuário digitou e recusa tudo que não seja uma página web
 * pública — menos o passo de DNS, que a rota faz em seguida.
 */
export function parseTargetUrl(raw: string, lang: Lang = 'pt-BR'): TargetUrl {
  const fail = (error: string): TargetUrl => ({ ok: false, error })
  const copy = TARGET_ERRORS[lang]

  const input = raw.trim()
  if (!input) return fail(copy.empty)

  // Esquema explícito que não seja http(s) é recusado com a mensagem certa. Sem
  // isso, `ftp://x` viraria `https://ftp://x` e morreria no check de DNS, com um
  // erro que não descreve o problema. Só a forma `esquema://` conta: exigir as
  // duas barras é o que distingue um esquema de um `exemplo.com:8080`, que o
  // regex sem elas leria como esquema "exemplo.com". Esquemas sem barras
  // (`javascript:`, `data:`) não escapam — viram URL inválida logo abaixo.
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(input)?.[1]?.toLowerCase()
  if (scheme && !['http', 'https'].includes(scheme)) {
    return fail(copy.scheme)
  }

  let url: URL
  try {
    url = new URL(scheme ? input : `https://${input}`)
  } catch {
    return fail(copy.invalid)
  }

  if (url.port && !ALLOWED_PORTS.includes(url.port)) {
    return fail(copy.port)
  }

  // Nomes locais nunca chegam ao DNS: barrá-los aqui dá a mensagem certa e não
  // depende de como o resolvedor da máquina trata `.local`.
  const host = url.hostname.replace(/\.$/, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return fail(copy.local)
  }
  // IP literal é decidido aqui mesmo — não há nome para resolver.
  const literal = host.startsWith('[') ? host.slice(1, -1) : host
  if (/^[\d.]+$/.test(literal) || literal.includes(':')) {
    if (isPrivateAddress(literal)) {
      return fail(copy.private)
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

interface HtmlTag {
  /** Nome em minúsculas (`meta`, `title`…), sem a barra do fechamento. */
  name: string
  /** `true` para `</title>`, `false` para `<title>`. */
  closing: boolean
  /** A tag inteira, de `<` a `>` — o que o parseAttributes lê. */
  tag: string
  /** Índice do `<`. */
  start: number
  /** Índice logo depois do `>`. */
  end: number
}

/**
 * Cada tag `<…>` do documento, na ordem, cortada no primeiro `>`.
 *
 * Uma passada linear, e o motivo é segurança, não elegância. As quatro
 * varreduras que isto substitui tinham a forma `/<meta\b[^>]*>/`: num documento
 * onde `<meta` aparece muitas vezes e `>` nunca, `[^>]*` consome o resto do
 * arquivo, falha ao exigir o `>` e recua um caractere por vez — em cada posição
 * de início. É quadrático no tamanho da entrada, que nesta ferramenta é
 * escolhida por quem chama. Medido em 2026-10-15 com 360 KB, abaixo do teto de
 * 500 KB que a rota busca: 14,2s no `<title>`, 10,0s no `<html>`, 10,7s no
 * `<meta>`, 10,2s no `<link>`, contra 0,3ms desta varredura. O `AbortSignal` da
 * rota governa o fetch, não o parse que vem depois — não havia teto nenhum
 * sobre esse tempo.
 *
 * O custo aceito do parse por regex (topo do arquivo) continua o mesmo: um `>`
 * dentro de um valor entre aspas corta a tag cedo, como antes.
 */
function* eachTag(html: string): Generator<HtmlTag> {
  const tagName = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)/
  let from = 0

  for (;;) {
    const start = html.indexOf('<', from)
    if (start === -1) return
    const gt = html.indexOf('>', start + 1)
    // Tag que nunca fecha: não há mais nada legível depois dela.
    if (gt === -1) return

    const tag = html.slice(start, gt + 1)
    const matched = tagName.exec(tag)
    if (matched) {
      yield { name: matched[1].toLowerCase(), closing: tag[1] === '/', tag, start, end: gt + 1 }
    }
    from = gt + 1
  }
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

  // A primeira ocorrência vence em todo campo — o que o navegador faz, e o que
  // os testes fixam. Para `<html>` e `<title>` isso vinha de graça de um
  // `exec()` que rodava uma vez só; com uma varredura única, são estas travas.
  let htmlSeen = false
  let titleDone = false
  let titleTextStart = -1

  for (const { name, closing, tag, start, end } of eachTag(html)) {
    if (closing) {
      // O texto do título é o que está entre a tag de abertura e esta.
      if (name === 'title' && titleTextStart !== -1) {
        result.title = decodeEntities(html.slice(titleTextStart, start)) || null
        titleTextStart = -1
        titleDone = true
      }
      continue
    }

    switch (name) {
      case 'html':
        if (!htmlSeen) {
          htmlSeen = true
          result.htmlLang = parseAttributes(tag).get('lang') ?? null
        }
        break

      case 'title':
        if (!titleDone && titleTextStart === -1) titleTextStart = end
        break

      case 'meta': {
        const attrs = parseAttributes(tag)
        const content = attrs.get('content') ?? ''
        const metaName = attrs.get('name')?.toLowerCase()
        const property = attrs.get('property')?.toLowerCase()

        if (attrs.has('charset')) result.charset ??= attrs.get('charset') ?? null
        if (metaName === 'description') result.description ??= content || null
        if (metaName === 'robots') result.metaRobots ??= content || null
        if (metaName === 'viewport') result.viewport ??= content || null
        if (metaName === 'twitter:card') result.twitterCard ??= content || null
        if (property?.startsWith('og:')) {
          const key = property.slice(3) as keyof ExtractedMeta['og']
          if (['title', 'description', 'image', 'url', 'type'].includes(key)) {
            result.og[key] ??= content || undefined
          }
        }
        break
      }

      case 'link': {
        const attrs = parseAttributes(tag)
        if (attrs.get('rel')?.toLowerCase() === 'canonical') {
          result.canonical ??= attrs.get('href') ?? null
        }
        break
      }
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

/**
 * Rótulos e frases de cada checagem, por idioma. Os rótulos que são nomes de
 * tag (Title, Canonical, og:title…) são os mesmos nos dois; as frases explicam
 * o veredito, que é idêntico.
 */
const CHECK_COPY = {
  'pt-BR': {
    langLabel: 'Atributo lang',
    titleMissing: 'Ausente. É o elemento de SEO on-page mais importante da página.',
    titleLong: (n: number) => `${n} caracteres — acima de ${TITLE_MAX}, o Google tende a truncar na SERP.`,
    titleOk: (n: number) => `Presente, ${n} caracteres.`,
    descriptionMissing: 'Ausente. O Google gera um snippet por conta própria — raramente o que você quer.',
    descriptionLong: (n: number) => `${n} caracteres — acima de ${DESCRIPTION_MAX}, sujeito a truncamento.`,
    descriptionOk: (n: number) => `Presente, ${n} caracteres.`,
    canonicalMissing: 'Ausente. Sem canonical, variações de URL (parâmetros, barra final) podem diluir o sinal.',
    canonicalRelative: (href: string) => `Relativo ("${href}"). O Google recomenda canonical absoluto.`,
    canonicalElsewhere: (href: string) =>
      `Aponta para outra URL (${href}). Se intencional (página duplicada), ok; numa página principal, é sinal de problema.`,
    canonicalOk: 'Presente, absoluto e autorreferente.',
    robotsNoindex: (value: string) =>
      `"${value}" — a página está pedindo para NÃO ser indexada. Confirme se é intencional.`,
    robotsMissing: 'Ausente — o padrão é index,follow, nenhum problema.',
    h1None: 'Nenhum <h1> encontrado. Toda página indexável deve ter exatamente um.',
    h1Many: (n: number) => `${n} <h1> encontrados — o recomendado é exatamente um.`,
    h1Ok: 'Exatamente um <h1>.',
    langMissing: 'Ausente no <html>. Importa para acessibilidade e para o idioma detectado.',
    charsetMissing: 'Meta charset ausente — declare utf-8 no topo do <head>.',
    viewportMissing: 'Ausente — sem ele a página falha o critério mobile-friendly.',
    present: 'Presente.',
    ogMissing: (isImage: boolean) =>
      `Ausente — o preview do link em redes sociais fica sem ${isImage ? 'imagem' : 'texto próprio'}.`,
    twitterMissing: 'Ausente — o X/Twitter cai no fallback do Open Graph, sem card grande.',
  },
  en: {
    langLabel: 'lang attribute',
    titleMissing: 'Missing. It is the most important on-page SEO element of the page.',
    titleLong: (n: number) => `${n} characters — over ${TITLE_MAX}, Google tends to truncate it in the SERP.`,
    titleOk: (n: number) => `Present, ${n} characters.`,
    descriptionMissing: 'Missing. Google builds a snippet on its own — rarely the one you want.',
    descriptionLong: (n: number) => `${n} characters — over ${DESCRIPTION_MAX}, likely to be truncated.`,
    descriptionOk: (n: number) => `Present, ${n} characters.`,
    canonicalMissing: 'Missing. Without a canonical, URL variants (parameters, trailing slash) can dilute the signal.',
    canonicalRelative: (href: string) => `Relative ("${href}"). Google recommends an absolute canonical.`,
    canonicalElsewhere: (href: string) =>
      `Points to another URL (${href}). Fine if intended (a duplicate page); on a main page, it signals a problem.`,
    canonicalOk: 'Present, absolute and self-referencing.',
    robotsNoindex: (value: string) =>
      `"${value}" — the page is asking NOT to be indexed. Confirm that this is intended.`,
    robotsMissing: 'Missing — the default is index,follow, no problem.',
    h1None: 'No <h1> found. Every indexable page should have exactly one.',
    h1Many: (n: number) => `${n} <h1> found — exactly one is recommended.`,
    h1Ok: 'Exactly one <h1>.',
    langMissing: 'Missing on <html>. It matters for accessibility and for the detected language.',
    charsetMissing: 'Meta charset missing — declare utf-8 at the top of <head>.',
    viewportMissing: 'Missing — without it the page fails the mobile-friendly criterion.',
    present: 'Present.',
    ogMissing: (isImage: boolean) =>
      `Missing — the link preview on social networks has no ${isImage ? 'image' : 'text of its own'}.`,
    twitterMissing: 'Missing — X/Twitter falls back to Open Graph, with no large card.',
  },
} as const

export function runChecks(finalUrl: string, meta: ExtractedMeta, lang: Lang = 'pt-BR'): MetaCheck[] {
  const copy = CHECK_COPY[lang]
  const checks: MetaCheck[] = []
  const add = (id: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ id, label, status, detail })

  // Title
  if (!meta.title) {
    add('title', 'Title', 'error', copy.titleMissing)
  } else if (meta.title.length > TITLE_MAX) {
    add('title', 'Title', 'warning', copy.titleLong(meta.title.length))
  } else {
    add('title', 'Title', 'ok', copy.titleOk(meta.title.length))
  }

  // Description
  if (!meta.description) {
    add('description', 'Meta description', 'error', copy.descriptionMissing)
  } else if (meta.description.length > DESCRIPTION_MAX) {
    add('description', 'Meta description', 'warning', copy.descriptionLong(meta.description.length))
  } else {
    add('description', 'Meta description', 'ok', copy.descriptionOk(meta.description.length))
  }

  // Canonical
  if (!meta.canonical) {
    add('canonical', 'Canonical', 'warning', copy.canonicalMissing)
  } else if (!/^https?:\/\//i.test(meta.canonical)) {
    add('canonical', 'Canonical', 'error', copy.canonicalRelative(meta.canonical))
  } else if (!sameUrl(meta.canonical, finalUrl)) {
    add('canonical', 'Canonical', 'warning', copy.canonicalElsewhere(meta.canonical))
  } else {
    add('canonical', 'Canonical', 'ok', copy.canonicalOk)
  }

  // Robots
  const robots = meta.metaRobots?.toLowerCase() ?? ''
  if (robots.includes('noindex')) {
    add('robots', 'Meta robots', 'warning', copy.robotsNoindex(meta.metaRobots ?? ''))
  } else {
    add('robots', 'Meta robots', 'ok', meta.metaRobots ? `"${meta.metaRobots}".` : copy.robotsMissing)
  }

  // H1
  if (meta.h1Count === 0) {
    add('h1', 'H1', 'error', copy.h1None)
  } else if (meta.h1Count > 1) {
    add('h1', 'H1', 'warning', copy.h1Many(meta.h1Count))
  } else {
    add('h1', 'H1', 'ok', copy.h1Ok)
  }

  // Fundamentos do documento
  if (meta.htmlLang) {
    add('lang', copy.langLabel, 'ok', `<html lang="${meta.htmlLang}">.`)
  } else {
    add('lang', copy.langLabel, 'warning', copy.langMissing)
  }
  add(
    'charset',
    'Charset',
    meta.charset ? 'ok' : 'warning',
    meta.charset ? `${meta.charset}.` : copy.charsetMissing
  )
  add('viewport', 'Viewport', meta.viewport ? 'ok' : 'warning', meta.viewport ? copy.present : copy.viewportMissing)

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
      meta.og[key] ? copy.present : copy.ogMissing(key === 'image')
    )
  }
  add(
    'twitter-card',
    'twitter:card',
    meta.twitterCard ? 'ok' : 'warning',
    meta.twitterCard ? `"${meta.twitterCard}".` : copy.twitterMissing
  )

  return checks
}

/** Contagem que vai no evento `tool_validate_meta` (measurement-plan.md). */
export function countIssues(checks: MetaCheck[]): number {
  return checks.filter((c) => c.status !== 'ok').length
}
