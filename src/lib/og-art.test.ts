import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { SCENES } from '@/components/art/Art'
import { CentralMark } from '@/components/art/Marks'
import { SCENE_IDS } from '@/lib/art'
import { artColors, colors } from '@/lib/design-tokens'
import { artSvg, markDataUri, sceneDataUri } from '@/lib/og-art'

// ─────────────────────────────────────────────────────────────────────────────
// A arte das imagens OG é o SVG do site com a classe de token trocada pelo hex
// do escuro. Se uma classe escapar, o Satori pinta a forma de preto sobre o
// grafite e o cartão sai sem a cena — sem erro nenhum. Estes testes fecham isso.
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = new Set<string>([
  colors.foreground,
  colors.background,
  colors.primary,
  colors.accent,
  ...Object.values(artColors),
])

function paints(svg: string): string[] {
  return [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1])
}

describe('og-art', () => {
  it.each(SCENE_IDS)('cena %s vira SVG autônomo, só com hex da paleta', (id) => {
    const svg = artSvg(SCENES[id], {})
    expect(svg).toMatch(/^<svg viewBox="0 0 360 280"[^>]* xmlns="http:\/\/www\.w3\.org\/2000\/svg">/)
    expect(svg).not.toMatch(/class|className|aria-hidden|focusable/)
    // Nenhuma prop camelCase sobrou (viewBox é o nome SVG de verdade).
    expect(svg.replace(/ viewBox=/g, ' ')).not.toMatch(/ [a-z]+[A-Z][a-zA-Z]*=/)
    const used = paints(svg)
    expect(used.length).toBeGreaterThan(0)
    for (const hex of used) expect(PALETTE).toContain(hex)
  })

  it('traduz as props React para atributos SVG', () => {
    const svg = artSvg(SCENES['beam-piercing'], {})
    expect(svg).toContain(`fill-opacity="0.35"`)
    expect(svg).toContain(`stroke-width="1.5"`)
    expect(svg).toContain(`stroke-dasharray="4 4"`)
    expect(svg).toContain(`fill="${artColors.brass}"`)
  })

  it('a marca central perde as classes de layout e ganha a opacidade no SVG', () => {
    const svg = artSvg(CentralMark, { variant: 'beam' })
    expect(svg).not.toMatch(/mark-central|absolute|data-mark/)
    expect(svg).toContain(`stroke="${colors.primary}"`)
    const uri = markDataUri('beam', 0.14)
    expect(Buffer.from(uri.split(',')[1], 'base64').toString()).toMatch(/^<svg opacity="0.14" /)
  })

  it('entrega data URI base64', () => {
    expect(sceneDataUri('window')).toMatch(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/)
  })

  it('classe fill-/stroke- sem token lança em vez de sair preta', () => {
    const Rogue = () => createElement('svg', { viewBox: '0 0 1 1' }, createElement('rect', { className: 'fill-art-neon' }))
    expect(() => artSvg(Rogue, {})).toThrow(/fill-art-neon/)
  })
})
