import { promises as nodeDns } from 'node:dns'
import {
  parseDictionary,
  parseItem,
  serializeInnerList,
  serializeItem,
  type InnerList,
  type Item,
} from 'structured-headers'

// ─────────────────────────────────────────────────────────────────────────────
// Identity verification for AI crawlers (docs/detection-experiment.md §5).
//
// This is the layer `ai-crawlers.ts` does NOT have: `classifyAiCrawler()`
// answers "what does this request CLAIM to be", this module answers "is that
// claim true". Three positive sources, strongest first — Web Bot Auth
// signature (RFC 9421), vendor-published IP ranges, forward-confirmed reverse
// DNS — and two verdicts that are findings, not failures:
//
//   impersonated  — at least one positive source existed and the request
//                   failed it (rDNS is tried as a fallback first, so a stale
//                   CIDR feed alone cannot produce this verdict)
//   unverifiable  — the vendor publishes nothing to check against. NEVER
//                   collapsed into `impersonated`: there was no source to fail
//
// RUNTIME: Node, not Edge — WebCrypto Ed25519, `node:dns` and `Buffer` are
// unavailable in the Vercel Edge Runtime. `src/proxy.ts` declares
// `runtime: 'nodejs'` for exactly this reason; forgetting it fails silently
// as "no signature ever verifies".
//
// The client IP must come from Vercel's `x-real-ip` (set from the
// connection). An `impersonated` verdict cannot rest on a header the client
// can influence, which rules out the leftmost `X-Forwarded-For` hop.
// ─────────────────────────────────────────────────────────────────────────────

export type Verdict =
  | 'verified-ip'
  | 'verified-signature'
  | 'verified-rdns'
  | 'impersonated'
  | 'unverifiable'
  | 'unknown-agent'

export interface VerificationResult {
  agent: string | null
  verdict: Verdict
  /** Which published source produced the verdict, for the log record. */
  evidence: string | null
}

/** Injectable for tests; production uses the real network and clock. */
export interface VerifyDeps {
  fetchImpl: typeof fetch
  dns: {
    reverse(ip: string): Promise<string[]>
    lookup(hostname: string): Promise<string[]>
  }
  now(): number
}

const defaultDeps: VerifyDeps = {
  fetchImpl: (...args) => fetch(...args),
  dns: {
    reverse: (ip) => nodeDns.reverse(ip),
    lookup: async (hostname) =>
      (await nodeDns.lookup(hostname, { all: true })).map((a) => a.address),
  },
  now: () => Date.now(),
}

/* ------------------------------------------------------------------ *
 * 1. Published verification sources, per agent
 * ------------------------------------------------------------------ */

/**
 * Vendor-published CIDR feeds (Google's `{prefixes:[{ipv4Prefix|ipv6Prefix}]}`
 * shape, which every vendor below adopted). Only agents listed here can ever
 * reach `verified-ip`.
 */
const RANGE_FEEDS: Record<string, string> = {
  GPTBot: 'https://openai.com/gptbot.json',
  'OAI-SearchBot': 'https://openai.com/searchbot.json',
  'ChatGPT-User': 'https://openai.com/chatgpt-user.json',
  PerplexityBot: 'https://www.perplexity.ai/perplexitybot.json',
  'Perplexity-User': 'https://www.perplexity.ai/perplexity-user.json',
  Bingbot: 'https://www.bing.com/toolbox/bingbot.json',
  Applebot: 'https://search.developer.apple.com/applebot.json',
}

/**
 * Vendor-documented reverse-DNS suffixes, used as a second positive source:
 * PTR must end in the suffix AND the name must resolve back to the same IP
 * (forward-confirmed). Also the fallback that keeps a stale CIDR feed from
 * branding a vendor's new IP as an impersonator.
 */
const RDNS_SUFFIXES: Record<string, readonly string[]> = {
  Bingbot: ['.search.msn.com'],
  Applebot: ['.applebot.apple.com'],
}

/**
 * robots.txt tokens that are NOT fetching agents — their vendors document
 * that no request ever carries them as a User-Agent. A UA claiming one is
 * fake by construction: the cheapest sharp verdict in the module.
 */
const TOKEN_ONLY = new Set(['Google-Extended', 'Applebot-Extended'])

