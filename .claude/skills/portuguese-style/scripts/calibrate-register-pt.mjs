#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// calibrate-register-pt.mjs — measures native technical Portuguese and writes
// the band check-portuguese.mjs (step 3) compares each Portuguese page with.
//
// For every page in native-corpus-pt.json it fetches the live page, checks it
// again against the corpus criteria (Portuguese by its function words, no
// translation note, no date on the page after the cutoff), keeps running
// prose (<p> elements that read as sentences), and computes the features of
// register-pt.mjs. It then measures this site's Portuguese pages the same way
// and prints both distributions. Only numbers are printed or written: no text
// from the corpus is stored.
//
// Usage (from the repository root, needs network):
//   node .claude/skills/portuguese-style/scripts/calibrate-register-pt.mjs
//   node .claude/skills/portuguese-style/scripts/calibrate-register-pt.mjs --pages
//   node .claude/skills/portuguese-style/scripts/calibrate-register-pt.mjs --write
//
//   --pages   also print every page's values (corpus and site)
//   --write   save the band to register-thresholds-pt.json (commit it with the
//             research note that records the run)
//
// Band: native p10, p50 and p90 per feature (nearest rank). Pages change, so a
// rerun can move the numbers; the committed JSON records the date and commit.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { FEATURES, articleHtml, decode, fromHtml, fromMdx, languageShares, percentile, profile, wordsOf } from './register-pt.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = process.cwd()
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, 'native-corpus-pt.json'), 'utf8'))
const CUTOFF = corpus.cutoff

if (!fs.existsSync(path.join(ROOT, 'src', 'lib', 'content.ts'))) {
  console.error('Run this from the root of the seotecnico.dev.br repository.')
  process.exit(2)
}

// A generic browser user agent: the request carries nothing about this project.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'pt-BR,pt;q=0.9' }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const MONTHS = { jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06', jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12' }

/**
 * Dates the page states about itself, each with where it was found: the
 * page-level metadata, and the <time> elements and written dates ("em 05 Dez
 * 2012") inside the article area only. A sidebar of recent posts carries
 * other articles' dates, which say nothing about this one.
 */
