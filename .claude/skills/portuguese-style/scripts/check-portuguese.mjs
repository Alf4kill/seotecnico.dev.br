#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-portuguese.mjs — flags, in a Portuguese page, the patterns the style
// guide (references/estilo-ptbr.md) asks to remove, and measures the page's
// register against native technical Portuguese.
//
// Step 3 of docs/proposals/portuguese-style.md. It never edits a file, and a
// clean run does not mean the Portuguese is good: it means no known pattern
// is left and the structure sits near native prose. The reading pass of the
// portuguese-style skill finds what a pattern cannot.
//
// Two layers, as in english-version/scripts/check-english.mjs:
//   - patterns: lexical rules over the frontmatter strings and the body lines,
//     outside code, URLs, markup and quoted text (a quote keeps its words);
//   - register: the features of register-pt.mjs against the native band in
//     register-thresholds-pt.json
//     (docs/research/2026-11-11-portuguese-register-profile.md).
//
// Usage (from the repository root):
//   node .claude/skills/portuguese-style/scripts/check-portuguese.mjs <file.mdx>…
//   node .claude/skills/portuguese-style/scripts/check-portuguese.mjs --published
//
//   --published   every Portuguese page (content/blog, content/guia,
//                 content/projeto): the regression test for this script
//                 (expected: 0 errors)
//   --summary     after the per-file report, the count of each rule over all
//                 files (the before/after figure of a revision) and the pages
//                 ranked by distance from the native band (the order to
//                 revise them in), with every register value
//   --quiet       print only files with findings
//
// ERROR: chatbot residue, curly quotes, a page whose lang is not pt-BR. These
// have one right answer.
// WARN: every other pattern, and every register feature outside the native
// band. Each is a question for the reviser; a WARN that survives the reading
// pass is fine, and goes unexplained. The band is never an error (proposal
// §4.1): natives vary, and one native page is past every site page on
// semicolons.
// Exit code 1 when any ERROR is found.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { FEATURES, fromMdx, profile } from './register-pt.mjs'

const ROOT = process.cwd()
const BAND = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'register-thresholds-pt.json'), 'utf8'))

// Words: \p{L} with lookarounds, since \b does not know accented letters.
const W = (s) => `(?<![\\p{L}\\d])(?:${s})(?![\\p{L}\\d])`
const rx = (s, flags = 'giu') => new RegExp(W(s), flags)

// Chatbot residue: text addressed to the person who asked for the page.
const RESIDUE = [
  'espero que (isso|isto|este (artigo|texto|post|guia|conteúdo)) (ajude|tenha ajudado|seja útil)',
  'como (um )?modelo de linguagem',
  'claro[!,] aqui (está|estão|vai|vão)',
  '(ótima|excelente) pergunta',
  'posso ajudar (em|com) mais alguma coisa',
]

