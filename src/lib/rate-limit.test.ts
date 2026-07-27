import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clientKey, createDailyBudget, createFixedWindow } from './rate-limit'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createFixedWindow', () => {
  it('allows up to the cap and blocks past it', () => {
    const limiter = createFixedWindow({ windowMs: 60_000, max: 3 })
    const results = [1, 2, 3, 4, 5].map(() => limiter.hit('a'))
    expect(results).toEqual([false, false, false, true, true])
  })

  it('counts each caller separately', () => {
    const limiter = createFixedWindow({ windowMs: 60_000, max: 1 })
    expect(limiter.hit('a')).toBe(false)
    expect(limiter.hit('a')).toBe(true)
    expect(limiter.hit('b')).toBe(false)
  })

  it('forgives the caller once the window rolls over', () => {
    const limiter = createFixedWindow({ windowMs: 60_000, max: 1 })
    limiter.hit('a')
    expect(limiter.hit('a')).toBe(true)

    vi.advanceTimersByTime(60_001)
    expect(limiter.hit('a')).toBe(false)
  })

  it('sweeps expired keys instead of growing without bound', () => {
    const limiter = createFixedWindow({ windowMs: 1_000, max: 10, maxKeys: 3 })
    for (const key of ['a', 'b', 'c']) limiter.hit(key)

    vi.advanceTimersByTime(1_001)
    // A quarta inserção passa do maxKeys e dispara a varredura; se ela não
    // acontecesse, o Map cresceria para sempre numa instância de vida longa.
    limiter.hit('d')
    expect(limiter.hit('a')).toBe(false) // 'a' expirou e foi removido
  })
})

describe('createDailyBudget', () => {
  it('spends down to zero and then refuses', () => {
    const budget = createDailyBudget(2)
    expect(budget.spend()).toBe(true)
    expect(budget.spend()).toBe(true)
    expect(budget.spend()).toBe(false)
    expect(budget.remaining()).toBe(0)
  })

  it('resets when the UTC day turns', () => {
    vi.setSystemTime(new Date('2026-07-26T23:59:00Z'))
    const budget = createDailyBudget(1)
    expect(budget.spend()).toBe(true)
    expect(budget.spend()).toBe(false)

    vi.setSystemTime(new Date('2026-07-27T00:01:00Z'))
    expect(budget.remaining()).toBe(1)
    expect(budget.spend()).toBe(true)
  })
})

describe('clientKey', () => {
  const request = (headers: Record<string, string>) => ({
    headers: { get: (name: string) => headers[name] ?? null },
  })

  it('takes the first hop of x-forwarded-for', () => {
    expect(clientKey(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip, then to a constant', () => {
    expect(clientKey(request({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientKey(request({}))).toBe('unknown')
  })
})
