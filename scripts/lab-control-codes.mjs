#!/usr/bin/env node
// Prints the expected positive-control codes. Run locally, never in CI output
// that is kept (docs/lab-control-rounds.md):
//   LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs [last]
//     H15 probe (/lab/<slug>): rounds 00..last (default 15)
//   LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs --probes [h16|h17]
//     each assistant's probe path and the codes of its scheduled rounds
//     (default h16)
//   LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs --probe <name> <from> <to>
//     one derived probe, any rounds (diagnostics after round 30)
// Mirrors controlCode() and probeSlug() in src/lib/lab-probes.ts;
// lab-probes.test.ts runs this script and fails if the two ever disagree.
import { createHmac } from 'node:crypto'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const KINDS = ['SRV', 'UC', 'LD', 'JS']

// Schedules (docs/lab-control-rounds.md). Key order matches DERIVED_PROBES
// in lab-probes.ts.
const SCHEDULES = {
  // Round 2: interleaved, 5 per assistant.
  h16: {
    gemini: [16, 19, 22, 25, 28],
    deepseek: [17, 20, 23, 26, 29],
    grok: [18, 21, 24, 27, 30],
    owner: [0],
  },
  // Round 3: six blocks of five (ChatGPT, Claude, Gemini, DeepSeek, Grok),
  // conditions alternating by block from 40.
  h17: {
    gemini: [42, 47, 52, 57, 62, 67],
    deepseek: [43, 48, 53, 58, 63, 68],
    grok: [44, 49, 54, 59, 64, 69],
    chatgpt: [40, 45, 50, 55, 60, 65],
    claude: [41, 46, 51, 56, 61, 66],
  },
}
const PROBES = ['gemini', 'deepseek', 'grok', 'owner', 'chatgpt', 'claude']

function code(slug, round, kind) {
  const digest = createHmac('sha256', slug).update(`${round}:${kind}`).digest()
  let bits = 0n
  for (const byte of digest.subarray(0, 5)) bits = (bits << 8n) | BigInt(byte)
  let chars = ''
  for (let i = 7; i >= 0; i--) chars += ALPHABET[Number((bits >> BigInt(i * 5)) & 31n)]
  return `${kind}-${chars.slice(0, 4)}-${chars.slice(4)}`
}

function probeSlug(base, name) {
  return `p-${createHmac('sha256', base).update(`probe:${name}`).digest('hex').slice(0, 24)}`
}

function row(slug, r) {
  const round = String(r).padStart(2, '0')
  return [round, ...KINDS.map((kind) => code(slug, round, kind))].join('\t')
}

const slug = process.env.LAB_PROBE_CONTROL_SLUG?.trim()
if (!slug || !/^[a-z0-9-]{16,64}$/.test(slug)) {
  console.error('Set LAB_PROBE_CONTROL_SLUG (16–64 chars, a-z 0-9 -).')
  process.exit(1)
}

const [mode, ...args] = process.argv.slice(2)

if (mode === '--probes') {
  const schedule = SCHEDULES[args[0] ?? 'h16']
  if (!schedule) {
    console.error(`Unknown schedule. One of: ${Object.keys(SCHEDULES).join(', ')}.`)
    process.exit(1)
  }
  for (const [name, rounds] of Object.entries(schedule)) {
    const probe = probeSlug(slug, name)
    console.log(`# ${name}\t/lab/${probe}`)
    for (const r of rounds) console.log(row(probe, r))
  }
} else if (mode === '--probe') {
  const [name, from, to] = args
  if (!PROBES.includes(name)) {
    console.error(`Unknown probe. One of: ${PROBES.join(', ')}.`)
    process.exit(1)
  }
  const probe = probeSlug(slug, name)
  console.log(`# ${name}\t/lab/${probe}`)
  for (let r = Number(from ?? 0); r <= Number(to ?? from ?? 0); r++) console.log(row(probe, r))
} else {
  const last = Number(mode ?? 15)
  for (let r = 0; r <= last; r++) console.log(row(slug, r))
}