// Everything else classifyAiCrawler() knows — Anthropic (ClaudeBot,
// Claude-SearchBot, Claude-User), Common Crawl (CCBot), ByteDance
// (Bytespider), Meta (meta-externalagent) — publishes no ranges, no rDNS
// suffix and no signatures, and falls through to `unverifiable`.

/* ------------------------------------------------------------------ *
 * 2. CIDR matching (v4 + v6 via BigInt — one code path, no branches)
 * ------------------------------------------------------------------ */

export interface Cidr {
  base: bigint
  bits: number
  size: 32 | 128
}

export function ipToBigInt(ip: string): { value: bigint; size: 32 | 128 } | null {
  if (ip.includes(':')) {
    // Forma mista do IPv6 (RFC 4291 §2.2.3): os 32 bits finais escritos em
    // decimal pontuado, como `::ffff:127.0.0.1` — que é como um socket dual
    // stack costuma reportar um par v4. Sem esta normalização o grupo `127.0.0.1`
    // reprova no teste hexadecimal e o endereço inteiro vira null: um
    // `::ffff:10.0.0.1` passaria por não-privado em qualquer chamador.
    const embedded = /:((?:\d{1,3}\.){3}\d{1,3})$/.exec(ip)
    if (embedded) {
      const v4 = ipToBigInt(embedded[1])
      if (!v4) return null
      const hex = v4.value.toString(16).padStart(8, '0')
      ip = `${ip.slice(0, embedded.index)}:${hex.slice(0, 4)}:${hex.slice(4)}`
    }
    const parts = expandIpv6(ip)
    if (!parts) return null
    let v = 0n
    for (const group of parts) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null
      v = (v << 16n) | BigInt(parseInt(group, 16))
    }
    return { value: v, size: 128 }
  }
  const octets = ip.split('.')
  if (octets.length !== 4) return null
  let v = 0n
  for (const o of octets) {
    if (!/^\d{1,3}$/.test(o)) return null
    const n = Number(o)
    if (n > 255) return null
    v = (v << 8n) | BigInt(n)
  }
  return { value: v, size: 32 }
}

function expandIpv6(ip: string): string[] | null {
  const [head, tail, extra] = ip.split('::')
  if (extra !== undefined) return null
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  if (tail === undefined) return left.length === 8 ? left : null
  const fill = 8 - left.length - right.length
  if (fill < 1) return null
  return [...left, ...Array<string>(fill).fill('0'), ...right]
}

export function parseCidr(notation: string): Cidr | null {
  const [addr, prefix, extra] = notation.split('/')
  if (extra !== undefined) return null
  const parsed = ipToBigInt(addr)
  if (!parsed) return null
  const bits = prefix === undefined ? parsed.size : Number(prefix)
  if (!Number.isInteger(bits) || bits < 0 || bits > parsed.size) return null
  const shift = BigInt(parsed.size - bits)
  return { base: (parsed.value >> shift) << shift, bits, size: parsed.size }
}

export function inCidr(ip: string, cidr: Cidr): boolean {
  const parsed = ipToBigInt(ip)
  if (!parsed || parsed.size !== cidr.size) return false
  const shift = BigInt(cidr.size - cidr.bits)
  return (parsed.value >> shift) << shift === cidr.base
}

/* ------------------------------------------------------------------ *
 * 3. Feed cache
 * ------------------------------------------------------------------ */

interface FeedShape {
  prefixes?: Array<{ ipv4Prefix?: string; ipv6Prefix?: string }>
}

interface CachedRanges {
  cidrs: Cidr[]
  fetchedAt: number
}

const RANGE_TTL_MS = 6 * 60 * 60 * 1000 // 6h — per serverless instance, see doc §5

const rangeCache = new Map<string, CachedRanges>()
const keyCache = new Map<string, { keys: Jwk[]; fetchedAt: number }>()

/** Test hook: module-level caches would otherwise leak state across cases. */
export function clearVerificationCaches(): void {
  rangeCache.clear()
  keyCache.clear()
}

