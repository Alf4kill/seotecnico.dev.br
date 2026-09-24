import { Fragment, createElement, isValidElement, type ComponentType, type ReactNode } from 'react'
import { SCENES } from '@/components/art/Art'
import { CentralMark, type CentralVariant } from '@/components/art/Marks'
import type { SceneId } from '@/lib/art'
import { artColors, colors } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Arte do site dentro das imagens OG. O Satori não resolve classe nem custom
// property, e a arte (components/art) só tem cor por classe de token
// (`fill-art-brass`, `stroke-foreground`). Aqui a mesma obra vira um SVG
// autônomo com o hex do tema escuro — o do cartão OG — e entra como <img> de
// data URI: uma fonte de desenho só, nenhuma cópia a manter em sincronia.
//
// Classe fill-/stroke- sem token lança: uma obra nova com cor fora da paleta
// quebra o build da imagem em vez de sair preta.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_HEX: Readonly<Record<string, string>> = {
  foreground: colors.foreground,
  background: colors.background,
  primary: colors.primary,
  accent: colors.accent,
  ...Object.fromEntries(Object.entries(artColors).map(([name, hex]) => [`art-${name}`, hex])),
}

/** `fill-art-brass stroke-primary` → { fill, stroke } em hex. Outras classes são layout do site. */
function paint(className: unknown): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const cls of String(className ?? '').split(/\s+/)) {
    const match = cls.match(/^(fill|stroke)-(.+)$/)
    if (!match) continue
    const hex = TOKEN_HEX[match[2]]
    if (!hex) throw new Error(`[og-art] classe sem token hex: ${cls}`)
    attrs[match[1]] = hex
  }
  return attrs
}

const DROPPED = new Set(['children', 'className', 'aria-hidden', 'focusable'])

/** Nome de prop React → atributo SVG (`strokeWidth` → `stroke-width`; viewBox fica). */
function attrName(prop: string): string {
  return prop === 'viewBox' ? prop : prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

function escape(value: unknown): string {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function serialize(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(serialize).join('')
  if (typeof node === 'string' || typeof node === 'number') return escape(node)
  if (!isValidElement(node)) throw new Error('[og-art] nó inesperado na arte')

  const props = node.props as Record<string, unknown>
  if (node.type === Fragment) return serialize(props.children as ReactNode)
  if (typeof node.type === 'function') {
    return serialize((node.type as (p: typeof props) => ReactNode)(props))
  }
  if (typeof node.type !== 'string') throw new Error('[og-art] tipo de elemento sem suporte')

  const attrs: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (DROPPED.has(key) || key.startsWith('data-') || value == null) continue
    attrs[attrName(key)] = value
  }
  // A classe vence o atributo de apresentação, como no CSS do site.
  Object.assign(attrs, paint(props.className))
  if (node.type === 'svg') attrs.xmlns = 'http://www.w3.org/2000/svg'

  const open = Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${escape(value)}"`)
    .join('')
  const children = serialize(props.children as ReactNode)
  return children ? `<${node.type}${open}>${children}</${node.type}>` : `<${node.type}${open}/>`
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/** SVG autônomo (hex do escuro) de qualquer componente de arte. */
export function artSvg<P extends object>(component: ComponentType<P>, props: P): string {
  return serialize(createElement(component, props))
}

/** Cena 360×280 como data URI. */
export function sceneDataUri(id: SceneId): string {
  return toDataUri(artSvg(SCENES[id], {}))
}

/**
 * Marca central 400×400 como data URI. No site a opacidade vem de
 * --mark-central-opacity (CSS); aqui ela vai no próprio SVG.
 */
export function markDataUri(variant: CentralVariant, opacity: number): string {
  const svg = artSvg(CentralMark, { variant }).replace('<svg ', `<svg opacity="${opacity}" `)
  return toDataUri(svg)
}
