import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LCPMetricWithAttribution } from 'web-vitals/attribution'

vi.mock('web-vitals/attribution', () => ({
  onLCP: vi.fn(),
}))

import { onLCP } from 'web-vitals/attribution'
import { initRum, reportLCP } from './rum'

function makeMetric(
  overrides: Partial<LCPMetricWithAttribution> = {},
  attributionOverrides: Partial<LCPMetricWithAttribution['attribution']> = {},
): LCPMetricWithAttribution {
  return {
    name: 'LCP',
    value: 1234.56,
    rating: 'good',
    delta: 1234.56,
    id: 'v5-1234',
    entries: [],
    navigationType: 'navigate',
    attribution: {
      target: 'main > p.intro',
      timeToFirstByte: 100.4,
      resourceLoadDelay: 0.2,
      resourceLoadDuration: 0,
      elementRenderDelay: 1133.9,
      ...attributionOverrides,
    },
    ...overrides,
  } as LCPMetricWithAttribution
}

beforeEach(() => {
  window.dataLayer = []
})

describe('reportLCP', () => {
  it('pushes a web_vitals event with rounded values and the subparts', () => {
    reportLCP(makeMetric())

    expect(window.dataLayer).toEqual([
      {
        event: 'web_vitals',
        metric_name: 'LCP',
        metric_id: 'v5-1234',
        metric_value: 1235,
        metric_rating: 'good',
        lcp_element: 'main > p.intro',
        lcp_ttfb: 100,
        lcp_load_delay: 0,
        lcp_load_duration: 0,
        lcp_render_delay: 1134,
      },
    ])
  })

  it('truncates the element selector to the GA4 100-char param limit', () => {
    reportLCP(makeMetric({}, { target: 'div.x'.repeat(40) }))

    const event = (window.dataLayer as { lcp_element: string }[])[0]
    expect(event.lcp_element).toHaveLength(100)
  })

  it('falls back to a placeholder when there is no target selector', () => {
    reportLCP(makeMetric({}, { target: undefined }))

    const event = (window.dataLayer as { lcp_element: string }[])[0]
    expect(event.lcp_element).toBe('(unknown)')
  })
})

describe('initRum', () => {
  it('registers the LCP observer only once across repeated calls', () => {
    initRum()
    initRum()

    expect(onLCP).toHaveBeenCalledTimes(1)
    expect(onLCP).toHaveBeenCalledWith(reportLCP)
  })
})
