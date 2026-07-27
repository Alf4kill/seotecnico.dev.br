// @vitest-environment node
import { NextRequest, type NextFetchEvent } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// As peças do proxy já têm teste próprio: classificação de crawler, verificação
// de identidade, net_id, traps. O que não tinha é a COMPOSIÇÃO — e é nela que
// moram os erros que o experimento de detecção não sobreviveria:
//
//   - repassar o User-Agent do crawler para o GA4 faria a lista IAB descartar
//     100% dos eventos, sem erro em lugar nenhum;
//   - rodar verificação de identidade para tráfego humano gastaria DNS e fetch
//     de feed em toda visita, além de contrariar §2.3 do experimento;
//   - sem as variáveis de ambiente o proxy tem de ficar mudo, porque preview e
//     local não podem poluir a propriedade de crawler.
//
// Todos falham em silêncio no ar. Aqui falham vermelho.

const verifyCrawler = vi.hoisted(() => vi.fn())

vi.mock('@/lib/crawler-verification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/crawler-verification')>()),
  verifyCrawler,
}))

// GPTBot é de TREINO, e treino é Disallow neste site; OAI-SearchBot é de
// recuperação e é permitido. O par cobre os dois lados de `botPolicy`.
const GPT_BOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot'
const SEARCH_BOT = 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'
const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const sent: { url: string; body: Record<string, unknown> }[] = []
let pending: Promise<unknown>[] = []

/** `waitUntil` de mentira: guarda a promise para o teste poder esperá-la. */
const fetchEvent = {
  waitUntil: (promise: Promise<unknown>) => {
    pending.push(promise)
  },
} as unknown as NextFetchEvent

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://seotecnico.dev.br${path}`, { headers })
}

/** O único evento enviado, já desembrulhado do envelope do Measurement Protocol. */
function onlyEvent() {
  expect(sent).toHaveLength(1)
  const events = (sent[0].body as { events: { name: string; params: Record<string, string> }[] })
    .events
  expect(events).toHaveLength(1)
  return events[0]
}

let proxyModule: typeof import('./proxy')

beforeEach(async () => {
  vi.resetModules()
  sent.length = 0
  pending = []
  verifyCrawler.mockReset()
  verifyCrawler.mockResolvedValue({ verdict: 'verified' })

  vi.stubEnv('GA4_CRAWLER_MEASUREMENT_ID', 'G-TEST')
  vi.stubEnv('GA4_CRAWLER_API_SECRET', 'secret')
  vi.stubEnv('NET_ID_SALT_SECRET', 'salt-de-teste')

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
      sent.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) })
      return new Response('', { status: 204 })
    })
  )

  proxyModule = await import('./proxy')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function run(req: NextRequest) {
  const response = proxyModule.proxy(req, fetchEvent)
  await Promise.all(pending)
  return response
}

describe('proxy — reporte de hit', () => {
  it('reports a declared AI crawler with its documented identity', async () => {
    await run(request('/blog/inp-nextjs', { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    const event = onlyEvent()
    expect(event.name).toBe('ai_crawler_hit')
    expect(event.params).toMatchObject({
      bot_name: 'GPTBot',
      bot_vendor: 'OpenAI',
      bot_purpose: 'training',
      // Treino é Disallow aqui: um hit em página de conteúdo é a violação que
      // a consulta do experimento procura.
      bot_policy: 'disallowed',
      page_path: '/blog/inp-nextjs',
      ua_class: 'declared-ai',
    })
    expect(event.params.net_id).toBeTruthy()
  })

  it('reports a retrieval crawler as allowed', async () => {
    await run(request('/blog/inp-nextjs', { 'user-agent': SEARCH_BOT, 'x-real-ip': '203.0.113.9' }))

    expect(onlyEvent().params).toMatchObject({
      bot_name: 'OAI-SearchBot',
      bot_purpose: 'retrieval',
      bot_policy: 'allowed',
    })
  })

  it('never forwards the crawler User-Agent to GA4', async () => {
    // GA4 compara o UA do hit com a lista IAB e descarta o que reconhece como
    // bot. Repassar o UA real derrubaria 100% dos eventos silenciosamente.
    await run(request('/', { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    const headers = (vi.mocked(fetch).mock.calls[0][1]?.headers ?? {}) as Record<string, string>
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain('user-agent')
    expect(JSON.stringify(sent[0].body)).not.toContain('GPTBot/1.2')
  })

  it('classifies browser-shaped traffic without identifying it', async () => {
    await run(
      request('/', {
        'user-agent': CHROME,
        accept: 'text/html,application/xhtml+xml',
        'sec-fetch-mode': 'navigate',
        'x-real-ip': '198.51.100.4',
      })
    )

    const event = onlyEvent()
    expect(event.params.ua_class).toBe('browser-like')
    expect(event.params.bot_name).toBeUndefined()
    expect(event.params.bot_verified).toBeUndefined()
    // A invariante de privacidade e de custo: nada de DNS nem de feed para gente.
    expect(verifyCrawler).not.toHaveBeenCalled()
  })

  it('verifies identity when a crawler claims one', async () => {
    await run(request('/', { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    expect(verifyCrawler).toHaveBeenCalledOnce()
    expect(onlyEvent().params.bot_verified).toBe('verified')
  })

  it('verifies a signed request even with no declared agent', async () => {
    await run(request('/', { 'user-agent': CHROME, 'signature-input': 'sig1=()' }))

    expect(verifyCrawler).toHaveBeenCalledOnce()
  })

  it('marks a trap hit with its discovery channel', async () => {
    const { TRAP_ROBOTS_PATH } = await import('./lib/lab-traps')

    await run(request(TRAP_ROBOTS_PATH, { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    expect(onlyEvent().params).toMatchObject({
      is_trap: 'true',
      trap_channel: 'robots',
      // O trap de robots é Disallow para todo mundo: um hit aqui é violação.
      bot_policy: 'disallowed',
    })
  })

  it('reports the llms trap as not addressed by robots.txt', async () => {
    const { TRAP_LLMS_PATH } = await import('./lib/lab-traps')

    await run(request(TRAP_LLMS_PATH, { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    expect(onlyEvent().params.bot_policy).toBe('not-addressed')
  })
})

describe('proxy — fail-safe', () => {
  it('stays silent when the sink is not configured', async () => {
    // Preview e local não têm as variáveis, e não podem sujar a propriedade.
    vi.stubEnv('GA4_CRAWLER_MEASUREMENT_ID', '')
    vi.resetModules()
    proxyModule = await import('./proxy')

    await run(request('/', { 'user-agent': GPT_BOT }))

    expect(sent).toHaveLength(0)
  })

  it('serves the request even when telemetry throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('sink offline'))

    const response = await run(request('/', { 'user-agent': GPT_BOT, 'x-real-ip': '203.0.113.9' }))

    expect(response.status).toBe(200)
  })
})
