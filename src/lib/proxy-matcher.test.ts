// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks'
import { beforeAll, describe, expect, it } from 'vitest'
import { config } from '@/proxy'

// ─────────────────────────────────────────────────────────────────────────────
// O matcher do proxy decide o que vira evento de telemetria — é o instrumento
// do experimento de detecção. Até 2026-09-13 ele deixava passar as requisições
// RSC do Next.js, e a navegação humana foi contada como `ua_class: unknown`
// (docs/experiment-log.md). Este teste roda o `config` REAL contra o
// avaliador do próprio Next, não uma cópia da regex.
// ─────────────────────────────────────────────────────────────────────────────

type Matcher = typeof import('next/experimental/testing/server').unstable_doesMiddlewareMatch
let matches: (url: string, headers?: Record<string, string>) => boolean

beforeAll(async () => {
  // O utilitário de teste do Next espera o global que o runtime dele instala.
  ;(globalThis as unknown as { AsyncLocalStorage: unknown }).AsyncLocalStorage = AsyncLocalStorage
  const { unstable_doesMiddlewareMatch } = (await import('next/experimental/testing/server')) as {
    unstable_doesMiddlewareMatch: Matcher
  }
  matches = (url, headers) => unstable_doesMiddlewareMatch({ config, url, headers })
})

describe('proxy matcher', () => {
  it('counts document and discovery requests', () => {
    for (const url of ['/', '/sobre', '/blog/inp-nextjs', '/robots.txt', '/sitemap.xml', '/llms.txt']) {
      expect(matches(url), url).toBe(true)
    }
  })

  // H14 mede quem pede Markdown. Se o matcher filtrasse por Accept, o
  // numerador seria zero por construção e o "ninguém pede" seria do filtro.
  it('counts a document request that asks for Markdown (H14)', () => {
    expect(matches('/blog/inp-nextjs', { accept: 'text/markdown' })).toBe(true)
    expect(matches('/', { accept: 'text/markdown, text/html;q=0.9' })).toBe(true)
  })

  it('never counts Next.js RSC prefetch or client navigation requests', () => {
    expect(matches('/sobre?_rsc=abc12', { rsc: '1', 'next-router-prefetch': '1' })).toBe(false)
    expect(matches('/sobre?_rsc=abc12', { rsc: '1' })).toBe(false)
    expect(matches('/sobre', { 'next-router-prefetch': '1' })).toBe(false)
  })

  // Até 2026-09-26 o matcher só excluía `opengraph-image` no começo do
  // caminho: as imagens OG aninhadas (artigos, /design, /en/*) contavam como
  // leitura de página. Achado no fechamento da H15 (um hit do PerplexityBot em
  // /blog/hreflang-nextjs/opengraph-image). Lista = toda rota opengraph-image do app.
  it('never counts an Open Graph image, at any depth', () => {
    for (const url of [
      '/opengraph-image',
      '/blog/inp-nextjs/opengraph-image',
      '/design/opengraph-image',
      '/en/opengraph-image',
      '/en/design/opengraph-image',
      '/en/case-studies/opengraph-image',
    ]) {
      expect(matches(url), url).toBe(false)
    }
  })

  it('still counts a page whose slug merely mentions opengraph-image', () => {
    expect(matches('/blog/opengraph-image-nextjs')).toBe(true)
  })

  it('never counts static assets or the internal API', () => {
    for (const url of ['/_next/static/chunks/app.js', '/images/hero.webp', '/icon.svg', '/api/checador-cwv']) {
      expect(matches(url), url).toBe(false)
    }
  })
})
