// @vitest-environment node
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  CONTROL_KINDS,
  DERIVED_PROBES,
  controlCode,
  controlPaths,
  controlProbeForPath,
  controlSlug,
  isControlPath,
  labHitParams,
  normalizeRound,
  probeSlug,
  resolveProbe,
} from './lab-probes'

// Um slug de teste, público de propósito: nunca é o de produção.
const SLUG = 'test-control-0123456789abcdef'

describe('controlSlug', () => {
  it('reads the slug from the environment', () => {
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: SLUG })).toBe(SLUG)
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: `  ${SLUG}  ` })).toBe(SLUG)
  })

  it('fails safe: unset, short or URL-unsafe slugs disable the route', () => {
    expect(controlSlug({})).toBeNull()
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: '' })).toBeNull()
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: 'too-short' })).toBeNull()
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: 'Upper-Case-Slug-0123456' })).toBeNull()
    expect(controlSlug({ LAB_PROBE_CONTROL_SLUG: 'has/slash/0123456789abc' })).toBeNull()
  })
})

describe('normalizeRound', () => {
  it('pads rounds to two digits', () => {
    expect(normalizeRound('7')).toBe('07')
    expect(normalizeRound('12')).toBe('12')
    expect(normalizeRound(['3', '4'])).toBe('03')
  })

  it('falls back to 00 for anything else', () => {
    expect(normalizeRound(undefined)).toBe('00')
    expect(normalizeRound('')).toBe('00')
    expect(normalizeRound('abc')).toBe('00')
    expect(normalizeRound('1234')).toBe('00')
  })
})

describe('controlCode', () => {
  it('has the documented shape: PREFIX-XXXX-XXXX in Crockford base32', () => {
    for (const kind of CONTROL_KINDS) {
      expect(controlCode(SLUG, '01', kind)).toMatch(
        new RegExp(`^${kind}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$`)
      )
    }
  })

  it('is deterministic for a slug, round and kind', () => {
    expect(controlCode(SLUG, '01', 'SRV')).toBe(controlCode(SLUG, '01', 'SRV'))
  })

  it('changes with the round, the kind and the slug', () => {
    const codes = new Set<string>()
    for (let r = 0; r <= 15; r++) {
      for (const kind of CONTROL_KINDS) {
        codes.add(controlCode(SLUG, String(r).padStart(2, '0'), kind).slice(-9))
      }
    }
    // 16 rounds × 4 kinds, all distinct even without the prefix.
    expect(codes.size).toBe(64)
    expect(controlCode(SLUG, '01', 'SRV')).not.toBe(
      controlCode('other-control-0123456789abcd', '01', 'SRV')
    )
  })
})

describe('control paths', () => {
  it('covers the page and the JS endpoint, nothing else', () => {
    expect(controlPaths(SLUG)).toEqual({ page: `/lab/${SLUG}`, js: `/lab/${SLUG}/c` })
    expect(isControlPath(`/lab/${SLUG}`, SLUG)).toBe(true)
    expect(isControlPath(`/lab/${SLUG}/c`, SLUG)).toBe(true)
    expect(isControlPath(`/lab/${SLUG}/x`, SLUG)).toBe(false)
    expect(isControlPath('/lab/trap-r-7fk3q9zj', SLUG)).toBe(false)
    expect(isControlPath(`/lab/${SLUG}`, null)).toBe(false)
  })
})

describe('derived probes (H16)', () => {
  it('gives each assistant its own opaque, URL-safe slug', () => {
    const slugs = DERIVED_PROBES.map((name) => probeSlug(SLUG, name))
    expect(new Set(slugs).size).toBe(DERIVED_PROBES.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^p-[0-9a-f]{24}$/)
      expect(slug).not.toContain(SLUG)
    }
    // Rotating the base slug moves every probe URL.
    expect(probeSlug('other-control-0123456789abcd', 'grok')).not.toBe(probeSlug(SLUG, 'grok'))
  })

  it('resolves the H15 slug and every derived probe, nothing else', () => {
    expect(resolveProbe(SLUG, SLUG)).toEqual({ name: 'h15', slug: SLUG })
    for (const name of DERIVED_PROBES) {
      const slug = probeSlug(SLUG, name)
      expect(resolveProbe(slug, SLUG)).toEqual({ name, slug })
    }
    expect(resolveProbe('p-000000000000000000000000', SLUG)).toBeNull()
    expect(resolveProbe(probeSlug(SLUG, 'grok'), null)).toBeNull()
  })

  it('gives each probe its own codes for the same round', () => {
    const codes = DERIVED_PROBES.map((name) => controlCode(probeSlug(SLUG, name), '18', 'SRV'))
    expect(new Set([...codes, controlCode(SLUG, '18', 'SRV')]).size).toBe(DERIVED_PROBES.length + 1)
  })

  it('maps a path to its probe and endpoint', () => {
    const grok = probeSlug(SLUG, 'grok')
    expect(controlProbeForPath(`/lab/${grok}`, SLUG)).toEqual({ name: 'grok', slug: grok, endpoint: 'page' })
    expect(controlProbeForPath(`/lab/${grok}/c`, SLUG)).toEqual({ name: 'grok', slug: grok, endpoint: 'js' })
    expect(controlProbeForPath(`/lab/${SLUG}/c`, SLUG)?.name).toBe('h15')
    expect(controlProbeForPath(`/lab/${grok}/x`, SLUG)).toBeNull()
    expect(controlProbeForPath(`/blog/${grok}`, SLUG)).toBeNull()
    expect(isControlPath(`/lab/${probeSlug(SLUG, 'gemini')}`, SLUG)).toBe(true)
  })
})

