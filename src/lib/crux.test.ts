import { describe, expect, it } from 'vitest'
import {
  METRIC_SPECS,
  formatMetric,
  parseCruxReport,
  parseOrigin,
  rate,
  type MetricResult,
} from './crux'

// Uma resposta reduzida da API do CrUX, no formato real: p75 numérico para
// tempo, STRING para CLS, e histograma de três faixas com densidades 0–1.
const cruxPayload = {
  record: {
    key: { origin: 'https://exemplo.com.br', formFactor: 'PHONE' },
    metrics: {
      largest_contentful_paint: {
        histogram: [{ density: 0.72 }, { density: 0.19 }, { density: 0.09 }],
        percentiles: { p75: 2900 },
      },
      interaction_to_next_paint: {
        histogram: [{ density: 0.9 }, { density: 0.08 }, { density: 0.02 }],
        percentiles: { p75: 150 },
      },
      cumulative_layout_shift: {
        histogram: [{ density: 0.6 }, { density: 0.2 }, { density: 0.2 }],
        percentiles: { p75: '0.31' },
      },
      experimental_time_to_first_byte: {
        histogram: [{ density: 0.5 }, { density: 0.3 }, { density: 0.2 }],
        percentiles: { p75: 810 },
      },
    },
    collectionPeriod: {
      firstDate: { year: 2026, month: 6, day: 29 },
      lastDate: { year: 2026, month: 7, day: 26 },
    },
  },
}

describe('parseOrigin', () => {
  it('accepts a bare domain and assumes https', () => {
    expect(parseOrigin('exemplo.com.br')).toEqual({ ok: true, origin: 'https://exemplo.com.br' })
  })

  it('drops the path but keeps the port', () => {
    expect(parseOrigin('https://exemplo.com.br/blog/post?x=1')).toEqual({
      ok: true,
      origin: 'https://exemplo.com.br',
    })
    expect(parseOrigin('https://exemplo.com.br:8443/x')).toEqual({
      ok: true,
      origin: 'https://exemplo.com.br:8443',
    })
  })

  it('never strips www', () => {
    // Para o CrUX são origens diferentes, com dados diferentes. "Consertar"
    // isto devolveria o resultado de outro site sem avisar ninguém.
    expect(parseOrigin('www.exemplo.com.br')).toEqual({
      ok: true,
      origin: 'https://www.exemplo.com.br',
    })
  })

  it('preserves http when it was explicit', () => {
    expect(parseOrigin('http://exemplo.com.br')).toEqual({
      ok: true,
      origin: 'http://exemplo.com.br',
    })
  })

  it('rejects what the dataset can never answer', () => {
    for (const input of ['', '   ', 'localhost:3000', 'meu-servidor', 'não é url']) {
      expect(parseOrigin(input).ok, `should reject "${input}"`).toBe(false)
    }
  })

  it('rejects credentials in the address', () => {
    const result = parseOrigin('https://user:senha@exemplo.com.br')
    expect(result.ok).toBe(false)
  })
})

describe('rate', () => {
  const spec = (id: string) => METRIC_SPECS.find((s) => s.id === id)!

  it('uses the published field thresholds, not this repo lab budgets', () => {
    // CLAUDE.md §6: o orçamento de lab (LCP < 2,0s) é deliberadamente mais
    // rígido que o limiar de campo (2,5s). A ferramenta ensina o de campo.
    expect(rate(spec('lcp'), 2400)).toBe('good')
    expect(rate(spec('lcp'), 2500)).toBe('good')
    expect(rate(spec('lcp'), 2501)).toBe('needs-improvement')
    expect(rate(spec('lcp'), 4000)).toBe('poor')
  })

  it('rates INP and CLS on their own scales', () => {
    expect(rate(spec('inp'), 200)).toBe('good')
    expect(rate(spec('inp'), 499)).toBe('needs-improvement')
    expect(rate(spec('inp'), 500)).toBe('poor')
    expect(rate(spec('cls'), 0.1)).toBe('good')
    expect(rate(spec('cls'), 0.24)).toBe('needs-improvement')
    expect(rate(spec('cls'), 0.25)).toBe('poor')
  })
})

describe('parseCruxReport', () => {
  const report = parseCruxReport(cruxPayload, 'https://exemplo.com.br', 'PHONE')

  it('reads the p75 of every metric present', () => {
    expect(report.metrics.map((m) => m.id)).toEqual(['lcp', 'inp', 'cls', 'ttfb'])
    expect(report.metrics.find((m) => m.id === 'lcp')?.p75).toBe(2900)
  })

  it('parses a percentile that arrives as a string', () => {
    const cls = report.metrics.find((m) => m.id === 'cls')!
    expect(cls.p75).toBe(0.31)
    expect(cls.rating).toBe('poor')
  })

  it('turns histogram densities into percentages', () => {
    expect(report.metrics.find((m) => m.id === 'lcp')?.distribution).toEqual({
      good: 72,
      needsImprovement: 19,
      poor: 9,
    })
  })

  it('converts the collection period to ISO dates', () => {
    expect(report.period).toEqual({ firstDate: '2026-06-29', lastDate: '2026-07-26' })
  })

  it('omits a missing metric instead of reporting it as zero', () => {
    // O CrUX serve LCP sem INP com frequência. Zero seria lido como perfeito.
    expect(report.metrics.find((m) => m.id === 'fcp')).toBeUndefined()
  })

  it('reports the lcp bucket for the key event', () => {
    expect(report.lcpBucket).toBe('needs-improvement')
  })

  it('reports no-data when the origin is absent from the dataset', () => {
    // O caso mais comum em site novo — e o resultado que o próprio baseline
    // deste repo registrou em 2026-07-20.
    const empty = parseCruxReport({}, 'https://novo.com.br', 'PHONE')
    expect(empty.metrics).toEqual([])
    expect(empty.lcpBucket).toBe('no-data')
    expect(empty.period).toEqual({ firstDate: '', lastDate: '' })
  })
})

describe('formatMetric', () => {
  const metric = (over: Partial<MetricResult>): MetricResult => ({
    id: 'lcp',
    label: 'LCP',
    unit: 'ms',
    core: true,
    p75: 2900,
    rating: 'needs-improvement',
    goodMax: 2500,
    poorMin: 4000,
    distribution: { good: 0, needsImprovement: 0, poor: 0 },
    ...over,
  })

  it('shows seconds above 1s and milliseconds below', () => {
    expect(formatMetric(metric({ p75: 2900 }))).toBe('2,90 s')
    expect(formatMetric(metric({ p75: 150 }))).toBe('150 ms')
  })

  it('shows CLS as a unitless score', () => {
    expect(formatMetric(metric({ id: 'cls', unit: 'score', p75: 0.31 }))).toBe('0,31')
  })
})
