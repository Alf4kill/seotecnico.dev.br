import { describe, it, expect } from 'vitest'
import { hasBrowserFetchMetadata } from './fetch-metadata'

describe('hasBrowserFetchMetadata', () => {
  it('accepts a browser navigation (mode + dest)', () => {
    const headers = new Headers({ 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' })
    expect(hasBrowserFetchMetadata(headers)).toBe(true)
  })

  it("accepts a page script's fetch() (cors/empty)", () => {
    const headers = new Headers({ 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' })
    expect(hasBrowserFetchMetadata(headers)).toBe(true)
  })

  it("rejects Node's native fetch, which sends Sec-Fetch-Mode: cors and no Dest", () => {
    // O formato exato que o undici do Node 22 envia, mesmo com Accept de HTML.
    const headers = new Headers({ 'sec-fetch-mode': 'cors', accept: 'text/html,application/xhtml+xml' })
    expect(hasBrowserFetchMetadata(headers)).toBe(false)
  })

  it('rejects a client with no Fetch Metadata (curl)', () => {
    expect(hasBrowserFetchMetadata(new Headers({ accept: '*/*' }))).toBe(false)
  })
})