describe('labHitParams', () => {
  const grok = { name: 'grok' as const, slug: probeSlug(SLUG, 'grok'), endpoint: 'page' as const }
  const url = new URL(`https://seotecnico.dev.br/lab/${grok.slug}?r=18`)
  const CHROME =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

  it('splits a long user agent at GA4’s 100-character limit and keeps it whole', () => {
    const params = labHitParams(
      grok,
      url,
      new Headers({
        'user-agent': CHROME,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
        'x-vercel-ip-country': 'US',
      }),
      'none'
    )
    expect(params).toEqual({
      lab_probe: 'grok',
      lab_round: '18',
      lab_endpoint: 'page',
      lab_ua_1: CHROME.slice(0, 100),
      lab_ua_2: CHROME.slice(100),
      lab_accept: 'text/html,application/xhtml+xml',
      lab_accept_lang: 'en-US,en;q=0.9',
      lab_ip_owner: 'none',
      lab_country: 'US',
    })
    expect(params.lab_ua_1 + params.lab_ua_2).toBe(CHROME)
  })

  it('marks absent headers as (none) and omits an empty second half', () => {
    const params = labHitParams({ ...grok, endpoint: 'js' }, new URL('https://x.test/lab/p'), new Headers({ 'user-agent': 'curl/8.7.1' }), 'unknown')
    expect(params).toEqual({
      lab_probe: 'grok',
      lab_round: '00',
      lab_endpoint: 'js',
      lab_ua_1: 'curl/8.7.1',
      lab_accept: '(none)',
      lab_accept_lang: '(none)',
      lab_ip_owner: 'unknown',
      lab_country: '(none)',
    })
    expect(labHitParams(grok, url, new Headers(), 'none').lab_ua_1).toBe('(none)')
  })

  it('never sends a value longer than GA4 accepts', () => {
    const long = 'x'.repeat(450)
    const params = labHitParams(grok, url, new Headers({ 'user-agent': long, accept: long, 'accept-language': long }), 'none')
    for (const value of Object.values(params)) expect(value.length).toBeLessThanOrEqual(100)
  })
})

describe('scripts/lab-control-codes.mjs', () => {
  it('prints exactly the codes the site serves', () => {
    const script = path.resolve(__dirname, '../../scripts/lab-control-codes.mjs')
    const output = execFileSync(process.execPath, [script, '3'], {
      env: { ...process.env, LAB_PROBE_CONTROL_SLUG: SLUG },
      encoding: 'utf8',
    })
    const expected = ['00', '01', '02', '03']
      .map((round) => [round, ...CONTROL_KINDS.map((kind) => controlCode(SLUG, round, kind))].join('\t'))
      .join('\n')
    expect(output.trim()).toBe(expected)
  })

  it('prints each probe path and its scheduled rounds exactly as the site serves them', () => {
    const script = path.resolve(__dirname, '../../scripts/lab-control-codes.mjs')
    const output = execFileSync(process.execPath, [script, '--probes'], {
      env: { ...process.env, LAB_PROBE_CONTROL_SLUG: SLUG },
      encoding: 'utf8',
    })
    const schedule: Record<(typeof DERIVED_PROBES)[number], number[]> = {
      owner: [0],
      gemini: [16, 19, 22, 25, 28],
      deepseek: [17, 20, 23, 26, 29],
      grok: [18, 21, 24, 27, 30],
    }
    const expected = DERIVED_PROBES.flatMap((name) => {
      const slug = probeSlug(SLUG, name)
      return [
        `# ${name}\t/lab/${slug}`,
        ...schedule[name].map((r) => {
          const round = String(r).padStart(2, '0')
          return [round, ...CONTROL_KINDS.map((kind) => controlCode(slug, round, kind))].join('\t')
        }),
      ]
    }).join('\n')
    expect(output.trim()).toBe(expected)
  })
})
