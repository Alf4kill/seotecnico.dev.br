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
//   - timeout de 8s, resposta lida até 500 KB e descartada além disso;
//   - só text/html; User-Agent honesto e identificável, como manda a cultura
//     da casa (quem mede crawler alheio não navega anônimo).
//
// Sem armazenamento: a URL não é logada nem persistida (LGPD-simples, §13).
// `/api/` já é Disallow no robots.txt e está fora do matcher do proxy.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BYTES = 500_000
const TIMEOUT_MS = 8_000
const USER_AGENT = 'SEOTecnicoValidador/1.0 (+https://seotecnico.dev.br/ferramentas/validador-meta-tags)'

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = parseTargetUrl(request.nextUrl.searchParams.get('url') ?? '')
  if (!parsed.ok) return badRequest(parsed.error)
  const target = parsed.url

  if (!(await resolvesOnlyPublic(target.hostname.replace(/\.$/, '').toLowerCase()))) {
    return badRequest('Este endereço não resolve para um IP público — não é possível validar.')
  }

  let response: Response
  try {
    response = await fetch(target, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.5',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    return badRequest(
      timedOut
        ? 'A página demorou mais de 8 segundos para responder.'
        : 'Não foi possível buscar a página (DNS, conexão recusada ou bloqueio).',
      502
    )
  }

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

  const finalUrl = response.url || target.href
  const meta = extractMeta(html)
  const checks = runChecks(finalUrl, meta)

  return NextResponse.json({
    finalUrl,
    httpStatus: response.status,
    redirected: response.redirected,
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
