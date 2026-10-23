import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'
import sitemap from '../../src/app/sitemap'
import { parseCruxReport } from '../../src/lib/crux'

// ─────────────────────────────────────────────────────────────────────────────
// Acessibilidade automatizada (axe-core, WCAG 2.0 e 2.1 níveis A e AA).
//
// Toda rota do sitemap (mais as de busca, noindex), nos DOIS temas, e as três
// ferramentas de novo depois de produzirem resultado — com as rotas de API
// simuladas, sem rede.
//
// Nenhuma regra do axe é desligada. Uma regra é rebaixada a AVISO:
// `color-contrast`. Decisão do dono (2026-10-23): o site tem identidade visual
// própria e mudança de cor é decisão de design, tomada depois de ver o achado —
// não imposta pelo CI. O achado não some: vai anexado ao teste e o
// tests/a11y-reporter.ts o agrega em test-results/a11y-report.md, no resumo
// do job no GitHub e em anotações ::warning:: no PR. Todo o resto bloqueia.
//
// O contraste continua com portão próprio e bloqueante em contrast.spec.ts
// (≥4,5:1 por papel de cor, medido no navegador) e design-tokens.test.ts; o
// aviso daqui cobre o que aqueles não alcançam (elementos fora dos papéis
// mapeados), sem forçar a troca.
// ─────────────────────────────────────────────────────────────────────────────

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const WARN_ONLY_RULES = new Set(['color-contrast'])

const routes = [
  ...sitemap().map((entry) => new URL(entry.url).pathname),
  '/busca',
  '/en/search',
]

const SCHEMES = ['dark', 'light'] as const
type Scheme = (typeof SCHEMES)[number]

/** O que o reporter recebe de cada teste (anexo `a11y-result`). */
export interface A11yResult {
  route: string
  scheme: Scheme
  state: string
  violations: {
    id: string
    impact: string | null
    help: string
    nodes: number
    warnOnly: boolean
    /** Até 5 nós (seletor + trecho do HTML), para achar o componente. */
    sample: { selector: string; html: string }[]
  }[]
  contrast: ContrastNode[]
  /** Nós que o axe não conseguiu decidir (fundo em imagem, sobreposição…). */
  contrastIncomplete: number
}

export interface ContrastNode {
  selector: string
  html: string
  fg: string
  bg: string
  ratio: number
  required: number
  fontSize: string
  fontWeight: string
}

function contrastNodes(violation: Result | undefined): ContrastNode[] {
  if (!violation) return []
  return violation.nodes.map((node) => {
    const data = (node.any[0]?.data ?? {}) as Record<string, unknown>
    return {
      selector: node.target.join(' '),
      html: node.html.slice(0, 120),
      fg: String(data.fgColor ?? ''),
      bg: String(data.bgColor ?? ''),
      ratio: Number(data.contrastRatio ?? 0),
      required: Number(String(data.expectedContrastRatio ?? '4.5').replace(':1', '')),
      fontSize: String(data.fontSize ?? ''),
      fontWeight: String(data.fontWeight ?? ''),
    }
  })
}

async function audit(page: Page, testInfo: TestInfo, route: string, scheme: Scheme, state: string) {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(TAGS).analyze()

  const result: A11yResult = {
    route,
    scheme,
    state,
    violations: violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      help: v.help,
      nodes: v.nodes.length,
      warnOnly: WARN_ONLY_RULES.has(v.id),
      sample: v.nodes.slice(0, 5).map((n) => ({ selector: n.target.join(' '), html: n.html.slice(0, 160) })),
    })),
    contrast: contrastNodes(violations.find((v) => v.id === 'color-contrast')),
    contrastIncomplete: incomplete.find((v) => v.id === 'color-contrast')?.nodes.length ?? 0,
  }
  await testInfo.attach('a11y-result', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  })
  if (result.contrast.length > 0) {
    testInfo.annotations.push({
      type: 'a11y-warning',
      description: `${result.contrast.length} nó(s) abaixo do contraste AA — aviso, não falha`,
    })
  }

  const blocking = violations
    .filter((v) => !WARN_ONLY_RULES.has(v.id))
    .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(blocking, `violações WCAG em ${route} (${scheme}, ${state})`).toEqual([])
}

async function open(page: Page, route: string, scheme: Scheme) {
  // Sem animação: uma transição no meio da medição daria cor intermediária.
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
  await page.goto(route)
  await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
}

