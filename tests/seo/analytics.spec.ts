import { test, expect, type Page } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Key events das ferramentas (CLAUDE.md §7.2, docs/measurement-plan.md).
//
// `tool_generate_jsonld` e `tool_validate_meta` são os eventos-chave do
// objetivo O5 — a métrica de que as ferramentas funcionam. Até aqui só a
// função `pushEvent` tinha teste; o caminho que realmente importa (clicar e o
// evento chegar ao dataLayer) era verificado à mão, uma vez, no DebugView.
//
// Modos de falha que isto pega e o teste de unidade não pegava: a chamada
// removida num refactor do componente, o clique que retorna antes por causa da
// validação, e o parâmetro renomeado no componente sem passar pelo tipo.
//
// Não valida GTM nem GA4 — valida o contrato do site com o GTM, que é o
// dataLayer. O que o GTM faz depois depende de consentimento e de container
// publicado, nenhum dos dois presente no CI.
// ─────────────────────────────────────────────────────────────────────────────

interface DataLayerEvent {
  event?: string
  [key: string]: unknown
}

/** Eventos empurrados pelo site, na ordem. */
async function dataLayerEvents(page: Page): Promise<DataLayerEvent[]> {
  return page.evaluate(
    () => ((window as unknown as { dataLayer?: DataLayerEvent[] }).dataLayer ?? []) as DataLayerEvent[]
  )
}

/**
 * O banner de consentimento é SSR e cobre o rodapé. Recusar é o caminho mais
 * conservador e não deve calar o dataLayer: quem decide o que sai dali é o
 * Consent Mode no GTM, não o site.
 */
async function dismissConsent(page: Page) {
  const reject = page.getByRole('button', { name: 'Recusar' })
  if (await reject.isVisible().catch(() => false)) await reject.click()
}

test.describe('key events das ferramentas', () => {
  test('tool_generate_jsonld fires with the chosen schema type', async ({ page }) => {
    await page.goto('/ferramentas/gerador-json-ld')
    await dismissConsent(page)

    await page.getByLabel(/Título do artigo/).fill('Como melhorar o LCP no Next.js')
    await page.getByLabel(/URL canônica do artigo/).fill('https://exemplo.dev/blog/lcp')
    await page.getByLabel(/Data de publicação/).fill('2026-07-26')
    await page.getByLabel(/Nome do autor/).fill('Fulano de Tal')

    await page.getByRole('button', { name: 'Gerar JSON-LD' }).click()

    // A saída aparecendo é o que prova que a validação passou — sem isso, um
    // dataLayer vazio significaria "formulário incompleto", não "evento sumiu".
    await expect(page.locator('pre').first()).toContainText('"@type": "Article"')

    const events = await dataLayerEvents(page)
    expect(events).toContainEqual(
      expect.objectContaining({ event: 'tool_generate_jsonld', schema_type: 'Article' })
    )
  })

  test('does not fire the event when the form is rejected', async ({ page }) => {
    // O evento-chave mede uso real. Se disparasse no clique e não na geração,
    // toda validação falha viraria uso no relatório.
    await page.goto('/ferramentas/gerador-json-ld')
    await dismissConsent(page)

    await page.getByRole('button', { name: 'Gerar JSON-LD' }).click()

    const events = await dataLayerEvents(page)
    expect(events.filter((e) => e.event === 'tool_generate_jsonld')).toHaveLength(0)
  })

  test('tool_validate_meta reports a count, never the URL', async ({ page }) => {
    await page.goto('/ferramentas/validador-meta-tags')
    await dismissConsent(page)

    // A rota de API é interceptada: a suíte não deve sair para a internet, e o
    // que está sob teste é o evento, não o fetch.
    await page.route('**/api/validador-meta**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          finalUrl: 'https://exemplo.dev/',
          httpStatus: 200,
          redirected: false,
          meta: {
            title: 'Exemplo',
            description: 'Descrição de exemplo',
            ogTitle: null,
            ogDescription: null,
            ogImage: null,
          },
          checks: [],
          issuesFound: 3,
        }),
      })
    )

    await page.getByRole('textbox').first().fill('https://exemplo.dev/')
    await page.getByRole('button', { name: /Validar/ }).click()

    await expect
      .poll(async () =>
        (await dataLayerEvents(page)).find((e) => e.event === 'tool_validate_meta')
      )
      .toMatchObject({ issues_found: 3 })

    // LGPD e §13: a URL validada não pode viajar como parâmetro de evento.
    const serialized = JSON.stringify(await dataLayerEvents(page))
    expect(serialized).not.toContain('exemplo.dev')
  })

  test('tool_check_cwv reports the LCP bucket, including no-data', async ({ page }) => {
    await page.goto('/ferramentas/checador-cwv')
    await dismissConsent(page)

    // Origem fora do conjunto de dados: é o resultado mais comum da ferramenta
    // e o que mais interessa medir, então precisa gerar evento como qualquer
    // outro — e não um erro.
    await page.route('**/api/checador-cwv**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          origin: 'https://exemplo.dev',
          formFactor: 'PHONE',
          period: { firstDate: '', lastDate: '' },
          metrics: [],
          lcpBucket: 'no-data',
          inDataset: false,
        }),
      })
    )

    await page.getByRole('textbox').first().fill('exemplo.dev')
    await page.getByRole('button', { name: /Consultar/ }).click()

    await expect
      .poll(async () => (await dataLayerEvents(page)).find((e) => e.event === 'tool_check_cwv'))
      .toMatchObject({ lcp_bucket: 'no-data' })

    // "Sem dados" é resposta, não falha: o leitor tem de entender por quê.
    await expect(page.getByText(/ainda não está no conjunto de dados/i)).toBeVisible()

    const serialized = JSON.stringify(await dataLayerEvents(page))
    expect(serialized).not.toContain('exemplo.dev')
  })
})