async function getRanges(agent: string, deps: VerifyDeps): Promise<Cidr[] | null> {
  const url = RANGE_FEEDS[agent]
  if (!url) return null

  const cached = rangeCache.get(agent)
  if (cached && deps.now() - cached.fetchedAt < RANGE_TTL_MS) return cached.cidrs

  try {
    const res = await deps.fetchImpl(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return cached?.cidrs ?? null

    const body = (await res.json()) as FeedShape
    const cidrs = (body.prefixes ?? [])
      .map((p) => p.ipv4Prefix ?? p.ipv6Prefix)
      .filter((s): s is string => typeof s === 'string')
      .map(parseCidr)
      .filter((c): c is Cidr => c !== null)

    rangeCache.set(agent, { cidrs, fetchedAt: deps.now() })
    return cidrs
  } catch {
    // Never fail the request because a vendor feed is down. Serve stale,
    // or fall through to `unverifiable` — the same fail-safe shape as
    // the GA4 env vars in src/proxy.ts.
    return cached?.cidrs ?? null
  }
}

/* ------------------------------------------------------------------ *
 * 4. Forward-confirmed reverse DNS
 * ------------------------------------------------------------------ */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    // Node returns a Timeout object; jsdom/browser timers have no unref.
    ;(timer as unknown as { unref?: () => void }).unref?.()
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

async function verifyRdns(agent: string, ip: string, deps: VerifyDeps): Promise<string | null> {
  const suffixes = RDNS_SUFFIXES[agent]
  if (!suffixes) return null

  const target = ipToBigInt(ip)
  if (!target) return null

  try {
    const names = await withTimeout(deps.dns.reverse(ip), 2000)
    for (const name of names) {
      const host = name.toLowerCase().replace(/\.$/, '')
      if (!suffixes.some((s) => host.endsWith(s))) continue
      // Forward-confirm: PTR alone is attacker-controlled; the A/AAAA of the
      // claimed hostname must resolve back to the same address.
      const addresses = await withTimeout(deps.dns.lookup(host), 2000)
      if (
        addresses.some((a) => {
          const parsed = ipToBigInt(a)
          return parsed !== null && parsed.size === target.size && parsed.value === target.value
        })
      ) {
        return host
      }
    }
  } catch {
    // DNS failure is absence of evidence, never evidence of impersonation.
  }
  return null
}

/* ------------------------------------------------------------------ *
 * 5. Web Bot Auth (RFC 9421 HTTP Message Signatures)
 * ------------------------------------------------------------------ */

interface SignatureParts {
  /** The parsed inner list, re-serialized canonically for the signature base. */
  innerList: InnerList
  covered: Item[]
  keyid: string
  signature: Uint8Array<ArrayBuffer>
  agentUrl: string
}

/** Decode into a plain ArrayBuffer-backed view, which is what WebCrypto wants. */
function toArrayBufferView(buf: ArrayBuffer | Buffer): Uint8Array<ArrayBuffer> {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  const out = new Uint8Array(new ArrayBuffer(bytes.length))
  out.set(bytes)
  return out
}

function parseSignatureHeaders(headers: Headers, deps: VerifyDeps): SignatureParts | null {
  const inputHeader = headers.get('signature-input')
  const sigHeader = headers.get('signature')
  const agentHeader = headers.get('signature-agent')
  if (!inputHeader || !sigHeader || !agentHeader) return null

  try {
    const inputDict = parseDictionary(inputHeader)
    const sigDict = parseDictionary(sigHeader)

    for (const [label, entry] of inputDict) {
      const [value, params] = entry
      if (!Array.isArray(value)) continue // Item, not InnerList — not a signature
      if (params.get('tag') !== 'web-bot-auth') continue

      const keyid = params.get('keyid')
      if (typeof keyid !== 'string') return null

      const expires = params.get('expires')
      if (typeof expires === 'number' && expires * 1000 < deps.now()) return null

      const sigEntry = sigDict.get(label)
      if (!sigEntry) return null
      const [sigValue] = sigEntry
      if (!(sigValue instanceof ArrayBuffer)) return null

      const [agentValue] = parseItem(agentHeader.trim())
      if (typeof agentValue !== 'string') return null

      return {
        innerList: entry as InnerList,
        covered: value,
        keyid,
        signature: toArrayBufferView(sigValue),
        agentUrl: agentValue,
      }
    }
  } catch {
    return null
  }
  return null
}

function buildSignatureBase(parts: SignatureParts, req: Request, headers: Headers): string | null {
  const lines: string[] = []
  for (const item of parts.covered) {
    const [component, itemParams] = item
    if (typeof component !== 'string' || itemParams.size > 0) return null // e.g. @query-param;name=…

    let value: string | null
    if (component === '@authority') value = new URL(req.url).host.toLowerCase()
    else if (component === '@method') value = req.method.toUpperCase()
    else if (component === '@target-uri') value = req.url
    else if (component === '@path') value = new URL(req.url).pathname
    else if (component.startsWith('@')) return null // unsupported derived component
    else value = headers.get(component)
    if (value === null) return null

    lines.push(`${serializeItem(item)}: ${value.trim()}`)
  }
  lines.push(`"@signature-params": ${serializeInnerList(parts.innerList)}`)
  return lines.join('\n')
}

interface Jwk {
  kid?: string
  kty?: string
  crv?: string
  x?: string
}

async function getSigningKey(
  agentUrl: string,
  keyid: string,
  deps: VerifyDeps
): Promise<Jwk | null> {
  let origin: string
  try {
    origin = new URL(agentUrl.includes('://') ? agentUrl : `https://${agentUrl}`).origin
  } catch {
    return null
  }

  const cached = keyCache.get(origin)
  let keys = cached && deps.now() - cached.fetchedAt < RANGE_TTL_MS ? cached.keys : null

  if (!keys) {
    try {
      const res = await deps.fetchImpl(`${origin}/.well-known/http-message-signatures-directory`, {
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) return null
      const body = (await res.json()) as { keys?: Jwk[] }
      keys = body.keys ?? []
      keyCache.set(origin, { keys, fetchedAt: deps.now() })
    } catch {
      return null
    }
  }

  return keys.find((k) => k.kid === keyid && k.kty === 'OKP' && k.crv === 'Ed25519') ?? null
}

async function verifySignature(
  req: Request,
  deps: VerifyDeps
): Promise<{ ok: boolean; agentUrl?: string }> {
  const parts = parseSignatureHeaders(req.headers, deps)
  if (!parts) return { ok: false }

  const jwk = await getSigningKey(parts.agentUrl, parts.keyid, deps)
  if (!jwk?.x) return { ok: false }

  const base = buildSignatureBase(parts, req, req.headers)
  if (base === null) return { ok: false }

  try {
    const raw = toArrayBufferView(Buffer.from(jwk.x, 'base64url'))
    const key = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify'])
    const ok = await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      parts.signature,
      new TextEncoder().encode(base)
    )
    return { ok, agentUrl: parts.agentUrl }
  } catch {
    return { ok: false }
  }
}

/* ------------------------------------------------------------------ *
 * 6. The public entry point
 * ------------------------------------------------------------------ */

/**
 * @param claimedAgent whatever `classifyAiCrawler()` read out of the UA (its `token`)
 * @param clientIp     Vercel's `x-real-ip` — never a client-suppliable header
 */
export async function verifyCrawler(
  req: Request,
  claimedAgent: string | null,
  clientIp: string | null,
  deps: VerifyDeps = defaultDeps
): Promise<VerificationResult> {
  // A valid signature is the strongest evidence and does not depend on the UA.
  const signed = await verifySignature(req, deps)
  if (signed.ok) {
    return {
      agent: claimedAgent,
      verdict: 'verified-signature',
      evidence: signed.agentUrl ?? 'web-bot-auth',
    }
  }

  if (!claimedAgent) return { agent: null, verdict: 'unknown-agent', evidence: null }

  if (TOKEN_ONLY.has(claimedAgent)) {
    return {
      agent: claimedAgent,
      verdict: 'impersonated',
      evidence: 'token-only agent never fetches',
    }
  }

  const cidrs = await getRanges(claimedAgent, deps)

  if (cidrs && clientIp) {
    if (cidrs.some((c) => inCidr(clientIp, c))) {
      return { agent: claimedAgent, verdict: 'verified-ip', evidence: RANGE_FEEDS[claimedAgent] }
    }
    // Not in the published ranges. Before the harshest verdict, try the
    // vendor's documented rDNS — feeds go stale before vendors stop adding IPs.
    const rdnsHost = await verifyRdns(claimedAgent, clientIp, deps)
    if (rdnsHost) {
      return { agent: claimedAgent, verdict: 'verified-rdns', evidence: rdnsHost }
    }
    return { agent: claimedAgent, verdict: 'impersonated', evidence: RANGE_FEEDS[claimedAgent] }
  }

  if (RANGE_FEEDS[claimedAgent]) {
    // A feed exists but was unreachable (or no client IP): absence of
    // evidence, not evidence of impersonation.
    return { agent: claimedAgent, verdict: 'unverifiable', evidence: 'feed unavailable' }
  }

  return { agent: claimedAgent, verdict: 'unverifiable', evidence: 'no published feed' }
}
