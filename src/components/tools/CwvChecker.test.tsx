import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CwvChecker } from './CwvChecker'
import { parseCruxReport } from '@/lib/crux'

// Contrato de interação da UI do checador. Limiares e leitura da resposta têm
// teste próprio (crux.test.ts); aqui a rota /api/checador-cwv é simulada — o
// teste nunca toca a rede — e o relatório é montado pelo mesmo parseCruxReport
// que a rota usa, para a UI receber exatamente o formato real.

function histogram(good: number, mid: number, poor: number) {
  return [{ density: good }, { density: mid }, { density: poor }]
}

const report = {
  ...parseCruxReport(
    {
      record: {
        metrics: {
          // Um valor em cada faixa: bom, precisa melhorar, ruim.
          largest_contentful_paint: { percentiles: { p75: 2500 }, histogram: histogram(0.8, 0.15, 0.05) },
          interaction_to_next_paint: { percentiles: { p75: 201 }, histogram: histogram(0.7, 0.2, 0.1) },
          cumulative_layout_shift: { percentiles: { p75: '0.25' }, histogram: histogram(0.5, 0.2, 0.3) },
        },
        collectionPeriod: {
          firstDate: { year: 2026, month: 9, day: 1 },
          lastDate: { year: 2026, month: 9, day: 28 },
        },
      },
    },
    'https://exemplo.dev',
    'DESKTOP'
  ),
  inDataset: true,
}

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  window.dataLayer = []
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('CwvChecker', () => {
  it('classifica cada métrica pela faixa e empurra só o lcp_bucket', async () => {
    const fetchMock = mockFetch(report)
    const user = userEvent.setup()
    render(<CwvChecker />)

    await user.type(screen.getByLabelText(/endereço do site/i), 'exemplo.dev')
    await user.click(screen.getByRole('button', { name: /consultar/i }))

    const cards = await screen.findAllByRole('listitem')
    expect(cards).toHaveLength(3)
    const [lcp, inp, cls] = cards
    expect(within(lcp).getByText('2,50 s')).toBeTruthy()
    expect(within(lcp).getByText('Bom')).toBeTruthy()
    expect(within(inp).getByText('201 ms')).toBeTruthy()
    expect(within(inp).getByText('Precisa melhorar')).toBeTruthy()
    expect(within(cls).getByText('0,25')).toBeTruthy()
    expect(within(cls).getByText('Ruim')).toBeTruthy()

    expect(fetchMock.mock.calls[0][0]).toContain('formFactor=PHONE')
    expect(window.dataLayer).toEqual([{ event: 'tool_check_cwv', lcp_bucket: 'good' }])
  })

  it('o seletor de dispositivo alterna aria-pressed e o formFactor da consulta', async () => {
    const fetchMock = mockFetch(report)
    const user = userEvent.setup()
    render(<CwvChecker />)

    const phone = screen.getByRole('button', { name: /celular/i })
    const desktop = screen.getByRole('button', { name: /desktop/i })
    expect(phone.getAttribute('aria-pressed')).toBe('true')
    expect(desktop.getAttribute('aria-pressed')).toBe('false')

    await user.click(desktop)
    expect(phone.getAttribute('aria-pressed')).toBe('false')
    expect(desktop.getAttribute('aria-pressed')).toBe('true')

    await user.type(screen.getByLabelText(/endereço do site/i), 'exemplo.dev')
    await user.click(screen.getByRole('button', { name: /consultar/i }))
    await screen.findAllByRole('listitem')
    expect(fetchMock.mock.calls[0][0]).toContain('formFactor=DESKTOP')
  })

  it('trata origem fora do CrUX como resposta, não como erro', async () => {
    mockFetch({ ...report, metrics: [], lcpBucket: 'no-data', inDataset: false })
    const user = userEvent.setup()
    render(<CwvChecker lang="en" />)

    await user.type(screen.getByLabelText(/site address/i), 'tiny-site.dev')
    await user.click(screen.getByRole('button', { name: /check/i }))

    expect(await screen.findByText(/not in the crux dataset yet/i)).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(window.dataLayer).toEqual([{ event: 'tool_check_cwv', lcp_bucket: 'no-data' }])
  })
})
