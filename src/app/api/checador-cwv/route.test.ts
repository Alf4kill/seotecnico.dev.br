// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A rota do checador guarda um recurso que as outras não têm: a QUOTA da chave
// do CrUX. Ela é finita, compartilhada por todos os visitantes e, se esgotada,
// derruba a ferramenta para todo mundo até o dia seguinte.
//
// O que estes testes prendem: a chave nunca vaza para a resposta, 404 do CrUX é
// dado e não erro, o cache de borda existe (é ele que segura a quota de pé), e
// erro nunca é cacheado.

const CRUX_DATA = {
  record: {
    key: { origin: 'https://exemplo.com.br', formFactor: 'PHONE' },
    metrics: {
      largest_contentful_paint: {
        histogram: [{ density: 0.8 }, { density: 0.15 }, { density: 0.05 }],
        percentiles: { p75: 2100 },
      },
    },
    collectionPeriod: {
      firstDate: { year: 2026, month: 6, day: 29 },
      lastDate: { year: 2026, month: 7, day: 26 },
    },
  },
}

const calls: { url: string; body: unknown }[] = []
let route: typeof import('./route')

function get(origin: string, init: { ip?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(
    `https://seotecnico.dev.br/api/checador-cwv?origin=${encodeURIComponent(origin)}`,
    {
      headers: {
        'x-forwarded-for': init.ip ?? `203.0.113.${Math.floor(Math.random() * 250) + 1}`,
        ...init.headers,
      },
    }
  )
}

function respondWith(status: number, body: unknown) {
  vi.mocked(fetch).mockImplementationOnce(async (url, requestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(requestInit?.body ?? 'null')) })
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })
}

beforeEach(async () => {
  vi.resetModules()
  calls.length = 0
  vi.stubEnv('CRUX_API_KEY', 'chave-secreta-de-teste')
  vi.stubGlobal('fetch', vi.fn())
  route = await import('./route')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('GET /api/checador-cwv', () => {
  it('queries CrUX for the normalized origin and returns the report', async () => {
    respondWith(200, CRUX_DATA)

    const response = await route.GET(get('exemplo.com.br/blog/post'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(calls[0].body).toEqual({ origin: 'https://exemplo.com.br', formFactor: 'PHONE' })
    expect(body.inDataset).toBe(true)
    expect(body.lcpBucket).toBe('good')
    expect(body.metrics[0]).toMatchObject({ id: 'lcp', p75: 2100 })
  })

  it('never leaks the API key into the response', async () => {
    respondWith(200, CRUX_DATA)

    const response = await route.GET(get('exemplo.com.br'))
    const serialized = JSON.stringify(await response.json())

    expect(serialized).not.toContain('chave-secreta-de-teste')
    // A chave viaja na query da chamada ao Google — é onde a API a espera.
    expect(calls[0].url).toContain('key=chave-secreta-de-teste')
  })

  it('treats a 404 from CrUX as data, not as an error', async () => {
    // Origem sem visitas suficientes na janela de 28 dias. É o caso mais comum
    // em site novo e é o próprio resultado que o baseline deste repo registrou.
    respondWith(404, { error: { code: 404, message: 'chrome ux report data not found' } })

    const response = await route.GET(get('site-novo.com.br'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.inDataset).toBe(false)
    expect(body.lcpBucket).toBe('no-data')
    expect(body.metrics).toEqual([])
  })

  it('caches successful answers at the edge', async () => {
    // É o cache que segura a quota: o CrUX publica uma vez por dia, então
    // repetir a consulta em minutos devolveria o mesmo número.
    respondWith(200, CRUX_DATA)

    const response = await route.GET(get('exemplo.com.br'))

    expect(response.headers.get('cache-control')).toContain('s-maxage=21600')
    expect(response.headers.get('cache-control')).toContain('stale-while-revalidate')
  })

  it('never caches an error', async () => {
    const response = await route.GET(get('localhost:3000'))

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('passes the requested form factor through', async () => {
    respondWith(200, CRUX_DATA)

    const request = new NextRequest(
      'https://seotecnico.dev.br/api/checador-cwv?origin=exemplo.com.br&formFactor=DESKTOP',
      { headers: { 'x-forwarded-for': '203.0.113.5' } }
    )
    await route.GET(request)

    expect((calls[0].body as { formFactor: string }).formFactor).toBe('DESKTOP')
  })
})

describe('GET /api/checador-cwv — defesas de quota', () => {
  it('rejects a caller past the per-minute cap', async () => {
    for (let i = 0; i < 10; i++) respondWith(200, CRUX_DATA)

    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      statuses.push((await route.GET(get('exemplo.com.br', { ip: '198.51.100.20' }))).status)
    }

    expect(statuses.filter((s) => s === 200)).toHaveLength(10)
    expect(statuses.slice(10)).toEqual([429, 429])
    // O que importa: as duas recusadas não chegaram a gastar quota.
    expect(calls).toHaveLength(10)
  })

  it('refuses a request from another site', async () => {
    const response = await route.GET(
      get('exemplo.com.br', { headers: { origin: 'https://outro-site.com' } })
    )

    expect(response.status).toBe(403)
    expect(calls).toHaveLength(0)
  })

  it('allows a request with no Origin header at all', async () => {
    // Navegação direta e alguns proxies omitem o header; barrar isso quebraria
    // usuário real sem deter ninguém.
    respondWith(200, CRUX_DATA)

    const response = await route.GET(get('exemplo.com.br'))

    expect(response.status).toBe(200)
  })

  it('says it is unavailable when the key is missing', async () => {
    // Preview e local sem chave: dizer "indisponível" em vez de fingir que a
    // origem não tem dados, que seria uma mentira medível.
    vi.stubEnv('CRUX_API_KEY', '')
    vi.resetModules()
    route = await import('./route')

    const response = await route.GET(get('exemplo.com.br'))

    expect(response.status).toBe(503)
    expect(calls).toHaveLength(0)
  })

  it('reports upstream failures without revealing which one', async () => {
    // 403 de quota e 429 de rate limit são problema do dono do site; a
    // mensagem não deve dizer ao visitante qual dos dois aconteceu.
    respondWith(403, { error: { code: 403, message: 'quota exceeded' } })

    const response = await route.GET(get('exemplo.com.br'))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.error).not.toMatch(/quota|403|chave/i)
  })
})
