import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MetaValidator } from './MetaValidator'

// Contrato de interação da UI do validador. A extração e as checagens rodam no
// servidor e têm teste próprio (meta-validator.test.ts, route.test.ts); aqui a
// rota é simulada e o que se testa é o formulário, os estados e o evento.

const okResponse = {
  finalUrl: 'https://exemplo.dev/blog/artigo',
  httpStatus: 200,
  redirected: false,
  meta: {
    title: 'Título da página',
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
  },
  checks: [
    { id: 'title', status: 'ok', label: 'Title', detail: '17 caracteres.' },
    { id: 'description', status: 'error', label: 'Meta description', detail: 'Ausente.' },
    { id: 'og-image', status: 'warning', label: 'og:image', detail: 'Ausente.' },
  ],
  issuesFound: 2,
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

describe('MetaValidator', () => {
  it('valida a URL digitada, mostra preview e checagens e empurra a contagem', async () => {
    const fetchMock = mockFetch(okResponse)
    const user = userEvent.setup()
    render(<MetaValidator />)

    await user.type(screen.getByLabelText(/url da página para validar/i), 'exemplo.dev/blog/artigo')
    await user.click(screen.getByRole('button', { name: /validar/i }))

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/validador-meta?url=${encodeURIComponent('exemplo.dev/blog/artigo')}`
    )
    expect(await screen.findByRole('heading', { name: /preview na busca/i })).toBeTruthy()
    // Sem description, o preview cai no texto explicativo em vez de ficar vazio.
    expect(screen.getByText(/sem meta description/i)).toBeTruthy()

    const checks = screen.getByRole('heading', { name: /checagens/i })
    expect(checks.textContent).toContain('1 erro, 1 aviso')
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    // Só a contagem vai para o dataLayer, nunca a URL validada.
    expect(window.dataLayer).toEqual([{ event: 'tool_validate_meta', issues_found: 2 }])
  })

  it('não chama a rota com o campo vazio e explica em um alerta', async () => {
    const fetchMock = mockFetch(okResponse)
    const user = userEvent.setup()
    render(<MetaValidator lang="en" />)

    await user.click(screen.getByRole('button', { name: /validate/i }))

    expect(screen.getByRole('alert').textContent).toBe('Enter a URL to validate.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mostra o erro devolvido pela rota sem registrar evento', async () => {
    mockFetch({ error: 'Endereço privado não é permitido.' }, false)
    const user = userEvent.setup()
    render(<MetaValidator />)

    await user.type(screen.getByLabelText(/url da página para validar/i), 'http://127.0.0.1')
    await user.click(screen.getByRole('button', { name: /validar/i }))

    expect((await screen.findByRole('alert')).textContent).toBe('Endereço privado não é permitido.')
    expect(window.dataLayer).toEqual([])
  })
})
