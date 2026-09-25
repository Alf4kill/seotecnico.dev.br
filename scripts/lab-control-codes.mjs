#!/usr/bin/env node
// Prints the expected positive-control codes for rounds 00–15 (H15).
// Run locally, never in CI output that is kept:
//   LAB_PROBE_CONTROL_SLUG=<slug> node scripts/lab-control-codes.mjs
// Mirrors controlCode() in src/lib/lab-probes.ts; lab-probes.test.ts runs this
// script and fails if the two ever disagree. See docs/lab-control-rounds.md.
import { createHmac } from 'node:crypto'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const KINDS = ['SRV', 'UC', 'LD', 'JS']

function code(slug, round, kind) {
  const digest = createHmac('sha256', slug).update(`${round}:${kind}`).digest()
  let bits = 0n
  for (const byte of digest.subarray(0, 5)) bits = (bits << 8n) | BigInt(byte)
  let chars = ''
  for (let i = 7; i >= 0; i--) chars += ALPHABET[Number((bits >> BigInt(i * 5)) & 31n)]
  return `${kind}-${chars.slice(0, 4)}-${chars.slice(4)}`
}

const slug = process.env.LAB_PROBE_CONTROL_SLUG?.trim()
if (!slug || !/^[a-z0-9-]{16,64}$/.test(slug)) {
  console.error('Set LAB_PROBE_CONTROL_SLUG (16–64 chars, a-z 0-9 -).')
  process.exit(1)
}

const last = Number(process.argv[2] ?? 15)
for (let r = 0; r <= last; r++) {
  const round = String(r).padStart(2, '0')
  console.log([round, ...KINDS.map((kind) => code(slug, round, kind))].join('\t'))
}
