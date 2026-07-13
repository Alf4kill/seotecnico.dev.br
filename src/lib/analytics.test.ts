import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_STORAGE_KEY,
  applyConsent,
  getSavedConsent,
  pushEvent,
  saveConsent,
  subscribeConsent,
} from './analytics'

// Reads the raw dataLayer as an array of plain values. gtag() pushes the
// `arguments` object (array-like, not a real array), so normalize those to
// arrays for assertions.
function readDataLayer(): unknown[] {
  const dl = (window.dataLayer ?? []) as unknown[]
  return dl.map((entry) => {
    if (
      entry !== null &&
      typeof entry === 'object' &&
      !Array.isArray(entry) &&
      typeof (entry as { length?: unknown }).length === 'number' &&
      !('event' in (entry as object))
    ) {
      return Array.from(entry as ArrayLike<unknown>)
    }
    return entry
  })
}

beforeEach(() => {
  window.dataLayer = []
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pushEvent', () => {
  it('initializes dataLayer when absent and pushes the event object', () => {
    delete window.dataLayer
    pushEvent({ event: 'tool_generate_jsonld', schema_type: 'Article' })

    expect(window.dataLayer).toEqual([
      { event: 'tool_generate_jsonld', schema_type: 'Article' },
    ])
  })

  it('appends events without dropping existing entries', () => {
    pushEvent({ event: 'tool_validate_meta', issues_found: 3 })
    pushEvent({ event: 'tool_check_cwv', lcp_bucket: 'good' })

    expect(readDataLayer()).toEqual([
      { event: 'tool_validate_meta', issues_found: 3 },
      { event: 'tool_check_cwv', lcp_bucket: 'good' },
    ])
  })
})

describe('applyConsent', () => {
  it('pushes a gtag consent-update command as an arguments object', () => {
    applyConsent('granted')

    // gtag pushes the `arguments` object, not an array — readDataLayer()
    // normalizes it so the shape GTM reads is asserted exactly.
    expect(readDataLayer()).toEqual([
      ['consent', 'update', { analytics_storage: 'granted' }],
    ])
  })

  it('reflects a denied choice', () => {
    applyConsent('denied')

    expect(readDataLayer()).toEqual([
      ['consent', 'update', { analytics_storage: 'denied' }],
    ])
  })
})

describe('saveConsent / getSavedConsent', () => {
  it('round-trips a granted choice through localStorage', () => {
    saveConsent('granted')

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
    expect(getSavedConsent()).toBe('granted')
  })

  it('returns null when nothing is stored', () => {
    expect(getSavedConsent()).toBeNull()
  })

  it('returns null for an unrecognized stored value', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'maybe')

    expect(getSavedConsent()).toBeNull()
  })
})

describe('subscribeConsent', () => {
  it('notifies subscribers when a choice is saved', () => {
    const listener = vi.fn()
    subscribeConsent(listener)

    saveConsent('granted')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeConsent(listener)

    saveConsent('granted')
    unsubscribe()
    saveConsent('denied')

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
