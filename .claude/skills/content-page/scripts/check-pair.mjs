#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-pair.mjs — pair-level checks for a Portuguese/English page pair: a
// blog article (default) or a project entry (--type project, CLAUDE.md §5.4).
//
// The build (src/lib/content.ts) already validates each file on its own:
// required fields, title/description/tldr lengths, category, status, basedOn.
// What nothing checks is the PAIR: that both sides exist, declare each other,
// are registered in TRANSLATION_PAIRS, carry the same facts and link inside
// their own language. This script covers that gap. It never edits a file.
//
// Usage (from the repository root):
//   node .claude/skills/content-page/scripts/check-pair.mjs <pt-slug> [--type blog|project]
//   node .claude/skills/content-page/scripts/check-pair.mjs --all [--type blog|project] [--verbose]
//
// Exit code 1 when any ERROR is found; WARN lines never fail the run. NOTE
// lines (links whose counterpart is missing on the other side) are printed for
// a single pair, and for --all only with --verbose.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const HREFLANG = path.join(ROOT, 'src', 'lib', 'hreflang.ts')
const LOG = path.join(ROOT, 'docs', 'experiment-log.md')

// Where each kind of page lives and what its links must reach. A blog article
// links the pillar and a tool (CLAUDE.md §6); a project entry instead links at
// least one versioned artifact in the repository (§5.4, the evidence rule).
const TYPES = {
  blog: {
    ptDir: ['content', 'blog'],
    enDir: ['content', 'en', 'blog'],
    ptPrefix: '/blog/',
    enPrefix: '/en/blog/',
    hubLinks: true,
  },
  project: {
    ptDir: ['content', 'projeto'],
    enDir: ['content', 'en', 'project'],
    ptPrefix: '/projeto/',
    enPrefix: '/en/project/',
    hubLinks: false,
  },
}

const PT_PILLAR = '/guia/seo-tecnico-nextjs'
const EN_PILLAR = '/en/guide/technical-seo-nextjs'
const REPOSITORY = 'github.com/Alf4kill/seotecnico.dev.br'
const TRANSLATION_NOTE = 'first published in Portuguese'
// CLAUDE.md §10, owner rule of 2026-10-23: every new article ships in both
// languages in the same PR, so pairs from that date on share datePublished.
// Older translations were published later and keep their own (later) date.
const SAME_PR_RULE = '2026-10-23'

if (!fs.existsSync(HREFLANG)) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

// TRANSLATION_PAIRS is TypeScript; reading it with a regex keeps this script
// free of a TS toolchain. Each entry is { id, paths: { 'pt-BR': ..., en: ... } }.
function readPairs() {
  const src = fs.readFileSync(HREFLANG, 'utf8')
  const re = /id:\s*'([^']+)'[\s\S]*?'pt-BR':\s*'([^']+)'[\s\S]*?en:\s*'([^']+)'/g
  const pairs = []
  for (const m of src.matchAll(re)) pairs.push({ id: m[1], pt: m[2], en: m[3] })
  return pairs
}

/** Body text with fenced and inline code removed, so examples do not count as links or headings. */
function prose(body) {
  return body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
}

