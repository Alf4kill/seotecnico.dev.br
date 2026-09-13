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

  it('never counts Next.js RSC prefetch or client navigation requests', () => {
    expect(matches('/sobre?_rsc=abc12', { rsc: '1', 'next-router-prefetch': '1' })).toBe(false)
    expect(matches('/sobre?_rsc=abc12', { rsc: '1' })).toBe(false)
    expect(matches('/sobre', { 'next-router-prefetch': '1' })).toBe(false)
  })

  it('never counts static assets or the internal API', () => {
    for (const url of ['/_next/static/chunks/app.js', '/images/hero.webp', '/icon.svg', '/api/checador-cwv']) {
      expect(matches(url), url).toBe(false)
    }
  })
})
