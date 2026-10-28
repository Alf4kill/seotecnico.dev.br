#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// placeholders.mjs — moves the verbatim parts of a page out of the writer's
// way and back in, byte for byte.
//
// The English draft is written from a fact sheet by a writer who never sees
// the Portuguese prose (SKILL.md, step 2). Code blocks and figures are not
// prose: they go to the writer as placeholders ([CODE-1], [FIGURE-1]) and
// come back from the source file untouched. Copying them by hand through a
// tool call is how `<` turned into `<` on 2026-10-27; this script never
// lets the text pass through a prompt.
//
// Usage (from the repository root):
//   node .claude/skills/english-version/scripts/placeholders.mjs extract <source.mdx> <out-dir>
//   node .claude/skills/english-version/scripts/placeholders.mjs assemble <draft.mdx> <out-dir> <target.mdx>
//   node .claude/skills/english-version/scripts/placeholders.mjs compare <old.mdx> <new.mdx>
//
// extract   writes <out-dir>/verbatim.json and prints one line per block
//           (placeholder, kind, first line), in page order. Source: the
//           published English page when revising (its figures already carry
//           English labels), the Portuguese page for a new one (translate the
//           figure's <text>, aria-label and caption after assembling).
// assemble  replaces each placeholder line of the draft with its block,
//           wraps prose at 78 columns (never inside inline code), keeps the
//           target's line endings and writes <target.mdx>. Fails if a
//           placeholder is missing, repeated or unknown.
// compare   lists inline code, link targets and numbers of the old file that
//           the new one lacks (and the ones it adds): the mechanical half of
//           the fidelity check.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'

const [cmd, ...args] = process.argv.slice(2)
const lf = (s) => s.replace(/\r\n/g, '\n')

/** Fenced code blocks and top-level <figure>…</figure> blocks, in order. */
function blocks(body) {
  const lines = body.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      const fence = lines[i].trim().slice(0, 3)
      let j = i + 1
      while (j < lines.length && !lines[j].trim().startsWith(fence)) j++
      out.push({ kind: 'CODE', start: i, end: j })
      i = j
    } else if (/^<figure\b/.test(lines[i])) {
      let j = i
      while (j < lines.length && !/^<\/figure>/.test(lines[j])) j++
      out.push({ kind: 'FIGURE', start: i, end: j })
      i = j
    }
  }
  const n = { CODE: 0, FIGURE: 0 }
  return out.map((b) => ({ ...b, id: `${b.kind}-${++n[b.kind]}`, text: lines.slice(b.start, b.end + 1).join('\n') }))
}

function wrap(line, width = 78) {
  const words = []
  let cur = ''
  let tick = false
  for (const ch of line) {
    if (ch === '`') tick = !tick
    if (ch === ' ' && !tick) { words.push(cur); cur = '' } else cur += ch
  }
  words.push(cur)
  const out = []
  let l = ''
  for (const w of words) {
    if (l && `${l} ${w}`.length > width) { out.push(l); l = w } else l = l ? `${l} ${w}` : w
  }
  out.push(l)
  return out.join('\n')
}

if (cmd === 'extract' && args.length === 2) {
  const [source, dir] = args
  const body = lf(fs.readFileSync(source, 'utf8'))
  const found = blocks(body)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'verbatim.json'), JSON.stringify(Object.fromEntries(found.map((b) => [b.id, b.text])), null, 2) + '\n')
  for (const b of found) console.log(`[${b.id}]  ${b.text.split('\n')[b.kind === 'CODE' ? 1 : 0]?.slice(0, 90) ?? ''}`)
  console.log(`\n${found.length} blocks → ${path.join(dir, 'verbatim.json')}`)
} else if (cmd === 'assemble' && args.length === 3) {
  const [draft, dir, target] = args
  const verbatim = JSON.parse(fs.readFileSync(path.join(dir, 'verbatim.json'), 'utf8'))
  const text = lf(fs.readFileSync(draft, 'utf8'))
  const m = text.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/)
  if (!m) { console.error('draft has no frontmatter'); process.exit(1) }
  const used = new Map()
  const errors = []
  let inFence = false
  const body = m[2].split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line }
    const ph = !inFence && line.trim().match(/^\[((?:CODE|FIGURE)-\d+)\]$/)
    if (ph) {
      const id = ph[1]
      if (!(id in verbatim)) errors.push(`unknown placeholder [${id}]`)
      used.set(id, (used.get(id) || 0) + 1)
      return `\u0000${id}\u0000`
    }
    if (inFence || line.length <= 78 || /^([|#>]|\s|- |\* |\d+\. |<|This is the English version)/.test(line)) return line
    return wrap(line)
  }).join('\n')
  for (const id of Object.keys(verbatim)) {
    if (!used.has(id)) errors.push(`[${id}] not placed in the draft`)
    else if (used.get(id) > 1) errors.push(`[${id}] placed ${used.get(id)} times`)
  }
  if (inFence) errors.push('unclosed code fence in the draft')
  if (errors.length) { for (const e of errors) console.error(`ERROR ${e}`); process.exit(1) }
  const out = m[1] + body.replace(/\u0000((?:CODE|FIGURE)-\d+)\u0000/g, (_, id) => verbatim[id])
  const crlf = fs.existsSync(target) && fs.readFileSync(target, 'utf8').includes('\r\n')
  fs.writeFileSync(target, crlf ? out.replace(/\n/g, '\r\n') : out)
  console.log(`assembled ${Object.keys(verbatim).length} blocks → ${target}`)
} else if (cmd === 'compare' && args.length === 2) {
  // What a rewrite must not lose: inline code, link targets and numbers. The
  // old file is the published English (or the Portuguese, for numbers and
  // link targets of a new page). A missing item is a question for the
  // fidelity check, not always an error: a number written as a word, a link
  // moved to another sentence.
  const [oldFile, newFile] = args
  const items = (file) => {
    const raw = lf(fs.readFileSync(file, 'utf8'))
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^\s*(```|~~~)[\s\S]*?^\s*\1.*$/gm, '').replace(/^<figure\b[\s\S]*?^<\/figure>/gm, '')
    const flat = body.replace(/\n(?!\n)/g, ' ')
    return {
      'inline code': flat.match(/`[^`\n]+`/g) || [],
      'link target': [...flat.matchAll(/\]\(([^)\s]+)\)/g)].map((x) => x[1].replace(/^\/(?!en\/)/, '/en/').replace(/#.*$/, '')),
      number: (flat.replace(/`[^`]*`|\]\([^)]*\)/g, ' ').match(/\d[\d,.]*\d|\d/g) || []).map((n) => n.replace(/,/g, '')),
    }
  }
  const a = items(oldFile)
  const b = items(newFile)
  let missing = 0
  for (const kind of Object.keys(a)) {
    const left = [...b[kind]]
    for (const x of a[kind]) {
      const i = left.indexOf(x)
      if (i >= 0) left.splice(i, 1)
      else { missing++; console.log(`missing ${kind}: ${x}`) }
    }
    for (const x of left) console.log(`new ${kind}: ${x}`)
  }
  console.log(missing ? `\n${missing} item(s) of the old file not found in the new one` : '\nnothing missing')
} else {
  console.error('usage: placeholders.mjs extract <source.mdx> <out-dir> | assemble <draft.mdx> <out-dir> <target.mdx> | compare <old.mdx> <new.mdx>')
  process.exit(2)
}
