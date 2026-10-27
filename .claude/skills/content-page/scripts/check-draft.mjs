#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-draft.mjs — checks one MDX file before it enters content/.
//
// A draft arrives from three places: an external writing session, the owner,
// or this repository's own session. Every route so far returned defects that
// a script can find (a body H1, a literal `{{`, an unfilled placeholder, a
// missing pillar link) next to defects only a reader can find (invented code,
// a source that moved on). This script does the first kind, so the
// verification pass (references/draft-verification.md) is spent on the
// second. It never edits a file.
//
// Usage (from the repository root):
//   node .claude/skills/content-page/scripts/check-draft.mjs <file.mdx> [options]
//   node .claude/skills/content-page/scripts/check-draft.mjs --published
//
//   --arrival          the draft just came back: placeholders are listed as
//                      WARN (the inventory the implementation pass must fill)
//                      instead of failing the run
//   --type blog|project   default: blog (a project entry needs no pillar or
//                      tool link, but must link a versioned artifact on GitHub)
//   --ban "a,b,c"      framings the brief banned; any hit in prose fails
//   --published        final-mode checks on every published article: the
//                      regression test for this script (expected: 0 errors)
//
// Exit code 1 when any ERROR is found; WARN lines never fail the run.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const LIMITS = { title: 60, description: 155, tldr: 300 }
const REQUIRED = ['title', 'description', 'slug', 'datePublished', 'dateModified', 'primaryQuery', 'lang']
const DATE_FIELDS = ['datePublished', 'dateModified']
const PILLAR = { 'pt-BR': '/guia/seo-tecnico-nextjs', en: '/en/guide/technical-seo-nextjs' }
const TOOL_PREFIX = { 'pt-BR': '/ferramentas/', en: '/en/tools/' }
const REPO_URL = 'github.com/Alf4kill/seotecnico.dev.br'
// The placeholder convention of references/handoff-kit.md.
const PLACEHOLDERS = [/\[CODE-\d+[^\]]*\]/g, /\[SVG-[A-Z0-9]+[^\]]*\]/g, /NOTA-REDACAO/g]
// Components src/components/mdx/mdx-components.tsx maps for MDX. Any other
// capitalised tag in prose is undefined at render time.
const MAPPED_COMPONENTS = ['Image']

if (!fs.existsSync(path.join(ROOT, 'src', 'lib', 'content.ts'))) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

/**
 * Body text with fenced and inline code removed, so examples do not count.
 * Fences are tracked line by line: a lazy ```…``` regex can pair an opening
 * fence with a triple backtick quoted in prose and leak code into the text.
 */
