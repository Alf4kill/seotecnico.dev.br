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
// Calques are words; translation also survives as structure. Since the
// register calibration of 2026-10-27
// (docs/research/2026-10-27-english-register-profile.md) each page is also
// compared with native technical English on the features of register.mjs
// ("the" density, sentences opening with "The", colons, semicolons, "you"),
// against the thresholds in register-thresholds.json.
//
// Usage (from the repository root):
//   node .claude/skills/english-version/scripts/check-english.mjs <file.mdx>…
//   node .claude/skills/english-version/scripts/check-english.mjs --published
//
//   --published   every English page in content/en (blog, guide, case
//                 studies, project): the regression test for this script
//                 (expected: 0 errors)
//   --summary     after the per-file report, the count of each rule over all
//                 files (the before/after figure of a revision) and the pages
//                 ranked by distance from the native register (the order to
//                 revise them in)
//   --quiet       print only files with findings
//
// ERROR: British spelling, a day-month date, the translation note not on the
// last line. These have one right answer under the style guide.
// WARN: a calque, a register pattern or a register feature past its native
// threshold. Each is a question for the reviser; a WARN that survives the
// native pass is fine, and goes unexplained. On a hand-checked sample of
// paragraphs past the "the" threshold, about 4 in 10 were fine as they stood.
// Exit code 1 when any ERROR is found.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { FEATURES, PARAGRAPH_MIN_WORDS, mdxParagraphs, profile, theDensity, wordsOf } from './register.mjs'

const ROOT = process.cwd()
const THRESHOLDS = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'register-thresholds.json'), 'utf8'))
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
  // Article patterns (references/calques.md, "Structural interference").
  // Many of these "the" are required; the fix is a new sentence, never a
  // deleted article.
  { id: 'the-coord', re: /\bthe [\w-]+ and the [\w-]+/gi,
    hint: '"as fontes e o código": one article for the pair ("the sources and code"), or none'  },
  { id: 'the-genitive', re: /\bthe [\w-]+ (of|in) the [\w-]+/gi,
    hint: '"o X do Y": possessive ("the route\'s code"), compound ("pipeline doc") or pronoun ("its")' },
  { id: 'is-the-same', re: /\b[Tt]he [\w-]+ (is|was) the same\b/g,
    hint: '"o X é o mesmo": say what repeats ("It works the same way", "Same fix:")' },
  { id: 'between-me', re: /\bbetween me and\b/gi,
    hint: '"entre mim e o Claude": "between Claude and me", or "Claude and I" as the subject' },
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

  // Headings named by a bare noun phrase ("The chain") mirror Portuguese
  // section titles ("A cadeia"). English, but a verb or a description reads
  // better and makes a better anchor.
  const allLines = raw.split(/\r?\n/)
  allLines.forEach((line, i) => {
    if (i >= bodyStart && /^#{2,3} The [\w-]+(?: [\w-]+){0,2}\s*$/.test(line)) {
      hit('the-heading')
      warns.push(`line ${i + 1}: [the-heading] "${line.replace(/^#+\s*/, '')}" — "A cadeia" style title: describe or use a verb ("How the pipeline works")`)
    }
  })

  // Register profile against native technical English. Page features, then
  // the paragraphs with the densest run of "the".
  const paragraphs = mdxParagraphs(content)
  const prof = profile(paragraphs)
  const register = { prof, past: 0, dense: 0, worst: 0 }
  if (prof) {
    for (const f of FEATURES) {
      const t = THRESHOLDS.features[f.id]
      if (!t) continue
      const value = prof[f.id]
      if (t.dir === 'high' ? value > t.value : value < t.value) {
        register.past++
        hit(`register-${f.id}`)
        warns.push(`[register-${f.id}] ${f.label} ${value.toFixed(1)} (native median ${t.nativeMedian}, ${t.dir === 'high' ? 'p90' : 'p10'} ${t.value}) — ${f.hint}`)
      }
    }
  }
  const limit = THRESHOLDS.paragraphTheDensity.value
  const dense = paragraphs
    .filter((p) => wordsOf(p).length >= PARAGRAPH_MIN_WORDS)
    .map((p) => ({ p, d: theDensity(p) }))
    .filter(({ d }) => d > limit)
    .sort((a, b) => b.d - a.d)
  register.dense = dense.length
  register.worst = dense[0]?.d || 0
  for (const { p, d } of dense) {
    hit('the-density')
    warns.push(`[the-density] ${d.toFixed(1)} "the" per 100 words (native p95 ${limit}) in "${p.slice(0, 60)}…" — rewrite the sentences (verbs, possessives, pronouns), never just delete articles`)
  }

  // The translation note closes the page (references/structure.md).
  const lines = content.trimEnd().split(/\r?\n/)
  const noteAt = lines.findIndex((l) => l.includes(NOTE_MARK))
  if (noteAt >= 0 && noteAt !== lines.length - 1) {
    hit('note-not-last')
    errors.push(`translation note on body line ${noteAt + 1} of ${lines.length}: it must be the last line`)
  }
  if (data.lang && data.lang !== 'en') errors.push(`lang is "${data.lang}": this script checks English pages`)

  return { errors, warns, counts, register }
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
  for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${v}`)

  // Revision order: most register features past threshold first, then the
  // most paragraphs past the "the" threshold, then the densest paragraph.
  console.log(`\nregister, furthest from native first (thresholds measured ${THRESHOLDS.measured} at ${THRESHOLDS.commit}):`)
  console.log(`  ${'past'.padStart(4)} ${'dense'.padStart(5)} ${'worst'.padStart(5)} ${FEATURES.map((f) => f.id.padStart(11)).join('')}  file`)
  ranking.sort((a, b) => b.past - a.past || b.dense - a.dense || b.worst - a.worst)
  for (const r of ranking) {
    const cols = FEATURES.map((f) => (r.prof ? r.prof[f.id].toFixed(1) : '—').padStart(11)).join('')
    console.log(`  ${String(r.past).padStart(4)} ${String(r.dense).padStart(5)} ${r.worst.toFixed(1).padStart(5)} ${cols}  ${r.file}`)
  }
  console.log(`  ${'native median'.padEnd(16)} ${FEATURES.map((f) => String(THRESHOLDS.features[f.id]?.nativeMedian ?? '—').padStart(11)).join('')}`)
}
if (files.length > 1) console.log(`\n${files.length} files checked, ${failed} with errors`)
process.exit(failed ? 1 : 0)
