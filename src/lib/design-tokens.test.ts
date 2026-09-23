import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { colors, contrastRatio, lightColors, type ColorToken } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// A paleta existe em dois lugares — globals.css (canais, para o Tailwind) e
// design-tokens.ts (hex, para Satori/favicon/tabela da página /design). Este
// teste é o que torna isso aceitável: qualquer divergência falha o CI.
//
// E transforma as razões de contraste anotadas nos comentários em asserção:
// "medido, não suposto" (CLAUDE.md §9) vale também para a próxima mudança.
// ─────────────────────────────────────────────────────────────────────────────

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')

/** Token hex → custom property de canais em globals.css. */
const CSS_VAR: Record<ColorToken, string> = {
  background: '--background-rgb',
  surface: '--surface-rgb',
  surface2: '--surface-2-rgb',
  surfaceAlt: '--surface-alt-rgb',
  rule: '--border-rgb',
  ruleStrong: '--border-strong-rgb',
  control: '--control-rgb',
  foreground: '--foreground-rgb',
  body: '--body-rgb',
  muted: '--muted-rgb',
  label: '--label-rgb',
  labelOnCode: '--label-code-rgb',
  primary: '--primary-rgb',
  primaryHover: '--primary-hover-rgb',
  onPrimary: '--on-primary-rgb',
  accent: '--accent-rgb',
  dangerText: '--danger-rgb',
  danger: '--danger-shape-rgb',
  reference: '--reference-rgb',
}

/** Corpo de um bloco de regras de globals.css, do seletor até o `}`. */
function block(selector: string): string {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`${selector} não encontrado em globals.css`)
  return css.slice(start, css.indexOf('}', start))
}

/** Base escura (também a ilha escura) e o tema claro. */
const THEMES = {
  escuro: { body: block('.theme-dark-island,'), palette: colors },
  claro: { body: block(":root[data-theme='light'] {"), palette: lightColors },
} as const

function channelsOf(body: string, variable: string): string {
  const match = body.match(new RegExp(`${variable}:\\s*(\\d+ \\d+ \\d+);`))
  if (!match) throw new Error(`${variable} não encontrado no bloco`)
  return match[1]
}

function hexToChannels(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')
}

describe('design tokens', () => {
  for (const [name, { body, palette }] of Object.entries(THEMES)) {
    it.each(Object.entries(CSS_VAR) as [ColorToken, string][])(
      `${name}: %s em hex bate com %s em globals.css`,
      (token, variable) => {
        expect(channelsOf(body, variable)).toBe(hexToChannels(palette[token]))
      }
    )
  }

  it('--code-background é o surface2 escuro (fundo do tema Shiki), nos dois temas', () => {
    expect(css).toMatch(new RegExp(`--code-background:\\s*${colors.surface2};`, 'i'))
    expect(THEMES.claro.body).not.toMatch(/--code-background/)
  })

  it('o escuro é a base; o claro só existe como [data-theme=light], uma vez', () => {
    expect(THEMES.escuro.body).toMatch(/color-scheme:\s*dark/)
    expect(THEMES.claro.body).toMatch(/color-scheme:\s*light/)
    expect(css.match(/\[data-theme='light'\]\s*\{/g)).toHaveLength(1)
    // Sem bloco de media query duplicado: o script do <head> resolve a
    // preferência do sistema e grava data-theme.
    expect(css).not.toMatch(/prefers-color-scheme:\s*light/)
  })

  it('a ilha escura redeclara os tokens escuros (bloco de código no claro)', () => {
    expect(css).toMatch(/:root,\s*\.theme-dark-island,\s*\.rich-text figure\[data-rehype-pretty-code-figure\]\s*\{/)
  })

  it('o âmbar de preenchimento dos diagramas não muda com o tema', () => {
    expect(THEMES.escuro.body).toMatch(/--color-accent:\s*#E89B3C;/)
    expect(THEMES.claro.body).not.toMatch(/--color-accent:/)
  })
})

describe.each([
  ['escuro', colors],
  ['claro', lightColors],
] as const)('contraste %s (WCAG AA, texto ≥ 4,5:1)', (_, c) => {
  const pages = { background: c.background, surface: c.surface }

  it.each(['foreground', 'body', 'muted', 'label', 'primary', 'primaryHover', 'accent', 'dangerText'] as const)(
    '%s é legível sobre o fundo e sobre o cartão',
    (token) => {
      for (const bg of Object.values(pages)) {
        expect(contrastRatio(c[token], bg)).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it('texto sobre botão ciano ou âmbar', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(c.onPrimary, c.accent)).toBeGreaterThanOrEqual(4.5)
  })

  it('borda de controle atinge 3:1 (WCAG 1.4.11)', () => {
    expect(contrastRatio(c.control, c.background)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(c.control, c.surface)).toBeGreaterThanOrEqual(3)
  })
})

describe('contraste do escuro — casos que só ele tem', () => {
  it.each(['foreground', 'body', 'muted', 'labelOnCode', 'primary', 'accent', 'dangerText'] as const)(
    '%s é legível sobre o bloco de código',
    (token) => {
      expect(contrastRatio(colors[token], colors.surface2)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('o rótulo comum NÃO serve sobre código — por isso existe labelOnCode', () => {
    expect(contrastRatio(colors.label, colors.surface2)).toBeLessThan(4.5)
  })

  it('o vermelho De Stijl reprova como texto — daí dangerText', () => {
    expect(contrastRatio(colors.danger, colors.background)).toBeLessThan(4.5)
  })
})

describe('contraste do claro — o metal', () => {
  // No claro o header e o rodapé são metal (surface2): todo papel de texto que
  // aparece na moldura precisa passar ali também.
  it.each(['foreground', 'body', 'muted', 'label', 'primary', 'accent', 'dangerText'] as const)(
    '%s é legível sobre o metal',
    (token) => {
      expect(contrastRatio(lightColors[token], lightColors.surface2)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('o ciano e o âmbar brilhantes reprovam como texto no papel — daí as tintas', () => {
    expect(contrastRatio(colors.primary, lightColors.background)).toBeLessThan(3)
    expect(contrastRatio(colors.accent, lightColors.background)).toBeLessThan(3)
  })

  it('diagramas: a tinta sobre as fases claras e o grafite sobre o âmbar', () => {
    const phase = (name: string) => THEMES.claro.body.match(new RegExp(`${name}:\\s*(#[0-9A-F]{6})`, 'i'))![1]
    for (const p of ['--color-diagram-phase-a', '--color-diagram-phase-b']) {
      expect(contrastRatio(lightColors.foreground, phase(p))).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrastRatio(colors.background, '#E89B3C')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('contrastRatio', () => {
  it('reproduz os extremos da escala', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
  })
})