function prose(body) {
  let inFence = false
  const kept = []
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (!inFence) kept.push(line)
  }
  return kept.join('\n').replace(/`[^`\n]*`/g, '')
}

/**
 * Prose without markup, for wording checks: attribute values first (an
 * aria-label can hold "->" or a long description in quotes), then the tags.
 */
function plainText(text) {
  return text
    .replace(/[\w:-]+=(?:"[^"]*"|'[^']*'|\{[^}]*\})/g, ' ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
}

function internalLinks(text) {
  const out = new Set()
  for (const m of text.matchAll(/\]\((\/[^)\s#?]*)/g)) out.add(m[1])
  for (const m of text.matchAll(/href=["'](\/[^"'#?]*)/g)) out.add(m[1])
  return [...out]
}

function checkFile(file, { arrival = false, type = 'blog', ban = [] } = {}) {
  const errors = []
  const warns = []
  const raw = fs.readFileSync(file, 'utf8')
  let parsed
  try {
    parsed = matter(raw)
  } catch (e) {
    return { errors: [`frontmatter does not parse as YAML: ${e.message.split('\n')[0]}`], warns }
  }
  const { data, content: body } = parsed
  const text = prose(body)
  const plain = plainText(text)
  const lang = data.lang

  // 1. Frontmatter: the loader's rules, caught before a build.
  for (const f of REQUIRED) if (data[f] === undefined || data[f] === '') errors.push(`missing frontmatter field '${f}'`)
  for (const [f, max] of Object.entries(LIMITS)) {
    const len = data[f] ? [...String(data[f]).trim()].length : 0
    if (len > max) errors.push(`${f} is ${len} chars (max ${max})`)
  }
  if (type === 'blog' && !data.category) errors.push("blog article without 'category' (src/lib/categories.ts)")
  if (type === 'project' && data.category) errors.push("project entry with 'category': entries stay out of the blog axes")
  if (lang && !PILLAR[lang]) errors.push(`lang '${lang}' is neither 'pt-BR' nor 'en'`)
  if (lang === 'en' && !data.translationOf) warns.push("English page without 'translationOf'")
  for (const item of data.faq || []) {
    if (!item?.question || !item?.answer) errors.push('faq item without question or answer')
  }

  // 2. Unfilled work. On arrival this is the inventory; at the end it is a stop.
  const found = []
  for (const re of PLACEHOLDERS) for (const m of raw.matchAll(re)) found.push(m[0].slice(0, 60))
  // A date format can be the subject of a table in the body; only the
  // frontmatter dates are placeholders when they are not dates.
  for (const f of DATE_FIELDS) {
    if (data[f] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(data[f]))) found.push(`${f}: ${data[f]}`)
  }
  if (found.length) {
    const msg = `${found.length} placeholder(s): ${[...new Set(found)].join(' | ')}`
    if (arrival) warns.push(msg)
    else errors.push(msg)
  }

  // 3. MDX traps seen in returned drafts.
  if (/^# /m.test(text)) errors.push('body has an H1; the title is the H1')
  if (/\{\{/.test(text)) errors.push("'{{' outside code: MDX reads it as an expression and the build crashes")
  if ((body.match(/^\s*(```|~~~)/gm) || []).length % 2) errors.push('unbalanced code fences')
  const tags = [...new Set([...text.matchAll(/<([A-Z][A-Za-z]+)[\s/>]/g)].map((m) => m[1]))]
    .filter((t) => !MAPPED_COMPONENTS.includes(t))
  if (tags.length) {
    errors.push(`unmapped component tags outside code (${tags.join(', ')}): mdx-components.tsx maps only ${MAPPED_COMPONENTS.join(', ')}`)
  }
  if (/``[^`\n]+``/.test(text)) warns.push('double-backtick inline code: normalise to single backticks')
  const bareHex = text.match(/(?:fill|stroke)=["']#[0-9A-Fa-f]{3,8}["']/g)
  if (bareHex) errors.push(`SVG colour without a token (${[...new Set(bareHex)].join(', ')}): use var(--…), CLAUDE.md §9`)
  for (const svg of text.match(/<svg[\s\S]*?<\/svg>/g) || []) {
    if (!/role=["']img["']/.test(svg) || !/aria-label=/.test(svg)) {
      warns.push('inline SVG without role="img" and aria-label')
      break
    }
  }

  // 4. Wording the site never uses, plus what the brief banned.
  if (/clique aqui|click here/i.test(plain)) errors.push("'clique aqui' / 'click here' anchor (CLAUDE.md §10)")
  for (const term of ban) {
    if (plain.toLowerCase().includes(term.toLowerCase())) errors.push(`banned framing from the brief: '${term}'`)
  }
  // Quotes of a source: at most one per source, under 15 words. The
  // per-source count needs a reader; the length does not.
  for (const m of plain.matchAll(/["“]([^"”\n]{20,400})["”]/g)) {
    const n = m[1].trim().split(/\s+/).length
    if (n >= 15) warns.push(`quote of ${n} words ("${m[1].slice(0, 40)}…"): the limit is under 15`)
  }

  // 5. Links §6 requires.
  const links = internalLinks(text)
  if (lang && PILLAR[lang]) {
    if (type === 'blog') {
      if (!links.includes(PILLAR[lang])) errors.push(`no link to the pillar ${PILLAR[lang]}`)
      if (!links.some((l) => l.startsWith(TOOL_PREFIX[lang]))) errors.push(`no link to a tool (${TOOL_PREFIX[lang]}…)`)
    } else if (!body.includes(REPO_URL)) {
      errors.push(`project entry links no versioned artifact (${REPO_URL}/…)`)
    }
    if (lang === 'en') {
      const toPt = links.filter((l) => !l.startsWith('/en'))
      if (toPt.length) errors.push(`English text links non-English pages: ${toPt.join(', ')}`)
    }
  }

  // 6. The first paragraph answers primaryQuery (§10): there must be one.
  const lead = plainText(text.split(/^## /m)[0])
    .split(/\n\s*\n/)
    .map((para) => para.replace(/\s+/g, ' ').trim())
    .find((para) => para && !/^[|>#-]/.test(para))
  if (!lead || lead.length < 80) warns.push('no prose paragraph before the first H2: the first paragraph answers primaryQuery (§10)')

  return { errors, warns }
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const options = {
  arrival: args.includes('--arrival'),
  type: opt('--type') || 'blog',
  ban: (opt('--ban') || '').split(',').map((s) => s.trim()).filter(Boolean),
}
const files = args.includes('--published')
  ? ['blog', path.join('en', 'blog')].flatMap((d) =>
      fs.readdirSync(path.join(ROOT, 'content', d)).filter((f) => f.endsWith('.mdx')).map((f) => path.join('content', d, f)))
  : args.filter((a, i) => !a.startsWith('--') && !['--type', '--ban'].includes(args[i - 1]))

if (!files.length) {
  console.error('usage: check-draft.mjs <file.mdx> [--arrival] [--type blog|project] [--ban "a,b"] | --published')
  process.exit(2)
}

let failed = 0
for (const file of files) {
  const { errors, warns } = checkFile(path.resolve(ROOT, file), options)
  console.log(`${errors.length ? 'FAIL' : warns.length ? 'WARN' : 'OK  '}  ${file}`)
  for (const e of errors) console.log(`  ERROR ${e}`)
  for (const w of warns) console.log(`  WARN  ${w}`)
  if (errors.length) failed++
}
if (files.length > 1) console.log(`\n${files.length} files checked, ${failed} with errors`)
process.exit(failed ? 1 : 0)