function pageDates(html) {
  const area = articleHtml(html)
  const found = []
  const add = (source, text, re, map = (m) => decode(m[1]).slice(0, 10)) => {
    for (const m of text.matchAll(re)) found.push({ source, date: map(m) })
  }
  add('article:published_time', html, /article:published_time"\s+content="([^"]+)"/gi)
  add('article:modified_time', html, /article:modified_time"\s+content="([^"]+)"/gi)
  add('og:updated_time', html, /og:updated_time"\s+content="([^"]+)"/gi)
  add('JSON-LD datePublished', html, /"datePublished"\s*:\s*"([^"]+)"/g)
  add('JSON-LD dateModified', html, /"dateModified"\s*:\s*"([^"]+)"/g)
  add('<time datetime> in the article', area, /<time[^>]*datetime="?([0-9]{4}-[0-9]{2}-[0-9]{2})/gi)
  add('written date in the article', area.replace(/<[^>]+>/g, ' '),
    /\bem (\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?,? (?:de )?(\d{4})\b/gi,
    (m) => `${m[3]}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`)
  const seen = new Set()
  return found.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !seen.has(d.source + d.date) && seen.add(d.source + d.date))
}

/** A note that the text is a translation, in the prose or around it. */
const TRANSLATION = /(originalmente publicad[oa]|tradução (para o português|de|feita|autorizada)|traduzid[oa] (do|de|por)|texto original em inglês|translated (from|by))/i

const fmt = (n) => (Number.isFinite(n) ? n.toFixed(1) : '—').padStart(6)
const showPages = process.argv.includes('--pages')

// ── native corpus ───────────────────────────────────────────────────────────
const native = []
for (const page of corpus.pages) {
  const { url } = page
  try {
    const html = await fetchPage(url)
    const { paragraphs, structure } = fromHtml(html)
    const langs = languageShares(paragraphs)
    const late = pageDates(html).filter((d) => d.date >= CUTOFF)
    const prof = profile(paragraphs, structure)
    const reason =
      langs.pt < 0.2 || langs.en > 0.03 ? `not Portuguese (pt ${langs.pt.toFixed(2)}, en ${langs.en.toFixed(2)})`
        : TRANSLATION.test(paragraphs.join(' ')) ? 'translation note in the text'
          : late.length ? `date after the cutoff (${late.map((d) => `${d.source} ${d.date}`).join(', ')})`
            : !prof ? 'too little prose'
              : ''
    if (reason) { console.error(`skip (${reason}): ${url}`); continue }
    native.push({ ...page, prof, words: paragraphs.reduce((n, p) => n + wordsOf(p).length, 0), dates: pageDates(html) })
  } catch (e) {
    console.error(`skip (${e.message}): ${url}`)
  }
}

// ── this site's Portuguese pages ────────────────────────────────────────────
const site = []
for (const d of ['blog', 'guia', 'projeto']) {
  const dir = path.join(ROOT, 'content', d)
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'))
    const { paragraphs, structure } = fromMdx(content)
    const prof = profile(paragraphs, structure)
    if (prof) site.push({ url: `content/${d}/${f}`, date: String(data.datePublished ?? '').slice(0, 10), prof })
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const dist = (pages, id) => pages.map((p) => p.prof[id])
const kinds = [...new Set(native.map((p) => p.kind))]
const sites = new Set(native.map((p) => new URL(p.url).host)).size
const authors = new Set(native.map((p) => p.author)).size

console.log(`native: ${native.length} pages, ${sites} sites, ${authors} authors (${kinds.map((k) => `${native.filter((p) => p.kind === k).length} ${k}`).join(', ')}), ${native.reduce((n, p) => n + p.words, 0)} words of prose`)
console.log(`site:   ${site.length} pages\n`)
console.log(`${'feature'.padEnd(42)} ${kinds.map((k) => `${k.slice(0, 7)} p50`.padStart(11)).join(' ')} ${'nat p10'.padStart(8)} ${'nat p50'.padStart(8)} ${'nat p90'.padStart(8)} ${'site p50'.padStart(9)}`)
const band = {}
for (const f of FEATURES) {
  const all = dist(native, f.id)
  const p10 = percentile(all, 10), p50 = percentile(all, 50), p90 = percentile(all, 90)
  band[f.id] = { dir: f.dir, p10: Number(p10.toFixed(2)), p50: Number(p50.toFixed(2)), p90: Number(p90.toFixed(2)) }
  console.log(`${f.label.padEnd(42)} ${kinds.map((k) => fmt(percentile(dist(native.filter((p) => p.kind === k), f.id), 50)).padStart(11)).join(' ')}   ${fmt(p10)}   ${fmt(p50)}   ${fmt(p90)}    ${fmt(percentile(dist(site, f.id), 50))}`)
}

console.log('\nsite pages outside the band (by the side the feature warns on):')
for (const f of FEATURES.filter((x) => x.dir !== 'info')) {
  const { p10, p90 } = band[f.id]
  const out = site.filter((p) => {
    const v = p.prof[f.id]
    if (!Number.isFinite(v)) return false
    return (f.dir !== 'low' && v > p90) || (f.dir !== 'high' && v < p10)
  })
  const july = out.filter((p) => p.date.startsWith('2026-07')).length
  console.log(`  ${f.label.padEnd(42)} ${String(out.length).padStart(2)} of ${site.length}  (July 2026 pages: ${july})`)
}

if (showPages) {
  const ids = FEATURES.map((f) => f.id)
  console.log(`\n${'page'.padEnd(64)} ${ids.map((i) => i.slice(0, 8).padStart(8)).join(' ')}`)
  for (const p of [...native, ...site.sort((a, b) => a.date.localeCompare(b.date))]) {
    const name = p.author ? `${p.kind.slice(0, 5)} ${new URL(p.url).host} ${p.date}` : `site ${p.date} ${path.basename(p.url)}`
    console.log(`${name.slice(0, 64).padEnd(64)} ${ids.map((i) => fmt(p.prof[i]).padStart(8)).join(' ')}`)
  }
  console.log('\ncorpus dates found on each page (none on or after the cutoff):')
  for (const p of native) console.log(`  ${p.url}\n    ${p.dates.map((d) => `${d.source} ${d.date}`).join('; ') || 'none in the markup (date from the corpus file)'}`)
}

if (process.argv.includes('--write')) {
  let commit = 'unknown'
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch {}
  const out = {
    measured: new Date().toLocaleDateString('sv'), // local date, as the research notes are named
    commit,
    corpus: { pages: native.length, sites, authors, words: native.reduce((n, p) => n + p.words, 0), cutoff: CUTOFF },
    note: 'A band, not a limit: check-portuguese.mjs warns outside it and never fails on it.',
    features: band,
  }
  fs.writeFileSync(path.join(HERE, 'register-thresholds-pt.json'), JSON.stringify(out, null, 2) + '\n')
  console.log(`\nwrote ${path.relative(ROOT, path.join(HERE, 'register-thresholds-pt.json'))}`)
}