/** Internal link targets (markdown and href), without hash or query. */
function internalLinks(body) {
  const text = prose(body)
  const out = new Set()
  for (const m of text.matchAll(/\]\((\/[^)\s#?]*)/g)) out.add(m[1])
  for (const m of text.matchAll(/href=["'](\/[^"'#?]*)/g)) out.add(m[1])
  return [...out]
}

const h2Count = (body) => (prose(body).match(/^## /gm) || []).length
const hasH1 = (body) => /^# /m.test(prose(body))

function readPost(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  return { data, body: content }
}

function checkPair(ptSlug, pairs, logText, type) {
  const errors = []
  const warns = []
  const notes = []
  const err = (m) => errors.push(m)
  const warn = (m) => warns.push(m)
  const note = (m) => notes.push(m)
  const { ptPrefix, enPrefix } = type
  const ptRel = type.ptDir.join('/')
  const enRel = type.enDir.join('/')

  const ptFile = path.join(ROOT, ...type.ptDir, `${ptSlug}.mdx`)
  if (!fs.existsSync(ptFile)) {
    err(`${ptRel}/${ptSlug}.mdx does not exist`)
    return { errors, warns, notes }
  }
  const pt = readPost(ptFile)

  // 1. Pair registered in hreflang.ts, with the Portuguese path matching the slug.
  const pair = pairs.find((p) => p.pt === `${ptPrefix}${ptSlug}`)
  if (!pair) {
    err(`no TRANSLATION_PAIRS entry with 'pt-BR': '${ptPrefix}${ptSlug}' in src/lib/hreflang.ts`)
    return { errors, warns, notes }
  }
  if (pair.id !== ptSlug) err(`TRANSLATION_PAIRS id is '${pair.id}', expected the Portuguese slug '${ptSlug}'`)
  if (!pair.en.startsWith(enPrefix)) err(`English path '${pair.en}' is not under ${enPrefix}`)
  const enSlug = pair.en.replace(enPrefix, '')

  // 2. English file exists and declares the pair.
  const enFile = path.join(ROOT, ...type.enDir, `${enSlug}.mdx`)
  if (!fs.existsSync(enFile)) {
    err(`${enRel}/${enSlug}.mdx does not exist (TRANSLATION_PAIRS points to it)`)
    return { errors, warns, notes, enSlug }
  }
  const en = readPost(enFile)

  if (pt.data.slug !== ptSlug) err(`PT frontmatter slug '${pt.data.slug}' differs from file name '${ptSlug}'`)
  if (en.data.slug !== enSlug) err(`EN frontmatter slug '${en.data.slug}' differs from file name '${enSlug}'`)
  if (pt.data.lang !== 'pt-BR') err(`PT lang is '${pt.data.lang}', expected 'pt-BR'`)
  if (en.data.lang !== 'en') err(`EN lang is '${en.data.lang}', expected 'en'`)
  if (en.data.translationOf !== ptSlug) err(`EN translationOf is '${en.data.translationOf}', expected '${ptSlug}'`)
  if (pt.data.translationOf) warn(`PT declares translationOf '${pt.data.translationOf}'; only the English side does in this repo`)

  // 3. Same facts on both sides.
  const ptDate = String(pt.data.datePublished ?? '')
  const enDate = String(en.data.datePublished ?? '')
  if (enDate < ptDate) err(`EN datePublished ${enDate} is earlier than the Portuguese original ${ptDate}`)
  else if (ptDate >= SAME_PR_RULE && enDate !== ptDate) {
    err(`datePublished differs (PT ${ptDate}, EN ${enDate}); since ${SAME_PR_RULE} both sides ship in the same PR`)
  }
  for (const field of ['category', 'status']) {
    if ((pt.data[field] ?? null) !== (en.data[field] ?? null)) {
      err(`'${field}' differs: PT '${pt.data[field]}' vs EN '${en.data[field]}'`)
    }
  }
  if ((pt.data.dateModified ?? '') > (en.data.dateModified ?? '')) {
    warn(`PT dateModified ${pt.data.dateModified} is newer than EN ${en.data.dateModified}: was the change carried over?`)
  }
  const ptFaq = (pt.data.faq || []).length
  const enFaq = (en.data.faq || []).length
  if (ptFaq !== enFaq) err(`FAQ count differs: PT ${ptFaq} vs EN ${enFaq}`)
  const ptH2 = h2Count(pt.body)
  const enH2 = h2Count(en.body)
  if (ptH2 !== enH2) warn(`H2 count differs: PT ${ptH2} vs EN ${enH2} (fine only if a section was merged on purpose)`)

  // basedOn: the English side must point to the English pairs of the Portuguese sources.
  const ptBased = pt.data.basedOn || []
  const enBased = new Set(en.data.basedOn || [])
  for (const src of ptBased) {
    const srcPair = pairs.find((p) => p.pt === `/blog/${src}`)
    const expected = srcPair?.en.replace('/en/blog/', '')
    if (!expected) err(`PT basedOn '${src}' has no English pair, so the EN side cannot cite it`)
    else if (!enBased.has(expected)) err(`EN basedOn is missing '${expected}' (English pair of '${src}')`)
  }
  if (enBased.size !== ptBased.length) warn(`basedOn length differs: PT ${ptBased.length} vs EN ${enBased.size}`)

  // 4. Body rules that hold on both sides.
  for (const [label, post] of [['PT', pt], ['EN', en]]) {
    if (hasH1(post.body)) err(`${label} body has an H1; the title is the H1`)
    if (/\{\{/.test(prose(post.body))) err(`${label} body has '{{' outside code; MDX reads it as an expression`)
    if (!post.data.tldr) warn(`${label} has no tldr`)
  }

  // 5. Links stay inside their own language and reach what the page type requires.
  const ptLinks = internalLinks(pt.body)
  const enLinks = internalLinks(en.body)
  const enToPt = enLinks.filter((l) => !l.startsWith('/en'))
  if (enToPt.length) err(`EN links to non-English pages: ${enToPt.join(', ')}`)
  const ptToEn = ptLinks.filter((l) => l === '/en' || l.startsWith('/en/'))
  if (ptToEn.length) warn(`PT links to English pages: ${ptToEn.join(', ')}`)
  if (type.hubLinks) {
    if (!ptLinks.includes(PT_PILLAR)) err(`PT does not link the pillar ${PT_PILLAR}`)
    if (!enLinks.includes(EN_PILLAR)) err(`EN does not link the pillar ${EN_PILLAR}`)
    if (!ptLinks.some((l) => l.startsWith('/ferramentas/'))) err('PT links no tool (/ferramentas/...)')
    if (!enLinks.some((l) => l.startsWith('/en/tools/'))) err('EN links no tool (/en/tools/...)')
  } else {
    for (const [label, post] of [['PT', pt], ['EN', en]]) {
      if (!prose(post.body).includes(REPOSITORY)) err(`${label} links no versioned artifact (${REPOSITORY}/...), CLAUDE.md §5.4`)
    }
  }

  // Every internal link on one side should have its counterpart on the other.
  const counterpart = (p, from, to) => pairs.find((x) => x[from] === p)?.[to]
  for (const l of ptLinks) {
    const c = counterpart(l, 'pt', 'en')
    if (c && !enLinks.includes(c)) note(`PT links ${l} but EN does not link its pair ${c} (fine if EN points elsewhere on purpose)`)
  }

  // 6. English conventions.
  if (!en.body.includes(TRANSLATION_NOTE)) {
    warn(`EN has no closing translation note ("...${TRANSLATION_NOTE}; the two declare each other.")`)
  }
  const kw = (en.data.keywords || []).map((k) => String(k).toLowerCase())
  if (!kw.includes('english') || !kw.includes('inglês')) warn("EN keywords lack 'english' and 'inglês' (on-site search finds English pages by them)")

  // 7. Publication bookkeeping.
  if (logText && !logText.includes(ptSlug) && !logText.includes(enSlug)) {
    warn(`docs/experiment-log.md mentions neither '${ptSlug}' nor '${enSlug}' (§7.3: register before publishing)`)
  }

  return { errors, warns, notes, enSlug }
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const verbose = args.includes('--verbose')
const typeIdx = args.indexOf('--type')
const typeName = typeIdx >= 0 ? args[typeIdx + 1] : 'blog'
const type = TYPES[typeName]
if (!type) {
  console.error(`unknown --type '${typeName}' (expected: ${Object.keys(TYPES).join(', ')})`)
  process.exit(2)
}
const arg = args.find((a, i) => a !== '--verbose' && a !== '--type' && (typeIdx < 0 || i !== typeIdx + 1))
if (!arg) {
  console.error('usage: check-pair.mjs <pt-slug> | --all [--type blog|project]')
  process.exit(2)
}

const pairs = readPairs()
const logText = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8') : ''
const slugs =
  arg === '--all'
    ? pairs.filter((p) => p.pt.startsWith(type.ptPrefix)).map((p) => p.pt.replace(type.ptPrefix, ''))
    : [arg.replace(/\.mdx$/, '')]

const showNotes = slugs.length === 1 || verbose
let failed = 0
for (const slug of slugs) {
  const { errors, warns, notes, enSlug } = checkPair(slug, pairs, logText, type)
  const shownNotes = showNotes ? notes : []
  const head = `${slug}${enSlug ? ` ↔ ${enSlug}` : ''}`
  if (!errors.length && !warns.length && !shownNotes.length) {
    console.log(`OK    ${head}`)
    continue
  }
  console.log(`${errors.length ? 'FAIL' : warns.length ? 'WARN' : 'NOTE'}  ${head}`)
  for (const e of errors) console.log(`  ERROR ${e}`)
  for (const w of warns) console.log(`  WARN  ${w}`)
  for (const n of shownNotes) console.log(`  NOTE  ${n}`)
  if (errors.length) failed++
}
if (slugs.length > 1) console.log(`\n${slugs.length} pairs checked, ${failed} with errors`)
process.exit(failed ? 1 : 0)
