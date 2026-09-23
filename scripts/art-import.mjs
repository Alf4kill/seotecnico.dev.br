#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Imports the art SVGs (scenes and emblems) as theme-aware React components.
//
//   node scripts/art-import.mjs <folder-with-svgs>
//
// The artwork is drawn with fixed hex colours, which cannot follow the theme.
// This script replaces every colour with a token class (fill-art-earth,
// stroke-foreground, …) through the explicit table below and FAILS on any
// colour that is not in it — a new hue must be given a token first, never
// passed through. Output: src/components/art/generated.tsx (committed; the
// source SVGs stay outside the repository, like the design boards).
//
// Element opacity (fill-opacity, opacity) is kept as drawn: it is part of the
// composition, and the colour behind it is what changes per theme.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'

/** Source hex → token name used in `fill-*` / `stroke-*` classes. */
export const COLOR_TOKENS = {
  '#0e1116': 'background', // the void the scene was drawn on
  '#e8eaed': 'foreground', // ink: stars, moon, emblem strokes
  '#7a7f86': 'art-line',
  '#3a444c': 'art-mass',
  '#5b3a22': 'art-earth',
  '#4a4128': 'art-olive',
  '#1c3b39': 'art-deep',
  '#3f9b7a': 'art-leaf',
  '#b8893c': 'art-brass',
  '#c4553b': 'art-signal',
}

/** File stem → component name, title (pt-BR / en) and kind. */
export const CATALOG = {
  'b1-feixe-perfurante': { name: 'BeamPiercing', pt: 'Feixe perfurante', en: 'Piercing beam' },
  'b2-abobada-rompida': { name: 'BrokenVault', pt: 'Abóbada rompida', en: 'Broken vault' },
  'b3-coluna-de-luz': { name: 'LightColumn', pt: 'Coluna de luz', en: 'Column of light' },
  'c1-luas-gemeas': { name: 'TwinMoons', pt: 'Luas gêmeas', en: 'Twin moons' },
  'c2-chegada-ao-vazio': { name: 'ArrivalAtVoid', pt: 'Chegada ao vazio', en: 'Arrival at the void' },
  'c3-vazio-vertical': { name: 'VerticalVoid', pt: 'Vazio vertical', en: 'Vertical void' },
  'd1-contemplacao': { name: 'Contemplation', pt: 'Contemplação', en: 'Contemplation' },
  'd2-a-unica': { name: 'TheOnlyOne', pt: 'A única', en: 'The only one' },
  'd3-janela': { name: 'Window', pt: 'Janela', en: 'Window' },
  'e1-olho-guardiao': { name: 'GuardianEye', pt: 'Olho guardião', en: 'Guardian eye' },
  'e2-a-vigilia': { name: 'Vigil', pt: 'A vigília', en: 'The vigil' },
  'e3-campo-de-lapides': { name: 'TombstoneField', pt: 'Campo de lápides', en: 'Field of tombstones' },
  'g3-escada': { name: 'Staircase', pt: 'Escada', en: 'Staircase' },
  'h1-dinamo': { name: 'Dynamo', pt: 'Dínamo', en: 'Dynamo' },
  'h2-circuito': { name: 'Circuit', pt: 'Circuito', en: 'Circuit' },
  'h3-laco-fechado': { name: 'ClosedLoop', pt: 'Laço fechado', en: 'Closed loop' },
}

const JSX_ATTR = {
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-opacity': 'strokeOpacity',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
}
const DROP = new Set(['xmlns', 'aria-hidden', 'focusable'])

function convertElement(tag, attrs, file) {
  const classes = []
  const props = []
  for (const [, key, value] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    if (DROP.has(key)) continue
    if ((key === 'fill' || key === 'stroke') && value !== 'none') {
      const token = COLOR_TOKENS[value.toLowerCase()]
      if (!token) throw new Error(`${file}: colour ${value} has no token in COLOR_TOKENS`)
      classes.push(`${key}-${token}`)
      continue
    }
    props.push(`${JSX_ATTR[key] ?? key}="${value}"`)
  }
  if (classes.length) props.push(`className="${classes.join(' ')}"`)
  return `<${tag} ${props.join(' ')} />`
}

function convert(file) {
  const svg = fs.readFileSync(file, 'utf8').trim()
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]
  if (!viewBox) throw new Error(`${file}: no viewBox`)
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  const body = []
  for (const [, tag, attrs] of inner.matchAll(/<(\w+)\s([^>]*?)\/?>(?:<\/\1>)?/g)) {
    if (!['rect', 'line', 'circle', 'ellipse', 'path', 'polygon', 'polyline'].includes(tag)) {
      throw new Error(`${file}: unsupported element <${tag}>`)
    }
    body.push(convertElement(tag, attrs, file))
  }
  return { viewBox, body }
}

function main() {
  const dir = process.argv[2]
  if (!dir) throw new Error('usage: node scripts/art-import.mjs <folder-with-svgs>')
  const files = fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.svg'))
    .map((f) => path.join(dir, f))

  const out = []
  const seen = new Set()
  for (const file of files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)))) {
    const stem = path.basename(file, '.svg')
    const entry = CATALOG[stem]
    if (!entry) throw new Error(`${stem}: not in CATALOG — give it a name and titles first`)
    seen.add(stem)
    const { viewBox, body } = convert(file)
    out.push(
      `/** ${entry.pt} — ${stem}.svg */\n` +
        `export function ${entry.name}({ className }: ArtProps) {\n` +
        `  return (\n` +
        `    <svg viewBox="${viewBox}" aria-hidden="true" focusable="false" className={className}>\n` +
        body.map((line) => `      ${line}\n`).join('') +
        `    </svg>\n` +
        `  )\n` +
        `}\n`
    )
  }
  const missing = Object.keys(CATALOG).filter((stem) => !seen.has(stem))
  if (missing.length) throw new Error(`missing SVGs: ${missing.join(', ')}`)

  const header =
    `// GENERATED by scripts/art-import.mjs — do not edit by hand; re-run the script.\n` +
    `// Every colour is a token class: the art follows the theme (globals.css).\n\n` +
    `export interface ArtProps {\n  className?: string\n}\n\n`
  const target = path.join('src', 'components', 'art', 'generated.tsx')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, header + out.join('\n'))
  console.log(`wrote ${target}: ${out.length} components`)
}

main()
