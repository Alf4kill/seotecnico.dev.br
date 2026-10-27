#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-english.mjs — flags the marks of a Portuguese text read in English.
//
// The English pages of this site were written from the Portuguese ones, and a
// feedback the owner received (October 2026) was that they read like a
// translation. The
// revision of 2026-10-27 catalogued the patterns behind that effect
// (references/calques.md); this script finds the ones a pattern can find, so
// the native-reader pass is spent on the ones it cannot. It never edits a
// file, and a clean run does not mean the English is good: it means none of
// the known calques is left.
//
// Usage (from the repository root):
//   node .claude/skills/english-version/scripts/check-english.mjs <file.mdx>…
//   node .claude/skills/english-version/scripts/check-english.mjs --published
//
//   --published   every English page in content/en (blog, guide, case
//                 studies, project): the regression test for this script
//                 (expected: 0 errors)
//   --summary     after the per-file report, the count of each rule over all
//                 files (the before/after figure of a revision)
//   --quiet       print only files with findings
//
// ERROR: British spelling, a day-month date, the translation note not on the
// last line. These have one right answer under the style guide.
// WARN: a calque or register pattern. Each is a question for the reviser; a
// WARN that survives the native pass is fine, and goes unexplained.
// Exit code 1 when any ERROR is found.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const NOTE_MARK = 'first published in Portuguese'
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
const PT_MONTHS = 'janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro'

// British → American. Matched as whole words, case-insensitive, outside code,
// URLs and quoted text (a verbatim quote keeps its spelling).
const BRITISH = {
  behaviour: 'behavior', behaviours: 'behaviors', colour: 'color', colours: 'colors',
  favour: 'favor', honour: 'honor', labour: 'labor', neighbour: 'neighbor',
  analyse: 'analyze', analysed: 'analyzed', analysing: 'analyzing',
  organise: 'organize', organised: 'organized', organisation: 'organization',
  optimise: 'optimize', optimised: 'optimized', optimisation: 'optimization',
  prioritise: 'prioritize', prioritised: 'prioritized', recognise: 'recognize',
  recognised: 'recognized', realise: 'realize', realised: 'realized',
  summarise: 'summarize', summarised: 'summarized', generalise: 'generalize',
  generalises: 'generalizes', normalise: 'normalize', normalised: 'normalized',
  serialise: 'serialize', serialised: 'serialized', tokenise: 'tokenize',
  tokenised: 'tokenized', minimise: 'minimize', maximise: 'maximize',
  customise: 'customize', initialise: 'initialize', categorise: 'categorize',
  utilise: 'use', catalogue: 'catalog', catalogues: 'catalogs', centre: 'center',
  defence: 'defense', licence: 'license', modelling: 'modeling',
  labelled: 'labeled', labelling: 'labeling', travelled: 'traveled',
  cancelled: 'canceled', programme: 'program', artefact: 'artifact',
  artefacts: 'artifacts', whilst: 'while', amongst: 'among', judgement: 'judgment',
}

// Calques and register patterns: the catalogue of references/calques.md, in
// the same order. Each pattern was a real hit in the 2026-10-27 revision.
const CALQUES = [
  { id: 'worth', re: /\bit is worth\b|\bit's worth (noting|mentioning|remembering)\b/gi,
    hint: '"vale a pena / vale lembrar": say the thing, or "it pays to…"' },
  { id: 'in-words', re: /(^|\n)\s*In words\b/g,
    hint: '"Em palavras" (the diagram\'s text mirror): "In short," or no label' },
  { id: 'mirror', re: /\b(the )?diagram'?s mirror\b|\bmirror of the diagram\b/gi,
    hint: '"espelho do diagrama": "the same steps as a table" / "in text"' },
  { id: 'that-is-why', re: /\bThat is why\b|\bThis is why\b/g,
    hint: '"Por isso": "That\'s why", "So", or join the sentences' },
  { id: 'with-this', re: /(^|[.!?]\s+)(With this|With that|Besides that|Beyond that|In this sense),/g,
    hint: '"Com isso / Além disso / Nesse sentido": "So,", "That way,", "Also,"' },
  { id: 'reading-noun', re: /\b(a|one|each|every|the|two|three|four|five|ten|\d+)\s+(controlled\s+|real\s+|later\s+)?readings?\b(?!\s+(list|order|level|time))/gi,
    hint: '"leitura" (an assistant opening a page): "fetch", "visit", "pass"' },
  { id: 'note-of', re: /\bNote of (\d|January|February|March|April|May|June|July|August|September|October|November|December)/g,
    hint: '"Nota de 25 de setembro": "Update, September 25:" / "Note (September 25):"' },
  { id: 'make-test', re: /\b(make|makes|made|making) (a|the|one|this|that) (test|measurement|audit|crawl|deploy)\b(?!\s+(reliable|possible|valid|harder|easier|fail|pass|work|useful|more|less))/gi,
    hint: '"fazer um teste": "run a test", "take a measurement", "run an audit"' },
  { id: 'realize-do', re: /\brealiz(e|es|ed|ing) (a|an|the) (test|measurement|audit|experiment|analysis|crawl)\b/gi,
    hint: 'false friend "realizar" = carry out: "run", "carry out"' },
  { id: 'it-is-possible', re: /\bIt is (possible|important|necessary) to\b/g,
    hint: '"É possível / importante / necessário": "You can", "You need to", or the verb'  },
  { id: 'in-the-case-of', re: /\b[Ii]n the case of\b/g,
    hint: '"No caso de": "For", "With", "If"' },
  { id: 'the-same-pronoun', re: /\b(of|in|to|with|on|from) the same(?=[.,;:)])/gi,
    hint: '"o mesmo" as a pronoun: "it", "them", "that one"' },
  { id: 'false-friend', re: /\b(eventually|pretends?|pretended|punctual|punctually)\b/gi,
    hint: 'check the sense: eventualmente = possibly, pretender = intend, pontual = one-off' },
  { id: 'defect', re: /\bdefects?\b/gi,
    hint: '"defeito" in software: "bug", "flaw", "problem"' },
  { id: 'colon-chain', paragraph: true,
    hint: '3+ colons in one paragraph: Portuguese chains clauses with ":"; English uses a period, "so" or a dash' },
]