// The patterns of references/estilo-ptbr.md §5 and §1, in that order. A WARN
// asks the reviser to look; the guide says when the sentence may stay.
const RULES = [
  { id: 'filler', re: rx('além disso|vale (ressaltar|destacar|lembrar|notar|mencionar)|é importante (destacar|ressaltar|notar|lembrar|mencionar|frisar)|em suma|em resumo|no cenário atual|nos dias de hoje|neste artigo,? (vamos|você vai)'),
    hint: 'filler connective (§5.1): start with what is worth noting' },
  { id: 'inflated', re: rx('crucia(l|is)|fundamenta(l|is)|essencia(l|is)|revolucionári[oa]s?|robust[oa]s?|poderos[oa]s?|incríve(l|is)'),
    hint: 'inflated adjective (§5.1): the measured fact, or nothing' },
  // "elemento", "momento", "documento"… end in -mento without being a verb
  // turned noun: "promover um elemento a LCP" is the real verb.
  { id: 'support-verb', re: rx('(realiz|efetu|promov|proced)\\p{L}* (a|o|uma|um|à|ao) (?!(ele|mo|docu|seg|argu|instru|departa|aparta|comporta)mentos?(?![\\p{L}]))\\p{L}+(ção|ções|mento|mentos|agem)'),
    hint: 'support verb (§2): use the real verb ("realizar a medição" → "medir")' },
  { id: 'vague-attribution', re: rx('(muitos|vários) especialistas|especialistas (afirmam|dizem|apontam|concordam)|estudos (mostram|indicam|apontam|comprovam)|pesquisas (mostram|indicam|apontam)|segundo especialistas'),
    hint: 'vague attribution (§5.1): the source, by name, with its date' },
  { id: 'calque', re: rx('endereç\\p{L}* (o|os|a|as|esse|este|um) (problema|questão|questões|ponto)|jog\\p{L}* um papel|mergulh\\p{L}* fundo|isso dito|no final do dia'),
    hint: 'calque from English (§5.1): "resolver", "ter um papel", "detalhar"' },
  { id: 'generalization', re: rx('(quase )?todo mundo (erra|esquece|usa|faz|acha|sabe|ignora)|ninguém (verifica|confere|testa|lembra|sabe|olha)|a maioria (dos devs|dos desenvolvedores|das pessoas) (erra|esquece|ignora|não)'),
    hint: 'generalization about people (§5.2): what the evidence shows' },
  // ", mas" is left out: "não é obrigatório, mas ajuda" is ordinary Portuguese.
  { id: 'empty-contrast', re: rx('não (é|está|se trata de) [^.,;:!?\\n]{1,40}, (é|está)'),
    hint: '"não é X, é Y" (§5.2): keep only when X is a belief the page refutes with evidence' },
  { id: 'hedge-filler', re: rx('basicamente|simplesmente|na verdade'),
    hint: 'hedge added to sound natural (§5.2): delete, unless it carries meaning' },
  { id: 'impersonal', re: rx('é possível|deve-se|pode-se|recomenda-se|faz-se necessário'),
    hint: 'impersonal frame (§1): say who does it, or address the reader' },
  // "nós" alone is left out: on this site it is mostly the plural of "nó"
  // (accessibility-tree and network nodes), 5 of 6 hits on the first run.
  { id: 'we', re: rx('recomendamos|vamos (ver|entender|explorar|analisar|começar|lá)|nosso|nossa|nossos|nossas'),
    hint: 'one author, not an organization (§1): "eu", "você", or the system as subject' },
]

// Mechanics (estilo-ptbr.md §4). Run on prose paragraphs only: tables, lists,
// code and source lists have their own forms.
const MECHANICS = [
  // Three digits after the point is a thousands separator ("1.280 ms").
  { id: 'decimal-point', re: /(?<![\d.])\d+\.(?:\d{1,2}|\d{4,})\s?(ms|s|%|KB|kB|MB|GB|px)(?![\p{L}])/gu,
    hint: 'decimal comma in Portuguese prose: "4,9 s"' },
  // The whole number, thousands groups included ("1.280ms"); seconds only
  // with a decimal comma ("4,9s"), so a decade like "anos 90s" never fires.
  { id: 'unit-space', re: /(?<![\p{L}\d.,])(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?(?:ms|KB|kB|MB|GB)|\d+,\d+s)(?![\p{L}])/gu,
    hint: 'a space between number and unit: "80 ms"' },
  { id: 'percent-space', re: /(?<![\d,])\d+(?:,\d+)?\s%/g,
    hint: 'no space before %: "25%"' },
  { id: 'range-hyphen', re: /(?<![\d-])\d+(?:,\d+)?-\d+(?:,\d+)?\s?(ms|s|%|KB|kB|MB|px|dias|semanas|meses|palavras|páginas|URLs)(?![\p{L}])/gu,
    hint: 'ranges take an en dash: "80–148 ms"' },
]

if (!fs.existsSync(path.join(ROOT, 'src', 'lib', 'content.ts'))) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

