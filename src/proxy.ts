import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { classifyAiCrawler, isAllowed, type AiCrawler } from '@/lib/ai-crawlers'
import { verifyCrawler, type VerificationResult } from '@/lib/crawler-verification'
import { netId } from '@/lib/net-id'
import { trapChannel } from '@/lib/lab-traps'

// ─────────────────────────────────────────────────────────────────────────────
// Telemetria de requisições (docs/measurement-plan.md → `ai_crawler_hit`;
// classificação e regras de publicação em docs/detection-experiment.md).
//
// Por que existe: crawler não executa JavaScript, então o GTM — e portanto todo
// o GA4 do site — é estruturalmente cego para ele. E o Vercel Hobby descarta
// log de função em ~1h, então não há onde ler depois. A única janela é o
// próprio request, na borda.
//
// Desde o experimento de detecção, o evento dispara para TODO request que o
// matcher deixa passar — não só UAs de IA declarados. É isso que torna o
// "two-pipeline delta" computável (requests server-side vs pageviews com JS):
// tráfego humano entra como `ua_class: browser-like`, anônimo, e é filtrado na
// análise. Verificação de identidade (feed de IP, rDNS, assinatura) NUNCA roda
// para tráfego com formato de navegador.
//
// No Next.js 16 o middleware virou **Proxy**: o arquivo é `src/proxy.ts` e
// precisa exportar uma função chamada `proxy`.
// ─────────────────────────────────────────────────────────────────────────────

// Runtime: no Next.js 16, Proxy roda SEMPRE em Node.js (declarar `runtime` no
// config é build error). É o que crawler-verification.ts exige — WebCrypto
// Ed25519, node:dns (FCrDNS) e Buffer não existem no Edge Runtime. Se este
// arquivo um dia voltar a ser middleware Edge, a verificação falharia em
// silêncio: "nenhuma assinatura nunca verifica".
export const config = {
  // Páginas HTML + os endpoints de descoberta. `/robots.txt` e `/sitemap.xml`
  // entram de propósito: é onde o crawler se anuncia primeiro, e um hit ali sem
  // nenhum hit de página depois já é um achado.
  // Ficam de fora os estáticos, onde um hit não diz nada sobre leitura — e é o
  // matcher que limita o volume de eventos, já que agora tudo que passa vira
  // evento.
  // `api/` fora do matcher: são chamadas internas das ferramentas (fetch do
  // próprio client component), não leitura de conteúdo — contá-las poluiria o
  // volume guard de docs/detection-experiment.md §9.1. Crawler em /api/ segue
  // coberto pelo Disallow no robots.txt.
  matcher: [
    '/((?!api/|_next/static|_next/image|images/|favicon.ico|icon.svg|opengraph-image|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$).*)',
  ],
}

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

/**
 * URL do Measurement Protocol, ou `undefined` quando as variáveis não estão
 * configuradas — mesmo fail-safe de `site.gtmId`: sem configuração, o proxy
 * classifica e não faz nada. As variáveis existem só em produção na Vercel,
 * então preview e local nunca mandam hit.
 *
 * Propriedade GA4 SEPARADA da humana (`G-59LQZ6LR72`): hit de Measurement
 * Protocol cria usuário e sessão como qualquer outro, e misturar bot com gente
 * estragaria todo relatório de engajamento e todo percentil de RUM.
 */
function sinkUrl(): string | undefined {
  const measurementId = process.env.GA4_CRAWLER_MEASUREMENT_ID
  const apiSecret = process.env.GA4_CRAWLER_API_SECRET
  if (!measurementId || !apiSecret) return undefined
  return `${MP_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`
}