if (!fs.existsSync(path.join(ROOT, 'src', 'lib', 'content.ts'))) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

/** Body lines with fenced code blanked, so line numbers survive. */
function proseLines(body) {
  let inFence = false
  return body.split(/\r?\n/).map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return ''
    }
    if (inFence) return ''
    return line
      .replace(/`[^`\n]*`/g, ' ')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\w:-]+=(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, ' ')
      .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
  })
}

/** Text with quoted spans removed: verbatim quotes keep their own spelling. */
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
  proseLines(content).forEach((line, i) => line.trim() && units.push([`line ${bodyStart + i + 1}`, line]))

  for (const [where, text] of units) {
    const plain = unquoted(text)
    for (const word of plain.match(/\b[A-Za-z]+\b/g) || []) {
      const us = BRITISH[word.toLowerCase()]
      if (us) {
        hit('british')
        errors.push(`${where}: British spelling "${word}" → "${us}" (style guide: American English)`)
      }
    }
    const dm = plain.match(new RegExp(`\\b\\d{1,2}(st|nd|rd|th)? (${MONTHS}),? \\d{4}\\b`, 'g'))
    for (const d of dm || []) {
      hit('day-month-date')
      errors.push(`${where}: day-month date "${d}" → "Month D, YYYY" in prose, ISO in tables and sources`)
    }
    const pt = plain.match(new RegExp(`\\b\\d{1,2} de (${PT_MONTHS})\\b|\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b`, 'gi'))
    for (const d of pt || []) {
      hit('pt-date')
      errors.push(`${where}: Portuguese date format "${d}"`)
    }
    for (const rule of CALQUES) {
      if (rule.paragraph) continue
      rule.re.lastIndex = 0
      for (const m of plain.matchAll(rule.re)) {
        hit(rule.id)
        warns.push(`${where}: [${rule.id}] "${m[0].trim()}" — ${rule.hint}`)
      }
    }
  }

  // Colon chains are a paragraph property, not a line property. Only running
  // prose counts: lists, tables, quotes, headings and markup (SVG labels)
  // use colons as labels, which is English too.
  const fenceless = (() => {
    let inFence = false
    return content.split(/\r?\n/).map((l) => {
      if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return '' }
      return inFence ? '' : l
    }).join('\n')
  })()
  for (const p of fenceless.split(/\n\s*\n/)) {
    const text = p.trim()
    if (!text || /^([|#<>*→-]|\d+\.)/.test(text)) continue
    const flat = text.replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ')
    const colons = (flat.match(/:\s/g) || []).length
    if (colons >= 3) {
      hit('colon-chain')
      warns.push(`[colon-chain] ${colons} colons in "${flat.slice(0, 60).replace(/\s+/g, ' ')}…" — ${CALQUES.at(-1).hint}`)
    }
  }

  // Register: a page with no contractions at all, and many uncontracted
  // forms, reads like a translation even when each sentence is correct.
  const body = proseLines(content).join(' ')
  const uncontracted = (body.match(/\b(does not|do not|did not|is not|are not|was not|were not|cannot|could not|would not|should not|has not|have not)\b/gi) || []).length
  const contracted = (body.match(/\b\w+n['’]t\b/gi) || []).length
  if (uncontracted >= 12 && contracted === 0) {
    hit('no-contractions')
    warns.push(`[no-contractions] ${uncontracted} uncontracted negatives and no contractions: the style guide uses contractions in explanatory prose`)
  }

  // The translation note closes the page (references/structure.md).
  const lines = content.trimEnd().split(/\r?\n/)
  const noteAt = lines.findIndex((l) => l.includes(NOTE_MARK))
  if (noteAt >= 0 && noteAt !== lines.length - 1) {
    hit('note-not-last')
    errors.push(`translation note on body line ${noteAt + 1} of ${lines.length}: it must be the last line`)
  }
  if (data.lang && data.lang !== 'en') errors.push(`lang is "${data.lang}": this script checks English pages`)

  return { errors, warns, counts }
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const files = args.includes('--published')
  ? ['blog', 'guide', 'case-studies', 'project'].flatMap((d) => {
      const dir = path.join(ROOT, 'content', 'en', d)
      return fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => path.join('content', 'en', d, f))
        : []
    })
  : args.filter((a) => !a.startsWith('--'))

if (!files.length) {
  console.error('usage: check-english.mjs <file.mdx>… [--summary] [--quiet] | --published [--summary]')
  process.exit(2)
}

let failed = 0
const totals = {}
for (const file of files) {
  const { errors, warns, counts } = checkFile(path.resolve(ROOT, file))
  for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v
  if (args.includes('--quiet') && !errors.length && !warns.length) continue
  console.log(`${errors.length ? 'FAIL' : warns.length ? 'WARN' : 'OK  '}  ${file}`)
  for (const e of errors) console.log(`  ERROR ${e}`)
  for (const w of warns) console.log(`  WARN  ${w}`)
  if (errors.length) failed++
}
if (args.includes('--summary')) {
  console.log('\nrule totals:')
  for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${v}`)
}
if (files.length > 1) console.log(`\n${files.length} files checked, ${failed} with errors`)
process.exit(failed ? 1 : 0)