/** Body lines with fenced code blanked, so line numbers survive. */
function proseLines(body) {
  let inFence = false
  let inSvg = false
  return body.split(/\r?\n/).map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return '' }
    if (inFence) return ''
    if (/<svg\b/.test(line)) inSvg = true
    if (inSvg) { if (/<\/svg>/.test(line)) inSvg = false; return '' }
    return line
      .replace(/`[^`\n]*`/g, ' ')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\{\/\*.*?\*\/\}/g, ' ')
      .replace(/[\w:-]+=(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, ' ')
      .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
  })
}

/** Text with quoted spans removed: a quote keeps its own words. */
const unquoted = (s) => s.replace(/“[^”]*”/g, ' ').replace(/"[^"\n]*"/g, ' ').replace(/^\s*>.*$/, ' ')

function frontmatterTexts(data) {
  const out = []
  for (const key of ['title', 'description', 'tldr']) if (typeof data[key] === 'string') out.push([`frontmatter.${key}`, data[key]])
  for (const [i, item] of (Array.isArray(data.faq) ? data.faq : []).entries()) {
    if (item?.question) out.push([`faq[${i}].question`, String(item.question)])
    if (item?.answer) out.push([`faq[${i}].answer`, String(item.answer)])
  }
  return out
}

const outsideBand = (f, value) => {
  const b = BAND.features[f.id]
  if (!b || f.dir === 'info' || !Number.isFinite(value)) return null
  if (f.dir !== 'low' && value > b.p90) return 'above p90'
  if (f.dir !== 'high' && value < b.p10) return 'below p10'
  return null
}

function checkFile(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const errors = []
  const warns = []
  const counts = {}
  const hit = (id) => (counts[id] = (counts[id] || 0) + 1)

  // Units of text with a location: frontmatter strings, then body lines.
  const units = frontmatterTexts(data)
  const bodyStart = raw.split(/\r?\n/).length - content.split(/\r?\n/).length
  const lines = proseLines(content)
  lines.forEach((line, i) => line.trim() && units.push([`line ${bodyStart + i + 1}`, line]))

  for (const [where, text] of units) {
    if (/[“”]/.test(text)) {
      hit('curly-quotes')
      errors.push(`${where}: curly quotes — straight double quotes (estilo-ptbr.md §3)`)
    }
    const plain = unquoted(text)
    for (const r of RESIDUE) {
      for (const m of plain.matchAll(rx(r))) {
        hit('chatbot-residue')
        errors.push(`${where}: chatbot residue "${m[0]}" — delete (§5.1)`)
      }
    }
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      for (const m of plain.matchAll(rule.re)) {
        hit(rule.id)
        warns.push(`${where}: [${rule.id}] "${m[0].trim()}" — ${rule.hint}`)
      }
    }
  }

  // Paragraph-level rules on running prose (lists, tables, headings, quotes
  // and markup use colons and dates as labels, which is Portuguese too).
  let inFence = false
  const paraLines = content.split(/\r?\n/).map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return '' }
    return inFence ? '' : l
  })
  let start = 0
  const blocks = []
  paraLines.forEach((l, i) => {
    if (!l.trim()) { start = i + 1; return }
    if (i === start) blocks.push({ line: bodyStart + i + 1, text: l, lines: [l] })
    else { blocks[blocks.length - 1].text += `\n${l}`; blocks[blocks.length - 1].lines.push(l) }
  })
  // The line of a hit inside a paragraph: the first line holding it, or the
  // first of two lines it spans; the paragraph's start if neither does.
  const lineOf = ({ line, lines }, needle) => {
    const n = needle.replace(/\s+/g, ' ').trim()
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].replace(/\s+/g, ' ').includes(n)) return line + j
      if (j + 1 < lines.length && `${lines[j]} ${lines[j + 1]}`.replace(/\s+/g, ' ').includes(n)) return line + j
    }
    return line
  }
  for (const block of blocks) {
    const { line, text } = block
    const t = text.trim()
    if (/^([|#<>*→{-]|\d+\.\s|import |export )/.test(t)) continue
    const flat = unquoted(t.replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ')).replace(/\s+/g, ' ')
    const colons = (flat.match(/:\s/g) || []).length
    if (colons >= 3) {
      hit('colon-chain')
      warns.push(`line ${line}: [colon-chain] ${colons} colons in "${flat.slice(0, 60)}…" — a colon only to introduce a list, table, code or one explanation (§3)`)
    }
    // Dates: "25 de setembro de 2026" in a sentence; DD/MM/AAAA only inside
    // parentheses; ISO only in tables, logs and code.
    const outsideParens = flat.replace(/\([^)]*\)/g, ' ')
    for (const m of outsideParens.matchAll(/(?<![\d/-])(\d{1,2}\/\d{1,2}\/\d{4}|20\d\d-\d\d-\d\d)(?![\d/-])/g)) {
      hit('date-form')
      warns.push(`line ${lineOf(block, m[1])}: [date-form] "${m[1]}" in a sentence — "25 de setembro de 2026"; DD/MM/AAAA inside parentheses (§4)`)
    }
    for (const rule of MECHANICS) {
      rule.re.lastIndex = 0
      for (const m of flat.matchAll(rule.re)) {
        hit(rule.id)
        warns.push(`line ${lineOf(block, m[0])}: [${rule.id}] "${m[0]}" — ${rule.hint}`)
      }
    }
  }

  // Register profile against the native band.
  const { paragraphs, structure } = fromMdx(content)
  const prof = profile(paragraphs, structure)
  const register = { prof, outside: 0 }
  if (prof) {
    for (const f of FEATURES) {
      const side = outsideBand(f, prof[f.id])
      if (!side) continue
      const b = BAND.features[f.id]
      register.outside++
      hit(`register-${f.id}`)
      warns.push(`[register-${f.id}] ${f.label} ${prof[f.id].toFixed(1)}, ${side} (native p10 ${b.p10}, median ${b.p50}, p90 ${b.p90}) — ${f.hint}`)
    }
  } else {
    warns.push('[register] too little running prose to profile (under 300 words or 15 sentences)')
  }

  if (data.lang && data.lang !== 'pt-BR') {
    hit('lang')
    errors.push(`lang is "${data.lang}": this script checks Portuguese pages`)
  }

  return { errors, warns, counts, register }
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const files = args.includes('--published')
  ? ['blog', 'guia', 'projeto'].flatMap((d) => {
      const dir = path.join(ROOT, 'content', d)
      return fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => path.join('content', d, f))
        : []
    })
  : args.filter((a) => !a.startsWith('--'))

if (!files.length) {
  console.error('usage: check-portuguese.mjs <file.mdx>… [--summary] [--quiet] | --published [--summary]')
  process.exit(2)
}

let failed = 0
const totals = {}
const ranking = []
for (const file of files) {
  const { errors, warns, counts, register } = checkFile(path.resolve(ROOT, file))
  for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v
  ranking.push({ file, ...register })
  if (errors.length) failed++
  if (args.includes('--quiet') && !errors.length && !warns.length) continue
  console.log(`${errors.length ? 'FAIL' : warns.length ? 'WARN' : 'OK  '}  ${file}`)
  for (const e of errors) console.log(`  ERROR ${e}`)
  for (const w of warns) console.log(`  WARN  ${w}`)
}
if (args.includes('--summary')) {
  console.log('\nrule totals:')
  for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(26)} ${v}`)

  // Revision order: most features outside the band first, then the colon
  // density (the feature furthest from native across the site).
  console.log(`\nregister, furthest from native first (band measured ${BAND.measured} at ${BAND.commit}, ${BAND.corpus.pages} native pages):`)
  const ids = FEATURES.map((f) => f.id)
  console.log(`  ${'out'.padStart(3)} ${ids.map((i) => i.slice(0, 10).padStart(11)).join('')}  file`)
  ranking.sort((a, b) => b.outside - a.outside || (b.prof?.colons ?? 0) - (a.prof?.colons ?? 0))
  for (const r of ranking) {
    const cols = ids.map((i) => (r.prof && Number.isFinite(r.prof[i]) ? r.prof[i].toFixed(1) : '—').padStart(11)).join('')
    console.log(`  ${String(r.outside).padStart(3)} ${cols}  ${r.file}`)
  }
  console.log(`  ${'p50'.padStart(3)} ${ids.map((i) => String(BAND.features[i]?.p50 ?? '—').padStart(11)).join('')}  native median`)
  console.log(`  ${'p90'.padStart(3)} ${ids.map((i) => String(BAND.features[i]?.p90 ?? '—').padStart(11)).join('')}  native p90`)
}
if (files.length > 1) console.log(`\n${files.length} files checked, ${failed} with errors`)
process.exit(failed ? 1 : 0)
