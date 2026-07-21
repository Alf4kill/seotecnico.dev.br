import { test, expect, type Page } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Tema claro/escuro (CLAUDE.md §9).
//
// O que precisa continuar verdadeiro:
//  - sem escolha salva, o site segue prefers-color-scheme;
//  - a escolha explícita vence a preferência do sistema, nos dois sentidos;
//  - a escolha sobrevive a um reload e é aplicada ANTES da primeira pintura
//    (senão o visitante vê o flash branco que o tema escuro existe para evitar);
//  - o contraste de texto passa AA (4,5:1) nos DOIS temas — um tema escuro que
//    reprova no audit de contraste seria uma regressão, não um recurso.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'seotecnico:theme'

// O navegador só devolve as cores resolvidas; a matemática de contraste fica
// aqui no Node, onde é legível e testável.
interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const parse = (css: string): Rgba => {
  const [r, g, b, a] = css.match(/[\d.]+/g)!.map(Number)
  return { r, g, b, a: a ?? 1 }
}
const channel = (c: number) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (c: Rgba) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
const over = (fg: Rgba, bg: Rgba): Rgba => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
})

/** Contraste do texto do elemento contra o fundo que realmente aparece atrás. */
async function contrastOf(page: Page, selector: string) {
  // Fundos semitransparentes (o tint de 10% do selo) precisam ser empilhados
  // até a primeira camada opaca, senão o número sai errado para mais.
  const { color, layers } = await page.locator(selector).first().evaluate((el) => {
    const stack: string[] = []
    let node: Element | null = el
    while (node) {
      const bg = getComputedStyle(node).backgroundColor
      const alpha = Number(bg.match(/[\d.]+/g)?.[3] ?? 1)
      if (alpha > 0) stack.push(bg)
      if (alpha === 1) break
      node = node.parentElement
    }
    return { color: getComputedStyle(el).color, layers: stack }
  })

  let background: Rgba = { r: 255, g: 255, b: 255, a: 1 }
  for (let i = layers.length - 1; i >= 0; i--) background = over(parse(layers[i]), background)

  const foreground = over(parse(color), background)
  const [hi, lo] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
}

const themeOf = (page: Page) =>
  page.evaluate(() => {
    const chosen = document.documentElement.dataset.theme
    if (chosen === 'light' || chosen === 'dark') return chosen
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

const toggle = (page: Page) => page.getByRole('button', { name: /tema/i }).first()

test.describe('tema escuro', () => {
  test('sem escolha salva, segue a preferência do sistema', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    expect(await themeOf(page)).toBe('dark')
    // O atributo só existe quando o usuário escolheu: sem escolha, quem manda
    // é o CSS via media query.
    expect(await page.evaluate(() => document.documentElement.dataset.theme ?? '')).toBe('')

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    expect(await themeOf(page)).toBe('light')
  })

  test('o botão alterna o tema e persiste a escolha', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    await toggle(page).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe('dark')

    await toggle(page).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe('light')
  })

  test('a escolha vence o sistema e é aplicada antes da primeira pintura', async ({ page }) => {
    // Sistema no claro, usuário escolheu escuro: o escuro tem de ganhar.
    await page.emulateMedia({ colorScheme: 'light' })
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k as string, v as string),
      [STORAGE_KEY, 'dark'],
    )
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    // Antes da primeira pintura: se o atributo só chegasse na hidratação, o
    // documento pintaria claro primeiro. Checar no documentElement logo após o
    // goto cobre isso porque o script é inline e síncrono no <head>.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(13, 17, 23)')
  })

  test('o ícone mostrado é o do tema de destino', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    const button = toggle(page)
    // No claro, oferece o escuro (lua). No escuro, oferece o claro (sol).
    await expect(button.locator('.theme-icon-dark')).toBeVisible()
    await expect(button.locator('.theme-icon-light')).toBeHidden()

    await button.click()
    await expect(button.locator('.theme-icon-light')).toBeVisible()
    await expect(button.locator('.theme-icon-dark')).toBeHidden()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`contraste de texto passa AA no tema ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await page.goto('/ferramentas')

      // Um alvo por papel de cor, incluindo o par que já reprovou antes: o selo
      // "Em breve", texto sobre um tint de 10% (achado (3) da baseline).
      const targets: Record<string, string> = {
        h1: 'h1',
        corpo: 'main p',
        secundario: '.text-muted',
        selo: 'span.bg-primary\\/10',
      }

      for (const [role, selector] of Object.entries(targets)) {
        const found = await page.locator(selector).first().count()
        expect(found, `alvo de contraste ausente: ${role} (${selector})`).toBeGreaterThan(0)

        const ratio = await contrastOf(page, selector)
        expect(ratio, `${role} no tema ${theme}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  test('o botão de tema fica visível contra o header nos dois temas', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme })
      await page.goto('/')
      const stroke = await toggle(page).evaluate((button) => {
        const icon = [...button.querySelectorAll('svg')].find(
          (svg) => getComputedStyle(svg).display !== 'none',
        )
        return getComputedStyle(icon as Element).color
      })
      const headerBg = await page
        .locator('header')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(stroke, `ícone e header idênticos no tema ${theme}`).not.toBe(headerBg)
    }
  })
})
