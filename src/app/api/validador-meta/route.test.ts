// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A guarda anti-SSRF desta rota é a única superfície do site que busca uma URL
// escolhida por quem chama. O modo de falha que importa não é o fetch direto —
// esse `parseTargetUrl` já cobre, testado em meta-validator.test.ts — e sim o
// REDIRECIONAMENTO: um host público que responde 302 para 169.254.169.254
// atravessa qualquer validação feita só na entrada.
//
// O teste existe porque a regressão é de uma palavra: trocar `redirect:
// 'manual'` de volta para `'follow'` reabre o buraco inteiro sem quebrar nada
// mais. Rede e DNS são simulados; nada aqui sai da máquina.

const state = vi.hoisted(() => ({
  /** hostname → IP que o DNS simulado devolve. */
  dns: new Map<string, string>(),
  /** URL → resposta que o fetch simulado devolve. */
  routes: new Map<string, () => Response>(),
  /** Toda URL efetivamente buscada, em ordem. */
  fetched: [] as string[],
  /** O `init` de cada fetch, para conferir o contrato do redirecionamento. */
  inits: [] as (RequestInit | undefined)[],
}))

vi.mock('node:dns', () => {
  const lookup = async (hostname: string) => {
    const address = state.dns.get(hostname)
    if (!address) throw new Error(`ENOTFOUND ${hostname}`)
    return [{ address, family: address.includes(':') ? 6 : 4 }]
  }
  return { promises: { lookup }, default: { promises: { lookup } } }
})

const html = (body = '<title>ok</title><h1>ok</h1>') =>
  new Response(`<html lang="pt-BR"><head>${body}</head><body></body></html>`, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })

const redirectTo = (location: string, status = 302) =>
  new Response(null, { status, headers: { location } })

function get(url: string, ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`) {
  // IP distinto por chamada: o limitador guarda estado de módulo, e um bucket
  // compartilhado faria um teste derrubar o seguinte com 429.
  const request = new NextRequest(
    `https://seotecnico.dev.br/api/validador-meta?url=${encodeURIComponent(url)}`,
    { headers: { 'x-forwarded-for': ip } }
  )
  return request
}

let route: typeof import('./route')

beforeEach(async () => {
  state.dns.clear()
  state.routes.clear()
  state.fetched.length = 0
  state.inits.length = 0

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const href = input instanceof URL ? input.href : String(input)
      state.fetched.push(href)
      state.inits.push(init)
      const handler = state.routes.get(href)
      if (!handler) throw new Error(`unexpected fetch: ${href}`)
      return handler()
    })
  )

  route = await import('./route')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/validador-meta — cadeia de redirecionamento', () => {
  it('refuses a redirect that lands on a private address', async () => {
    state.dns.set('publico.example', '93.184.216.34')
    state.dns.set('interno.example', '169.254.169.254') // metadata da nuvem
    state.routes.set('https://publico.example/', () =>
      redirectTo('http://interno.example/latest/meta-data/')
    )

    const response = await route.GET(get('https://publico.example/'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('redirecionamento'),
    })
    // A prova real: o destino privado nunca chegou a ser buscado.
    expect(state.fetched).toEqual(['https://publico.example/'])
  })

  it('never delegates redirect following to fetch', async () => {
    // Esta asserção é a que pega a regressão de uma palavra. Com `follow`, o
    // runtime segue a cadeia internamente e a rota nunca vê o 302 — logo nunca
    // revalida o destino. Os outros testes usam fetch simulado e continuariam
    // passando; só esta olha para o contrato pedido.
    state.dns.set('direto.example', '93.184.216.34')
    state.routes.set('https://direto.example/', () => html())

    await route.GET(get('https://direto.example/'))

    expect(state.inits).toHaveLength(1)
    expect(state.inits[0]?.redirect).toBe('manual')
  })

  it('refuses a redirect to a scheme the entry gate would have rejected', async () => {
    state.dns.set('publico.example', '93.184.216.34')
    state.routes.set('https://publico.example/', () => redirectTo('file:///etc/passwd'))

    const response = await route.GET(get('https://publico.example/'))

    expect(response.status).toBe(400)
    expect(state.fetched).toEqual(['https://publico.example/'])
  })

  it('follows a legitimate public chain and reports the final URL', async () => {
    state.dns.set('velho.example', '93.184.216.34')
    state.dns.set('novo.example', '93.184.216.35')
    state.routes.set('https://velho.example/antigo', () =>
      redirectTo('https://novo.example/atual', 301)
    )
    state.routes.set('https://novo.example/atual', () => html())

    const response = await route.GET(get('https://velho.example/antigo'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.finalUrl).toBe('https://novo.example/atual')
    expect(body.redirected).toBe(true)
  })

  it('resolves a relative Location against the current hop', async () => {
    state.dns.set('site.example', '93.184.216.34')
    state.routes.set('https://site.example/a', () => redirectTo('/b'))
    state.routes.set('https://site.example/b', () => html())

    const body = await (await route.GET(get('https://site.example/a'))).json()

    expect(body.finalUrl).toBe('https://site.example/b')
  })

  it('gives up on a redirect loop instead of hanging', async () => {
    state.dns.set('loop.example', '93.184.216.34')
    state.routes.set('https://loop.example/', () => redirectTo('https://loop.example/'))

    const response = await route.GET(get('https://loop.example/'))

    expect(response.status).toBe(502)
    // Teto de 5 saltos = 6 buscas no total, e então para.
    expect(state.fetched.length).toBe(6)
  })

  it('reports a direct hit as not redirected', async () => {
    state.dns.set('direto.example', '93.184.216.34')
    state.routes.set('https://direto.example/', () => html())

    const body = await (await route.GET(get('https://direto.example/'))).json()

    expect(body.redirected).toBe(false)
    expect(body.finalUrl).toBe('https://direto.example/')
  })
})

describe('GET /api/validador-meta — limite por IP', () => {
  it('serves a burst up to the cap, then answers 429', async () => {
    state.dns.set('alvo.example', '93.184.216.34')
    state.routes.set('https://alvo.example/', () => html())

    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      const response = await route.GET(get('https://alvo.example/', '198.51.100.7'))
      statuses.push(response.status)
    }

    expect(statuses.filter((s) => s === 200)).toHaveLength(10)
    expect(statuses.slice(10)).toEqual([429, 429])
  })

  it('counts each caller separately', async () => {
    state.dns.set('alvo.example', '93.184.216.34')
    state.routes.set('https://alvo.example/', () => html())

    for (let i = 0; i < 11; i++) await route.GET(get('https://alvo.example/', '198.51.100.8'))
    const other = await route.GET(get('https://alvo.example/', '198.51.100.9'))

    expect(other.status).toBe(200)
  })
})
