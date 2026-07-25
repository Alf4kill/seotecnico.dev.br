import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { classifyAiCrawler, isAllowed, type AiCrawler } from '@/lib/ai-crawlers'

// ─────────────────────────────────────────────────────────────────────────────
// Telemetria de crawler de IA (docs/measurement-plan.md → `ai_crawler_hit`).
//
// Por que existe: crawler não executa JavaScript, então o GTM — e portanto todo
// o GA4 do site — é estruturalmente cego para ele. E o Vercel Hobby descarta
// log de função em ~1h, então não há onde ler depois. A única janela é o
// próprio request, na borda.
//
// No Next.js 16 o middleware virou **Proxy**: o arquivo é `src/proxy.ts` e
// precisa exportar uma função chamada `proxy` (`NextMiddleware` e
// `MiddlewareConfig` seguem como aliases deprecados).
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  // Páginas HTML + os endpoints de descoberta. `/robots.txt` e `/sitemap.xml`
  // entram de propósito: é onde o crawler se anuncia primeiro, e um hit ali sem
  // nenhum hit de página depois já é um achado.
  // Ficam de fora os estáticos, onde um hit não diz nada sobre leitura.
  matcher: [
    '/((?!_next/static|_next/image|images/|favicon.ico|icon.svg|opengraph-image|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$).*)',
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

/** Hash estável → um "usuário" por crawler no GA4, em vez de um por request. */
function stableId(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const DAY_MS = 86_400_000

async function reportCrawlerHit(
  crawler: AiCrawler,
  pathname: string,
  href: string
): Promise<void> {
  const url = sinkUrl()
  if (!url) return

  const id = stableId(crawler.token)

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
      // Um "session" por crawler por dia: agrupa a varredura inteira.
      events: [
        {
          name: 'ai_crawler_hit',
          params: {
            bot_name: crawler.token,
            bot_vendor: crawler.vendor,
            bot_purpose: crawler.purpose,
            // O que o robots.txt diz para ESTE agente. Filtrar por
            // `disallowed` + um page_path que não seja /robots.txt é a
            // consulta que flagra violação da política.
            bot_policy: isAllowed(crawler) ? 'allowed' : 'disallowed',
            page_path: pathname,
            // `page_location` é o parâmetro que alimenta as dimensões nativas
            // de página do GA4 (Pages and screens, Landing page). Sem ele, os
            // relatórios padrão desta propriedade ficariam vazios e tudo teria
            // de ser lido por custom dimension. É a URL pública do próprio
            // site — não carrega nada além do que o crawler já pediu.
            page_location: href,
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
  const crawler = classifyAiCrawler(request.headers.get('user-agent'))

  if (crawler) {
    // `event.waitUntil` e não um fetch solto: a invocação de borda pode ser
    // encerrada assim que a resposta sai, matando a promise no meio.
    // `.catch` obrigatório — telemetria nunca pode derrubar um request.
    event.waitUntil(
      reportCrawlerHit(
        crawler,
        request.nextUrl.pathname,
        request.nextUrl.href
      ).catch(() => {})
    )
  }

  return NextResponse.next()
}
