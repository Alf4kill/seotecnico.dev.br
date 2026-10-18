import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// A busca existe nas duas molduras, cada uma com o índice do próprio idioma
// (lib/search-index.ts). Este teste a usa pelos papéis de acessibilidade, como
// um leitor de tela usaria: até 2026-10-18 o overlay do modal tinha
// aria-hidden e envolvia a caixa inteira, então campo e resultados não
// existiam na árvore de acessibilidade — e nada falhava, porque os testes
// achavam o campo pelo label.
// ─────────────────────────────────────────────────────────────────────────────

const FRAMES = [
  { home: '/', open: 'Abrir busca', field: 'Campo de busca', seeAll: /Ver todos os resultados para/, results: '/busca?q=lcp', articlePrefix: '/blog/' },
  { home: '/en', open: 'Open search', field: 'Search field', seeAll: /See all results for/, results: '/en/search?q=lcp', articlePrefix: '/en/blog/' },
] as const

for (const frame of FRAMES) {
  test(`search on ${frame.home} is reachable by role and stays in its language`, async ({ page }) => {
    await page.goto(frame.home)
    await page.getByRole('button', { name: frame.open }).first().click()
    await page.getByRole('searchbox', { name: frame.field }).fill('lcp')

    const firstArticle = page.getByRole('option').locator(`a[href^="${frame.articlePrefix}"]`).first()
    await expect(firstArticle).toBeVisible()
    await expect(page.getByRole('link', { name: frame.seeAll })).toHaveAttribute('href', frame.results)
  })
}

test('the English index returns no Portuguese article', async ({ page }) => {
  await page.goto('/en/search?q=next')
  const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? '')
  )
  const portuguese = hrefs.filter((href) => href.startsWith('/blog/') || href.startsWith('/guia/'))
  expect(portuguese).toEqual([])
})
