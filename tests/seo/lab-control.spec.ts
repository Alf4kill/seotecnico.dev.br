import { test, expect } from '@playwright/test'
import { controlCode, controlSlug } from '../../src/lib/lab-probes'

// ─────────────────────────────────────────────────────────────────────────────
// Controle positivo da H15 (docs/detection-experiment.md §4.6).
//
// A tabela da §4.6 diz onde cada código vive. Esta suíte prova isso no HTML
// servido, que é o que um agente sem JavaScript recebe:
//   SRV- e UC- no texto do HTML (UC- vem de um componente 'use client'),
//   LD- só dentro do JSON-LD, JS- em lugar nenhum até o JS rodar.
// Prova também que o slug não vaza para nenhuma superfície de descoberta.
//
// Precisa de LAB_PROBE_CONTROL_SLUG no build E no servidor (o CI define um
// slug de teste). Sem ele, a rota é 404 por design e a suíte é pulada.
// ─────────────────────────────────────────────────────────────────────────────

const slug = controlSlug()
const ROUND = '05'

test.describe('positive control (H15)', () => {
  test.skip(!slug, 'LAB_PROBE_CONTROL_SLUG not set: the control route is disabled by design')

  const page = `/lab/${slug}`
  const codes = {
    SRV: slug ? controlCode(slug, ROUND, 'SRV') : '',
    UC: slug ? controlCode(slug, ROUND, 'UC') : '',
    LD: slug ? controlCode(slug, ROUND, 'LD') : '',
    JS: slug ? controlCode(slug, ROUND, 'JS') : '',
  }

  test('served HTML: SRV and UC in the text, LD only in JSON-LD, JS nowhere', async ({ request }) => {
    const response = await request.get(`${page}?r=${ROUND}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['x-robots-tag']).toContain('noindex')

    const html = await response.text()
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)

    // O texto visível, sem nenhum <script> (JSON-LD e payload RSC incluídos).
    const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    expect(text).toContain(codes.SRV)
    expect(text).toContain(codes.UC)
    expect(text, 'LD- must not be in the visible text').not.toContain(codes.LD)

    const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]) as { identifier?: string })
    expect(jsonLd.map((node) => node.identifier)).toContain(codes.LD)

    // Nem no texto nem em script algum: o JS- só existe depois do fetch.
    expect(html, 'JS- must not be in the served HTML at all').not.toContain(codes.JS)
  })

  test('the JS code appears only after the client fetch runs', async ({ page: browser }) => {
    await browser.goto(`${page}?r=${ROUND}`)
    await expect(browser.getByTestId('fetched-code')).toHaveText(codes.JS)
  })

  test('the round changes every code', async ({ request }) => {
    const other = await (await request.get(`${page}?r=06`)).text()
    expect(other).not.toContain(codes.SRV)
    expect(other).toContain(controlCode(slug!, '06', 'SRV'))
  })

  test('any other segment is a 404, page and endpoint alike', async ({ request }) => {
    expect((await request.get('/lab/not-the-control-slug-000')).status()).toBe(404)
    expect((await request.get('/lab/not-the-control-slug-000/c')).status()).toBe(404)
    const endpoint = await request.get(`${page}/c?r=${ROUND}`)
    expect(endpoint.status()).toBe(200)
    expect(endpoint.headers()['cache-control']).toContain('no-store')
    expect(await endpoint.json()).toEqual({ code: codes.JS })
  })

  test('the slug leaks into no discovery surface', async ({ request }) => {
    for (const surface of ['/sitemap.xml', '/robots.txt', '/llms.txt', '/feed.xml', '/', '/en']) {
      const body = await (await request.get(surface)).text()
      expect(body, surface).not.toContain(slug!)
    }
  })
})
