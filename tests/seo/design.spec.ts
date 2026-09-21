import { test, expect } from '@playwright/test'
import { getAllPosts, getGuide } from '../../src/lib/content'
import { CATEGORIES } from '../../src/lib/categories'
import sitemap from '../../src/app/sitemap'

// ─────────────────────────────────────────────────────────────────────────────
// Comportamentos do sistema visual que um teste de SEO não vê, mas que
// quebrariam em silêncio (docs/design-system.md):
//  - o índice do artigo aponta para ids que existem (extraídos no build, têm
//    de bater com os do rehype-slug);
//  - o filtro da /blog funciona sem JavaScript;
//  - o skip link leva ao conteúdo;
//  - `#article-end`, gatilho do evento article_read no GTM, continua lá.
// ─────────────────────────────────────────────────────────────────────────────

const ARTICLE_ROUTES = [
  ...getAllPosts().map((p) => `/blog/${p.frontmatter.slug}`),
  '/guia/seo-tecnico-nextjs',
  '/en/guide/technical-seo-nextjs',
]

test.describe('layout de leitura', () => {
  for (const route of ARTICLE_ROUTES) {
    test(`${route}: índice resolve e #article-end existe`, async ({ page }) => {
      await page.goto(route)
      const missing = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>('nav[aria-labelledby="toc-title"] a'))
          .map((a) => decodeURIComponent(a.hash.slice(1)))
          .filter((id) => !document.getElementById(id))
      )
      expect(missing, 'itens do índice sem heading correspondente').toEqual([])
      await expect(page.locator('#article-end')).toHaveCount(1)
    })
  }

  test('o índice da pilar lista todos os h2 do corpo', async ({ page }) => {
    await page.goto('/guia/seo-tecnico-nextjs')
    await expect(page.locator('nav[aria-labelledby="toc-title"] li')).toHaveCount(
      getGuide().derived.headings.length
    )
    await expect(page.locator('.rich-text h2')).toHaveCount(getGuide().derived.headings.length)
  })
})

test.describe('diagramas inline', () => {
  // Um rótulo de diagrama escrito com cor fixa (#1a1a1a) sobre uma fase que
  // escurece com o tema some — aconteceu em melhorar-lcp-nextjs e só apareceu
  // quando o site virou só-escuro. Aqui cada <text> é medido contra a forma que
  // está atrás dele (a última forma, na ordem do SVG, cujo retângulo contém o
  // centro do texto), ou contra o fundo da página.
  const withDiagrams = getAllPosts().filter((p) => p.content.includes('<svg'))

  for (const { frontmatter } of withDiagrams) {
    test(`/blog/${frontmatter.slug}: rótulos legíveis (≥4,5:1)`, async ({ page }) => {
      await page.goto(`/blog/${frontmatter.slug}`)
      const failing = await page.evaluate(() => {
        const parse = (css: string) => {
          const m = css.match(/[\d.]+/g)
          return m ? m.map(Number) : null
        }
        const ch = (c: number) => {
          const v = c / 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        }
        const lum = ([r, g, b]: number[]) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
        const ratio = (a: number[], b: number[]) => {
          const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x)
          return (h + 0.05) / (l + 0.05)
        }
        const pageBg = parse(getComputedStyle(document.body).backgroundColor)!
        const out: string[] = []
        for (const svg of Array.from(document.querySelectorAll<SVGSVGElement>('.rich-text svg'))) {
          const shapes = Array.from(svg.querySelectorAll<SVGGraphicsElement>('rect, circle, ellipse, polygon, path'))
          for (const text of Array.from(svg.querySelectorAll<SVGTextElement>('text'))) {
            const t = text.getBBox()
            const cx = t.x + t.width / 2
            const cy = t.y + t.height / 2
            const behind = shapes
              .filter((s) => text.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_PRECEDING)
              .filter((s) => {
                const fill = getComputedStyle(s).fill
                if (fill === 'none' || fill.startsWith('url')) return false
                const b = s.getBBox()
                return cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height
              })
              .at(-1)
            // Caixas de destaque costumam ser tint (fill-opacity 0.12): compõe
            // a cor sobre o fundo da página antes de medir.
            let bg = pageBg
            if (behind) {
              const style = getComputedStyle(behind)
              const fill = parse(style.fill)!
              const alpha = Number(style.fillOpacity) * Number(style.opacity) * (fill[3] ?? 1)
              bg = [0, 1, 2].map((i) => fill[i] * alpha + pageBg[i] * (1 - alpha))
            }
            const fg = parse(getComputedStyle(text).fill)
            if (!fg) continue
            const r = ratio(fg, bg)
            if (r < 4.5) out.push(`"${text.textContent?.trim().slice(0, 30)}" ${r.toFixed(2)}:1`)
          }
        }
        return out
      })
      expect(failing).toEqual([])
    })
  }
})

test.describe('filtro da /blog', () => {
  test.use({ javaScriptEnabled: false })

  test('cada eixo mostra só os seus artigos, sem JavaScript', async ({ page }) => {
    await page.goto('/blog')
    const rows = page.locator('li[data-category]')
    const total = getAllPosts().length
    await expect(rows.filter({ visible: true })).toHaveCount(total)

    for (const { slug } of CATEGORIES) {
      await page.locator(`input[name="eixo"][value="${slug}"]`).check({ force: true })
      const expected = getAllPosts().filter((p) => p.frontmatter.category === slug).length
      await expect(rows.filter({ visible: true })).toHaveCount(expected)
      await expect(page.locator(`li[data-category="${slug}"]`).filter({ visible: true })).toHaveCount(expected)
    }

    await page.locator('input[name="eixo"][value="all"]').check({ force: true })
    await expect(rows.filter({ visible: true })).toHaveCount(total)
  })
})

test.describe('sem rolagem horizontal no celular (390px)', () => {
  // Um item de grid cresce até a largura mínima do conteúdo (min-width: auto):
  // uma tabela larga dentro de um overflow-x-auto ainda empurra a página se a
  // coluna que a contém não tiver min-w-0. Aconteceu em /design.
  test.use({ viewport: { width: 390, height: 844 } })

  for (const route of sitemap().map((e) => new URL(e.url).pathname)) {
    test(route, async ({ page }) => {
      await page.goto(route)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  }
})

test('o skip link é o primeiro foco e leva ao conteúdo', async ({ page }) => {
  await page.goto('/blog')
  await page.keyboard.press('Tab')
  const skip = page.locator('a.skip-link')
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await expect(page.locator('main#conteudo')).toHaveCount(1)
})
