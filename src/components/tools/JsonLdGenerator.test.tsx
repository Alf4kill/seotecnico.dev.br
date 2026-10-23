import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JsonLdGenerator } from './JsonLdGenerator'

// Contrato de interação da UI do gerador. A lógica de schema já tem teste
// próprio (src/lib/jsonld-generator.test.ts); aqui só o que o usuário faz:
// achar cada campo pelo rótulo, gerar, ler o resultado e o evento-chave.

beforeEach(() => {
  window.dataLayer = []
})
afterEach(cleanup)

async function fillArticle(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/título do artigo/i), 'Meu artigo')
  await user.type(screen.getByLabelText(/url canônica/i), 'https://exemplo.dev/blog/meu-artigo')
  await user.type(screen.getByLabelText(/data de publicação/i), '2026-10-23')
  await user.type(screen.getByLabelText(/nome do autor/i), 'Nalpi')
}

describe('JsonLdGenerator', () => {
  it('gera um Article com o título digitado e empurra o evento-chave', async () => {
    const user = userEvent.setup()
    render(<JsonLdGenerator />)

    await fillArticle(user)
    await user.click(screen.getByRole('button', { name: /gerar json-ld/i }))

    const output = screen.getByRole('region', { name: /resultado/i })
    const json = JSON.parse(output.textContent ?? '')
    expect(json['@context']).toBe('https://schema.org')
    expect(json['@type']).toBe('Article')
    expect(json.headline).toBe('Meu artigo')
    expect(json.author).toMatchObject({ '@type': 'Person', name: 'Nalpi' })
    // Só o tipo vai para o dataLayer, nunca o conteúdo do formulário.
    expect(window.dataLayer).toEqual([{ event: 'tool_generate_jsonld', schema_type: 'Article' }])
  })

  it('lista os campos obrigatórios em um alerta e não gera nada', async () => {
    const user = userEvent.setup()
    render(<JsonLdGenerator />)

    await user.click(screen.getByRole('button', { name: /gerar json-ld/i }))

    const alert = screen.getByRole('alert')
    expect(alert.querySelectorAll('li')).toHaveLength(4)
    expect(screen.queryByRole('region', { name: /resultado/i })).toBeNull()
    expect(window.dataLayer).toEqual([])
  })

  it('troca os campos ao mudar o tipo e gera o FAQPage', async () => {
    const user = userEvent.setup()
    render(<JsonLdGenerator />)

    await user.selectOptions(screen.getByLabelText(/tipo de schema/i), 'FAQPage')
    expect(screen.queryByLabelText(/título do artigo/i)).toBeNull()

    await user.type(screen.getByLabelText(/^pergunta/i), 'O que é LCP?')
    await user.type(screen.getByLabelText(/resposta/i), 'O maior elemento pintado.')
    await user.click(screen.getByRole('button', { name: /gerar json-ld/i }))

    const json = JSON.parse(screen.getByRole('region', { name: /resultado/i }).textContent ?? '')
    expect(json['@type']).toBe('FAQPage')
    expect(json.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'O que é LCP?',
      acceptedAnswer: { '@type': 'Answer', text: 'O maior elemento pintado.' },
    })
  })

  it('alterna para o componente Next.js pelas abas', async () => {
    const user = userEvent.setup()
    render(<JsonLdGenerator />)

    await fillArticle(user)
    await user.click(screen.getByRole('button', { name: /gerar json-ld/i }))

    const nextTab = screen.getByRole('tab', { name: /componente next\.js/i })
    expect(nextTab.getAttribute('aria-selected')).toBe('false')
    await user.click(nextTab)

    expect(nextTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('region', { name: /resultado/i }).textContent).toContain(
      'application/ld+json'
    )
  })
})