/** Hash estável → um "usuário" por crawler (ou por rede) no GA4. */
function stableId(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const DAY_MS = 86_400_000

type UaClass = 'declared-ai' | 'browser-like' | 'unknown'

/**
 * `browser-like` exige as duas coisas que um navegador real sempre manda numa
 * navegação e um cliente HTTP cru quase nunca manda: os headers `Sec-Fetch-*`
 * e um `Accept` que pede HTML. Sinais por request em
 * docs/detection-experiment.md §2.2.
 */
function classifyUa(request: NextRequest, crawler: AiCrawler | undefined): UaClass {
  if (crawler) return 'declared-ai'
  const hasSecFetch = request.headers.has('sec-fetch-mode')
  const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false
  return hasSecFetch && acceptsHtml ? 'browser-like' : 'unknown'
}

/**
 * O que o robots.txt diz para ESTE agente sobre ESTE caminho. O trap de
 * robots é Disallow para todo mundo; o trap de llms.txt fica fora do robots
 * de propósito (`not-addressed`) — colocá-lo lá contaminaria a atribuição de
 * canal (§4 do experimento).
 */
function botPolicy(crawler: AiCrawler, pathname: string): 'allowed' | 'disallowed' | 'not-addressed' {
  if (trapChannel(pathname) === 'llms') return 'not-addressed'
  if (trapChannel(pathname) === 'robots') return 'disallowed'
  return isAllowed(crawler) ? 'allowed' : 'disallowed'
}

async function reportHit(request: NextRequest): Promise<void> {
  const url = sinkUrl()
  if (!url) return

  const { pathname, href } = request.nextUrl
  const crawler = classifyAiCrawler(request.headers.get('user-agent'))
  const uaClass = classifyUa(request, crawler)
  const trap = trapChannel(pathname)

  // `x-real-ip` é escrito pela Vercel a partir da conexão — nunca o
  // `X-Forwarded-For`, cujo primeiro hop o cliente pode fornecer. Um veredito
  // de impersonation não pode depender de header que o cliente influencia.
  // O IP é usado transientemente aqui e nunca sai do servidor (§2.3).
  const clientIp = request.headers.get('x-real-ip')
  const net = await netId(clientIp, process.env.NET_ID_SALT_SECRET)

  // Verificação de identidade SÓ para quem alega ser um agente conhecido ou
  // apresenta assinatura Web Bot Auth. Nada de DNS nem fetch de feed para
  // tráfego com formato de navegador.
  let verification: VerificationResult | null = null
  if (crawler || request.headers.has('signature-input')) {
    verification = await verifyCrawler(request, crawler?.token ?? null, clientIp).catch(() => null)
  }

  // Um "usuário" por crawler declarado; para o resto, um por rede (net_id
  // rotaciona por mês, então o "usuário" também). Sessão agrupa o dia.
  const id = stableId(crawler?.token ?? net ?? uaClass)

  await fetch(url, {
    method: 'POST',
    // NÃO repassar o User-Agent do crawler. O GA4 exclui automaticamente
    // tráfego de bots conhecidos comparando o user agent do hit com a lista
    // IAB — repassar o UA real faria o GA4 aceitar o request e descartar 100%
    // dos eventos, sem erro em lugar nenhum. A identidade do bot vai como
    // parâmetro do evento. Ver docs/measurement-plan.md.
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: `${id}.1`,
      events: [
        {
          name: 'ai_crawler_hit',
          params: {
            ...(crawler && {
              bot_name: crawler.token,
              bot_vendor: crawler.vendor,
              // Propósito DOCUMENTADO pelo fornecedor — citação, não inferência.
              bot_purpose: crawler.purpose,
              // Filtrar `disallowed` + page_path ≠ /robots.txt é a consulta
              // que flagra violação da política.
              bot_policy: botPolicy(crawler, pathname),
            }),
            ...(verification && { bot_verified: verification.verdict }),
            page_path: pathname,
            // `page_location` alimenta as dimensões nativas de página do GA4
            // (Pages and screens, Landing page). É a URL pública do próprio
            // site — não carrega nada além do que o cliente já pediu.
            page_location: href,
            ua_class: uaClass,
            has_sec_fetch: String(request.headers.has('sec-fetch-mode')),
            req_conditional: String(
              request.headers.has('if-none-match') || request.headers.has('if-modified-since')
            ),
            ...(net && { net_id: net }),
            ...(trap && { is_trap: 'true', trap_channel: trap }),
            session_id: `${id}${Math.floor(Date.now() / DAY_MS)}`,
            // Sem isto o GA4 trata o evento como sem engajamento e ele some
            // dos relatórios padrão.
            engagement_time_msec: 1,
          },
        },
      ],
    }),
  })
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  // `event.waitUntil` e não um fetch solto: a invocação pode ser encerrada
  // assim que a resposta sai, matando a promise no meio.
  // `.catch` obrigatório — telemetria nunca pode derrubar um request.
  event.waitUntil(reportHit(request).catch(() => {}))

  return NextResponse.next()
}
