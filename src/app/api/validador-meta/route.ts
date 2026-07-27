import { NextResponse, type NextRequest } from 'next/server'
import { promises as dns } from 'node:dns'
import {
  countIssues,
  extractMeta,
  isPrivateAddress,
  parseTargetUrl,
  runChecks,
} from '@/lib/meta-validator'

// ─────────────────────────────────────────────────────────────────────────────
// Backend do validador de meta tags: busca a URL server-side (CORS impede o
// navegador de fazê-lo) e devolve extração + checagens prontas.
//
// Segurança — este é o primeiro endpoint do site que faz fetch de URL
// controlada pelo usuário, então as regras ficam explícitas:
//   - só http/https, porta padrão ou 80/443/8080, nada de nome local ou IP
//     literal privado (parseTargetUrl, testado em meta-validator.test.ts);
//   - hostname resolvido via DNS ANTES do fetch e comparado contra faixas
//     privadas/loopback/link-local (v4 e v6) — nega SSRF óbvio contra a rede
//     interna. Limitação conhecida e aceita: DNS rebinding entre a checagem e
//     o fetch não é coberto; na Vercel não há rede interna valiosa atrás.
//   - redirecionamento NÃO é delegado ao fetch: cada salto é revalidado pelas
//     mesmas regras antes de ser seguido. Com `redirect: 'follow'` a guarda
//     acima valia só para o primeiro endereço, e um destino público que
//     responde 302 para 169.254.169.254 atravessava tudo;
//   - orçamento único de 8s para a cadeia inteira (não por salto) e teto de
//     saltos, resposta lida até 500 KB e descartada além disso;
//   - limite de requisições por IP, em memória (ver `rateLimited`);
//   - só text/html; User-Agent honesto e identificável, como manda a cultura
//     da casa (quem mede crawler alheio não navega anônimo).
//
// Sem armazenamento: a URL não é logada nem persistida (LGPD-simples, §13).
// `/api/` já é Disallow no robots.txt e está fora do matcher do proxy.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BYTES = 500_000
const TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 5
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const USER_AGENT = 'SEOTecnicoValidador/1.0 (+https://seotecnico.dev.br/ferramentas/validador-meta-tags)'

// Janela fixa por IP. É um endpoint público e sem login que busca até 500 KB de
// uma URL escolhida por quem chama — sem teto, serve de proxy de saída para
// qualquer um.
//
// O estado é do processo, não compartilhado: na Vercel cada instância tem o seu
// Map, então o limite real é POR INSTÂNCIA e escala com o fan-out. É proteção
// contra o abuso trivial (um script em laço), não contra um atacante
// distribuído — para esse último o teto de verdade é o da própria plataforma.
// Um limitador exato exigiria armazenamento compartilhado, que §13 do CLAUDE.md
// mantém fora do projeto. Nada aqui é logado nem sobrevive à janela.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_MAX_KEYS = 5_000

const requestWindows = new Map<string, { count: number; resetAt: number }>()

function rateLimited(request: NextRequest): boolean {
  const key = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const current = requestWindows.get(key)

  if (!current || now >= current.resetAt) {
    // Varre expirados só quando o Map cresce: uma instância de vida longa não
    // deve acumular chave de quem passou por aqui uma vez.
    if (requestWindows.size >= RATE_LIMIT_MAX_KEYS) {
      for (const [k, window] of requestWindows) {
        if (now >= window.resetAt) requestWindows.delete(k)
      }
    }
    requestWindows.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > RATE_LIMIT_MAX
}

async function resolvesOnlyPublic(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.lookup(hostname, { all: true })
    if (addresses.length === 0) return false
    return addresses.every((a) => !isPrivateAddress(a.address))
  } catch {
    return false // não resolve = não busca
  }
}

function badRequest(error: string, status = 400): NextResponse {
  return NextResponse.json({ error }, { status })
}

