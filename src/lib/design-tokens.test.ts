import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { colors, contrastRatio, type ColorToken } from '@/lib/design-tokens'

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

function channelsOf(variable: string): string {
  const match = css.match(new RegExp(`${variable}:\\s*(\\d+ \\d+ \\d+);`))
  if (!match) throw new Error(`${variable} não encontrado em globals.css`)
  return match[1]
}

function hexToChannels(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')
}

describe('design tokens', () => {
  it.each(Object.entries(CSS_VAR) as [ColorToken, string][])(
    '%s em hex bate com %s em globals.css',
    (token, variable) => {
      expect(channelsOf(variable)).toBe(hexToChannels(colors[token]))
    }
  )

  it('--code-background é o surface2 (fundo do tema Shiki)', () => {
    expect(css).toMatch(new RegExp(`--code-background:\\s*${colors.surface2};`, 'i'))
  })

  it('não sobrou tema claro', () => {
    expect(css).not.toMatch(/prefers-color-scheme:\s*light|data-theme/)
    expect(css).toMatch(/color-scheme:\s*dark/)
  })
})

describe('contraste (WCAG AA, texto ≥ 4,5:1)', () => {
  const pages = { background: colors.background, surface: colors.surface }

  it.each(['foreground', 'body', 'muted', 'label', 'primary', 'primaryHover', 'accent', 'dangerText'] as const)(
    '%s é legível sobre o fundo e sobre o cartão',
    (token) => {
      for (const bg of Object.values(pages)) {
        expect(contrastRatio(colors[token], bg)).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it.each(['foreground', 'body', 'muted', 'labelOnCode', 'primary', 'accent', 'dangerText'] as const)(
    '%s é legível sobre o bloco de código',
    (token) => {
      expect(contrastRatio(colors[token], colors.surface2)).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('o rótulo comum NÃO serve sobre código — por isso existe labelOnCode', () => {
    expect(contrastRatio(colors.label, colors.surface2)).toBeLessThan(4.5)
  })

  it('texto sobre botão ciano ou âmbar', () => {
    expect(contrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(colors.onPrimary, colors.accent)).toBeGreaterThanOrEqual(4.5)
  })

  it('borda de controle atinge 3:1 (WCAG 1.4.11)', () => {
    expect(contrastRatio(colors.control, colors.background)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(colors.control, colors.surface)).toBeGreaterThanOrEqual(3)
  })

  it('o vermelho De Stijl reprova como texto — daí dangerText', () => {
    expect(contrastRatio(colors.danger, colors.background)).toBeLessThan(4.5)
  })

  it('contrastRatio reproduz os extremos da escala', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
  })
})
