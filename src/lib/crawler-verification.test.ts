import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import { parseDictionary, serializeInnerList, type InnerList } from 'structured-headers'
import {
  clearVerificationCaches,
  inCidr,
  ipToBigInt,
  parseCidr,
  verifyCrawler,
  type VerifyDeps,
} from './crawler-verification'

// jsdom fornece `crypto.getRandomValues` mas não `crypto.subtle`; o runtime
// real (Node na Vercel) tem os dois. Os testes de assinatura usam o WebCrypto
// do próprio Node.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
  }
})

beforeEach(() => {
  clearVerificationCaches()
})

/* ------------------------------------------------------------------ *
 * CIDR
 * ------------------------------------------------------------------ */

describe('parseCidr / inCidr', () => {
  it('matches IPv4 boundary addresses of a /24', () => {
    const cidr = parseCidr('192.168.1.0/24')!
    expect(inCidr('192.168.1.0', cidr)).toBe(true)
    expect(inCidr('192.168.1.255', cidr)).toBe(true)
    expect(inCidr('192.168.0.255', cidr)).toBe(false)
    expect(inCidr('192.168.2.0', cidr)).toBe(false)
  })

  it('treats /32 as exact match and bare address as /32', () => {
    const cidr = parseCidr('10.1.2.3/32')!
    expect(inCidr('10.1.2.3', cidr)).toBe(true)
    expect(inCidr('10.1.2.4', cidr)).toBe(false)
    expect(parseCidr('10.1.2.3')).toEqual(cidr)
  })

  it('matches IPv6 boundary addresses of a /32', () => {
    const cidr = parseCidr('2001:db8::/32')!
    expect(inCidr('2001:db8::', cidr)).toBe(true)
    expect(inCidr('2001:db8::1', cidr)).toBe(true)
    expect(inCidr('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff', cidr)).toBe(true)
    expect(inCidr('2001:db9::', cidr)).toBe(false)
  })

  it('never matches across address families', () => {
    expect(inCidr('192.168.1.1', parseCidr('2001:db8::/32')!)).toBe(false)
    expect(inCidr('2001:db8::1', parseCidr('192.168.1.0/24')!)).toBe(false)
  })

  it('reads the IPv4-mapped mixed form as the address it denotes', () => {
    // `::ffff:a.b.c.d` (RFC 4291 §2.2.3) é como um socket dual stack reporta um
    // par v4. Antes de ser tratada, a forma virava null e escapava de toda
    // comparação de faixa.
    expect(ipToBigInt('::ffff:127.0.0.1')?.value).toBe(ipToBigInt('::ffff:7f00:1')?.value)
    expect(ipToBigInt('::ffff:127.0.0.1')?.size).toBe(128)
    expect(inCidr('::ffff:10.0.0.1', parseCidr('::ffff:0:0/96')!)).toBe(true)
    expect(inCidr('::ffff:8.8.8.8', parseCidr('fc00::/7')!)).toBe(false)
    // Ainda é v6: não casa com uma faixa v4, nem inventa um endereço inválido.
    expect(inCidr('::ffff:10.0.0.1', parseCidr('10.0.0.0/8')!)).toBe(false)
    expect(ipToBigInt('::ffff:999.0.0.1')).toBeNull()
  })

  it('rejects malformed input instead of guessing', () => {
    expect(parseCidr('999.1.1.1/24')).toBeNull()
    expect(parseCidr('10.0.0.0/33')).toBeNull()
    expect(parseCidr('10.0.0.0/8/9')).toBeNull()
    expect(parseCidr('not-an-ip')).toBeNull()
    expect(ipToBigInt('1.2.3')).toBeNull()
    expect(ipToBigInt('2001:db8:::1')).toBeNull()
    expect(ipToBigInt('gggg::1')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * Verdicts
 * ------------------------------------------------------------------ */

const GPTBOT_FEED = 'https://openai.com/gptbot.json'
const BINGBOT_FEED = 'https://www.bing.com/toolbox/bingbot.json'

interface DepsOptions {
  feeds?: Record<string, unknown>
  failFeeds?: boolean
  reverse?: (ip: string) => Promise<string[]>
  lookup?: (hostname: string) => Promise<string[]>
  now?: () => number
}

function makeDeps(opts: DepsOptions = {}): VerifyDeps & { feedFetches: string[] } {
  const feedFetches: string[] = []
  return {
    feedFetches,
    fetchImpl: (async (input: RequestInfo | URL) => {
      const url = String(input)
      feedFetches.push(url)
      if (opts.failFeeds) throw new Error('network down')
      const body = opts.feeds?.[url]
      if (body === undefined) return new Response('not found', { status: 404 })
      return new Response(JSON.stringify(body), { status: 200 })
    }) as typeof fetch,
    dns: {
      reverse: opts.reverse ?? (async () => []),
      lookup: opts.lookup ?? (async () => []),
    },
    now: opts.now ?? (() => Date.now()),
  }
}

function plainRequest(): Request {
  return new Request('https://seotecnico.dev.br/blog/inp-nextjs')
}

describe('verifyCrawler — verdict matrix', () => {
  it('returns unknown-agent when nothing is claimed and nothing is signed', async () => {
    const result = await verifyCrawler(plainRequest(), null, '1.2.3.4', makeDeps())
    expect(result).toEqual({ agent: null, verdict: 'unknown-agent', evidence: null })
  })

  it('NEVER reports a vendor with no published feed as impersonation', async () => {
    for (const agent of ['CCBot', 'ClaudeBot', 'Bytespider', 'meta-externalagent']) {
      const result = await verifyCrawler(plainRequest(), agent, '1.2.3.4', makeDeps())
      expect(result.verdict).toBe('unverifiable')
      expect(result.evidence).toBe('no published feed')
    }
  })

  it('reports token-only robots tokens as impersonated by construction', async () => {
    for (const agent of ['Google-Extended', 'Applebot-Extended']) {
      const result = await verifyCrawler(plainRequest(), agent, '1.2.3.4', makeDeps())
      expect(result.verdict).toBe('impersonated')
      expect(result.evidence).toBe('token-only agent never fetches')
    }
  })

  it('verifies an IP inside the vendor feed as verified-ip', async () => {
    const deps = makeDeps({
      feeds: { [GPTBOT_FEED]: { prefixes: [{ ipv4Prefix: '20.15.240.0/20' }] } },
    })
    const result = await verifyCrawler(plainRequest(), 'GPTBot', '20.15.240.7', deps)
    expect(result.verdict).toBe('verified-ip')
    expect(result.evidence).toBe(GPTBOT_FEED)
  })

  it('reports an IP outside the feed as impersonated when no rDNS exists', async () => {
    const deps = makeDeps({
      feeds: { [GPTBOT_FEED]: { prefixes: [{ ipv4Prefix: '20.15.240.0/20' }] } },
    })
    const result = await verifyCrawler(plainRequest(), 'GPTBot', '203.0.113.9', deps)
    expect(result.verdict).toBe('impersonated')
    expect(result.evidence).toBe(GPTBOT_FEED)
  })

  it('falls back to unverifiable — not impersonated — when the feed is unreachable', async () => {
    const result = await verifyCrawler(
      plainRequest(),
      'GPTBot',
      '203.0.113.9',
      makeDeps({ failFeeds: true })
    )
    expect(result.verdict).toBe('unverifiable')
    expect(result.evidence).toBe('feed unavailable')
  })

  it('stays unverifiable when there is no client IP to check', async () => {
    const deps = makeDeps({
      feeds: { [GPTBOT_FEED]: { prefixes: [{ ipv4Prefix: '20.15.240.0/20' }] } },
    })
    const result = await verifyCrawler(plainRequest(), 'GPTBot', null, deps)
    expect(result.verdict).toBe('unverifiable')
  })

  it('rescues a stale-feed miss via forward-confirmed rDNS (verified-rdns)', async () => {
    const deps = makeDeps({
      feeds: { [BINGBOT_FEED]: { prefixes: [{ ipv4Prefix: '157.55.39.0/24' }] } },
      reverse: async () => ['msnbot-40-77-167-1.search.msn.com'],
      lookup: async () => ['40.77.167.1'],
    })
    const result = await verifyCrawler(plainRequest(), 'Bingbot', '40.77.167.1', deps)
    expect(result.verdict).toBe('verified-rdns')
    expect(result.evidence).toBe('msnbot-40-77-167-1.search.msn.com')
  })

  it('rejects a PTR that fails forward confirmation', async () => {
    const deps = makeDeps({
      feeds: { [BINGBOT_FEED]: { prefixes: [{ ipv4Prefix: '157.55.39.0/24' }] } },
      reverse: async () => ['msnbot-40-77-167-1.search.msn.com'],
      lookup: async () => ['198.51.100.50'], // resolves elsewhere — PTR is attacker-controlled
    })
    const result = await verifyCrawler(plainRequest(), 'Bingbot', '40.77.167.1', deps)
    expect(result.verdict).toBe('impersonated')
  })

  it('rejects a PTR outside the documented suffix', async () => {
    const deps = makeDeps({
      feeds: { [BINGBOT_FEED]: { prefixes: [{ ipv4Prefix: '157.55.39.0/24' }] } },
      reverse: async () => ['evil.example.com'],
      lookup: async () => ['40.77.167.1'],
    })
    const result = await verifyCrawler(plainRequest(), 'Bingbot', '40.77.167.1', deps)
    expect(result.verdict).toBe('impersonated')
  })

  it('treats DNS failure as absence of evidence (impersonated only via the feed miss)', async () => {
    const deps = makeDeps({
      feeds: { [BINGBOT_FEED]: { prefixes: [{ ipv4Prefix: '157.55.39.0/24' }] } },
      reverse: async () => {
        throw new Error('SERVFAIL')
      },
    })
    const result = await verifyCrawler(plainRequest(), 'Bingbot', '40.77.167.1', deps)
    expect(result.verdict).toBe('impersonated')
    expect(result.evidence).toBe(BINGBOT_FEED)
  })

  it('caches the vendor feed and serves stale ranges when a refresh fails', async () => {
    let fail = false
    let clock = 0
    const feeds = { [GPTBOT_FEED]: { prefixes: [{ ipv4Prefix: '20.15.240.0/20' }] } }
    const deps: VerifyDeps & { feedFetches: string[] } = {
      ...makeDeps({ feeds }),
      now: () => clock,
    }
    const base = deps.fetchImpl
    deps.fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (fail) throw new Error('network down')
      return base(input, init)
    }) as typeof fetch

    const first = await verifyCrawler(plainRequest(), 'GPTBot', '20.15.240.7', deps)
    expect(first.verdict).toBe('verified-ip')

    // Past the 6h TTL the refresh fails; the stale cache must still verify.
    clock = 7 * 60 * 60 * 1000
    fail = true
    const second = await verifyCrawler(plainRequest(), 'GPTBot', '20.15.240.7', deps)
    expect(second.verdict).toBe('verified-ip')
  })
})

/* ------------------------------------------------------------------ *
 * Web Bot Auth (RFC 9421)
 * ------------------------------------------------------------------ */

const AGENT_URL = 'https://crawler.example.com'
const DIRECTORY_URL = `${AGENT_URL}/.well-known/http-message-signatures-directory`

async function makeSignedRequest(opts: { expiresInSec?: number; tamper?: boolean } = {}) {
  const { publicKey, privateKey } = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey))
  const x = Buffer.from(rawKey).toString('base64url')

  const created = Math.floor(Date.now() / 1000)
  const expires = created + (opts.expiresInSec ?? 300)
  const signatureInput = `sig1=("@authority" "signature-agent");created=${created};expires=${expires};keyid="test-key";tag="web-bot-auth"`

  // Reconstrói a base exatamente como o módulo: serialização canônica SFV.
  const inner = parseDictionary(signatureInput).get('sig1') as InnerList
  const base = [
    `"@authority": seotecnico.dev.br`,
    `"signature-agent": "${AGENT_URL}"`,
    `"@signature-params": ${serializeInnerList(inner)}`,
  ].join('\n')

  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, new TextEncoder().encode(base))
  )
  if (opts.tamper) signature[0] ^= 0xff

  const req = new Request('https://seotecnico.dev.br/blog/inp-nextjs', {
    headers: {
      'signature-input': signatureInput,
      signature: `sig1=:${Buffer.from(signature).toString('base64')}:`,
      'signature-agent': `"${AGENT_URL}"`,
    },
  })

  const deps = makeDeps({
    feeds: { [DIRECTORY_URL]: { keys: [{ kid: 'test-key', kty: 'OKP', crv: 'Ed25519', x }] } },
  })
  return { req, deps }
}

describe('verifyCrawler — Web Bot Auth', () => {
  it('verifies a valid Ed25519 signature regardless of the UA claim', async () => {
    const { req, deps } = await makeSignedRequest()
    const result = await verifyCrawler(req, null, null, deps)
    expect(result.verdict).toBe('verified-signature')
    expect(result.evidence).toBe(AGENT_URL)
  })

  it('rejects an expired signature and falls through to the other paths', async () => {
    const { req, deps } = await makeSignedRequest({ expiresInSec: -10 })
    const result = await verifyCrawler(req, null, null, deps)
    expect(result.verdict).toBe('unknown-agent')
  })

  it('rejects a tampered signature', async () => {
    const { req, deps } = await makeSignedRequest({ tamper: true })
    const result = await verifyCrawler(req, null, null, deps)
    expect(result.verdict).toBe('unknown-agent')
  })
})
