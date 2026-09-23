// ─────────────────────────────────────────────────────────────────────────────
// Per-URL table of a Lighthouse CI run, written to the GitHub job summary.
//
// Why: `lhci assert` prints only the assertions that failed, and the uploaded
// report is a single run that expires in ~7 days. Reading a red (or a
// suspiciously green) run needs every run's spread and the runner's CPU score,
// because timing metrics move with the machine: the same code measured TBT
// 73 ms at benchmarkIndex ~3500 and ~125 ms at ~2450. Bytes and DOM size do
// not move, which is why they are printed next to the timings.
//
//   node scripts/lhci-summary.mjs            (after `lhci collect`/`autorun`)
//
// Reads .lighthouseci/lhr-*.json; appends to $GITHUB_STEP_SUMMARY when set,
// prints to stdout otherwise.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'

const DIR = '.lighthouseci'

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor((sorted.length - 1) / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid] + sorted[mid + 1]) / 2
}
const kb = (bytes) => (bytes / 1024).toFixed(0)
const ms = (value) => Math.round(value)

if (!fs.existsSync(DIR)) {
  console.log(`No ${DIR} directory: nothing was collected.`)
  process.exit(0)
}

/** @type {Map<string, any[]>} */
const byUrl = new Map()
for (const file of fs.readdirSync(DIR)) {
  if (!file.startsWith('lhr-') || !file.endsWith('.json')) continue
  const lhr = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  const url = new URL(lhr.requestedUrl).pathname
  byUrl.set(url, [...(byUrl.get(url) ?? []), lhr])
}

const rows = [...byUrl.entries()].map(([url, lhrs]) => {
  const audit = (id) => lhrs.map((lhr) => lhr.audits[id].numericValue)
  const tbt = audit('total-blocking-time')
  const summary = Object.fromEntries(
    lhrs[0].audits['resource-summary'].details.items.map((item) => [item.resourceType, item]),
  )
  return [
    url,
    lhrs.length,
    ms(median(lhrs.map((lhr) => lhr.environment.benchmarkIndex))),
    ms(median(lhrs.map((lhr) => lhr.categories.performance.score * 100))),
    ms(median(audit('largest-contentful-paint'))),
    `${ms(median(tbt))} (${ms(Math.min(...tbt))}–${ms(Math.max(...tbt))})`,
    median(audit('cumulative-layout-shift')).toFixed(3),
    kb(summary.script?.transferSize ?? 0),
    kb(summary['third-party']?.transferSize ?? 0),
    lhrs[0].audits['dom-size'].numericValue,
  ]
})

const header = [
  'URL',
  'Runs',
  'CPU index',
  'Perf',
  'LCP ms',
  'TBT ms (min–max)',
  'CLS',
  'JS KB',
  '3rd-party KB',
  'DOM',
]
const table = [header, header.map(() => '---'), ...rows]
  .map((cells) => `| ${cells.join(' | ')} |`)
  .join('\n')

const output = [
  '### Lighthouse — medians per URL',
  '',
  table,
  '',
  'CPU index is Lighthouse’s benchmarkIndex of the runner: timing metrics are',
  'only comparable between runs with a similar index. Bytes and DOM are not',
  'affected by the machine.',
  '',
].join('\n')

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, output)
}
console.log(output)
