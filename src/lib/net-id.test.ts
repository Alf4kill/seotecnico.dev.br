import { beforeAll, describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import { netId } from './net-id'

// jsdom não tem crypto.subtle; o runtime real (Node na Vercel) tem.
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
  }
})

const SECRET = 'test-secret'
const JULY = new Date('2026-07-25T12:00:00Z')
const AUGUST = new Date('2026-08-02T12:00:00Z')

describe('netId', () => {
  it('is deterministic within the same month', async () => {
    expect(await netId('203.0.113.7', SECRET, JULY)).toBe(await netId('203.0.113.7', SECRET, JULY))
  })

  it('groups the /24 (v4): same subnet, same id; different subnet, different id', async () => {
    const a = await netId('203.0.113.7', SECRET, JULY)
    expect(await netId('203.0.113.250', SECRET, JULY)).toBe(a)
    expect(await netId('203.0.114.7', SECRET, JULY)).not.toBe(a)
  })

  it('groups the /48 (v6) and normalizes notation', async () => {
    const a = await netId('2001:db8:aaaa::1', SECRET, JULY)
    expect(await netId('2001:DB8:AAAA:ffff::9', SECRET, JULY)).toBe(a)
    expect(await netId('2001:db8:bbbb::1', SECRET, JULY)).not.toBe(a)
  })

  it('rotates when the month changes', async () => {
    expect(await netId('203.0.113.7', SECRET, JULY)).not.toBe(
      await netId('203.0.113.7', SECRET, AUGUST)
    )
  })

  it('is 10 hex chars — truncated on purpose', async () => {
    expect(await netId('203.0.113.7', SECRET, JULY)).toMatch(/^[0-9a-f]{10}$/)
  })

  it('fails safe to null without a secret, an ip, or a parseable ip', async () => {
    expect(await netId('203.0.113.7', undefined, JULY)).toBeNull()
    expect(await netId(null, SECRET, JULY)).toBeNull()
    expect(await netId('not-an-ip', SECRET, JULY)).toBeNull()
  })
})
