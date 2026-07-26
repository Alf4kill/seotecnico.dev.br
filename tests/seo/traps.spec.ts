import { test, expect } from '@playwright/test'
import sitemap from '../../src/app/sitemap'
import { TRAP_LLMS_PATH, TRAP_ROBOTS_PATH } from '../../src/lib/lab-traps'

// ─────────────────────────────────────────────────────────────────────────────
// Honeypots do experimento de detecção (docs/detection-experiment.md §4).
//
// A invariante que vale o arquivo: cada trap existe em EXATAMENTE uma
// superfície de descoberta. O trap de robots só no robots.txt; o de llms só
// no llms.txt; nenhum dos dois no sitemap. Um trap vazando para o sitemap
// anularia o experimento sem nenhum sintoma visível — é exatamente o tipo de
// falha que só um teste de artefato servido pega.
// ─────────────────────────────────────────────────────────────────────────────

test('robots trap is disallowed in robots.txt and appears nowhere else', async ({ request }) => {
  // Sem SITE_INDEXABLE o robots.txt é o fail-safe `Disallow: /` sem grupos —
  // a linha do trap só existe no build indexável.
  test.skip(process.env.SITE_INDEXABLE !== 'true', 'requires an indexable build')

  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain(`Disallow: ${TRAP_ROBOTS_PATH}`)
  expect(robots).not.toContain(TRAP_LLMS_PATH)
})

test('llms trap is linked in llms.txt and appears nowhere else', async ({ request }) => {
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).toContain(TRAP_LLMS_PATH)
  expect(llms).not.toContain(TRAP_ROBOTS_PATH)
})

test('neither trap leaks into the sitemap', async ({ request }) => {
  // Nas duas fontes: o módulo (o que o build gera) e o artefato servido.
  for (const entry of sitemap()) {
    expect(entry.url).not.toContain('/lab/')
  }
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).not.toContain(TRAP_ROBOTS_PATH)
  expect(xml).not.toContain(TRAP_LLMS_PATH)
})

for (const [name, path] of [
  ['robots trap', TRAP_ROBOTS_PATH],
  ['llms trap', TRAP_LLMS_PATH],
] as const) {
  test(`${name} serves an honest noindex page with revalidation headers`, async ({ request }) => {
    const response = await request.get(path)
    expect(response.status()).toBe(200)

    // noindex nas DUAS camadas: header (para qualquer client) e meta (para
    // quem só parseia HTML).
    expect(response.headers()['x-robots-tag']).toContain('noindex')
    const html = await response.text()
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow">/)

    // Página honesta: título, um único h1, idioma e a explicação do que é.
    expect(html).toMatch(/<title>[^<]+<\/title>/)
    expect(html.match(/<h1>/g)).toHaveLength(1)
    expect(html).toContain('lang="pt-BR"')
    expect(html).toContain('experimento')

    // Zero subresources: um hit no trap gera exatamente um request.
    expect(html).not.toMatch(/<(script|link|img)[\s>]/)

    // Revalidação (Axis B, §3.2): ETag + Last-Modified presentes…
    const etag = response.headers()['etag']
    expect(etag).toBeTruthy()
    expect(response.headers()['last-modified']).toBeTruthy()

    // …e um request condicional recebe 304 de verdade.
    const revalidated = await request.get(path, { headers: { 'If-None-Match': etag } })
    expect(revalidated.status()).toBe(304)
  })
}

test('trap route directories match the paths declared in lab-traps.ts', async ({ request }) => {
  // Os diretórios em src/app/lab/ duplicam os slugs das constantes; se
  // divergirem, a superfície anuncia um caminho e o servidor serve outro —
  // 404 aqui é exatamente esse drift.
  for (const path of [TRAP_ROBOTS_PATH, TRAP_LLMS_PATH]) {
    expect((await request.get(path)).status()).toBe(200)
  }
})
