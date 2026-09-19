import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/lib/design-tokens'
import { shikiTheme } from '@/lib/shiki-theme'

// O critério que escolheu o tema de código (src/lib/mdx.ts), agora executável:
// todo token precisa passar AA (4,5:1) sobre o fundo do bloco.

describe('tema Shiki', () => {
  const background = shikiTheme.colors?.['editor.background'] as string
  const foregrounds = new Set(
    (shikiTheme.tokenColors ?? [])
      .map((rule) => rule.settings.foreground)
      .filter((color): color is string => Boolean(color))
  )

  it('usa o fundo de código do sistema', () => {
    expect(background).toBe('#1B222B')
  })

  it.each([...foregrounds])('%s passa AA sobre o fundo', (color) => {
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5)
  })
})
