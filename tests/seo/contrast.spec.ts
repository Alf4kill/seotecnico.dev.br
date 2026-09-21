import { test, expect, type Page } from '@playwright/test'
import { getAllPosts } from '../../src/lib/content'
import { colors } from '../../src/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Contraste e tema (CLAUDE.md §9, docs/design-system.md).
//
// O site tem um tema só, escuro. O que precisa continuar verdadeiro:
//  - a preferência clara do sistema não muda nada (nem pisca fundo branco);
//  - não sobrou botão de tema nem script de tema;
//  - todo texto renderizado passa AA (4,5:1) contra o fundo que realmente está
//    atrás dele — medido no navegador, papel por papel, em várias rotas.
//
// design-tokens.test.ts prova que os PARES da paleta passam. Este arquivo prova
// que os componentes USAM os pares certos: um rótulo #7A8798 posto sobre o
// bloco de código (4,39:1) passa no teste de tokens e reprova aqui.
// ─────────────────────────────────────────────────────────────────────────────

const newest = getAllPosts()[0].frontmatter.slug

const ROUTES = ['/', '/blog', `/blog/${newest}`, '/guia/seo-tecnico-nextjs', '/ferramentas', '/ferramentas/checador-cwv', '/en', '/design']

/** Um seletor por papel de cor do sistema. */
const ROLES: Record<string, string> = {
  título: 'h1',
  corpo: 'main p',
  leitura: '.rich-text p, .rich-text li',
  apoio: '.text-muted',
  rótulo: '.eyebrow, .text-label',
  link: 'main a',
  'botão sólido': '.bg-primary-solid',
  código: '.rich-text pre code span[style]',
  'título de bloco de código': '[data-rehype-pretty-code-title]',
}

interface Worst {
  ratio: number
  text: string
}

/**
 * Pior contraste entre os elementos visíveis que casam com o seletor. Fundos
 * semitransparentes são empilhados até a primeira camada opaca — sem isso um
 * tint de 10% dá um número errado para mais.
 */
function worstContrast(page: Page, selector: string): Promise<Worst | null> {
  return page.evaluate((sel) => {
    const parse = (css: string) => {
      const [r, g, b, a] = (css.match(/[\d.]+/g) ?? ['0', '0', '0', '0']).map(Number)
      return { r, g, b, a: a ?? 1 }
    }
    type C = ReturnType<typeof parse>
    const over = (fg: C, bg: C): C => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    })
    const ch = (c: number) => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    const lum = (c: C) => 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b)

    let worst: { ratio: number; text: string } | null = null
    for (const el of Array.from(document.querySelectorAll(sel)).slice(0, 60)) {
      const text = (el.textContent ?? '').trim()
      const rect = el.getBoundingClientRect()
      if (!text || rect.width === 0 || rect.height === 0) continue
      if (getComputedStyle(el).visibility === 'hidden') continue

      const layers: string[] = []
      let node: Element | null = el
      while (node) {
        const bg = getComputedStyle(node).backgroundColor
        const alpha = Number(bg.match(/[\d.]+/g)?.[3] ?? 1)
        if (alpha > 0) layers.push(bg)
        if (alpha === 1) break
        node = node.parentElement
      }
      let background: C = { r: 0, g: 0, b: 0, a: 1 }
      for (let i = layers.length - 1; i >= 0; i--) background = over(parse(layers[i]), background)
      const foreground = over(parse(getComputedStyle(el).color), background)
      const [hi, lo] = [lum(foreground), lum(background)].sort((a, b) => b - a)
      const ratio = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
      if (!worst || ratio < worst.ratio) worst = { ratio, text: text.slice(0, 50) }
    }
    return worst
  }, selector)
}

test.describe('tema único, escuro', () => {
  test('a preferência clara do sistema não muda o fundo', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    const rgb = colors.background.match(/\w\w/g)!.map((h) => parseInt(h, 16)).join(', ')
    await expect(page.locator('body')).toHaveCSS('background-color', `rgb(${rgb})`)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', colors.background)
  })

  test('não há botão nem script de tema', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /tema/i })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined()
  })
})

test.describe('contraste AA por papel de cor', () => {
  for (const route of ROUTES) {
    test(route, async ({ page }) => {
      await page.goto(route)
      for (const [role, selector] of Object.entries(ROLES)) {
        const worst = await worstContrast(page, selector)
        if (!worst) continue // papel ausente nesta rota
        expect(worst.ratio, `${role} em ${route}: "${worst.text}"`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  test('chip de categoria da busca', async ({ page }) => {
    // Texto sobre fundo de modal: o par que já reprovou uma vez (tint de 10%,
    // achado (3) da baseline de 2026-07-20). O chip mudou de forma, a regra não.
    await page.goto('/ferramentas')
    await page.getByRole('button', { name: 'Abrir busca' }).first().click()
    await page.getByLabel('Campo de busca').fill('json')
    await expect(page.locator('.search-chip').first()).toBeVisible()
    const worst = await worstContrast(page, '.search-chip')
    expect(worst?.ratio).toBeGreaterThanOrEqual(4.5)
  })
})
