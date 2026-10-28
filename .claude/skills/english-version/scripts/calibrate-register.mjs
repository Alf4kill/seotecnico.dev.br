#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// calibrate-register.mjs — measures native technical English and writes the
// thresholds check-english.mjs compares each English page against.
//
// It fetches every page in native-corpus.json, keeps running prose (<p>
// elements that read as sentences; code, navigation and captions dropped),
// computes the register features of register.mjs per page and the "the"
// density per paragraph, and prints the distribution next to the site's own.
// Only numbers are printed or written: no text from the corpus is stored.
//
// Usage (from the repository root, needs network):
//   node .claude/skills/english-version/scripts/calibrate-register.mjs
//   node .claude/skills/english-version/scripts/calibrate-register.mjs --write
//
//   --write   save the thresholds to register-thresholds.json (commit it with
//             the research note that records the run)
//
// Thresholds: native p90 per page for 'high' features, p10 for 'low' ones,
// and the native p95 of the per-paragraph "the" density. Pages change, so a
// rerun can move the numbers; the committed JSON records the date and commit.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import {
  FEATURES, PARAGRAPH_MIN_WORDS, htmlParagraphs, mdxParagraphs, percentile, profile, theDensity, wordsOf,
} from './register.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = process.cwd()
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'native-corpus.json'), 'utf8'))

if (!fs.existsSync(path.join(ROOT, 'src', 'lib', 'content.ts'))) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

async function fetchPage(url) {
  // Google's sites negotiate the language: ask for English explicitly.
  const u = /(^|\.)(google\.com|web\.dev)\//.test(new URL(url).host + '/') ? `${url}?hl=en` : url
  const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (seotecnico.dev.br register calibration)', 'accept-language': 'en-US,en;q=0.9' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const fmt = (n) => (Number.isFinite(n) ? n.toFixed(1) : '—').padStart(6)

// ── native corpus ───────────────────────────────────────────────────────────
const native = []
for (const { url, kind } of corpus.pages) {
  try {
    const paras = htmlParagraphs(await fetchPage(url))
    const prof = profile(paras)
    if (!prof) { console.error(`skip (too little prose): ${url}`); continue }
    native.push({ url, kind, paras, prof, words: paras.reduce((n, p) => n + wordsOf(p).length, 0) })
  } catch (e) {
    console.error(`skip (${e.message}): ${url}`)
  }
}

// ── this site's English pages ───────────────────────────────────────────────
const site = []
for (const d of ['blog', 'guide', 'case-studies', 'project']) {
  const dir = path.join(ROOT, 'content', 'en', d)
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const paras = mdxParagraphs(matter(fs.readFileSync(path.join(dir, f), 'utf8')).content)
    const prof = profile(paras)
    if (prof) site.push({ url: `content/en/${d}/${f}`, paras, prof })
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const dist = (pages, id) => pages.map((p) => p.prof[id])
const paraDens = (pages) => pages.flatMap((p) => p.paras.filter((x) => wordsOf(x).length >= PARAGRAPH_MIN_WORDS).map(theDensity))

console.log(`native: ${native.length} pages (${native.filter((p) => p.kind === 'docs').length} docs, ${native.filter((p) => p.kind === 'first-person').length} first-person), ${native.reduce((n, p) => n + p.words, 0)} words of prose`)
console.log(`site:   ${site.length} pages\n`)
console.log(`${'feature'.padEnd(34)} ${'docs p50'.padStart(8)} ${'1st p50'.padStart(8)} ${'nat p10'.padStart(8)} ${'nat p50'.padStart(8)} ${'nat p90'.padStart(8)} ${'site p50'.padStart(8)}`)
const thresholds = {}
for (const f of FEATURES) {
  const all = dist(native, f.id)
  const p10 = percentile(all, 10), p50 = percentile(all, 50), p90 = percentile(all, 90)
  thresholds[f.id] = { dir: f.dir, value: Number((f.dir === 'high' ? p90 : p10).toFixed(2)), nativeMedian: Number(p50.toFixed(2)) }
  console.log(`${f.label.padEnd(34)} ${fmt(percentile(dist(native.filter((p) => p.kind === 'docs'), f.id), 50))}   ${fmt(percentile(dist(native.filter((p) => p.kind === 'first-person'), f.id), 50))}   ${fmt(p10)}   ${fmt(p50)}   ${fmt(p90)}   ${fmt(percentile(dist(site, f.id), 50))}`)
}

const nd = paraDens(native)
const sd = paraDens(site)
const paraLimit = percentile(nd, 95)
console.log(`\n"the" per 100 words, paragraphs of ${PARAGRAPH_MIN_WORDS}+ words:`)
console.log(`  native (${nd.length}): p50 ${fmt(percentile(nd, 50))}  p90 ${fmt(percentile(nd, 90))}  p95 ${fmt(paraLimit)}`)
console.log(`  site   (${sd.length}): p50 ${fmt(percentile(sd, 50))}  p90 ${fmt(percentile(sd, 90))}  p95 ${fmt(percentile(sd, 95))}`)
console.log(`  site paragraphs above the native p95: ${sd.filter((d) => d > paraLimit).length} of ${sd.length}`)

console.log('\nsite pages past a threshold:')
for (const f of FEATURES) {
  const t = thresholds[f.id].value
  const past = site.filter((p) => (f.dir === 'high' ? p.prof[f.id] > t : p.prof[f.id] < t)).length
  console.log(`  ${f.label.padEnd(34)} ${String(past).padStart(2)} of ${site.length}`)
}

if (process.argv.includes('--write')) {
  let commit = 'unknown'
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch {}
  const out = {
    measured: new Date().toLocaleDateString('sv'), // local date, as the research notes are named
    commit,
    corpus: { pages: native.length, words: native.reduce((n, p) => n + p.words, 0) },
    paragraphTheDensity: { minWords: PARAGRAPH_MIN_WORDS, value: Number(paraLimit.toFixed(2)), percentile: 95 },
    features: thresholds,
  }
  fs.writeFileSync(path.join(HERE, 'register-thresholds.json'), JSON.stringify(out, null, 2) + '\n')
  console.log(`\nwrote ${path.relative(ROOT, path.join(HERE, 'register-thresholds.json'))}`)
}