for (const scheme of SCHEMES) {
  test.describe(`axe — tema ${scheme}`, () => {
    for (const route of routes) {
      test(`${route} sem violações WCAG A/AA`, async ({ page }, testInfo) => {
        await open(page, route, scheme)
        await audit(page, testInfo, route, scheme, 'inicial')
      })
    }

    // ── Ferramentas com resultado na tela ─────────────────────────────────

    test('gerador de JSON-LD depois de gerar', async ({ page }, testInfo) => {
      const route = '/ferramentas/gerador-json-ld'
      await open(page, route, scheme)
      await page.getByLabel(/título do artigo/i).fill('Meu artigo')
      await page.getByLabel(/url canônica/i).fill('https://exemplo.dev/blog/meu-artigo')
      await page.getByLabel(/data de publicação/i).fill('2026-10-23')
      await page.getByLabel(/nome do autor/i).fill('Nalpi')
      await page.getByRole('button', { name: /gerar json-ld/i }).click()
      await expect(page.getByRole('tab', { name: 'JSON-LD' })).toBeVisible()
      await audit(page, testInfo, route, scheme, 'resultado')
    })

    test('gerador de JSON-LD com erros de validação', async ({ page }, testInfo) => {
      const route = '/ferramentas/gerador-json-ld'
      await open(page, route, scheme)
      await page.getByRole('button', { name: /gerar json-ld/i }).click()
      // O Next também tem um role="alert" (o anunciador de rota): filtra a lista de erros.
      await expect(page.getByRole('alert').filter({ has: page.locator('li') })).toBeVisible()
      await audit(page, testInfo, route, scheme, 'erro')
    })

    test('validador de meta tags depois de validar', async ({ page }, testInfo) => {
      const route = '/ferramentas/validador-meta-tags'
      await page.route('**/api/validador-meta**', (r) =>
        r.fulfill({
          json: {
            finalUrl: 'https://exemplo.dev/blog/artigo',
            httpStatus: 200,
            redirected: true,
            meta: { title: 'Título da página', description: null, ogTitle: null, ogDescription: null, ogImage: null },
            checks: [
              { id: 'title', status: 'ok', label: 'Title', detail: '17 caracteres.' },
              { id: 'description', status: 'error', label: 'Meta description', detail: 'Ausente.' },
              { id: 'og-image', status: 'warning', label: 'og:image', detail: 'Ausente.' },
            ],
            issuesFound: 2,
          },
        })
      )
      await open(page, route, scheme)
      await page.getByLabel(/url da página para validar/i).fill('exemplo.dev/blog/artigo')
      await page.getByRole('button', { name: /^validar$/i }).click()
      await expect(page.getByRole('heading', { name: /checagens/i })).toBeVisible()
      await audit(page, testInfo, route, scheme, 'resultado')
    })

    test('checador de CWV depois de consultar', async ({ page }, testInfo) => {
      const route = '/ferramentas/checador-cwv'
      const histogram = (g: number, m: number, p: number) => [{ density: g }, { density: m }, { density: p }]
      const report = parseCruxReport(
        {
          record: {
            metrics: {
              largest_contentful_paint: { percentiles: { p75: 2100 }, histogram: histogram(0.8, 0.15, 0.05) },
              interaction_to_next_paint: { percentiles: { p75: 320 }, histogram: histogram(0.6, 0.3, 0.1) },
              cumulative_layout_shift: { percentiles: { p75: '0.31' }, histogram: histogram(0.5, 0.2, 0.3) },
              first_contentful_paint: { percentiles: { p75: 1500 }, histogram: histogram(0.8, 0.1, 0.1) },
            },
            collectionPeriod: {
              firstDate: { year: 2026, month: 9, day: 1 },
              lastDate: { year: 2026, month: 9, day: 28 },
            },
          },
        },
        'https://exemplo.dev',
        'PHONE'
      )
      await page.route('**/api/checador-cwv**', (r) => r.fulfill({ json: { ...report, inDataset: true } }))
      await open(page, route, scheme)
      await page.getByLabel(/endereço do site/i).fill('exemplo.dev')
      await page.getByRole('button', { name: /^consultar$/i }).click()
      await expect(page.getByText('Core Web Vital').first()).toBeVisible()
      await audit(page, testInfo, route, scheme, 'resultado')
    })
  })
}