type FetchOutcome =
  | { ok: true; response: Response; finalUrl: URL; redirected: boolean }
  | { ok: false; error: string; status: number }

/**
 * Segue a cadeia de redirecionamentos à mão, revalidando cada destino com as
 * mesmas regras aplicadas à URL digitada. `signal` é um só para a cadeia
 * inteira: com um timeout por salto, seis saltos custariam 48s de função.
 */
async function fetchGuarded(start: URL, signal: AbortSignal): Promise<FetchOutcome> {
  let current = start

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (hop > 0) {
      // O destino do redirect é entrada tão externa quanto a do usuário.
      const parsed = parseTargetUrl(current.href)
      if (!parsed.ok) {
        return {
          ok: false,
          error: `Um redirecionamento apontou para um destino não permitido (${parsed.error.toLowerCase()})`,
          status: 400,
        }
      }
      current = parsed.url
    }

    if (!(await resolvesOnlyPublic(current.hostname.replace(/\.$/, '').toLowerCase()))) {
      return {
        ok: false,
        error:
          hop === 0
            ? 'Este endereço não resolve para um IP público — não é possível validar.'
            : 'Um redirecionamento apontou para um endereço que não é público — cadeia interrompida.',
        status: 400,
      }
    }

    let response: Response
    try {
      response = await fetch(current, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.5',
        },
        redirect: 'manual',
        cache: 'no-store',
        signal,
      })
    } catch (err) {
      const timedOut =
        err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
      return {
        ok: false,
        error: timedOut
          ? 'A página demorou mais de 8 segundos para responder.'
          : 'Não foi possível buscar a página (DNS, conexão recusada ou bloqueio).',
        status: 502,
      }
    }

    const location = response.headers.get('location')
    if (!REDIRECT_STATUSES.has(response.status) || !location) {
      // Inclui o 3xx sem Location: não há para onde ir, então este é o fim da
      // cadeia e a resposta é julgada como está.
      return { ok: true, response, finalUrl: current, redirected: hop > 0 }
    }

    try {
      current = new URL(location, current)
    } catch {
      return { ok: false, error: 'O redirecionamento aponta para um endereço inválido.', status: 502 }
    }
  }

  return {
    ok: false,
    error: `A página redirecionou mais de ${MAX_REDIRECTS} vezes.`,
    status: 502,
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (rateLimited(request)) {
    return badRequest('Muitas validações seguidas. Espere um minuto e tente de novo.', 429)
  }

  const parsed = parseTargetUrl(request.nextUrl.searchParams.get('url') ?? '')
  if (!parsed.ok) return badRequest(parsed.error)

  const outcome = await fetchGuarded(parsed.url, AbortSignal.timeout(TIMEOUT_MS))
  if (!outcome.ok) return badRequest(outcome.error, outcome.status)
  const { response, finalUrl, redirected } = outcome

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    return badRequest(`A resposta não é HTML (Content-Type: ${contentType || 'ausente'}).`, 415)
  }

  // Lê no máximo MAX_BYTES — meta tags vivem no <head>; o resto só serve para
  // contar <h1>, e 500 KB de HTML cobrem qualquer página razoável.
  let html = ''
  const reader = response.body?.getReader()
  if (reader) {
    const decoder = new TextDecoder()
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (received >= MAX_BYTES) {
        await reader.cancel()
        break
      }
    }
  } else {
    html = (await response.text()).slice(0, MAX_BYTES)
  }

  const meta = extractMeta(html)
  const checks = runChecks(finalUrl.href, meta)

  return NextResponse.json({
    finalUrl: finalUrl.href,
    httpStatus: response.status,
    redirected,
    meta: {
      title: meta.title,
      description: meta.description,
      ogTitle: meta.og.title ?? null,
      ogDescription: meta.og.description ?? null,
      ogImage: meta.og.image ?? null,
    },
    checks,
    issuesFound: countIssues(checks),
  })
}
